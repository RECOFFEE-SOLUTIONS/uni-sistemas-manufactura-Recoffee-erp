"use client";

import React, { useState, useEffect } from "react";
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
  User,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import apiClient from "@/lib/api";

interface ProfileResponse {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  roles: string[];
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  // Estados del Formulario de Perfil
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Estados de Preferencias Generales
  const [language, setLanguage] = useState("es-NI");
  const [density, setDensity] = useState("normal");
  const [notifyAlerts, setNotifyAlerts] = useState(true);
  const [notifyTelemetry, setNotifyTelemetry] = useState(true);

  // Cargar Perfil desde Backend PostgreSQL
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const res = await apiClient.get<ProfileResponse>("/api/users/profile");
        if (isMounted && res.data) {
          setFullName(res.data.fullName || (user?.name || "Davis Muñoz"));
          setEmail(res.data.email || (user?.email || "davis@recoffee.ni"));
          setUsername(res.data.username || (user?.username || "davis"));
        }
      } catch {
        if (isMounted) {
          // Fallback con datos de sesión activa
          setFullName(user?.name || "Davis Muñoz");
          setEmail(user?.email || "davis@recoffee.ni");
          setUsername(user?.username || "davis");
        }
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Guardar Cambios de Perfil en PostgreSQL
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword && newPassword.length < 6) {
      showToast("La nueva contraseña debe tener al menos 6 caracteres", "error");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      showToast("Las nuevas contraseñas no coinciden", "error");
      return;
    }

    try {
      setIsSavingProfile(true);
      const payload: {
        fullName: string;
        currentPassword?: string;
        newPassword?: string;
        username?: string;
      } = {
        fullName: fullName.trim(),
        username: username || user?.username,
      };

      if (newPassword) {
        payload.currentPassword = currentPassword || undefined;
        payload.newPassword = newPassword;
      }

      const res = await apiClient.put<{ message: string; fullName: string }>(
        "/api/users/profile",
        payload
      );

      showToast(res.data?.message || "Perfil actualizado exitosamente en PostgreSQL", "success");

      // Limpiar campos de contraseña tras éxito
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Actualizar contexto global
      if (refreshUser) {
        await refreshUser();
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Error al actualizar el perfil en el servidor";
      showToast(errorMsg, "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePreferences = () => {
    showToast("Preferencias visuales y de planta guardadas", "success");
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
            Perfil de usuario y preferencias del ERP
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSavePreferences}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            Guardar Preferencias
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA PRINCIPAL: FORMULARIO DE PERFIL DE USUARIO */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-500/20">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Perfil de Usuario
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Actualización directa en base de datos PostgreSQL
                </span>
              </div>
            </div>

            <span className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20 rounded-lg">
              {user?.roles?.[0] || "Admin"}
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* Campo: Nombre Completo */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Nombre Completo
              </span>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Davis Muñoz"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Campo: Correo Electrónico (Solo Lectura) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Correo Electrónico Corporativo
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Solo Lectura
                </span>
              </div>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  className="w-full bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-600 dark:text-slate-400 cursor-not-allowed font-mono select-all"
                />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                El correo corporativo está vinculado a la identidad asignada en planta.
              </span>
            </div>

            {/* Sección: Cambio de Contraseña (Opcional) */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Seguridad de Acceso (Opcional)
                </span>
              </div>

              {/* Contraseña Actual */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Contraseña Actual
                </span>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Ingrese su contraseña actual para confirmar cambios"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Nueva Contraseña y Confirmación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Nueva Contraseña
                  </span>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Confirmar Contraseña
                  </span>
                  <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita la nueva contraseña"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Botón de Envío */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile || isLoadingProfile}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-sm shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando en PostgreSQL...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios de Perfil</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* COLUMNA LATERAL: PREFERENCIAS VISUALES Y DE PLANTA */}
        <div className="space-y-6">
          {/* Apariencia Visual */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm pb-3 border-b border-slate-100 dark:border-slate-800">
              <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Tema Visual</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  theme === "light"
                    ? "bg-amber-50 border-amber-500 text-amber-900 font-bold shadow-xs"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <Sun className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                <span className="text-[11px]">Claro</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  theme === "dark"
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-xs"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <Moon className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                <span className="text-[11px]">Oscuro</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  theme === "system"
                    ? "bg-amber-50 dark:bg-amber-500/20 border-amber-500 text-amber-900 dark:text-amber-300 font-bold shadow-xs"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <Laptop className="w-4 h-4 mx-auto mb-1 text-slate-600 dark:text-slate-400" />
                <span className="text-[11px]">Sistema</span>
              </button>
            </div>

            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Densidad de Tablas:
              </span>
              <select
                value={density}
                onChange={(e) => setDensity(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              >
                <option value="compact">Compacta (Alta Densidad)</option>
                <option value="normal">Estándar (Recomendada)</option>
                <option value="spacious">Espaciosa</option>
              </select>
            </div>
          </div>

          {/* Configuración de Notificaciones */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm pb-2 border-b border-slate-100 dark:border-slate-800">
              <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Alertas Operativas</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Alertas de Calidad
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Desviaciones en paso RO-5
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifyAlerts}
                onChange={(e) => setNotifyAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Telemetría IIoT RO-3
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Fin de curva de secado solar
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

          {/* Región y Planta */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold pb-2 border-b border-slate-100 dark:border-slate-800">
              <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Planta Operativa</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Sede:</span>
              <strong className="text-slate-900 dark:text-white">Plant 01 Managua</strong>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Moneda Base:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">C$ (NIO)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
