import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Rutas públicas excluidas de cualquier validación
  if (
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    // Si ya existe sesión y el usuario solicita /login, redirigir a inicio
    const hasSession =
      request.cookies.has("recoffee_jwt") ||
      request.cookies.has("recoffee_session") ||
      request.cookies.has("recoffee_token");

    if (hasSession && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  // 2. Comprobar presencia de la cookie de sesión (recoffee_jwt, recoffee_session o recoffee_token)
  const hasSession =
    request.cookies.has("recoffee_jwt") ||
    request.cookies.has("recoffee_session") ||
    request.cookies.has("recoffee_token");

  // 3. Si no existe cookie de sesión, redirigir al login
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Si la sesión existe, permitir paso sin ninguna restricción de roles en todas las rutas y subrutas
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
