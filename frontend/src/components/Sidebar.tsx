"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame,
  LayoutDashboard,
  Settings,
  Database,
  Layers,
  Boxes,
  Activity,
  Radio,
  Users,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  roles: string[];
}

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lista plana de opciones del sistema apuntando a las rutas raíz con auto-redirección
  const allNavItems: NavItem[] = [
    {
      name: "Inicio",
      href: "/",
      icon: LayoutDashboard,
      roles: ["Admin", "Produccion", "Calidad", "Almacen", "Ventas"],
    },
    {
      name: "M1: Datos Maestros",
      href: "/master-data",
      icon: Database,
      roles: ["Admin", "Almacen"],
    },
    {
      name: "M2: Ingeniería de Producto",
      href: "/engineering",
      icon: Layers,
      roles: ["Admin", "Produccion"],
    },
    {
      name: "M3: Gestión Transaccional",
      href: "/transactions",
      icon: Boxes,
      roles: ["Admin", "Produccion", "Almacen", "Ventas"],
    },
    {
      name: "M4: MES & Calidad",
      href: "/mes",
      icon: Activity,
      roles: ["Admin", "Calidad", "Produccion"],
    },
    {
      name: "M5: Telemetría & KPIs",
      href: "/iiot",
      icon: Radio,
      badge: "Live",
      roles: ["Admin"],
    },
    {
      name: "M8: Administración",
      href: "/admin",
      icon: Users,
      roles: ["Admin"],
    },
    {
      name: "Configuraciones Básicas",
      href: "/settings",
      icon: Settings,
      roles: ["Admin", "Produccion", "Calidad", "Almacen", "Ventas"],
    },
  ];

  // RBAC Visual: Lectura de roles del usuario autenticado
  const userRoles = (user?.roles || []).map((r) => r.toLowerCase());
  const isAdmin = userRoles.includes("admin") || userRoles.length === 0;

  const visibleItems = allNavItems.filter((item) => {
    if (isAdmin) return true;
    return item.roles.some((r) => userRoles.includes(r.toLowerCase()));
  });

  // Cálculo de ítem activo por jerarquía de ruta
  const isItemActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/settings") return pathname.startsWith("/settings");
    if (href === "/master-data") return pathname.startsWith("/master-data");
    if (href === "/engineering") return pathname.startsWith("/engineering");
    if (href === "/transactions") return pathname.startsWith("/transactions");
    if (href === "/mes") return pathname.startsWith("/mes");
    if (href === "/iiot") return pathname.startsWith("/iiot");
    if (href === "/admin") return pathname.startsWith("/admin");
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Overlay Móvil */}
      {mobileOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Cerrar navegación lateral"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setMobileOpen(false);
          }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Barra Lateral (Sidebar) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 shadow-sm p-4 ${
          collapsed ? "w-20" : "w-64"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo y Encabezado */}
          <div className="flex items-center gap-3 px-2 py-3 mb-4 shrink-0 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-sm text-white shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-slate-900 dark:text-white tracking-tight text-base truncate">
                  ReCoffee ERP
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tracking-wider">
                  Plant 01 Industrial
                </p>
              </div>
            )}
          </div>

          {/* Navegación Modular Plana (Sin Acordeones ni Submenús) */}
          <nav className="flex-1 overflow-y-auto space-y-1 pr-1 text-sm scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  onClick={() => {
                    if (window.innerWidth < 1024) setMobileOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold border border-amber-200/80 dark:border-amber-500/25 shadow-xs"
                      : "text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1">{item.name}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 rounded shrink-0">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions: Theme Toggle & Sidebar Collapse */}
        <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4 shrink-0 mt-2">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Alternar Tema Claro / Oscuro"
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
              collapsed ? "justify-center" : ""
            }`}
          >
            {mounted && theme === "light" ? (
              <Moon className="w-4 h-4 shrink-0 text-slate-700" />
            ) : (
              <Sun className="w-4 h-4 shrink-0 text-amber-400" />
            )}
            {!collapsed && (
              <span className="font-medium truncate text-xs">
                {mounted && theme === "light" ? "Modo Oscuro" : "Modo Claro"}
              </span>
            )}
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expandir Menú" : "Colapsar Menú"}
            className="w-full hidden lg:flex items-center justify-center py-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-xl transition-colors cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
