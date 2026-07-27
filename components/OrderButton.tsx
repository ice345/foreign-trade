"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X, CheckCircle2, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Props = {
  resourceId: string;
  resourcePrice?: number | null;
  resourceTitle?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
};

export default function OrderButton({
  resourceId,
  resourcePrice,
  resourceTitle,
  disabled,
  className,
  label = "立即推广"
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [productLink, setProductLink] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const queryClient = useQueryClient();

  const hasPrice = resourcePrice !== null && resourcePrice !== undefined;
  const basePrice = hasPrice ? resourcePrice : 0;

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId,
          message,
          productLink,
          discountCode,
          finalPrice: finalPrice ? Number(finalPrice) : null,
          startDate: startDate ? new Date(startDate).toISOString() : null,
          endDate: endDate ? new Date(endDate).toISOString() : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        setIsSuccess(true);
        toast.success("订单提交成功！");
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        setTimeout(() => {
          setIsOpen(false);
          setIsSuccess(false);
        }, 2000);
      } else {
        toast.error(data.error || "提交失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={className ?? "btn-primary w-full shadow-glow"}
        disabled={disabled}
      >
        <ShoppingCart className="h-4 w-4" />
        {disabled ? "暂不可询价" : label === "立即推广" ? "提交推广需求" : label}
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: "100%", opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.8 }}
              transition={{ type: "spring", damping: 24, stiffness: 200 }}
              className="relative flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-panel p-6 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-semibold">极简下单工作台</h3>
                  <p className="text-xs text-white/50">
                    {resourceTitle ?? "推广资源"} · 提交后进入审核流程
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-md p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {isSuccess ? (
                <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
                    <CheckCircle2 className="mb-4 h-16 w-16 text-accent" />
                  </motion.div>
                  <h3 className="text-xl font-semibold">提交成功</h3>
                  <p className="mt-2 text-sm text-white/60">
                    我们已收到推广需求，将进入审核与执行。
                  </p>
                </div>
              ) : (
                <form onSubmit={handleOrder} className="flex-1 space-y-5 overflow-y-auto pb-4">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                    <div className="flex items-center justify-between">
                      <span>公开参考价</span>
                      <span>{hasPrice ? `¥${basePrice.toFixed(2)}` : "待询价"}</span>
                    </div>
                    <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-5 text-white/50">
                      提交后由平台确认渠道档期和执行要求，再向您提供正式报价。此步骤不会扣款。
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">产品链接 / ASIN</label>
                    <input
                      className="input w-full"
                      value={productLink}
                      onChange={(e) => setProductLink(e.target.value)}
                      placeholder="粘贴商品链接或 ASIN..."
                    />
                    <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/50">
                      自动抓取产品图：{productLink ? "已检测到链接" : "等待输入"}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">折扣码</label>
                      <input
                        className="input w-full"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        placeholder="填写折扣码"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">产品参考售价（选填）</label>
                      <input
                        className="input w-full"
                        value={finalPrice}
                        onChange={(e) => setFinalPrice(e.target.value)}
                        type="number"
                        placeholder="例如 99"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">开始日期</label>
                      <input
                        className="input w-full"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        type="date"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">结束日期</label>
                      <input
                        className="input w-full"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        type="date"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">备注说明 (选填)</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="input min-h-[100px] resize-none"
                      placeholder="描述推广目标、折扣策略等..."
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setIsOpen(false)} className="btn-outline flex-1">
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary flex-1"
                    >
                      <ArrowRight className="h-4 w-4" />
                      {isSubmitting ? "提交中..." : "提交需求"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
