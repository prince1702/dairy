import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET || "supersecretdevelopmentjwtsecretkey12345!";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Paths requiring authentication
  const isProtectedPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/subadmin") ||
    pathname.startsWith("/manager") ||
    pathname.startsWith("/delivery") ||
    pathname.startsWith("/customer");

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret });

  // If no token exists, redirect to login page
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const userRole = token.role as string;

  // Check roles against routes
  if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/login?error=Unauthorized", req.url));
  }

  if (pathname.startsWith("/subadmin") && userRole !== "SUB_ADMIN") {
    return NextResponse.redirect(new URL("/login?error=Unauthorized", req.url));
  }

  if (pathname.startsWith("/manager") && userRole !== "MANAGER") {
    return NextResponse.redirect(new URL("/login?error=Unauthorized", req.url));
  }

  if (pathname.startsWith("/delivery") && userRole !== "DELIVERY_PERSON") {
    return NextResponse.redirect(new URL("/login?error=Unauthorized", req.url));
  }

  if (pathname.startsWith("/customer") && userRole !== "CUSTOMER") {
    return NextResponse.redirect(new URL("/login?error=Unauthorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/subadmin/:path*",
    "/manager/:path*",
    "/delivery/:path*",
    "/customer/:path*",
  ],
};
