"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, LogOut, CheckCircle2, XCircle, RefreshCw, UserCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";

export default function Navbar({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkBackend = async () => {
    setIsChecking(true);
    try {
      const res = await apiClient.get("/health");
      setBackendHealthy(res.status === 200);
    } catch {
      setBackendHealthy(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = (path: string): string => {
    if (path === "/") return "Panel de Control General";
    if (path.includes("/master-data/warehouses")) return "Datos Maestros / Almacenes (ALM)";
    if (path.includes("/master-data/items")) return "Datos Maestros / Catálogo de Artículos";
    if (path.includes("/master-data/suppliers")) return "Datos Maestros / Proveedores";
    if (path.includes("/master-data/customers")) return "Datos Maestros / Clientes";
    if (path.includes("/engineering/bom")) return "Ingeniería de Producto / Lista de Materiales (BOM)";
    if (path.includes("/engineering/routes")) return "Ingeniería de Producto / Rutas Estándar (RO-1..RO-8)";
    if (path.includes("/transactions/purchases")) return "Flujo Transaccional / Órdenes de Compra";
    if (path.includes("/transactions/inventory")) return "Flujo Transaccional / Kardex e Inventario";
    if (path.includes("/transactions/production")) return "Flujo Transaccional / Órdenes de Producción";
    if (path.includes("/transactions/sales")) return "Flujo Transaccional / Ventas y Despacho";
    if (path.includes("/mes/execution")) return "MES Planta / Ejecución de Operaciones";
    if (path.includes("/mes/quality")) return "MES Planta / Control de Calidad (RO-5)";
    if (path.includes("/mes/traceability")) return "MES Planta / Trazabilidad Genealógica";
    if (path.includes("/mes/scrap")) return "MES Planta / Disposición Scrap y Retrabajo";
    if (path.includes("/iiot/sensor")) return "Telemetría IIoT / Simulador Secado RO-3";
    if (path.includes("/iiot/kpis")) return "Telemetría IIoT / Dashboard de KPIs y OEE";
    return "ReCoffee Solutions - ERP & MES";
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "produccion":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "calidad":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "almacen":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "ventas":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-200">
      {/* Lado izquierdo: Botón Toggle + Título de Pantalla */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Abrir menú de navegación"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-sm font-semibold text-white tracking-wide">
            {getPageTitle(pathname)}
          </h2>
          <p className="text-xs text-slate-400 hidden sm:block">
            ReCoffee Solutions • Sistema de Gestión de Manufactura
          </p>
        </div>
      </div>

      {/* Lado derecho: Estado Backend + Perfil Usuario + Logout */}
      <div className="flex items-center gap-3">
        {/* Indicador de Salud del Backend */}
        <div
          title={
            backendHealthy === null
              ? "Verificando conexión..."
              : backendHealthy
              ? "Backend API (.NET 8): Online"
              : "Backend API (.NET 8): No disponible"
          }
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border bg-slate-800/80 border-slate-700 text-slate-300"
        >
          {isChecking ? (
            <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          ) : backendHealthy ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span className="hidden md:inline font-mono text-[11px]">
            API :5000 {backendHealthy ? "ONLINE" : "OFFLINE"}
          </span>
        </div>

        {/* Perfil de Usuario */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <UserCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-white leading-tight">
                {user?.username || "Usuario"}
              </p>
              {user?.roles?.[0] && (
                <span
                  className={`inline-block px-1.5 py-0.2 text-[10px] font-medium border rounded uppercase ${getRoleBadgeColor(
                    user.roles[0]
                  )}`}
                >
                  {user.roles[0]}
                </span>
              )}
            </div>
          </div>

          {/* Botón Logout */}
          <button
            type="button"
            onClick={logout}
            title="Cerrar sesión"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
