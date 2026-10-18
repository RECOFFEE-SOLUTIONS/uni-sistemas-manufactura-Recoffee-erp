"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coffee,
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
  ChevronDown,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
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

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

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
        { name: "Dashboard General", href: "/", icon: LayoutDashboard },
      ],
    },
    {
      title: "M1: Datos Maestros",
      items: [
        { name: "Almacenes (ALM)", href: "/master-data/warehouses", icon: Database },
        { name: "Catálogo de Artículos", href: "/master-data/items", icon: Boxes },
        { name: "Proveedores", href: "/master-data/suppliers", icon: Truck },
        { name: "Clientes", href: "/master-data/customers", icon: ShoppingCart },
      ],
    },
    {
      title: "M2: Ingeniería de Producto",
      items: [
        { name: "Estructura BOM", href: "/engineering/bom", icon: Layers },
        { name: "Rutas y Operaciones (RO)", href: "/engineering/routes", icon: GitBranch },
      ],
    },
    {
      title: "M3: Flujo Transaccional",
      items: [
        { name: "Órdenes de Compra", href: "/transactions/purchases", icon: ShoppingCart },
        { name: "Inventario y Kardex", href: "/transactions/inventory", icon: Boxes },
        { name: "Órdenes de Producción", href: "/transactions/production", icon: Factory },
        { name: "Ventas y Despacho", href: "/transactions/sales", icon: Truck },
      ],
    },
    {
      title: "M4: Capa MES y Calidad",
      items: [
        { name: "Ejecución MES en Planta", href: "/mes/execution", icon: Activity },
        { name: "Control Calidad (RO-5)", href: "/mes/quality", icon: ClipboardCheck },
        { name: "Trazabilidad Lotes", href: "/mes/traceability", icon: GitBranch },
        { name: "Scrap / Retrabajo", href: "/mes/scrap", icon: ShieldAlert },
      ],
    },
    {
      title: "M5: Telemetría & IIoT",
      items: [
        { name: "Sensor Secado RO-3", href: "/iiot/sensor", icon: Radio, badge: "Live" },
        { name: "Monitor KPIs & OEE", href: "/iiot/kpis", icon: LayoutDashboard },
      ],
    },
  ];

  return (
    <>
      {/* Overlay para móviles */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-200 transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Encabezado Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white shadow-md shadow-amber-500/20">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wide text-white">
              ReCoffee ERP
            </h1>
            <p className="text-xs text-amber-400 font-medium tracking-wider uppercase">
              Manufactura & MES
            </p>
          </div>
        </div>

        {/* Lista de Navegación */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 text-sm scrollbar-thin scrollbar-thumb-slate-700">
          {sections.map((section) => {
            const isCollapsed = collapsedSections[section.title];
            return (
              <div key={section.title} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200"
                >
                  <span>{section.title}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5 pt-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            if (window.innerWidth < 1024) onClose();
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
                            isActive
                              ? "bg-amber-600 text-white shadow-sm"
                              : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                            <span className="truncate">{item.name}</span>
                          </div>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md animate-pulse">
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

        {/* Footer Sidebar: Estado de Usuario */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs uppercase">
              {user?.username ? user.username.substring(0, 2) : "RC"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.username || "Sesión activa"}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.roles?.[0] || "Operador"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
