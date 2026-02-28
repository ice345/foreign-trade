import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { jwtSecret } from "@/lib/jwt-secret";

const tokenName = "globalpush_token";
const MAX_AGE = 7 * 24 * 60 * 60;

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: { userId: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(jwtSecret);
}

export async function setSessionToken(token: string) {
  const cookieStore = cookies();
  cookieStore.set(tokenName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: MAX_AGE
  });
}

export async function clearSessionToken() {
  const cookieStore = cookies();
  cookieStore.set(tokenName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    expires: new Date(0)
  });
}

export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(tokenName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, jwtSecret);
    return payload as { userId: string; role: string };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.userId) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}
