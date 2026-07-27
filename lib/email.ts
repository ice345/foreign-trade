import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const fromEmail = process.env.NOTIFICATION_FROM_EMAIL ?? "noreply@globalpush.io"

type SendEmailParams = {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[Dev Email] To: ${to} | Subject: ${subject}`)
      return
    }
    throw new Error("邮件服务未配置")
  }

  const result = await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    html
  })

  if (result.error) {
    throw new Error(`邮件服务拒绝请求 (${result.error.name})`)
  }

  return result.data?.id
}
