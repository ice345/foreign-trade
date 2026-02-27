import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, setSessionToken, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const { identifier, email, phone, password } = await request.json();
  const loginId = identifier || email || phone;
  if (!loginId || !password) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  const normalized = String(loginId).trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalized }, { phone: String(loginId).trim() }]
    }
  });
  if (!user) {
    return new NextResponse("Invalid credentials", { status: 401 });
  }
  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return new NextResponse("Invalid credentials", { status: 401 });
  }
  const token = await createToken({ userId: user.id, role: user.role });
  await setSessionToken(token);
  return NextResponse.json({ ok: true });
}
