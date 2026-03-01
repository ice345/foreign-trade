"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { fetcherOrNull, api } from "@/lib/api"
import type { UserProfile } from "@/lib/types"
import { toast } from "sonner"
import { User, Lock, Loader2 } from "lucide-react"
import UploadButton from "@/components/UploadButton"

export default function ProfileSettings() {
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => fetcherOrNull<UserProfile>("/api/auth/me")
  })

  const [nickname, setNickname] = useState("")
  const [avatar, setAvatar] = useState<string | undefined>(undefined)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  if (user && !profileLoaded) {
    setNickname(user.nickname ?? "")
    setAvatar(user.avatar ?? undefined)
    setProfileLoaded(true)
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      await api.updateProfile({ nickname: nickname.trim() || undefined, avatar: avatar ?? undefined })
      toast.success("资料已更新")
      queryClient.invalidateQueries({ queryKey: ["me"] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新失败")
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("两次密码不一致")
      return
    }
    if (newPassword.length < 8) {
      toast.error("新密码至少 8 位")
      return
    }

    setSavingPassword(true)
    try {
      await api.changePassword({ currentPassword, newPassword })
      toast.success("密码已修改")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "修改失败")
    } finally {
      setSavingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-white/50">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        加载中...
      </div>
    )
  }

  if (!user) {
    return <p className="text-sm text-white/50">请先登录</p>
  }

  return (
    <div className="space-y-8 max-w-lg">
      <div className="card border-white/10 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
          <User className="h-4 w-4" />
          基本信息
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/60">头像</label>
          <UploadButton
            folder="avatars"
            onUploaded={(url) => setAvatar(url)}
            currentUrl={avatar}
            circular
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/60">昵称</label>
          <input
            className="input w-full"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="设置一个昵称..."
            maxLength={50}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/60">邮箱</label>
          <input
            className="input w-full opacity-60"
            value={user.email ?? ""}
            disabled
            readOnly
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/60">手机</label>
          <input
            className="input w-full opacity-60"
            value={user.phone ?? ""}
            disabled
            readOnly
          />
        </div>

        <button
          className="btn-primary text-sm"
          onClick={handleSaveProfile}
          disabled={savingProfile}
        >
          {savingProfile ? "保存中..." : "保存资料"}
        </button>
      </div>

      <div className="card border-white/10 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
          <Lock className="h-4 w-4" />
          修改密码
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/60">当前密码</label>
          <input
            className="input w-full"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="输入当前密码"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/60">新密码</label>
          <input
            className="input w-full"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="至少 8 位"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/60">确认新密码</label>
          <input
            className="input w-full"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="再次输入新密码"
          />
        </div>

        <button
          className="btn-primary text-sm"
          onClick={handleChangePassword}
          disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
        >
          {savingPassword ? "修改中..." : "修改密码"}
        </button>
      </div>
    </div>
  )
}
