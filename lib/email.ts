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
    if (process.env.NODE_ENV === "development") {
      console.info(`[Dev Email] To: ${to} | Subject: ${subject}`)
    }
    return
  }

  await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    html
  })
}
