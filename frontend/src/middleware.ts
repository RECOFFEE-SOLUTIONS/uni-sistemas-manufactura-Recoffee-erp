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

  // 5. RBAC Route Protection: Validar permisos según rol del usuario
  const role = decodeURIComponent(request.cookies.get("recoffee_role")?.value || "").toLowerCase();

  // Si es Admin o no se ha determinado el rol aún, permitir acceso
  if (hasValidSession && role && role !== "admin" && !isPublicRoute && !isChangePasswordPage && pathname !== "/") {
    // Produccion: Solo ve M2 (Ingeniería) y M3 (Producción)
    if (role === "produccion") {
      const isAllowed = pathname.startsWith("/engineering") || pathname === "/transactions/production";
      if (!isAllowed) {
        return NextResponse.redirect(new URL("/transactions/production", request.url));
      }
    }
    // Calidad: Solo ve M4 (Capa MES y Calidad)
    else if (role === "calidad") {
      const isAllowed = pathname.startsWith("/mes");
      if (!isAllowed) {
        return NextResponse.redirect(new URL("/mes/execution", request.url));
      }
    }
    // Almacen: Solo ve M1 (Almacenes y Artículos) y M3 (Compras e Inventario)
    else if (role === "almacen") {
      const isAllowed =
        pathname === "/master-data/warehouses" ||
        pathname === "/master-data/items" ||
        pathname === "/transactions/purchases" ||
        pathname === "/transactions/inventory";
      if (!isAllowed) {
        return NextResponse.redirect(new URL("/transactions/inventory", request.url));
      }
    }
    // Ventas: Solo ve M3 (Ventas & Despacho)
    else if (role === "ventas") {
      const isAllowed = pathname === "/transactions/sales";
      if (!isAllowed) {
        return NextResponse.redirect(new URL("/transactions/sales", request.url));
      }
    }
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
