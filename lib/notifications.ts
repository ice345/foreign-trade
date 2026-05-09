import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import type { NotificationType } from "@prisma/client"

type CreateNotificationParams = {
  userId: string
  type: NotificationType
  title: string
  message: string
  orderId?: string
  sendEmail?: boolean
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  orderId,
  sendEmail: shouldEmail = false
}: CreateNotificationParams) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, message, orderId }
  })

  if (shouldEmail) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true }
    })

    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: title,
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#333">${title}</h2>
          <p style="color:#666;line-height:1.6">${message}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
          <p style="color:#999;font-size:12px">— GlobalPush</p>
        </div>`
      }).catch((err) => console.error("[Notification Email Error]", err))
    }

    if (user?.phone) {
      const { sendSMS } = await import("@/lib/sms")
      await sendSMS(user.phone, `【GlobalPush】${title}: ${message}`)
        .catch((err) => console.error("[Notification SMS Error]", err))
    }
  }

  return notification
}

export async function notifyAdmins({
  type,
  title,
  message,
  orderId,
  sendEmail: shouldEmail = true
}: Omit<CreateNotificationParams, "userId">) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true }
  })

  const promises = admins.map((admin) =>
    createNotification({
      userId: admin.id,
      type,
      title,
      message,
      orderId,
      sendEmail: shouldEmail
    }).catch((err) => console.error("[Notify Admin Error]", err))
  )

  await Promise.allSettled(promises)
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false }
  })
}
