"use client";

import { useState, useRef } from "react";
import { X, ImageIcon } from "lucide-react";
import { toast } from "sonner";

type Props = {
  folder: string;
  onUploaded: (url: string) => void;
  currentUrl?: string;
  label?: string;
  circular?: boolean;
};

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function UploadButton({
  folder,
  onUploaded,
  currentUrl,
  label = "上传图片",
  circular = false
}: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("仅支持 JPEG / PNG / WebP 格式");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("文件大小不能超过 5MB");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await new Promise<{ url: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const data = JSON.parse(xhr.responseText);
              reject(new Error(data.error || "上传失败"));
            } catch {
              reject(new Error("上传失败"));
            }
          }
        };

        xhr.onerror = () => reject(new Error("网络错误"));
        xhr.send(formData);
      });

      setPreview(res.url);
      onUploaded(res.url);
      toast.success("上传成功");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onUploaded("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={circular ? "inline-block" : "space-y-2"}>
      {preview ? (
        <div className="relative group">
          <div
            className={
              circular
                ? "h-24 w-24 rounded-full border border-white/10 bg-cover bg-center"
                : "h-32 w-full rounded-xl border border-white/10 bg-cover bg-center"
            }
            style={{ backgroundImage: `url(${preview})` }}
          />
          <button
            type="button"
            onClick={handleRemove}
            className={
              circular
                ? "absolute right-0 top-0 rounded-full bg-black/60 p-1 text-white/70 opacity-0 transition group-hover:opacity-100 hover:text-white"
                : "absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white/70 opacity-0 transition group-hover:opacity-100 hover:text-white"
            }
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={
            circular
              ? "flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed border-white/10 bg-white/5 text-white/40 transition hover:border-white/20 hover:text-white/60"
              : "flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 bg-white/5 text-white/40 transition hover:border-white/20 hover:text-white/60"
          }
        >
          {uploading ? (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
              <span className="text-xs">{progress}%</span>
            </>
          ) : (
            <>
              <ImageIcon className={circular ? "h-6 w-6" : "h-8 w-8"} />
              <span className="text-xs">{label}</span>
              {!circular && <span className="text-[10px]">JPEG / PNG / WebP, 最大 5MB</span>}
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
