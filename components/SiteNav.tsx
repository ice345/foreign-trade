"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, X, ShoppingCart } from "lucide-react"
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
  { href: "/orders", label: "订单进度" },
  { href: "/wallet", label: "钱包" }
]

const adminLinks = [
  { href: "/admin/dashboard", label: "数据面板" },
  { href: "/admin/resources", label: "管理控制台" },
  { href: "/admin/orders", label: "订单管理" },
  { href: "/admin/users", label: "用户管理" },
  { href: "/admin/categories", label: "分类管理" },
  { href: "/admin/tags", label: "标签管理" },
  { href: "/admin/payments", label: "支付管理" }
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

  const allMobileLinks = [
    ...baseLinks,
    ...(user ? userLinks : []),
    ...(user?.role === "ADMIN" ? adminLinks : [])
  ]

  return (
    <header className="relative z-50 border-b border-white/5 bg-black/30 backdrop-blur">
      <div className="page-container flex items-center justify-between gap-4 py-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-white/70 hover:text-white md:hidden"
            aria-label="打开菜单"
          >
            <Menu size={22} />
          </button>
          <Link href="/" className="text-lg font-semibold text-white">
            GlobalPush
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
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
        </nav>

        <div className="flex items-center gap-4">
          {user && (
            <Link href="/cart" className="relative text-white/70 transition hover:text-white">
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
              className="fixed inset-0 z-40 bg-black/60"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.nav
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gray-900 p-6 shadow-xl"
            >
              <button
                onClick={() => setDrawerOpen(false)}
                className="mb-6 self-end text-white/70 hover:text-white"
                aria-label="关闭菜单"
              >
                <X size={22} />
              </button>

              {baseLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setDrawerOpen(false)}
                  className={`rounded px-3 py-2.5 text-sm transition ${
                    pathname === link.href
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

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
                      className={`rounded px-3 py-2.5 text-sm transition ${
                        pathname === link.href
                          ? "bg-white/10 text-white"
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
                      className={`rounded px-3 py-2.5 text-sm transition ${
                        pathname === link.href
                          ? "bg-white/10 text-white"
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
