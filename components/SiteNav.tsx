"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, X, ShoppingCart, ArrowUpRight } from "lucide-react"
import { fetcherOrNull } from "@/lib/api"
import type { UserProfile } from "@/lib/types"
import type { CartItemData } from "@/lib/types"
import UserMenu from "@/components/UserMenu"
import TimeZones from "@/components/TimeZones"
import NotificationBell from "@/components/NotificationBell"
import NavDropdown from "@/components/NavDropdown"

const baseLinks = [
  { href: "/explore", label: "资源探索" },
  { href: "/search", label: "搜索" }
]

const userLinks = [
  { href: "/profile", label: "收藏中心" },
  { href: "/profile/settings", label: "个人设置" },
  { href: "/orders", label: "需求进度" }
]

const adminLinks = [
  { href: "/admin/dashboard", label: "数据面板" },
  { href: "/admin/resources", label: "管理控制台" },
  { href: "/admin/orders", label: "订单管理" },
  { href: "/admin/users", label: "用户管理" },
  { href: "/admin/categories", label: "分类管理" },
  { href: "/admin/tags", label: "标签管理" },
  { href: "/admin/payments", label: "历史账务" },
  { href: "/admin/help", label: "使用帮助" }
]

export default function SiteNav() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => fetcherOrNull<UserProfile>("/api/auth/me")
  })

  const { data: cartItems } = useQuery({
    queryKey: ["cart"],
    queryFn: () => fetcherOrNull<CartItemData[]>("/api/cart"),
    enabled: !!user
  })

  const cartCount = cartItems?.length ?? 0

  return (
    <header className="sticky top-0 z-50 px-3 py-3 md:px-6">
      <div className="glass-surface mx-auto flex min-h-16 w-full max-w-[1360px] items-center justify-between gap-4 rounded-xl px-4 py-2.5 md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-white/70 hover:text-white md:hidden"
            aria-label="打开菜单"
          >
            <Menu size={22} />
          </button>
          <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold text-white">
            <Image src="/icon.svg" alt="" width={36} height={36} className="h-9 w-9" priority />
            <span className="hidden sm:inline">GlobalPush</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-7 text-sm text-[var(--text-secondary)] md:flex">
          {baseLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? "text-white" : "hover:text-white"}
            >
              {link.label}
            </Link>
          ))}
          {user && <NavDropdown label="我的" links={userLinks} />}
          {user?.role === "ADMIN" && (
            <NavDropdown label="管理" links={adminLinks} />
          )}
          <Link href="/orders" className="inline-flex items-center gap-1 hover:text-white">需求档案<ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </nav>

        <div className="flex items-center gap-4">
          {user && (
            <Link href="/cart" className="relative text-white/70 transition hover:text-white" aria-label="需求清单" title="需求清单">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          )}
          {user && <NotificationBell />}
          <TimeZones />
          <UserMenu />
        </div>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.nav
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[var(--surface)] p-6 shadow-xl"
            >
              <button
                onClick={() => setDrawerOpen(false)}
                className="mb-6 self-end text-white/70 hover:text-white"
                aria-label="关闭菜单"
              >
                <X size={22} />
              </button>

              {user && (
                <div className="mb-4 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
                      {(user.nickname || user.email || user.phone || "U").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">
                      {user.nickname || user.email || user.phone}
                    </div>
                    {user.nickname && (user.email || user.phone) && (
                      <div className="truncate text-xs text-white/40">
                        {user.email || user.phone}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {baseLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setDrawerOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm transition ${
                    pathname === link.href
                      ? "border-l-2 border-accent bg-accent/10 pl-2.5 font-medium text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {!user && (
                <div className="mt-6 grid grid-cols-2 gap-2">
                  <Link href="/login" onClick={() => setDrawerOpen(false)} className="btn-outline">登录</Link>
                  <Link href="/register" onClick={() => setDrawerOpen(false)} className="btn-primary">注册</Link>
                </div>
              )}

              {user && (
                <>
                  <div className="mb-1 mt-4 px-3 text-xs uppercase tracking-wider text-white/30">
                    我的
                  </div>
                  {userLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setDrawerOpen(false)}
                      className={`rounded-lg px-3 py-2.5 text-sm transition ${
                        pathname === link.href
                          ? "border-l-2 border-accent bg-accent/10 pl-2.5 font-medium text-white"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </>
              )}

              {user?.role === "ADMIN" && (
                <>
                  <div className="mb-1 mt-4 px-3 text-xs uppercase tracking-wider text-white/30">
                    管理
                  </div>
                  {adminLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setDrawerOpen(false)}
                      className={`rounded-lg px-3 py-2.5 text-sm transition ${
                        pathname === link.href
                          ? "border-l-2 border-accent bg-accent/10 pl-2.5 font-medium text-white"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </>
              )}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
