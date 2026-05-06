import TopupClient from "./TopupClient"
import { buildMetadata } from "@/lib/metadata"

export const metadata = buildMetadata({
  title: "在线充值 — GlobalPush",
  description: "通过微信或支付宝为你的 GlobalPush 账户充值。",
  robots: { index: false, follow: false },
})

export default function TopupPage() {
  return (
    <div className="page-container py-16">
      <h1 className="mb-8 text-3xl font-semibold">在线充值</h1>
      <TopupClient />
    </div>
  )
}
