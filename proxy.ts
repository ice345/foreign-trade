import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecret } from "@/lib/jwt-secret";
import { isAllowedRequestOrigin } from "@/lib/request-security";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isAllowedOrigin(request: NextRequest) {
  return isAllowedRequestOrigin({
    origin: request.headers.get("origin"),
    fetchSite: request.headers.get("sec-fetch-site"),
    requestOrigin: request.nextUrl.origin,
    configuredSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    vercelUrl: process.env.VERCEL_URL
  });
}

export async function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith("/api/") &&
    unsafeMethods.has(request.method) &&
    !isAllowedOrigin(request)
  ) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("globalpush_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      issuer: "globalpush",
      audience: "globalpush-web"
    });
    if (payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"]
};
