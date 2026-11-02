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
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";

interface SubItem {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  id?: string;
  href?: string;
  icon: React.ElementType;
  badge?: string;
  roles: string[];
  children?: SubItem[];
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

  // Estado del acordeón: módulos colapsados por defecto (inician vacíos)
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Definición de ítems del menú con soporte para acordeones y submódulos
  const allNavItems: NavItem[] = [
    {
      name: "Inicio",
      href: "/",
      icon: LayoutDashboard,
      roles: ["Admin", "Produccion", "Calidad", "Almacen", "Ventas"],
    },
    {
      name: "M1: Datos Maestros",
      id: "master-data",
      icon: Database,
      roles: ["Admin", "Almacen"],
      children: [
        { name: "Almacenes", href: "/master-data/warehouses" },
        { name: "Artículos", href: "/master-data/items" },
        { name: "Proveedores", href: "/master-data/suppliers" },
        { name: "Clientes", href: "/master-data/customers" },
      ],
    },
    {
      name: "M2: Ingeniería de Producto",
      id: "engineering",
      icon: Layers,
      roles: ["Admin", "Produccion"],
      children: [
        { name: "Estructura BOM", href: "/engineering/bom" },
        { name: "Rutas Técnicas", href: "/engineering/routes" },
      ],
    },
    {
      name: "M3: Gestión Transaccional",
      id: "transactions",
      icon: Boxes,
      roles: ["Admin", "Produccion", "Almacen", "Ventas"],
      children: [
        { name: "Compras", href: "/transactions/purchases" },
        { name: "Inventario / Kardex", href: "/transactions/inventory" },
        { name: "Producción", href: "/transactions/production" },
        { name: "Ventas & Despacho", href: "/transactions/sales" },
      ],
    },
    {
      name: "M4: MES & Calidad",
      id: "mes",
      icon: Activity,
      roles: ["Admin", "Calidad", "Produccion"],
      children: [
        { name: "Piso de Planta", href: "/mes/execution" },
        { name: "Calidad (RO-5)", href: "/mes/quality" },
        { name: "Trazabilidad Lotes", href: "/mes/traceability" },
        { name: "Scrap & Retrabajo", href: "/mes/scrap" },
      ],
    },
    {
      name: "M5: Telemetría & KPIs",
      id: "iiot",
      icon: Radio,
      badge: "Live",
      roles: ["Admin"],
      children: [
        { name: "Curva Secado RO-3", href: "/iiot/sensor" },
        { name: "Dashboard KPIs & OEE", href: "/iiot/kpis" },
      ],
    },
    {
      name: "M8: Administración",
      id: "admin",
      icon: Users,
      roles: ["Admin"],
      children: [
        { name: "Gestión de Usuarios", href: "/admin/users" },
      ],
    },
    {
      name: "Configuraciones Básicas",
      href: "/settings",
      icon: Settings,
      roles: ["Admin", "Produccion", "Calidad", "Almacen", "Ventas"],
    },
  ];

  // RBAC Visual: Filtrado por roles del usuario autenticado
  const userRoles = (user?.roles || []).map((r) => r.toLowerCase());
  const isAdmin = userRoles.includes("admin") || userRoles.length === 0;

  const visibleItems = allNavItems.filter((item) => {
    if (isAdmin) return true;
    return item.roles.some((r) => userRoles.includes(r.toLowerCase()));
  });

  // Alternar acordeón de un módulo principal
  const toggleModule = (moduleId: string) => {
    if (collapsed) {
      setCollapsed(false);
      setExpandedModules((prev) => ({
        ...prev,
        [moduleId]: true,
      }));
      return;
    }
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
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

          {/* Navegación con Acordeón */}
          <nav className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-sm scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const hasChildren = Boolean(item.children && item.children.length > 0);
              const moduleId = item.id || item.name;
              const isExpanded = Boolean(expandedModules[moduleId]);

              // 1. Ítem Independiente de Nivel Superior (Inicio o Configuraciones Básicas)
              if (!hasChildren && item.href) {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    onClick={() => {
                      if (window.innerWidth < 1024) setMobileOpen(false);
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border-l-2 ${
                      isActive
                        ? "bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 font-bold border-l-amber-500 border-amber-200/80 dark:border-amber-500/25 shadow-xs"
                        : "text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border-l-transparent border-transparent"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    />
                    {!collapsed && <span className="truncate flex-1">{item.name}</span>}
                  </Link>
                );
              }

              // 2. Módulo Principal con Acordeón Desplegable (NO navega a ruta raíz, expande submódulos)
              const isParentActive = Boolean(
                item.children?.some(
                  (sub) => pathname === sub.href || pathname.startsWith(sub.href + "/")
                )
              );

              return (
                <div key={moduleId} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleModule(moduleId)}
                    title={collapsed ? item.name : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border-l-2 select-none ${
                      isParentActive
                        ? "bg-amber-50/80 dark:bg-amber-500/10 text-amber-900 dark:text-amber-300 font-bold border-l-amber-500"
                        : "text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border-l-transparent"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isParentActive
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1 text-left">{item.name}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 rounded shrink-0 mr-1">
                            {item.badge}
                          </span>
                        )}
                        <ChevronDown
                          className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
                            isExpanded ? "rotate-180 text-amber-600 dark:text-amber-400" : ""
                          }`}
                        />
                      </>
                    )}
                  </button>

                  {/* Submódulos Desplegables con Indentación Clara */}
                  {!collapsed && isExpanded && item.children && (
                    <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-200/80 dark:border-slate-800 ml-5 my-1">
                      {item.children.map((sub) => {
                        const isSubActive =
                          pathname === sub.href || pathname.startsWith(sub.href + "/");

                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => {
                              if (window.innerWidth < 1024) setMobileOpen(false);
                            }}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all border-l-2 ${
                              isSubActive
                                ? "bg-amber-100/70 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold border-l-amber-600 dark:border-l-amber-400 shadow-2xs"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/40 border-l-transparent font-medium"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                                isSubActive
                                  ? "bg-amber-600 dark:bg-amber-400 scale-125"
                                  : "bg-slate-300 dark:bg-slate-600"
                              }`}
                            />
                            <span className="truncate">{sub.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions: Alternar Tema y Colapso de Barra Lateral */}
        <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4 shrink-0 mt-2">
          {/* Botón de Alternar Tema */}
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

          {/* Botón de Colapso en Escritorio */}
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
