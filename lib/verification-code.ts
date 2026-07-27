import crypto from "crypto"

export function hashVerificationCode(secret: string, target: string, type: "EMAIL" | "PHONE", code: string) {
  return crypto.createHmac("sha256", secret).update(`${type}:${target}:${code}`).digest("hex")
}

export function verificationCodeMatches(expectedHex: string, actualHex: string) {
  const expected = Buffer.from(expectedHex, "hex")
  const actual = Buffer.from(actualHex, "hex")
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
}
