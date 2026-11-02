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
  GitBranch,
  ShoppingCart,
  Boxes,
  Factory,
  Truck,
  ClipboardCheck,
  Activity,
  Radio,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  Sun,
  Moon,
  Users,
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

interface NavSection {
  title: string;
  icon: React.ElementType;
  roles?: string[];
  items: NavItem[];
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

  // Estado inicial: todos los módulos contraídos por defecto (WI-8.01 / Requerimiento M8)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  // Definición de Secciones y Módulos con RBAC estricto
  const allSections: NavSection[] = [
    {
      title: "General",
      icon: LayoutDashboard,
      roles: ["Admin", "Produccion", "Calidad", "Almacen", "Ventas"],
      items: [
        { name: "Inicio", href: "/", icon: LayoutDashboard, roles: ["Admin", "Produccion", "Calidad", "Almacen", "Ventas"] },
        { name: "Configuraciones Básicas", href: "/settings", icon: Settings, roles: ["Admin", "Produccion", "Calidad", "Almacen", "Ventas"] },
      ],
    },
    {
      title: "M1: Maestros",
      icon: Database,
      roles: ["Admin", "Almacen"],
      items: [
        { name: "Almacenes", href: "/master-data/warehouses", icon: Database, roles: ["Admin", "Almacen"] },
        { name: "Artículos", href: "/master-data/items", icon: Boxes, roles: ["Admin", "Almacen"] },
        { name: "Proveedores", href: "/master-data/suppliers", icon: Truck, roles: ["Admin"] },
        { name: "Clientes", href: "/master-data/customers", icon: ShoppingCart, roles: ["Admin"] },
      ],
    },
    {
      title: "M2: Ingeniería",
      icon: Layers,
      roles: ["Admin", "Produccion"],
      items: [
        { name: "Estructura BOM", href: "/engineering/bom", icon: Layers, roles: ["Admin", "Produccion"] },
        { name: "Rutas Técnicas", href: "/engineering/routes", icon: GitBranch, roles: ["Admin", "Produccion"] },
      ],
    },
    {
      title: "M3: Transaccional",
      icon: ShoppingCart,
      roles: ["Admin", "Produccion", "Almacen", "Ventas"],
      items: [
        { name: "Compras", href: "/transactions/purchases", icon: ShoppingCart, roles: ["Admin", "Almacen"] },
        { name: "Inventario / Kardex", href: "/transactions/inventory", icon: Boxes, roles: ["Admin", "Almacen"] },
        { name: "Producción", href: "/transactions/production", icon: Factory, roles: ["Admin", "Produccion"] },
        { name: "Ventas & Despacho", href: "/transactions/sales", icon: Truck, roles: ["Admin", "Ventas"] },
      ],
    },
    {
      title: "M4: MES & Calidad",
      icon: Activity,
      roles: ["Admin", "Calidad", "Produccion"],
      items: [
        { name: "Piso de Planta", href: "/mes/execution", icon: Activity, roles: ["Admin", "Produccion", "Calidad"] },
        { name: "Calidad (RO-5)", href: "/mes/quality", icon: ClipboardCheck, roles: ["Admin", "Calidad"] },
        { name: "Trazabilidad Lotes", href: "/mes/traceability", icon: GitBranch, roles: ["Admin", "Calidad", "Produccion"] },
        { name: "Scrap & Retrabajo", href: "/mes/scrap", icon: ShieldAlert, roles: ["Admin", "Calidad"] },
      ],
    },
    {
      title: "M5: Telemetría & IIoT",
      icon: Radio,
      roles: ["Admin"],
      items: [
        { name: "Curva Secado RO-3", href: "/iiot/sensor", icon: Radio, badge: "Live", roles: ["Admin"] },
        { name: "Dashboard KPIs & OEE", href: "/iiot/kpis", icon: LayoutDashboard, roles: ["Admin"] },
      ],
    },
    {
      title: "M8: Administración",
      icon: Users,
      roles: ["Admin"],
      items: [
        { name: "Gestión de Usuarios", href: "/admin/users", icon: Users, roles: ["Admin"] },
      ],
    },
  ];

  // RBAC Visual: Lectura de roles del usuario y filtrado estricto
  const userRoles = (user?.roles || []).map((r) => r.toLowerCase());
  const isAdmin = userRoles.includes("admin") || userRoles.length === 0;

  const filteredSections = allSections
    .filter((section) => {
      if (isAdmin) return true;
      if (!section.roles) return true;
      return section.roles.some((r) => userRoles.includes(r.toLowerCase()));
    })
    .map((section) => {
      // Filtrar ítems de la sección según el rol
      const visibleItems = section.items.filter((item) => {
        if (isAdmin) return true;
        return item.roles.some((role) => userRoles.includes(role.toLowerCase()));
      });

      return {
        ...section,
        items: visibleItems,
      };
    })
    .filter((section) => section.items.length > 0);

  return (
    <>
      {/* Overlay para móviles */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Principal */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#11131a]/95 backdrop-blur-md transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } p-4 shadow-sm`}
      >
        <div className="flex flex-col min-h-0 flex-1">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 px-2 py-2 mb-4 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-xs">
              <Flame className="w-5 h-5 animate-pulse text-amber-600 dark:text-amber-500" />
            </div>
            {!collapsed && (
              <div className="leading-tight overflow-hidden">
                <h1 className="font-bold text-slate-900 dark:text-white tracking-tight text-base truncate">
                  ReCoffee ERP
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tracking-wider">
                  Plant 01 Industrial
                </p>
              </div>
            )}
          </div>

          {/* Navegación Modular con Módulos Contraídos por Defecto */}
          <nav className="flex-1 overflow-y-auto space-y-2 pr-1 text-sm scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {filteredSections.map((section) => {
              const isGeneral = section.title === "General";
              const isExpanded = Boolean(expandedSections[section.title]);
              const SectionIcon = section.icon;

              // Para "General", los links son directos de nivel superior
              if (isGeneral) {
                return (
                  <div key={section.title} className="space-y-0.5 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={collapsed ? item.name : undefined}
                          onClick={() => {
                            if (window.innerWidth < 1024) setMobileOpen(false);
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                            isActive
                              ? "bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 font-semibold border border-amber-200/80 dark:border-amber-500/20 shadow-xs"
                              : "text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                          } ${collapsed ? "justify-center" : ""}`}
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          />
                          {!collapsed && (
                            <span className="truncate flex-1">{item.name}</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                );
              }

              // Módulos M1..M8: Mostrados contraídos por defecto, solo se despliegan al hacer clic
              return (
                <div key={section.title} className="space-y-1">
                  {!collapsed ? (
                    <button
                      type="button"
                      onClick={() => toggleSection(section.title)}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isExpanded
                          ? "bg-amber-50/60 dark:bg-slate-800/60 text-amber-900 dark:text-amber-400 border border-amber-200/60 dark:border-slate-700"
                          : "text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <SectionIcon className={`w-4 h-4 shrink-0 ${isExpanded ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`} />
                        <span className="truncate">{section.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {section.items.length}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        )}
                      </div>
                    </button>
                  ) : (
                    // Sidebar colapsado: icono de módulo interactivo
                    <button
                      type="button"
                      onClick={() => {
                        setCollapsed(false);
                        toggleSection(section.title);
                      }}
                      title={`${section.title} (${section.items.length} opciones)`}
                      className="w-full flex justify-center py-2 text-slate-500 hover:text-amber-600 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
                    >
                      <SectionIcon className="w-4 h-4" />
                    </button>
                  )}

                  {/* Sub-opciones: Solo visibles cuando la categoría está expandida */}
                  {!collapsed && isExpanded && (
                    <div className="pl-3 ml-2 border-l-2 border-amber-500/20 dark:border-slate-800 space-y-0.5 pt-1 pb-1 animate-in fade-in duration-150">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => {
                              if (window.innerWidth < 1024) setMobileOpen(false);
                            }}
                            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isActive
                                ? "bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 font-semibold shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            <Icon
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isActive
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-slate-400 dark:text-slate-500"
                              }`}
                            />
                            <span className="truncate flex-1">{item.name}</span>
                            {item.badge && (
                              <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 rounded shrink-0">
                                {item.badge}
                              </span>
                            )}
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
