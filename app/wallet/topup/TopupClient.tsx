"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { ArrowLeft, Loader2, CheckCircle2, Clock, ZoomIn, X, Copy } from "lucide-react"
import Link from "next/link"
import UploadButton from "@/components/UploadButton"
import type { PaginatedResponse, PaymentRequestItem } from "@/lib/types"

type QrCode = {
  id: string
  type: string
  imageUrl: string
  label?: string
}

const methodLabel: Record<string, string> = { WECHAT: "微信支付", ALIPAY: "支付宝" }
const statusLabel: Record<string, string> = { PENDING: "等待审核", APPROVED: "已通过", REJECTED: "已拒绝" }
const statusColor: Record<string, string> = { PENDING: "text-amber-400", APPROVED: "text-green-400", REJECTED: "text-red-400" }

type Step = "amount" | "pay" | "submitted"

export default function TopupClient() {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>("amount")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<"WECHAT" | "ALIPAY">("WECHAT")
  const [selectedQr, setSelectedQr] = useState<QrCode | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [screenshotUrl, setScreenshotUrl] = useState("")
  const [note, setNote] = useState("")
  const [referenceNo, setReferenceNo] = useState("")
  const [showQrModal, setShowQrModal] = useState(false)

  const { data: qrCodes = [] } = useQuery<QrCode[]>({
    queryKey: ["payment-qr", method],
    queryFn: () => api.activePaymentQrCodes(method),
    enabled: step === "pay"
  })

  const { data: reqData } = useQuery<PaginatedResponse<PaymentRequestItem>>({
    queryKey: ["my-payment-requests"],
    queryFn: () => api.myPaymentRequests()
  })

  const handleGoToPay = () => {
    const num = Number(amount)
    if (!num || num <= 0) {
      toast.error("请输入有效金额")
      return
    }
    setStep("pay")
  }

  const handleSubmit = async () => {
    if (!selectedQr) {
      toast.error("请选择收款二维码")
      return
    }
    if (!screenshotUrl) {
      toast.error("请上传支付截图")
      return
    }
    setSubmitting(true)
    try {
      const result = await api.createPaymentRequest({
        amount: Number(amount),
        paymentMethod: method,
        qrCodeId: selectedQr.id,
        note: note || undefined,
        screenshotUrl
      })
      toast.success("充值请求已提交，请等待管理员审核")
      setReferenceNo(result.referenceNo)
      setStep("submitted")
      queryClient.invalidateQueries({ queryKey: ["my-payment-requests"] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "提交失败")
    } finally {
      setSubmitting(false)
    }
  }

  const copyRef = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("已复制")
    } catch {
      toast.error("复制失败")
    }
  }

  const presets = [50, 100, 200, 500, 1000, 2000]

  return (
    <div className="max-w-lg space-y-8">
      {step === "amount" && (
        <div className="card border-white/10 space-y-5">
          <h2 className="text-lg font-semibold">选择充值金额</h2>
          <div className="grid grid-cols-3 gap-3">
            {presets.map((v) => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                  amount === String(v)
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                ¥{v}
              </button>
            ))}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">自定义金额</label>
            <input
              className="input w-full"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="输入自定义金额"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">支付方式</label>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setMethod("WECHAT")
                  if (method !== "WECHAT") {
                    setSelectedQr(null)
                    setScreenshotUrl("")
                  }
                }}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm transition ${
                  method === "WECHAT"
                    ? "border-green-500 bg-green-500/10 text-green-400"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                微信支付
              </button>
              <button
                onClick={() => {
                  setMethod("ALIPAY")
                  if (method !== "ALIPAY") {
                    setSelectedQr(null)
                    setScreenshotUrl("")
                  }
                }}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm transition ${
                  method === "ALIPAY"
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                支付宝
              </button>
            </div>
          </div>

          <button
            className="btn-primary w-full"
            onClick={handleGoToPay}
            disabled={!amount || Number(amount) <= 0}
          >
            下一步
          </button>
        </div>
      )}

      {step === "pay" && (
        <div className="card border-white/10 space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep("amount")} className="text-white/50 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold">扫码支付</h2>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <div className="text-sm text-white/50">请使用{methodLabel[method]}扫描以下二维码支付</div>
            <div className="mt-2 text-2xl font-bold text-accent">¥{Number(amount).toFixed(2)}</div>
          </div>

          {qrCodes.length > 0 ? (
            <div className="space-y-3">
              {qrCodes.map((qr) => (
                <button
                  key={qr.id}
                  onClick={() => setSelectedQr(qr)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selectedQr?.id === qr.id
                      ? "border-accent bg-accent/5"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{qr.label ?? methodLabel[qr.type]}</span>
                    {selectedQr?.id === qr.id && <CheckCircle2 className="h-4 w-4 text-accent" />}
                  </div>
                  <div className="mt-2 relative group">
                    <img
                      src={qr.imageUrl}
                      alt="收款二维码"
                      className="mx-auto h-48 w-48 rounded-lg bg-white object-contain p-2"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedQr(qr)
                        setShowQrModal(true)
                      }}
                      className="absolute inset-0 m-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <ZoomIn className="h-5 w-5" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-white/40">
              暂无可用的{methodLabel[method]}收款码，请联系管理员
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">上传支付截图</label>
            <UploadButton
              folder="payment-screenshots"
              onUploaded={(url) => setScreenshotUrl(url)}
              currentUrl={screenshotUrl || undefined}
              label="上传支付截图"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">付款备注 / 转账单号</label>
            <input
              className="input w-full"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder="填写微信/支付宝账单号或转账备注，便于人工核对"
            />
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
            请在完成支付后，点击下方按钮确认。管理员审核通过后，余额将自动到账。
          </div>

          <button
            className="btn-primary w-full"
            onClick={handleSubmit}
            disabled={submitting || !selectedQr || !screenshotUrl}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                提交中...
              </span>
            ) : "我已完成支付"}
          </button>
        </div>
      )}

      {step === "submitted" && (
        <div className="card border-white/10 space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-accent" />
          <h2 className="text-lg font-semibold">充值请求已提交</h2>
          <p className="text-sm text-white/50">管理员审核通过后，余额将自动到账。</p>
          {referenceNo && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/40 mb-1">订单编号</div>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-sm font-medium text-accent">{referenceNo}</span>
                <button
                  onClick={() => copyRef(referenceNo)}
                  className="rounded p-1 text-white/40 hover:text-white transition"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <Link href="/wallet" className="btn-outline flex-1 text-sm">返回钱包</Link>
            <button
              className="btn-primary flex-1 text-sm"
              onClick={() => {
                setStep("amount")
                setAmount("")
                setSelectedQr(null)
                setScreenshotUrl("")
                setNote("")
                setReferenceNo("")
              }}
            >
              继续充值
            </button>
          </div>
        </div>
      )}

      {showQrModal && selectedQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="relative rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute -right-3 -top-3 rounded-full bg-gray-800 p-1.5 text-white/70 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={selectedQr.imageUrl}
              alt="收款二维码"
              className="h-80 w-80 object-contain"
            />
            <div className="mt-3 text-center text-sm text-gray-600">
              {selectedQr.label ?? methodLabel[selectedQr.type]}
            </div>
          </div>
        </div>
      )}

      {reqData && reqData.data.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white/80">充值记录</h3>
          <div className="space-y-2">
            {reqData.data.slice(0, 5).map((r) => (
              <div key={r.id} className="card border-white/5 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">¥{r.amount.toFixed(2)}</span>
                  <span className="ml-2 text-xs text-white/40">{methodLabel[r.paymentMethod]}</span>
                  {r.referenceNo && (
                    <span className="ml-2 font-mono text-xs text-white/30">{r.referenceNo}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {r.status === "PENDING" && <Clock className="h-3.5 w-3.5 text-amber-400" />}
                  <span className={`text-xs ${statusColor[r.status]}`}>{statusLabel[r.status]}</span>
                  <span className="text-xs text-white/30">
                    {new Date(r.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
