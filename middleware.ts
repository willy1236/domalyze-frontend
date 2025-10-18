import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const session = request.cookies.get("jwt")
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (pathname === "/login") {
    if (session) {
      const dashboardUrl = new URL("/dashboard", request.url)
      return NextResponse.redirect(dashboardUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}
