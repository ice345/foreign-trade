"use client";

import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { ResourceDetail } from "@/lib/types";

type FormValues = Omit<ResourceDetail, "tags"> & {
  tags: string;
  price?: number | null;
  badge?: string | null;
  followers?: number | null;
};

export default function AdminResourceEditor({ resource }: { resource: ResourceDetail }) {
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      ...resource,
      tags: resource.tags.join(", "),
      badge: resource.badge ?? "",
      followers: resource.followers ?? null
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await api.updateResource(resource.id, {
        ...values,
        price: values.price ?? null,
        tags: values.tags
          ? values.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
          : []
      });
      toast.success("资源已更新");
    } catch {
      toast.error("更新失败");
    }
  });

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <input className="input" placeholder="标题" {...register("title", { required: true })} />
        <input className="input" placeholder="分类（如：家居）" {...register("category", { required: true })} />
        <input className="input" placeholder="国家" {...register("country", { required: true })} />
        <input className="input" placeholder="平台（如：Facebook 群组）" {...register("platform", { required: true })} />
      </div>
      <input className="input" placeholder="资源链接" {...register("link", { required: true })} />
      <input className="input" placeholder="图片链接" {...register("image")} />
      <input
        className="input"
        placeholder="参考价格（人民币）"
        type="number"
        step="0.01"
        {...register("price", {
          setValueAs: (value) => (value === "" ? null : Number(value))
        })}
      />
      <input
        className="input"
        placeholder="粉丝数（选填）"
        type="number"
        {...register("followers", {
          setValueAs: (value) => (value === "" ? null : Number(value))
        })}
      />
      <input className="input" placeholder="快速标签（如：爆单王）" {...register("badge")} />
      <textarea
        className="input min-h-[140px]"
        placeholder="描述"
        {...register("description", { required: true })}
      />
      <input
        className="input"
        placeholder="标签（逗号分隔）"
        {...register("tags")}
      />
      <select className="input" {...register("status")}>
        <option value="ACTIVE">Active</option>
        <option value="HIDDEN">Hidden</option>
      </select>
      <button className="btn w-full" type="submit">
        保存修改
      </button>
    </form>
  );
}
