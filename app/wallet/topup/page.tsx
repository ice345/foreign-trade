"use client"

import TopupClient from "./TopupClient"

export default function TopupPage() {
  return (
    <div className="page-container py-16">
      <h1 className="mb-8 text-3xl font-semibold">在线充值</h1>
      <TopupClient />
    </div>
  )
}
