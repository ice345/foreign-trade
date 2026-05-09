import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { sendSMS } from "@/lib/sms"

const CODE_EXPIRY_MINUTES = 10
const RATE_LIMIT_SECONDS = 60

function generateCode(): string {
  const bytes = crypto.randomBytes(3)
  const num = bytes.readUIntBE(0, 3) % 1000000
  return String(num).padStart(6, "0")
}

export async function sendVerificationCode(
  target: string,
  type: "EMAIL" | "PHONE"
): Promise<{ success: boolean; error?: string; code?: string }> {
  const recent = await prisma.verificationCode.findFirst({
    where: {
      target,
      createdAt: { gte: new Date(Date.now() - RATE_LIMIT_SECONDS * 1000) }
    },
    orderBy: { createdAt: "desc" }
  })

  if (recent) {
    return { success: false, error: "请等待 60 秒后再试" }
  }

  await prisma.verificationCode.updateMany({
    where: { target, used: false },
    data: { used: true }
  })

  const code = generateCode()

  await prisma.verificationCode.create({
    data: {
      target,
      code,
      type,
      expiresAt: new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000)
    }
  })

  if (process.env.NODE_ENV === "development") {
    console.info(`[DEV] Verification code for ${target}: ${code}`)
  }

  try {
    if (type === "EMAIL") {
      await sendEmail({
        to: target,
        subject: "GlobalPush 验证码",
        html: `<p>您的验证码是：<strong>${code}</strong>，${CODE_EXPIRY_MINUTES} 分钟内有效。</p>`
      })
    } else {
      await sendSMS(target, `您的验证码是：${code}，${CODE_EXPIRY_MINUTES} 分钟内有效。`)
    }
  } catch (error) {
    await prisma.verificationCode.updateMany({
      where: { target, code, used: false },
      data: { used: true }
    })

    console.error("[Verification Send Error]", error)
    const message = error instanceof Error ? error.message : "验证码发送失败"
    return { success: false, error: message }
  }

  return {
    success: true,
    ...(process.env.NODE_ENV !== "production" ? { code } : {})
  }
}

export async function verifyCode(target: string, code: string): Promise<boolean> {
  const record = await prisma.verificationCode.findFirst({
    where: {
      target,
      code,
      used: false,
      expiresAt: { gte: new Date() }
    }
  })

  if (!record) return false

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { used: true }
  })

  return true
}
