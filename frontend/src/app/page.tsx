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
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";
import InfoTooltip from "@/components/InfoTooltip";

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

  const allModules = [
    {
      id: "M1",
      title: "M1: Datos Maestros",
      subtitle: "Catálogos y Almacenes Centrales",
      desc: "Almacenes ALM-001..004, Catálogo de MP, EMP, SEM, PT, Proveedores y Clientes.",
      href: "/master-data/warehouses",
      icon: Database,
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
      roles: ["Admin", "Almacen"],
    },
    {
      id: "M2",
      title: "M2: Ingeniería de Producto",
      subtitle: "BOM y Rutas Técnicas",
      desc: "Estructura BOM multinivel y secuencia de 8 operaciones de ruta estándar (RO-1..RO-8).",
      href: "/engineering/bom",
      icon: Layers,
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
      roles: ["Admin", "Produccion"],
    },
    {
      id: "M3",
      title: "M3: Flujo Transaccional",
      subtitle: "Operaciones y Flujo Continuo",
      desc: "Órdenes de Compra, Kardex con doble verificación, Órdenes de Producción y Despacho.",
      href: "/transactions/production",
      icon: ShoppingCart,
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
      roles: ["Admin", "Produccion", "Almacen", "Ventas"],
    },
    {
      id: "M4",
      title: "M4: Capa MES y Calidad",
      subtitle: "Piso de Planta y Calidad",
      desc: "Trazabilidad genealógica bidireccional de lotes, inspección RO-5, scrap y retrabajo.",
      href: "/mes/execution",
      icon: Activity,
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
      roles: ["Admin", "Calidad"],
    },
    {
      id: "M5",
      title: "M5: Simulador IIoT",
      subtitle: "Monitoreo Sensorial en Vivo",
      desc: "Captura de telemetría acelerada de secado RO-3 y cálculo en tiempo real de KPIs y OEE.",
      href: "/iiot/sensor",
      icon: Radio,
      badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20",
      roles: ["Admin"],
    },
    {
      id: "M6",
      title: "M6: Indicadores de Planta",
      subtitle: "Dashboard Ejecutivo y OEE",
      desc: "Monitoreo ejecutivo de disponibilidad, rendimiento, calidad y rotación de stock.",
      href: "/iiot/kpis",
      icon: TrendingUp,
      badgeColor: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
      roles: ["Admin"],
    },
    {
      id: "M8",
      title: "M8: Administración",
      subtitle: "Usuarios y Seguridad Central",
      desc: "Control de perfiles de usuario, roles de acceso, bitácoras de auditoría y políticas de seguridad.",
      href: "/admin/users",
      icon: Users,
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
      roles: ["Admin"],
    },
  ];

  // Filtrado RBAC para el Dashboard
  const userRoles = (user?.roles || []).map((r) => r.toLowerCase());
  const isAdmin = userRoles.includes("admin") || userRoles.length === 0;

  const modules = allModules.filter((mod) => {
    if (isAdmin) return true;
    return mod.roles.some((r) => userRoles.includes(r.toLowerCase()));
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner de Bienvenida: Degradado Brillante Corporativo en Modo Claro */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-emerald-500/10 dark:from-slate-900 dark:via-slate-800 dark:to-amber-950/40 p-6 md:p-8 border border-amber-200/80 dark:border-slate-800 shadow-sm dark:shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-400 text-xs font-semibold">
              <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              ReCoffee Solutions • Planta de Procesamiento
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Sistema Integral ERP & MES
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium">Gestión de Manufactura y Calidad</span>
              <InfoTooltip content="Plataforma integral para manufactura, control de calidad, trazabilidad de lotes y telemetría industrial de subproductos de café." />
            </div>
          </div>

          {/* Tarjeta de Estado de Conexión & JWT */}
          <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/90 dark:bg-slate-950/70 border border-amber-200/60 dark:border-slate-800/80 shadow-xs dark:shadow-md min-w-[260px]">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
              <span>Backend API (.NET 8)</span>
              {loading ? (
                <span className="text-amber-600 dark:text-amber-400 animate-pulse font-medium">Conectando...</span>
              ) : apiInfo ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Online
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                  <XCircle className="w-3.5 h-3.5" /> Offline
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400 pt-1.5 border-t border-slate-200 dark:border-slate-800">
              <span className="flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Token JWT
              </span>
              {isAuthenticated ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Inyectado
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Pendiente Login</span>
              )}
            </div>

            {user && (
              <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-1.5 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span>Usuario:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {user.username} <span className="text-[10px] font-normal text-slate-500">({user.roles?.[0] || "General"})</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid de Módulos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-wide">
            Módulos del Sistema
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {modules.length} {modules.length === 1 ? "módulo habilitado" : "módulos habilitados"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.title}
                href={mod.href}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border ${mod.badgeColor}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <InfoTooltip content={mod.desc} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                      {mod.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-white pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/60 transition-colors">
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
