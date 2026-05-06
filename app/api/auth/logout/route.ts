import { NextResponse } from "next/server";
import { clearSessionToken } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";

export async function POST() {
  try {
    await clearSessionToken();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
