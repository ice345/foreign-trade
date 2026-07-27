import Link from "next/link"
import { AlertTriangle, ArrowRight, BookOpen, CircleDollarSign, Database, FileCheck2, PackageSearch, ShieldCheck, Users } from "lucide-react"

const sections = [
  {
    icon: PackageSearch,
    title: "资源管理",
    body: "新增资源时完整填写国家、平台、分类、参考价格和预计周期。国家与分类应使用现有选项，避免“美国”和“US”被当成两个筛选值。ACTIVE 对用户可见，HIDDEN 用于暂存，SOLD_OUT 表示当前不可询价。图片必须通过站内上传进入 R2。"
  },
  {
    icon: FileCheck2,
    title: "订单工作流",
    body: "新需求先进入待评估。确认渠道档期后填写报价和说明并改为已报价；用户接受后才能进入执行中。发布完成后填写公开链接、上传凭证，再依次改为已发布和已确认。不要跳过状态，也不要把报价金额当作已收款。"
  },
  {
    icon: Users,
    title: "用户与权限",
    body: "停用账号会立即使旧登录会话失效，但不会删除历史订单和流水。只有确认存在违规或安全风险时才停用，并填写清楚原因。管理员账号不要多人共用，也不要通过聊天工具传递密码或验证码。"
  },
  {
    icon: CircleDollarSign,
    title: "历史账务",
    body: "当前平台采用询价与撮合模式，不再充值、代收或扣除余额。历史账务页面只用于核对旧充值和旧钱包流水，不能继续审批。取消旧扣款订单时，系统只会针对真实 DEDUCTION 流水生成一次 REFUND。"
  },
  {
    icon: Database,
    title: "推荐与数据",
    body: "首页推荐综合近期订单热度、履约阶段、评价、受众规模、预计周期和用户偏好自动计算。不要为了上榜伪造订单、评价或粉丝数。资源国家、平台和分类越规范，筛选与推荐越准确。"
  },
  {
    icon: ShieldCheck,
    title: "文件与安全",
    body: "付款凭证和订单截图不得使用外部公开链接，必须通过本站上传。不要把 R2、Resend、Neon 或 JWT 密钥写入资源描述、截图、浏览器代码或聊天记录。发现异常登录、批量注册或上传激增时，先停用相关账号并保留审计记录。"
  }
]

export default function AdminHelpPage() {
  return <div className="page-container py-10 md:py-14">
    <header className="max-w-3xl"><div className="inline-flex items-center gap-2 text-sm text-[var(--accent-soft)]"><BookOpen className="h-4 w-4" />管理员手册</div><h1 className="mt-3 text-3xl font-semibold md:text-4xl">GlobalPush 运营指南</h1><p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">用于日常资源维护、询价履约、用户管理和安全检查。涉及金额时，始终区分“报价记录”和“实际收款”。</p></header>

    <section className="admin-panel mt-8 grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center"><div><h2 className="text-lg font-semibold">每日建议顺序</h2><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">查看待评估需求 → 确认渠道档期并报价 → 跟进执行中订单 → 核对发布链接与截图 → 处理用户或安全异常 → 检查资源是否仍可用。</p></div><Link href="/admin/dashboard" className="btn-primary">打开运营面板<ArrowRight className="h-4 w-4" /></Link></section>

    <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{sections.map(({ icon: Icon, title, body }) => <section key={title} className="admin-panel p-6"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-muted)] text-[var(--accent-soft)]"><Icon className="h-4 w-4" /></span><h2 className="mt-5 text-lg font-semibold">{title}</h2><p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{body}</p></section>)}</div>

    <section className="mt-8 border-l-2 border-[var(--warning)] bg-[rgba(233,183,95,0.08)] px-5 py-4"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--warning)]" /><div><h2 className="font-medium">上线异常处理</h2><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">注册邮件失败先检查 Resend 域名和 Vercel 环境变量；页面数据异常先确认 Production 使用正确 Neon 数据库并已执行迁移；文件失败检查 R2 桶、Token 权限和全站配额。不要通过删除用户、订单或流水来“修复”数据。</p></div></div></section>
  </div>
}
