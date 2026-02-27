const IMGBB_API = "https://api.imgbb.com/1/upload"

export async function uploadToImgBB(
  base64Image: string,
  name?: string
): Promise<{ url: string; deleteUrl: string; thumbUrl: string }> {
  const apiKey = process.env.IMGBB_API_KEY
  if (!apiKey) {
    throw new Error("IMGBB_API_KEY is not configured")
  }

  const form = new URLSearchParams()
  form.append("key", apiKey)
  form.append("image", base64Image)
  if (name) {
    form.append("name", name)
  }

  const res = await fetch(IMGBB_API, {
    method: "POST",
    body: form
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`ImgBB upload failed: ${text}`)
  }

  const json = await res.json()

  if (!json.success) {
    throw new Error("ImgBB upload failed")
  }

  return {
    url: json.data.url,
    deleteUrl: json.data.delete_url,
    thumbUrl: json.data.thumb?.url ?? json.data.url
  }
}
