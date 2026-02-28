"use client"

import TagManager from "./TagManager"

export default function TagsPage() {
  return (
    <div className="page-container py-10">
      <h1 className="mb-8 text-3xl font-semibold">标签管理</h1>
      <TagManager />
    </div>
  )
}
