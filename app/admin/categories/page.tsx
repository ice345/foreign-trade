"use client"

import CategoryManager from "./CategoryManager"

export default function CategoriesPage() {
  return (
    <div className="page-container py-10">
      <h1 className="mb-8 text-3xl font-semibold">分类管理</h1>
      <CategoryManager />
    </div>
  )
}
