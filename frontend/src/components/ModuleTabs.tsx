"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Warehouse,
  Package,
  Truck,
  Users,
  Layers,
  GitFork,
  ShoppingCart,
  Boxes,
  Factory,
  PlayCircle,
  ShieldCheck,
  QrCode,
  AlertTriangle,
  Activity,
  BarChart3,
  LucideIcon,
} from "lucide-react";

export interface TabItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

interface ModuleConfig {
  title: string;
  tabs: TabItem[];
}

export const MODULE_NAV_CONFIG: Record<string, ModuleConfig> = {
  "master-data": {
    title: "M1 • Datos Maestros",
    tabs: [
      { name: "Almacenes", href: "/master-data/warehouses", icon: Warehouse },
      { name: "Artículos", href: "/master-data/items", icon: Package },
      { name: "Proveedores", href: "/master-data/suppliers", icon: Truck },
      { name: "Clientes", href: "/master-data/customers", icon: Users },
    ],
  },
  engineering: {
    title: "M2 • Ingeniería de Producto",
    tabs: [
      { name: "Estructura BOM", href: "/engineering/bom", icon: Layers },
      { name: "Rutas Técnicas", href: "/engineering/routes", icon: GitFork },
    ],
  },
  transactions: {
    title: "M3 • Gestión Transaccional",
    tabs: [
      { name: "Compras", href: "/transactions/purchases", icon: ShoppingCart },
      { name: "Inventario / Kardex", href: "/transactions/inventory", icon: Boxes },
      { name: "Producción", href: "/transactions/production", icon: Factory },
      { name: "Ventas & Despacho", href: "/transactions/sales", icon: Truck },
    ],
  },
  mes: {
    title: "M4 • MES & Calidad",
    tabs: [
      { name: "Piso de Planta", href: "/mes/execution", icon: PlayCircle },
      { name: "Calidad (RO-5)", href: "/mes/quality", icon: ShieldCheck },
      { name: "Trazabilidad Lotes", href: "/mes/traceability", icon: QrCode },
      { name: "Scrap & Retrabajo", href: "/mes/scrap", icon: AlertTriangle },
    ],
  },
  iiot: {
    title: "M5 • Telemetría & KPIs",
    tabs: [
      { name: "Curva Secado RO-3", href: "/iiot/sensor", icon: Activity },
      { name: "Dashboard KPIs & OEE", href: "/iiot/kpis", icon: BarChart3 },
    ],
  },
  admin: {
    title: "M8 • Administración",
    tabs: [
      { name: "Gestión de Usuarios", href: "/admin/users", icon: Users },
    ],
  },
};

export type ModuleKey = "master-data" | "engineering" | "transactions" | "mes" | "iiot" | "admin";

interface ModuleTabsProps {
  module: ModuleKey;
}

export default function ModuleTabs({ module }: ModuleTabsProps) {
  const pathname = usePathname();
  const config = MODULE_NAV_CONFIG[module];

  if (!config) return null;

  return (
    <div className="w-full pb-3 mb-6 border-b border-slate-200 dark:border-slate-800/80">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <nav
          className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-[#12131a] border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto max-w-full scrollbar-none"
          aria-label={`Navegación secundaria de ${config.title}`}
        >
          {config.tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all duration-150 whitespace-nowrap select-none ${
                  isActive
                    ? "bg-white dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-slate-200/90 dark:border-amber-500/30 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                />
                <span>{tab.name}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? "bg-amber-100 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300"
                        : "bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <span className="hidden md:inline-flex items-center text-xs font-mono font-medium text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60">
          {config.title}
        </span>
      </div>
    </div>
  );
}
