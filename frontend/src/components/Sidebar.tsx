"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame,
  LayoutDashboard,
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
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavSection {
  title: string;
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
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const sections: NavSection[] = [
    {
      title: "General",
      items: [
        { name: "Inicio", href: "/", icon: LayoutDashboard },
      ],
    },
    {
      title: "M1: Maestros",
      items: [
        { name: "Almacenes", href: "/master-data/warehouses", icon: Database },
        { name: "Artículos", href: "/master-data/items", icon: Boxes },
        { name: "Proveedores", href: "/master-data/suppliers", icon: Truck },
        { name: "Clientes", href: "/master-data/customers", icon: ShoppingCart },
      ],
    },
    {
      title: "M2: Ingeniería",
      items: [
        { name: "Estructura BOM", href: "/engineering/bom", icon: Layers },
        { name: "Rutas Técnicas", href: "/engineering/routes", icon: GitBranch },
      ],
    },
    {
      title: "M3: Transaccional",
      items: [
        { name: "Compras", href: "/transactions/purchases", icon: ShoppingCart },
        { name: "Inventario / Kardex", href: "/transactions/inventory", icon: Boxes },
        { name: "Producción", href: "/transactions/production", icon: Factory },
        { name: "Ventas & Despacho", href: "/transactions/sales", icon: Truck },
      ],
    },
    {
      title: "M4: MES & Calidad",
      items: [
        { name: "Piso de Planta", href: "/mes/execution", icon: Activity },
        { name: "Calidad (RO-5)", href: "/mes/quality", icon: ClipboardCheck },
        { name: "Trazabilidad Lotes", href: "/mes/traceability", icon: GitBranch },
        { name: "Scrap & Retrabajo", href: "/mes/scrap", icon: ShieldAlert },
      ],
    },
    {
      title: "M5: Telemetría & IIoT",
      items: [
        { name: "Curva Secado RO-3", href: "/iiot/sensor", icon: Radio, badge: "Live" },
        { name: "Dashboard KPIs & OEE", href: "/iiot/kpis", icon: LayoutDashboard },
      ],
    },
  ];

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
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between border-r border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#11131a]/90 backdrop-blur-md transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } p-4`}
      >
        <div className="flex flex-col min-h-0 flex-1">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 px-2 py-2 mb-4 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-sm">
              <Flame className="w-5 h-5 animate-pulse text-amber-500" />
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

          {/* Navegación Modular */}
          <nav className="flex-1 overflow-y-auto space-y-3 pr-1 text-sm scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {sections.map((section) => {
              const isSectionCollapsed = collapsedSections[section.title];
              return (
                <div key={section.title} className="space-y-1">
                  {!collapsed && (
                    <button
                      type="button"
                      onClick={() => toggleSection(section.title)}
                      className="flex items-center justify-between w-full px-2 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    >
                      <span className="truncate">{section.title}</span>
                      {isSectionCollapsed ? (
                        <ChevronRight className="w-3 h-3 shrink-0" />
                      ) : (
                        <ChevronDown className="w-3 h-3 shrink-0" />
                      )}
                    </button>
                  )}

                  {(!isSectionCollapsed || collapsed) && (
                    <div className="space-y-0.5">
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
                                ? "bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-semibold shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
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
                            {!collapsed && item.badge && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md shrink-0">
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
        <div className="space-y-2 border-t border-slate-200 dark:border-slate-800/80 pt-4 shrink-0 mt-2">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Alternar Tema Claro / Oscuro"
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            {mounted && theme === "light" ? (
              <Moon className="w-4 h-4 shrink-0 text-slate-700" />
            ) : (
              <Sun className="w-4 h-4 shrink-0 text-amber-400" />
            )}
            {!collapsed && (
              <span className="font-medium truncate">
                {mounted && theme === "light" ? "Modo Oscuro" : "Modo Claro"}
              </span>
            )}
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expandir Menú" : "Colapsar Menú"}
            className="w-full hidden lg:flex items-center justify-center py-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-lg transition-colors"
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
