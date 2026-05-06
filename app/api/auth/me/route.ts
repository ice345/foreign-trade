import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      nickname: user.nickname,
      avatar: user.avatar
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Me Error]", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
