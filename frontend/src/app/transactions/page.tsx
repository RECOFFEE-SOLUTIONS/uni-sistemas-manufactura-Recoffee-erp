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

export default function TransactionsHubPage() {
  const modules = [
    {
      title: "Órdenes de Compra",
      description: "Emisión de órdenes de compra para materias primas y recepción física con generación automática de lotes.",
      href: "/transactions/purchases",
      icon: ShoppingCart,
      color: "from-amber-600 to-amber-700",
      badge: "WI-3.01",
    },
    {
      title: "Inventario y Kardex",
      description: "Consulta de existencias físicas por almacén/lote y trazabilidad completa del Kardex inmutable.",
      href: "/transactions/inventory",
      icon: Boxes,
      color: "from-emerald-600 to-emerald-700",
      badge: "WI-3.02",
    },
    {
      title: "Órdenes de Producción",
      description: "Control de piso MES: Tablero Kanban, consumo a WIP en ALM-002 e ingreso de Producto Terminado a ALM-003.",
      href: "/transactions/production",
      icon: Factory,
      color: "from-blue-600 to-blue-700",
      badge: "WI-3.03 / WI-3.04",
    },
    {
      title: "Ventas y Despacho",
      description: "Gestión de pedidos de clientes y despacho con algoritmo FIFO y validación estricta de existencias en ALM-003.",
      href: "/transactions/sales",
      icon: Truck,
      color: "from-purple-600 to-purple-700",
      badge: "WI-3.05",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <TrendingUp className="w-7 h-7 text-amber-500" />
          Hito M3: Flujo Transaccional E2E
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Módulos transaccionales integrados: Abastecimiento, Trazabilidad por Lotes, Manufactura MES y Despacho Comercial.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.href}
              href={m.href}
              className="p-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 hover:bg-slate-800/40 transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-tr ${m.color} text-white shadow-md`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-slate-800 text-amber-400 border border-slate-700">
                    {m.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition">
                  {m.title}
                </h3>
                <p className="text-sm text-slate-400 mt-2">
                  {m.description}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
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
