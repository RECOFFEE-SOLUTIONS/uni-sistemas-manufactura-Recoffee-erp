import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Lectura explícita de la cookie HttpOnly del JWT ('recoffee_jwt') o el flag sincronizado ('recoffee_session')
  const jwtCookie = request.cookies.get("recoffee_jwt")?.value;
  const sessionCookie = request.cookies.get("recoffee_session")?.value;
  const tokenCookie = request.cookies.get("recoffee_token")?.value;

  const hasValidSession = Boolean(jwtCookie || sessionCookie || tokenCookie);

  const mustChangePassword = request.cookies.get("recoffee_must_change")?.value === "1";

  const isLoginPage = pathname === "/login";
  const isChangePasswordPage = pathname === "/auth/change-password";

  // Rutas públicas que no requieren autenticación
  const isPublicRoute =
    isLoginPage ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico";

  // 2. Si NO existe sesión válida y se intenta acceder a una ruta protegida -> FORZAR REDIRECCIÓN A /login
  if (!hasValidSession && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Si ya tiene sesión activa e intenta ir al login (sin tener que cambiar clave)
  if (hasValidSession && isLoginPage) {
    if (mustChangePassword) {
      return NextResponse.redirect(new URL("/auth/change-password", request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 4. Si tiene contraseña temporal obligatoria y navega por el sistema fuera de cambiar contraseña
  if (hasValidSession && mustChangePassword && !isChangePasswordPage && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/change-password", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files and assets:
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
