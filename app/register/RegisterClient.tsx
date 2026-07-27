"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Mail, Phone } from "lucide-react"
import { registerSchema, type RegisterInput } from "@/lib/validations/auth"

type TabType = "EMAIL" | "PHONE"

export default function RegisterClient() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<TabType>("EMAIL")
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [sendingCode, setSendingCode] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting }
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { type: "EMAIL", target: "", code: "", password: "", confirmPassword: "" }
  })

  const target = useWatch({ control, name: "target" })

  const switchTab = useCallback(
    (newTab: TabType) => {
      setTab(newTab)
      setValue("type", newTab)
      setValue("target", "")
      setValue("code", "")
      setCodeSent(false)
      setCountdown(0)
    },
    [setValue]
  )

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleSendCode = async () => {
    const trimmed = target?.trim()
    if (!trimmed) {
      toast.error(tab === "EMAIL" ? "请输入邮箱" : "请输入手机号")
      return
    }

    if (tab === "EMAIL" && !/^\S+@\S+\.\S+$/.test(trimmed)) {
      toast.error("邮箱格式不正确")
      return
    }
    if (tab === "PHONE" && !/^\+?[0-9]{6,15}$/.test(trimmed)) {
      toast.error("手机号格式不正确")
      return
    }

    setSendingCode(true)
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: trimmed, type: tab })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        if (data.code) {
          setValue("code", data.code)
          toast.success(`验证码已发送（开发模式：${data.code}）`)
        } else {
          toast.success("验证码已发送")
        }
        setCodeSent(true)
        setCountdown(60)
      } else {
        toast.error(data.error || "发送失败")
      }
    } catch {
      toast.error("发送验证码失败")
    } finally {
      setSendingCode(false)
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.success("注册成功")
        queryClient.invalidateQueries({ queryKey: ["me"] })
        router.push("/login")
        router.refresh()
      } else {
        toast.error(data.error || "注册失败")
      }
    } catch {
      toast.error("注册失败")
    }
  })

  return (
    <div className="page-container py-16">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-3xl font-semibold">注册账号</h1>
        <p className="text-sm text-white/60">创建一个新的 GlobalPush 账号。</p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => switchTab("EMAIL")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition ${
              tab === "EMAIL"
                ? "bg-white text-black"
                : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            邮箱
          </button>
          <button
            type="button"
            onClick={() => switchTab("PHONE")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition ${
              tab === "PHONE"
                ? "bg-white text-black"
                : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            <Phone className="h-3.5 w-3.5" />
            手机
          </button>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4">
          <div>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder={tab === "EMAIL" ? "邮箱地址" : "手机号"}
                type={tab === "EMAIL" ? "email" : "tel"}
                {...register("target")}
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0}
                className="btn-outline shrink-0 text-sm"
              >
                {countdown > 0 ? `${countdown}s` : sendingCode ? "发送中..." : "发送验证码"}
              </button>
            </div>
            {errors.target && (
              <p className="mt-1 text-xs text-red-400">{errors.target.message}</p>
            )}
          </div>

          <div>
            <input
              className="input w-full"
              placeholder="6 位验证码"
              maxLength={6}
              {...register("code")}
            />
            {errors.code && (
              <p className="mt-1 text-xs text-red-400">{errors.code.message}</p>
            )}
          </div>

          <div>
            <input
              className="input w-full"
              placeholder="密码（至少 8 位）"
              type="password"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          <div>
            <input
              className="input w-full"
              placeholder="确认密码"
              type="password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            className="btn w-full"
            type="submit"
            disabled={isSubmitting || !codeSent}
          >
            {isSubmitting ? "注册中..." : "创建账号"}
          </button>

          {!codeSent && (
            <p className="text-center text-xs text-white/40">请先发送验证码</p>
          )}
        </form>
      </div>
    </div>
  )
}
