"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

type FormValues = {
  identifier: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState } = useForm<FormValues>();

  const onSubmit = handleSubmit(async (values) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    if (res.ok) {
      toast.success("登录成功");
      queryClient.invalidateQueries({ queryKey: ["me"] });
      router.push("/explore");
      router.refresh();
    } else {
      toast.error("登录失败，请检查账号密码");
    }
  });

  return (
    <div className="page-container py-16">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-3xl font-semibold">欢迎回来</h1>
        <p className="text-sm text-white/60">使用邮箱登录你的 GlobalPush 账号。</p>
        <form onSubmit={onSubmit} className="card space-y-4">
          <input
            className="input"
            placeholder="邮箱或手机号"
            {...register("identifier", { required: true })}
          />
          <input
            className="input"
            placeholder="密码"
            type="password"
            {...register("password", { required: true })}
          />
          <button className="btn w-full" type="submit" disabled={formState.isSubmitting}>
            立即登录
          </button>
        </form>
      </div>
    </div>
  );
}
