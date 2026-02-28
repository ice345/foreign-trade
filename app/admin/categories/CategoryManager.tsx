"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { fetcher } from "@/lib/api"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, X } from "lucide-react"

type Category = {
  id: string
  name: string
  sort: number
  _count?: { resources: number }
}

export default function CategoryManager() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Category | null>(null)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState("")
  const [sort, setSort] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["admin-categories"],
    queryFn: () => fetcher<Category[]>("/api/admin/categories")
  })

  const handleSave = async () => {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      if (editing) {
        await fetcher(`/api/admin/categories/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify({ name: name.trim(), sort })
        })
        toast.success("分类已更新")
      } else {
        await fetcher("/api/admin/categories", {
          method: "POST",
          body: JSON.stringify({ name: name.trim(), sort })
        })
        toast.success("分类已创建")
      }
      setEditing(null)
      setAdding(false)
      setName("")
      setSort(0)
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "操作失败")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除该分类？")) return
    try {
      await fetcher(`/api/admin/categories/${id}`, { method: "DELETE" })
      toast.success("分类已删除")
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败")
    }
  }

  const startEdit = (cat: Category) => {
    setEditing(cat)
    setAdding(false)
    setName(cat.name)
    setSort(cat.sort)
  }

  const startAdd = () => {
    setAdding(true)
    setEditing(null)
    setName("")
    setSort(0)
  }

  const cancel = () => {
    setEditing(null)
    setAdding(false)
    setName("")
    setSort(0)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/50">共 {categories.length} 个分类</p>
        <button className="btn-primary text-sm" onClick={startAdd}>
          <Plus className="mr-1 h-4 w-4" />
          添加分类
        </button>
      </div>

      {(adding || editing) && (
        <div className="card border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editing ? "编辑分类" : "新增分类"}</h3>
            <button onClick={cancel} className="text-white/50 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">名称</label>
              <input
                className="input w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="分类名称"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">排序</label>
              <input
                className="input w-full"
                type="number"
                value={sort}
                onChange={(e) => setSort(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-outline text-sm" onClick={cancel}>取消</button>
            <button className="btn-primary text-sm" onClick={handleSave} disabled={submitting || !name.trim()}>
              {submitting ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden p-0 border-white/5">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/5 bg-white/5 text-xs uppercase tracking-wider text-white/40">
            <tr>
              <th className="px-6 py-4">名称</th>
              <th className="px-6 py-4">排序</th>
              <th className="px-6 py-4">资源数</th>
              <th className="px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {categories.map((cat) => (
              <tr key={cat.id} className="text-white/70">
                <td className="px-6 py-4 font-medium text-white">{cat.name}</td>
                <td className="px-6 py-4">{cat.sort}</td>
                <td className="px-6 py-4">{cat._count?.resources ?? 0}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => startEdit(cat)}
                      className="rounded p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="rounded p-1.5 text-white/40 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!categories.length && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-white/40">
                  暂无分类
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
