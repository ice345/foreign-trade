import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role
    });
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }
}
