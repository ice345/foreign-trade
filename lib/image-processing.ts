import sharp from "sharp"

export async function normalizeUploadedImage(source: Buffer, options: {
  maxBytes: number
  screenshot: boolean
}) {
  const image = sharp(source, { failOn: "error", limitInputPixels: 20_000_000 })
  const metadata = await image.metadata()
  if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) {
    throw new Error("UNSUPPORTED_IMAGE")
  }
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > 20_000_000) {
    throw new Error("IMAGE_DIMENSIONS")
  }
  const output = await image
    .rotate()
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: options.screenshot ? 90 : 84, effort: 4 })
    .toBuffer()
  if (output.length > options.maxBytes) throw new Error("NORMALIZED_FILE_TOO_LARGE")
  return output
}
