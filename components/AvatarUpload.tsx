"use client"

import { useState, useRef, useCallback } from "react"
import Cropper, { type Area } from "react-easy-crop"
import { X, ImageIcon, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import { toast } from "sonner"

type Props = {
  folder: string
  onUploaded: (url: string) => void
  currentUrl?: string
  size?: number
}

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const OUTPUT_SIZE = 256

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    image.crossOrigin = "anonymous"
    image.src = url
  })
}

async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  canvas.width = OUTPUT_SIZE
  canvas.height = OUTPUT_SIZE
  const ctx = canvas.getContext("2d")!

  ctx.beginPath()
  ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("Failed to create blob"))
      },
      "image/webp",
      0.85
    )
  })
}

export default function AvatarUpload({
  folder,
  onUploaded,
  currentUrl,
  size = 96
}: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleFileSelect = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("仅支持 JPEG / PNG / WebP 格式")
      return
    }
    if (file.size > MAX_SIZE) {
      toast.error("文件大小不能超过 10MB")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setCropSrc(reader.result as string)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!cropSrc || !croppedAreaPixels) return

    setUploading(true)
    setProgress(0)

    try {
      const blob = await getCroppedBlob(cropSrc, croppedAreaPixels)
      const formData = new FormData()
      formData.append("file", blob, "avatar.webp")
      formData.append("folder", folder)

      const res = await new Promise<{ url: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open("POST", "/api/upload")

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            try {
              const data = JSON.parse(xhr.responseText)
              reject(new Error(data.error || "上传失败"))
            } catch {
              reject(new Error("上传失败"))
            }
          }
        }

        xhr.onerror = () => reject(new Error("网络错误"))
        xhr.send(formData)
      })

      setPreview(res.url)
      onUploaded(res.url)
      setCropSrc(null)
      toast.success("头像上传成功")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "上传失败")
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onUploaded("")
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <>
      <div className="inline-block">
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="头像"
              className="rounded-full border border-white/10 object-cover"
              style={{ width: size, height: size }}
            />
            <div
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100 cursor-pointer"
              onClick={() => inputRef.current?.click()}
            >
              <span className="text-xs text-white">更换</span>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -right-1 -top-1 rounded-full bg-black/60 p-1 text-white/70 opacity-0 transition group-hover:opacity-100 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed border-white/10 bg-white/5 text-white/40 transition hover:border-white/20 hover:text-white/60"
            style={{ width: size, height: size }}
          >
            <ImageIcon className="h-6 w-6" />
            <span className="text-[10px]">上传</span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelect(file)
            if (inputRef.current) inputRef.current.value = ""
          }}
        />
      </div>

      {cropSrc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h3 className="text-sm font-semibold text-white">裁剪头像</h3>
              <button
                onClick={() => setCropSrc(null)}
                className="rounded-full p-1 text-white/50 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative h-72 bg-black">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="space-y-3 px-5 py-4">
              <div className="flex items-center gap-3">
                <ZoomOut className="h-4 w-4 text-white/40" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-accent"
                />
                <ZoomIn className="h-4 w-4 text-white/40" />
              </div>

              <div className="flex items-center gap-3">
                <RotateCw className="h-4 w-4 text-white/40" />
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="flex-1 accent-accent"
                />
                <span className="w-10 text-right text-xs text-white/40">{rotation}°</span>
              </div>
            </div>

            <div className="flex gap-3 border-t border-white/10 px-5 py-4">
              <button
                className="btn-outline flex-1 text-sm"
                onClick={() => setCropSrc(null)}
              >
                取消
              </button>
              <button
                className="btn-primary flex-1 text-sm"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? `上传中 ${progress}%` : "确认上传"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
