"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Settings,
  Sun,
  Moon,
  Laptop,
  Lock,
  Globe,
  Bell,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  User,
  Coffee,
  ArrowRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [language, setLanguage] = useState("es-NI");
  const [density, setDensity] = useState("normal");
  const [notifyAlerts, setNotifyAlerts] = useState(true);
  const [notifyTelemetry, setNotifyTelemetry] = useState(true);

  const handleSavePreferences = () => {
    showToast("Preferencias actualizadas correctamente", "success");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Encabezado Minimalista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-500/20 uppercase tracking-wider">
              Sistema General
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            Configuraciones Básicas
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
            Preferencias del sistema y usuario
          </p>
        </div>

        <button
          onClick={handleSavePreferences}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-sm shadow-amber-600/20 cursor-pointer self-start sm:self-auto"
        >
          Guardar Cambios
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarjeta 1: Apariencia y Tema */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base pb-3 border-b border-slate-100 dark:border-slate-800">
            <Sliders className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>Apariencia Visual</span>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Modo de Visualización:
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  theme === "light"
                    ? "bg-amber-50 border-amber-500 text-amber-900 font-bold shadow-xs"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <Sun className="w-5 h-5 mx-auto mb-1.5 text-amber-600" />
                <span className="text-xs">Claro</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  theme === "dark"
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-xs"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <Moon className="w-5 h-5 mx-auto mb-1.5 text-amber-400" />
                <span className="text-xs">Oscuro</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  theme === "system"
                    ? "bg-amber-50 dark:bg-amber-500/20 border-amber-500 text-amber-900 dark:text-amber-300 font-bold shadow-xs"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <Laptop className="w-5 h-5 mx-auto mb-1.5 text-slate-600 dark:text-slate-400" />
                <span className="text-xs">Sistema</span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Densidad de Tablas y Listas:
            </span>
            <select
              value={density}
              onChange={(e) => setDensity(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            >
              <option value="compact">Compacta (Alta Densidad Industrial)</option>
              <option value="normal">Estándar (Recomendada)</option>
              <option value="spacious">Espaciosa (Mayor Legibilidad)</option>
            </select>
          </div>
        </div>

        {/* Tarjeta 2: Perfil y Credenciales */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base pb-3 border-b border-slate-100 dark:border-slate-800">
            <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>Perfil y Seguridad</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Usuario Activo:</span>
              <strong className="text-slate-900 dark:text-white">{user?.username || "Usuario"}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Rol Asignado:</span>
              <span className="px-2 py-0.5 rounded-md font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                {user?.roles?.[0] || "General"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Correo Electrónico:</span>
              <span className="text-slate-700 dark:text-slate-300 font-mono">{user?.email || "usuario@recoffee.ni"}</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/auth/change-password"
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-amber-400 dark:hover:border-slate-700 hover:shadow-xs transition-all text-xs font-semibold text-slate-800 dark:text-slate-200 group"
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Actualizar Contraseña de Acceso</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>

        {/* Tarjeta 3: Configuración Regional */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base pb-3 border-b border-slate-100 dark:border-slate-800">
            <Globe className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>Región y Operaciones</span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Idioma del Sistema:
              </span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              >
                <option value="es-NI">Español (América Central - UTC-6)</option>
                <option value="en-US">English (United States)</option>
              </select>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Planta Operativa:</span>
                <strong className="text-slate-900 dark:text-white">Plant 01 Industrial (Managua)</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Unidad de Medida Base:</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono">Kilogramos (kg)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta 4: Alertas de Telemetría */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base pb-3 border-b border-slate-100 dark:border-slate-800">
            <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>Notificaciones de Planta</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Alertas de Calidad (NCRs)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Avisos inmediatos ante desviaciones en paso RO-5
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifyAlerts}
                onChange={(e) => setNotifyAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Telemetría IIoT RO-3
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Notificar cuando la curva de secado solar concluya
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifyTelemetry}
                onChange={(e) => setNotifyTelemetry(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
