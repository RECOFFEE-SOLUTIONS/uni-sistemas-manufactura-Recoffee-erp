import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas que no requieren autenticación
  const isPublicRoute =
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico";

  // Verificación permisiva de sesión basada exclusivamente en la existencia de cualquier cookie de sesión/JWT
  const jwtCookie = request.cookies.get("recoffee_jwt")?.value;
  const sessionCookie = request.cookies.get("recoffee_session")?.value;
  const tokenCookie = request.cookies.get("recoffee_token")?.value;

  const hasValidSession = Boolean(jwtCookie || sessionCookie || tokenCookie);

  // 1. Si no existe sesión y se intenta acceder a una ruta protegida -> Redirigir a login
  if (!hasValidSession && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Si ya tiene sesión activa e intenta ir al login -> Permitir acceso al panel principal
  if (hasValidSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
