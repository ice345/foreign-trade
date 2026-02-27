import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? ""
  }
})

const bucket = process.env.R2_BUCKET_NAME ?? "globalpush"
const publicUrl = process.env.R2_PUBLIC_URL ?? ""

export async function getPresignedUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType
  })

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 })

  return {
    uploadUrl,
    publicUrl: `${publicUrl}/${key}`
  }
}
