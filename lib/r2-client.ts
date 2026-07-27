import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3"

function required(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing server storage configuration: ${name}`)
  return value
}

let client: S3Client | null = null

function getClient() {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${required("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: required("R2_ACCESS_KEY_ID"),
        secretAccessKey: required("R2_SECRET_ACCESS_KEY")
      }
    })
  }
  return client
}

function bucket() {
  return required("R2_BUCKET_NAME")
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  await getClient().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: "private, no-store"
  }))
}

export async function getObject(key: string) {
  return getClient().send(new GetObjectCommand({ Bucket: bucket(), Key: key }))
}

export async function deleteObject(key: string) {
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }))
}
