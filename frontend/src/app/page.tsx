"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Coffee,
  Database,
  Layers,
  ShoppingCart,
  Activity,
  Radio,
  CheckCircle2,
  XCircle,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [apiInfo, setApiInfo] = useState<{
    status: string;
    service?: string;
    security?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApiHealth = async () => {
      try {
        const res = await apiClient.get("/");
        setApiInfo(res.data);
      } catch {
        setApiInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchApiHealth();
  }, []);

  const modules = [
    {
      title: "M1: Datos Maestros",
      desc: "Almacenes ALM-001..004, Catálogo de MP, EMP, SEM, PT, Proveedores y Clientes.",
      href: "/master-data/warehouses",
      icon: Database,
      color: "from-amber-600/20 to-amber-500/5 text-amber-400 border-amber-500/20",
    },
    {
      title: "M2: Ingeniería de Producto",
      desc: "Estructura BOM multinivel y secuencia de 8 operaciones de ruta estándar (RO-1..RO-8).",
      href: "/engineering/bom",
      icon: Layers,
      color: "from-blue-600/20 to-blue-500/5 text-blue-400 border-blue-500/20",
    },
    {
      title: "M3: Flujo Transaccional",
      desc: "Órdenes de Compra, Kardex con doble verificación, Órdenes de Producción y Despacho.",
      href: "/transactions/purchases",
      icon: ShoppingCart,
      color: "from-emerald-600/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20",
    },
    {
      title: "M4: Capa MES y Calidad",
      desc: "Trazabilidad genealógica bidireccional de lotes, inspección RO-5, scrap y retrabajo.",
      href: "/mes/execution",
      icon: Activity,
      color: "from-purple-600/20 to-purple-500/5 text-purple-400 border-purple-500/20",
    },
    {
      title: "M5: Simulador IIoT",
      desc: "Captura de telemetría acelerada de secado RO-3 y cálculo en tiempo real de KPIs y OEE.",
      href: "/iiot/sensor",
      icon: Radio,
      color: "from-cyan-600/20 to-cyan-500/5 text-cyan-400 border-cyan-500/20",
    },
    {
      title: "M6: Indicadores de Planta",
      desc: "Monitoreo ejecutivo de disponibilidad, rendimiento, calidad y rotación de stock.",
      href: "/iiot/kpis",
      icon: TrendingUp,
      color: "from-rose-600/20 to-rose-500/5 text-rose-400 border-rose-500/20",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner de Bienvenida */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/40 p-6 md:p-8 border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <Coffee className="w-3.5 h-3.5" />
              ReCoffee Solutions • Planta de Procesamiento
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Sistema Integral de Gestión ERP & MES
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Plataforma para la manufactura, control de calidad, trazabilidad de lotes y
              telemetría industrial de subproductos de café (Harina de Café).
            </p>
          </div>

          {/* Tarjeta de Estado de Conexión & JWT */}
          <div className="flex flex-col gap-2 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 min-w-[260px]">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span>Backend API (.NET 8)</span>
              {loading ? (
                <span className="text-amber-400 animate-pulse">Conectando...</span>
              ) : apiInfo ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Online
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-400">
                  <XCircle className="w-3.5 h-3.5" /> Offline
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs font-medium text-slate-400 pt-1 border-t border-slate-800">
              <span className="flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Token JWT
              </span>
              {isAuthenticated ? (
                <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" /> Inyectado
                </span>
              ) : (
                <span className="text-slate-400 text-[11px]">Pendiente Login</span>
              )}
            </div>

            {user && (
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                <span>Usuario:</span>
                <span className="font-semibold text-white">{user.username}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid de Módulos */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3 tracking-wide">
          Módulos del Sistema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.title}
                href={mod.href}
                className="group relative flex flex-col justify-between p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all duration-200"
              >
                <div className="space-y-3">
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br border ${mod.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-medium text-slate-400 group-hover:text-white pt-4 mt-2 border-t border-slate-800/60">
                  <span>Acceder al módulo</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
