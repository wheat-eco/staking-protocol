import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const ip = forwarded?.split(",")[0] || realIp || "unknown"

  return NextResponse.json({
    ip: ip,
    userAgent: request.headers.get("user-agent") || "unknown",
  })
}
