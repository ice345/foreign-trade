import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function PaymentsPage() {
  await requireAdmin()
  const requests = await prisma.paymentRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { email: true, phone: true, nickname: true } } }
  })

  return (
    <div className="page-container py-10">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm text-[var(--text-tertiary)]">历史账务审计</p>
        <h1 className="mt-2 text-3xl font-semibold">旧充值申请</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          充值、个人收款码和余额入账已关闭。以下记录仅供核对历史款项，不能继续审批或修改。
        </p>
      </div>

      <div className="resource-surface overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[var(--border)] text-xs text-[var(--text-tertiary)]">
            <tr>
              <th className="px-5 py-4">用户</th><th className="px-5 py-4">金额</th>
              <th className="px-5 py-4">方式</th><th className="px-5 py-4">状态</th>
              <th className="px-5 py-4">流水号</th><th className="px-5 py-4">提交时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="px-5 py-4">{request.user.nickname ?? request.user.email ?? request.user.phone ?? "-"}</td>
                <td className="px-5 py-4">¥{Number(request.amount).toFixed(2)}</td>
                <td className="px-5 py-4">{request.paymentMethod === "WECHAT" ? "微信" : "支付宝"}</td>
                <td className="px-5 py-4">{request.status}</td>
                <td className="px-5 py-4 font-mono text-xs">{request.referenceNo ?? "-"}</td>
                <td className="px-5 py-4 text-[var(--text-secondary)]">{request.createdAt.toLocaleString("zh-CN")}</td>
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-[var(--text-tertiary)]">暂无历史记录</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
