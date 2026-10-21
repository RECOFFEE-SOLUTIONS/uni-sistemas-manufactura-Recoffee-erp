"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Cpu,
  KeyRound,
  Radio,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Coffee,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectUrl = searchParams.get("redirect") || "/";
  const sessionExpired = searchParams.get("session_expired") === "true";

  const quickUsers = [
    { username: "davis", role: "Admin", name: "Davis Muñoz" },
    { username: "melany", role: "Admin", name: "Melany Sánchez" },
    { username: "kenneth", role: "Almacen", name: "Kenneth Pérez" },
    { username: "wildor", role: "Produccion", name: "Wildor Jarquín" },
    { username: "dayana", role: "Calidad", name: "Dayana Reyes" },
    { username: "dayerling", role: "Ventas", name: "Dayerling Perez" },
  ];

  const handleQuickFill = (uname: string) => {
    setIdentifier(uname);
    setPassword("Password123!");
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage("Por favor ingrese su identificador y contraseña.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // El servicio encripta asimétricamente la contraseña vía RSA WebCrypto
      // y el backend almacena el token exclusivamente en Cookie HttpOnly
      await login(identifier.trim(), password);
      router.push(redirectUrl);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axErr = err as { response?: { status?: number; data?: { message?: string } } };
        if (axErr.response?.status === 429) {
          setErrorMessage("Demasiados intentos de acceso fallidos. Por favor espere 1 minuto (Rate Limit activo).");
        } else if (axErr.response?.status === 423) {
          setErrorMessage("Cuenta temporalmente bloqueada por seguridad. Contacte al administrador.");
        } else {
          setErrorMessage(
            axErr.response?.data?.message ||
              "Credenciales incorrectas o error en la autenticación segura."
          );
        }
      } else {
        setErrorMessage("No se pudo conectar con el servidor de autenticación (.NET 8).");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0d0e13] text-slate-800 dark:text-[#e2e8f0] flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-800 dark:selection:text-amber-200 font-sans relative overflow-hidden transition-colors duration-200">
      {/* Fondo técnico con cuadrícula industrial */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e120_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e120_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-amber-500/10 dark:bg-amber-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Top Header Barra Global */}
      <header className="relative z-10 w-full px-6 sm:px-8 py-4 flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] backdrop-blur-md bg-white/70 dark:bg-[#121318]/70">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Coffee className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-base tracking-tight text-slate-900 dark:text-white">
              ReCoffee Solutions
            </span>
            <span className="hidden sm:inline-flex text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-neutral-400 font-mono">
              Planta Central v2.4
            </span>
          </div>
        </div>

        {/* Badge Visual: Conexión Encriptada AES-256 */}
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold backdrop-blur-sm shadow-[0_0_12px_rgba(16,185,129,0.15)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Lock className="w-3.5 h-3.5 stroke-[2.2]" />
          <span className="tracking-wide">Conexión Encriptada AES-256</span>
        </div>
      </header>

      {/* Tarjeta Central de Autenticación */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white/90 dark:bg-[#14161f]/90 border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
          <div className="absolute top-4 right-5 text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-neutral-500">
            TERM-08-SEC
          </div>

          {/* Encabezado del Formulario */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-white/[0.04] border border-amber-500/20 dark:border-white/[0.08] flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3 shadow-inner">
              <ShieldCheck className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Acceso a Terminal Seguro
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-xs">
              Autenticación perimetral para operadores y supervisión de planta
            </p>
          </div>

          {/* Ubicación / Terminal Asignado */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-neutral-900/70 border border-slate-200 dark:border-white/[0.05] mb-5 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-neutral-300 font-medium">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>Planta Central • Turno Activo</span>
            </div>
            <span className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              LÍNEA 04-A
            </span>
          </div>

          {/* Alertas contextuales */}
          {sessionExpired && (
            <div className="mb-4 flex items-center gap-2 p-3 text-xs rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Su sesión ha expirado. Por favor ingrese sus credenciales nuevamente.</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Formulario Sin Etiquetas Clásicas (labels) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Usuario / Identificador */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-neutral-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                aria-label="Identificador o usuario corporativo"
                placeholder="Identificador o usuario@recoffee.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#0d0e13]/80 border border-slate-200 dark:border-white/[0.08] focus:border-amber-500/60 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-150"
              />
            </div>

            {/* Input Contraseña */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-neutral-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                aria-label="Contraseña Maestra del Sistema"
                placeholder="Contraseña Maestra del Sistema"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-[#0d0e13]/80 border border-slate-200 dark:border-white/[0.08] focus:border-amber-500/60 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-150"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Checkbox Recordar Terminal */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-amber-600 focus:ring-amber-500/30"
                />
                <span>Mantener sesión iniciada en este terminal</span>
              </label>
              <button
                type="button"
                className="text-slate-500 hover:text-amber-600 dark:text-neutral-400 dark:hover:text-amber-400 transition-colors font-medium"
              >
                ¿Olvidé mi clave?
              </button>
            </div>

            {/* Botón CTA Primario */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-slate-950 font-semibold text-sm rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(245,158,11,0.25)] hover:shadow-[0_4px_22px_rgba(245,158,11,0.35)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span className="h-4 w-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Verificando credenciales seguras...
                </span>
              ) : (
                <>
                  <span>Iniciar Sesión Segura</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Autenticación Rápida para Pruebas / Demostración */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-neutral-500 text-center font-semibold mb-2">
              Credenciales Rápidas de Turno
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {quickUsers.map((u) => (
                <button
                  key={u.username}
                  type="button"
                  onClick={() => handleQuickFill(u.username)}
                  className="px-2 py-1.5 text-center rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/[0.06] transition text-[11px]"
                >
                  <span className="block font-semibold text-slate-800 dark:text-slate-200 truncate">{u.name}</span>
                  <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-mono">{u.role}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Autenticación de Campo FIDO2 / RFID */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/[0.06]">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/[0.06] text-xs text-slate-600 dark:text-neutral-300 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                <span>Llave FIDO2</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/[0.06] text-xs text-slate-600 dark:text-neutral-300 transition-colors"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-500" />
                <span>Tarjeta RFID / NFC</span>
              </button>
            </div>
          </div>

          {/* Mensaje de Cumplimiento Legal / Auditoría ISA-95 */}
          <div className="mt-4 flex items-start gap-2 text-[11px] text-slate-500 dark:text-neutral-500 leading-relaxed bg-slate-50 dark:bg-white/[0.01] p-2.5 rounded-xl border border-slate-200/80 dark:border-white/[0.03]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
            <span>
              Acceso auditado bajo normativas ISA-95 e IEC 62443. La actividad es monitoreada y registrada criptográficamente en el Kardex central.
            </span>
          </div>
        </div>
      </main>

      {/* Footer Industrial Discreto */}
      <footer className="relative z-10 w-full px-6 sm:px-8 py-3.5 border-t border-slate-200 dark:border-white/[0.06] bg-white/70 dark:bg-[#0d0e13]/80 backdrop-blur-md flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 dark:text-neutral-500 gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-slate-600 dark:text-neutral-400 font-medium">Todos los sistemas operativos</span>
          </div>
          <span>•</span>
          <span className="font-mono text-slate-600 dark:text-neutral-400">
            Cluster ReCoffee ERP: Latencia 14ms
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="font-mono text-slate-400 dark:text-neutral-500">v2.4.0-SEC</span>
          <span>•</span>
          <span className="text-slate-500 dark:text-neutral-400">Soporte IT de Planta: Ext 402</span>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0d0e13] text-amber-500">
          <div className="h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
