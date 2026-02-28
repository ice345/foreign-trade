"use client";

import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { X, PlusCircle } from "lucide-react";
import UploadButton from "@/components/UploadButton";

type FormValues = {
  title: string;
  description: string;
  category: string;
  country: string;
  platform: string;
  link: string;
  image?: string;
  price?: number | null;
  badge?: string;
  followers?: number | null;
  tags: string;
  status: "ACTIVE" | "HIDDEN";
  categoryId?: string;
};

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

export default function ResourceModal({ onClose, onCreated }: Props) {
  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { status: "ACTIVE", tags: "", price: null }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: api.categories,
    staleTime: 5 * 60 * 1000
  });

  const imageUrl = watch("image");

  const onSubmit = handleSubmit(async (values) => {
    try {
      await api.createResource({
        ...values,
        price: values.price ?? null,
        tags: values.tags
          ? values.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
          : [],
        categoryId: values.categoryId || null
      } as any);
      toast.success("资源已创建");
      onCreated();
    } catch {
      toast.error("创建失败");
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-xl overflow-y-auto max-h-[90vh] rounded-2xl border border-white/10 bg-panel shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-panel/80 p-6 backdrop-blur-md">
          <h2 className="text-xl font-semibold tracking-tight text-white/90">新增资源</h2>
          <button
            className="rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 pt-4 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">标题</label>
              <input className="input w-full" placeholder="输入资源标题..." {...register("title", { required: true })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">分类</label>
                <select className="input w-full cursor-pointer appearance-none" {...register("category", { required: true })}>
                  <option value="" className="bg-panel">选择分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name} className="bg-panel">{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">平台</label>
                <input className="input w-full" placeholder="例如: Facebook 群组" {...register("platform", { required: true })} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">国家/地区</label>
                <input className="input w-full" placeholder="例如: 全球" {...register("country", { required: true })} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">状态</label>
                <select className="input w-full cursor-pointer appearance-none" {...register("status")}>
                  <option value="ACTIVE" className="bg-panel">Active - 显示</option>
                  <option value="HIDDEN" className="bg-panel">Hidden - 隐藏</option>
                  <option value="SOLD_OUT" className="bg-panel">Sold Out - 售罄</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">资源链接</label>
              <input className="input w-full" placeholder="https://..." {...register("link", { required: true })} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">封面图片</label>
              <UploadButton
                folder="resources"
                onUploaded={(url) => setValue("image", url)}
                currentUrl={imageUrl}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">参考价格 (人民币)</label>
              <input
                className="input w-full"
                placeholder="例如: 199.00"
                type="number"
                step="0.01"
                {...register("price", {
                  setValueAs: (value) => (value === "" ? null : Number(value))
                })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">粉丝数 (选填)</label>
                <input
                  className="input w-full"
                  placeholder="例如: 120000"
                  type="number"
                  {...register("followers", {
                    setValueAs: (value) => (value === "" ? null : Number(value))
                  })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">快速标签</label>
                <input
                  className="input w-full"
                  placeholder="例如: 爆单王"
                  {...register("badge")}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">关键词标签 (以逗号分隔)</label>
              <input
                className="input w-full"
                placeholder="例如: AI, 效率, 免费"
                {...register("tags")}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">详细描述</label>
              <textarea
                className="input min-h-[100px] w-full resize-none leading-relaxed"
                placeholder="描述这个资源的核心价值..."
                {...register("description", { required: true })}
              />
            </div>
          </div>

          <div className="pt-2">
            <div className="flex gap-3">
              <button
                type="button"
                className="btn-outline flex-1"
                onClick={onClose}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1 shadow-glow"
              >
                <PlusCircle className="h-4 w-4 mr-1.5" />
                {isSubmitting ? "创建中..." : "创建资源"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
