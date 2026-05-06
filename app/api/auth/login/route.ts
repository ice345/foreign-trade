import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, setSessionToken, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/login";
import { rateLimitByIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const limit = rateLimitByIp(request, "login", 10, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } }
      );
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { identifier, email, phone, password } = parsed.data;
    const loginId = identifier || email || phone;

    if (!loginId) {
      return NextResponse.json({ error: "请输入邮箱或手机号" }, { status: 400 });
    }

    const normalized = String(loginId).trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalized }, { phone: String(loginId).trim() }]
      }
    });

    if (!user) {
      return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
    }

    const token = await createToken({ userId: user.id, role: user.role });
    await setSessionToken(token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Login Error]", error);
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}
