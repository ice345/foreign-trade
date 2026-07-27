import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { sendSMS } from "@/lib/sms"
import { getVerificationSecret } from "@/lib/jwt-secret"
import { hashVerificationCode, verificationCodeMatches } from "@/lib/verification-code"

const CODE_EXPIRY_MINUTES = 10
const RATE_LIMIT_SECONDS = 60

function generateCode(): string {
  const bytes = crypto.randomBytes(3)
  const num = bytes.readUIntBE(0, 3) % 1000000
  return String(num).padStart(6, "0")
}

function hashCode(target: string, type: "EMAIL" | "PHONE", code: string) {
  return hashVerificationCode(getVerificationSecret(), target, type, code)
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
    data: { used: true, usedAt: new Date() }
  })

  const code = generateCode()

  await prisma.verificationCode.create({
    data: {
      target,
      codeHash: hashCode(target, type, code),
      type,
      expiresAt: new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000)
    }
  })

  try {
    if (type === "EMAIL") {
      const requestId = await sendEmail({
        to: target,
        subject: "GlobalPush 验证码",
        html: `<p>您的验证码是：<strong>${code}</strong>，${CODE_EXPIRY_MINUTES} 分钟内有效。</p>`
      })
      if (requestId) console.info(`[Verification Email Sent] requestId=${requestId}`)
    } else {
      await sendSMS(target, `您的验证码是：${code}，${CODE_EXPIRY_MINUTES} 分钟内有效。`)
    }
  } catch (error) {
    await prisma.verificationCode.updateMany({
      where: { target, type, used: false },
      data: { used: true, usedAt: new Date() }
    })

    console.error("[Verification Send Error]", error)
    return { success: false, error: "验证码发送失败，请稍后重试" }
  }

  return {
    success: true,
    ...(process.env.NODE_ENV !== "production" ? { code } : {})
  }
}

export async function verifyCode(
  target: string,
  code: string,
  type: "EMAIL" | "PHONE"
): Promise<boolean> {
  const record = await prisma.verificationCode.findFirst({
    where: {
      target,
      type,
      used: false,
      attempts: { lt: 5 },
      expiresAt: { gte: new Date() }
    },
    orderBy: { createdAt: "desc" }
  })

  if (!record) return false

  const matches = verificationCodeMatches(record.codeHash, hashCode(target, type, code))

  if (!matches) {
    const attempts = record.attempts + 1
    await prisma.verificationCode.updateMany({
      where: { id: record.id, used: false },
      data: {
        attempts: { increment: 1 },
        ...(attempts >= 5 && { used: true, usedAt: new Date() })
      }
    })
    return false
  }

  const consumed = await prisma.verificationCode.updateMany({
    where: { id: record.id, used: false },
    data: { used: true, usedAt: new Date() }
  })

  return consumed.count === 1
}
