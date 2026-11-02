"use client";

import React from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Boxes,
  Factory,
  Truck,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import InfoTooltip from "@/components/InfoTooltip";
import { useAuth } from "@/context/AuthContext";

export default function TransactionsHubPage() {
  const { user } = useAuth();
  const userRoles = (user?.roles || []).map((r) => r.toLowerCase());
  const isAdmin = userRoles.includes("admin") || userRoles.length === 0;

  const allModules = [
    {
      title: "Órdenes de Compra",
      subtitle: "Abastecimiento y Lotes MP",
      description: "Emisión de órdenes de compra para materias primas y recepción física con generación automática de lotes.",
      href: "/transactions/purchases",
      icon: ShoppingCart,
      color: "from-amber-600 to-amber-700",
      badge: "WI-3.01",
      roles: ["Admin", "Almacen"],
    },
    {
      title: "Inventario y Kardex",
      subtitle: "Kardex Inmutable Doble Partida",
      description: "Consulta de existencias físicas por almacén/lote y trazabilidad completa del Kardex inmutable.",
      href: "/transactions/inventory",
      icon: Boxes,
      color: "from-emerald-600 to-emerald-700",
      badge: "WI-3.02",
      roles: ["Admin", "Almacen"],
    },
    {
      title: "Órdenes de Producción",
      subtitle: "Control de Piso Kanban",
      description: "Control de piso MES: Tablero Kanban, consumo a WIP en ALM-002 e ingreso de Producto Terminado a ALM-003.",
      href: "/transactions/production",
      icon: Factory,
      color: "from-blue-600 to-blue-700",
      badge: "WI-3.03 / WI-3.04",
      roles: ["Admin", "Produccion"],
    },
    {
      title: "Ventas y Despacho",
      subtitle: "Despacho FIFO de Lotes",
      description: "Gestión de pedidos de clientes y despacho con algoritmo FIFO y validación estricta de existencias en ALM-003.",
      href: "/transactions/sales",
      icon: Truck,
      color: "from-purple-600 to-purple-700",
      badge: "WI-3.05",
      roles: ["Admin", "Ventas"],
    },
  ];

  const modules = allModules.filter((m) => {
    if (isAdmin) return true;
    return m.roles.some((r) => userRoles.includes(r.toLowerCase()));
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Minimalista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-500/20">
              Hito M3
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Cadena Operativa</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <TrendingUp className="w-7 h-7 text-amber-500" />
            Flujo Transaccional E2E
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Abastecimiento, manufactura y despacho
            </p>
            <InfoTooltip content="Módulos transaccionales integrados: Abastecimiento de materias primas, Trazabilidad por Lotes, Manufactura MES y Despacho Comercial FIFO." />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.href}
              href={m.href}
              className="p-6 bg-white dark:bg-[#11131a] border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-amber-400 dark:hover:border-slate-700 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-tr ${m.color} text-white shadow-xs`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700">
                      {m.badge}
                    </span>
                    <InfoTooltip content={m.description} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {m.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                  {m.subtitle}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                <span>Ingresar al módulo</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
