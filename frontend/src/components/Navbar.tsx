"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  LogOut,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";

export default function Navbar({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (path.includes("/engineering/bom")) return "Ingeniería / Lista de Materiales (BOM)";
    if (path.includes("/engineering/routes")) return "Ingeniería / Rutas Estándar (RO-1..RO-8)";
    if (path.includes("/transactions/purchases")) return "Flujo Transaccional / Órdenes de Compra";
    if (path.includes("/transactions/inventory")) return "Flujo Transaccional / Kardex e Inventario";
    if (path.includes("/transactions/production")) return "Flujo Transaccional / Órdenes de Producción";
    if (path.includes("/transactions/sales")) return "Flujo Transaccional / Ventas y Despacho";
    if (path.includes("/mes/execution")) return "MES Planta / Ejecución de Operaciones";
    if (path.includes("/mes/quality")) return "MES Planta / Control de Calidad (RO-5)";
    if (path.includes("/mes/traceability")) return "MES Planta / Trazabilidad Genealógica";
    if (path.includes("/mes/scrap")) return "MES Planta / Disposición Scrap y Retrabajo";
    if (path.includes("/iiot/sensor")) return "Telemetría IIoT / Curva de Secado RO-3";
    if (path.includes("/iiot/kpis")) return "Telemetría IIoT / Dashboard de KPIs y OEE";
    return "Workspace";
  };

  const getUserInitials = (): string => {
    if (!user?.username) return "US";
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-[#11131a]/80 backdrop-blur-md sticky top-0 z-20 px-4 md:px-8 flex items-center justify-between gap-4 transition-colors duration-200">
      {/* Lado izquierdo: Toggle Móvil + Título Dinámico */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Abrir menú de navegación"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-tight leading-tight">
            {getPageTitle(pathname)}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block font-mono">
            Plant 01 Industrial • ReCoffee Solutions
          </p>
        </div>
      </div>

      {/* Lado derecho: Estado Backend + ThemeToggle + Avatar Usuario + Logout */}
      <div className="flex items-center gap-2.5">
        {/* Indicador de Salud del Backend */}
        <div
          title={
            backendHealthy === null
              ? "Verificando conexión con el backend..."
              : backendHealthy
              ? "Backend API (.NET 8): Online"
              : "Backend API (.NET 8): No disponible"
          }
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border bg-slate-100 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300"
        >
          {isChecking ? (
            <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
          ) : backendHealthy ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
          )}
          <span className="hidden md:inline font-mono text-[11px]">
            API :5000 {backendHealthy ? "ONLINE" : "OFFLINE"}
          </span>
        </div>

        {/* Theme Toggle en el Navbar */}
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Cambiar Tema (Claro / Oscuro)"
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
        >
          {mounted && theme === "light" ? (
            <Moon className="w-4 h-4 text-slate-700" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* Perfil de Usuario con Avatar Gradient */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div
            title={`Usuario: ${user?.username || "Operador"} (${user?.roles?.[0] || "General"})`}
            className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-default"
          >
            {getUserInitials()}
          </div>

          <div className="hidden lg:block text-left leading-tight">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {user?.username || "Operador"}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              {user?.roles?.[0] || "Producción"}
            </p>
          </div>

          {/* Botón Logout */}
          <button
            type="button"
            onClick={logout}
            title="Cerrar sesión"
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
