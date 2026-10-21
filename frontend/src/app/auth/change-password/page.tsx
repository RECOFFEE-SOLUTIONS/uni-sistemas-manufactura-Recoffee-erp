"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Coffee,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { authService } from "@/lib/auth";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newPassword.trim()) {
      setErrorMessage("Por favor ingrese la nueva contraseña.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("La confirmación de la contraseña no coincide.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.changePassword(
        newPassword.trim(),
        currentPassword.trim() || undefined
      );

      setSuccessMessage(res.message || "Contraseña actualizada exitosamente.");

      // Redirigir al ERP principal tras breve confirmación visual
      setTimeout(() => {
        router.push("/");
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
      }, 1500);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axErr = err as { response?: { data?: { message?: string } } };
        setErrorMessage(
          axErr.response?.data?.message || "No se pudo actualizar la contraseña. Verifique los requisitos."
        );
      } else {
        setErrorMessage("Error de conexión al servidor de seguridad.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0d0e13] text-slate-800 dark:text-[#e2e8f0] flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-800 dark:selection:text-amber-200 font-sans relative overflow-hidden transition-colors duration-200">
      {/* Fondo técnico sutil */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e120_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e120_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-amber-500/10 dark:bg-amber-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full px-6 sm:px-8 py-4 flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] backdrop-blur-md bg-white/70 dark:bg-[#121318]/70">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Coffee className="w-5 h-5" />
          </div>
          <span className="font-heading font-bold text-base tracking-tight text-slate-900 dark:text-white">
            ReCoffee Solutions
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-xs text-slate-600 dark:text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-500/30 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </header>

      {/* Tarjeta Central: Cambio Obligatorio de Contraseña */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white/90 dark:bg-[#14161f]/90 border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
          
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-white/[0.04] border border-amber-500/20 dark:border-white/[0.08] flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3 shadow-inner">
              <KeyRound className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Crear Nueva Contraseña
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-xs">
              Has iniciado sesión con una clave provisional. Por política de seguridad debes definir tu contraseña definitiva.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 flex items-center gap-2 p-3 text-xs rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage} Redirigiendo al panel de control...</span>
            </div>
          )}

          {/* Formulario Sin Etiquetas Clásicas (labels) */}
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {/* Input Contraseña Actual / Temporal (Opcional si viene autenticado con token) */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-neutral-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                placeholder="Contraseña temporal actual (opcional)"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#0d0e13]/80 border border-slate-200 dark:border-white/[0.08] focus:border-amber-500/60 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-150"
              />
            </div>

            {/* Input Nueva Contraseña */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-neutral-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <input
                type={showNewPassword ? "text" : "password"}
                required
                placeholder="Nueva contraseña definitiva (mínimo 6 caracteres)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-[#0d0e13]/80 border border-slate-200 dark:border-white/[0.08] focus:border-amber-500/60 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-150"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Input Confirmar Contraseña */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-neutral-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                placeholder="Confirma tu nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-[#0d0e13]/80 border border-slate-200 dark:border-white/[0.08] focus:border-amber-500/60 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-150"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Indicadores de Seguridad */}
            <div className="p-3 bg-slate-50 dark:bg-[#0d0e13] rounded-xl border border-slate-200 dark:border-white/[0.06] space-y-1.5 text-xs text-slate-500 dark:text-neutral-400">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    newPassword.length >= 6 ? "bg-emerald-500" : "bg-slate-300 dark:bg-neutral-700"
                  }`}
                />
                <span>Mínimo 6 caracteres</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    newPassword && newPassword === confirmPassword
                      ? "bg-emerald-500"
                      : "bg-slate-300 dark:bg-neutral-700"
                  }`}
                />
                <span>Las contraseñas coinciden</span>
              </div>
            </div>

            {/* Botón CTA Primario */}
            <button
              type="submit"
              disabled={isLoading || !!successMessage}
              className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-slate-950 font-semibold text-sm rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(245,158,11,0.25)] hover:shadow-[0_4px_22px_rgba(245,158,11,0.35)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span className="h-4 w-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Actualizando y encriptando...
                </span>
              ) : (
                <>
                  <span>Guardar y Entrar al ERP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 px-6 text-center text-xs text-slate-400 dark:text-neutral-500 border-t border-slate-200 dark:border-white/[0.04]">
        <p>© 2026 ReCoffee Solutions — Seguridad Perimetral y Gestión de Identidades</p>
      </footer>
    </div>
  );
}
