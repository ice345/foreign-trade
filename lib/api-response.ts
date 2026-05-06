import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    if (error.message === "Forbidden") {
      return apiError("Forbidden", 403);
    }
    if (error.message === "余额不足") {
      return apiError("余额不足", 400);
    }
    console.error("[API Error]", error.message);
  } else {
    console.error("[API Error]", error);
  }
  return apiError("服务器内部错误", 500);
}
