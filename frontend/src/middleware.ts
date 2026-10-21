import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session =
    request.cookies.get("recoffee_session")?.value ||
    request.cookies.get("recoffee_jwt")?.value ||
    request.cookies.get("recoffee_token")?.value;

  const mustChangePassword = request.cookies.get("recoffee_must_change")?.value === "1";

  const isLoginPage = pathname === "/login";
  const isChangePasswordPage = pathname === "/auth/change-password";

  // Rutas públicas o de soporte que no requieren autenticación
  const isPublicRoute =
    isLoginPage ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico";

  // Si no está autenticado y accede a una ruta protegida
  if (!session && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si ya tiene sesión activa e intenta ir al login (y no debe cambiar contraseña)
  if (session && isLoginPage) {
    if (mustChangePassword) {
      return NextResponse.redirect(new URL("/auth/change-password", request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Si tiene la bandera de contraseña temporal obligatoria y navega por el sistema fuera de cambiar contraseña
  if (session && mustChangePassword && !isChangePasswordPage && !pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
    return NextResponse.redirect(new URL("/auth/change-password", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
