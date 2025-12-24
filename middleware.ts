import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public paths that don't require authentication
    const isPublicPath = pathname === "/login";

    // Get session token from cookies (edge-compatible)
    const sessionToken =
        request.cookies.get("authjs.session-token")?.value ||
        request.cookies.get("__Secure-authjs.session-token")?.value;

    const isAuthenticated = !!sessionToken;

    // Redirect unauthenticated users to login
    if (!isAuthenticated && !isPublicPath) {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users away from login
    if (isAuthenticated && isPublicPath) {
        const homeUrl = new URL("/", request.url);
        return NextResponse.redirect(homeUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api/auth (auth endpoints)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc)
         */
        "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
