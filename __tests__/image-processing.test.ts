import { describe, expect, it } from "vitest"
import sharp from "sharp"
import { normalizeUploadedImage } from "@/lib/image-processing"

describe("uploaded image processing", () => {
  it("rejects a forged non-image payload", async () => {
    await expect(normalizeUploadedImage(Buffer.from("not an image"), {
      maxBytes: 4 * 1024 * 1024,
      screenshot: false
    })).rejects.toBeTruthy()
  })

  it("normalizes images to metadata-free WebP within 2400px", async () => {
    const source = await sharp({ create: { width: 3000, height: 1000, channels: 3, background: "#336699" } })
      .jpeg().withMetadata({ orientation: 1 }).toBuffer()
    const output = await normalizeUploadedImage(source, { maxBytes: 4 * 1024 * 1024, screenshot: false })
    const metadata = await sharp(output).metadata()
    expect(metadata.format).toBe("webp")
    expect(metadata.width).toBe(2400)
    expect(metadata.height).toBe(800)
    expect(metadata.exif).toBeUndefined()
  })
})
