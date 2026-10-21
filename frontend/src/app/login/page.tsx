"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Coffee,
  Users,
  KeyRound,
  CheckCircle2,
  Copy,
  X,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/lib/auth";

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
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Estado para el Modal de "¿Olvidé mi clave?"
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotResult, setForgotResult] = useState<{
    temporaryPassword?: string;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage("Por favor ingrese su usuario y contraseña.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Envío de credenciales cifradas
      const res = await login(identifier.trim(), password);

      // 2. Si tiene contraseña temporal, forzar redirección a cambio obligatorio de contraseña
      if (res.mustChangePassword) {
        router.push("/auth/change-password");
        if (typeof window !== "undefined") {
          window.location.href = "/auth/change-password";
        }
        return;
      }

      // 3. Redirección al destino solicitado o dashboard principal
      const target = redirectUrl && redirectUrl !== "/login" ? redirectUrl : "/";
      router.push(target);
      if (typeof window !== "undefined") {
        window.location.href = target;
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axErr = err as { response?: { status?: number; data?: { message?: string } } };
        if (axErr.response?.status === 429) {
          setErrorMessage("Demasiados intentos fallidos. Por favor espere 1 minuto (Rate Limiting activo).");
        } else if (axErr.response?.status === 423) {
          setErrorMessage("Cuenta temporalmente bloqueada por seguridad. Contacte al administrador.");
        } else {
          setErrorMessage(
            axErr.response?.data?.message ||
              "Credenciales incorrectas o error en la autenticación."
          );
        }
      } else {
        setErrorMessage("No se pudo conectar con el servidor de autenticación (.NET 8).");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError("Por favor ingrese su usuario o correo.");
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    setForgotResult(null);

    try {
      const res = await authService.forgotPassword(forgotIdentifier.trim());
      if (res.temporaryPassword) {
        setForgotResult({
          temporaryPassword: res.temporaryPassword,
          message: res.message || "Contraseña temporal generada exitosamente.",
        });
      } else {
        setForgotError("El servidor no devolvió una contraseña temporal válida.");
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axErr = err as { response?: { status?: number; data?: { message?: string } } };
        if (axErr.response?.status === 404) {
          setForgotError(axErr.response?.data?.message || `El usuario o correo "${forgotIdentifier}" no existe en el sistema.`);
        } else {
          setForgotError(axErr.response?.data?.message || "No se pudo generar la contraseña temporal. Verifique sus datos.");
        }
      } else {
        setForgotError("Error al contactar al servidor de recuperación.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const useTemporaryPassword = (tempPwd: string) => {
    setIdentifier(forgotIdentifier);
    setPassword(tempPwd);
    setForgotModalOpen(false);
    setForgotResult(null);
    setForgotIdentifier("");
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0d0e13] text-slate-800 dark:text-[#e2e8f0] flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-800 dark:selection:text-amber-200 font-sans relative overflow-hidden transition-colors duration-200">
      {/* Fondo técnico sutil */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e120_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e120_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-amber-500/10 dark:bg-amber-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Top Header Barra Global */}
      <header className="relative z-10 w-full px-6 sm:px-8 py-4 flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] backdrop-blur-md bg-white/70 dark:bg-[#121318]/70">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Coffee className="w-5 h-5" />
          </div>
          <span className="font-heading font-bold text-base tracking-tight text-slate-900 dark:text-white">
            ReCoffee Solutions
          </span>
        </div>
      </header>

      {/* Tarjeta Central de Autenticación */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white/90 dark:bg-[#14161f]/90 border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
          
          {/* Encabezado del Formulario */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-white/[0.04] border border-amber-500/20 dark:border-white/[0.08] flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3 shadow-inner">
              <Coffee className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Acceso al Sistema ERP
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-xs">
              Autenticación segura para operadores y supervisión
            </p>
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
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Input Usuario / Identificador */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-neutral-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                aria-label="Identificador o usuario corporativo"
                placeholder="Identificador o usuario corporativo"
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
                aria-label="Contraseña del Sistema"
                placeholder="Contraseña del Sistema"
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

            {/* Recordar Terminal y Olvidé mi clave (Sin etiquetas <label>) */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-2 cursor-pointer text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-300 select-none"
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-amber-600 focus:ring-amber-500/30"
                />
                <span>Mantener sesión iniciada</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setForgotModalOpen(true);
                  setForgotError(null);
                  setForgotResult(null);
                  setForgotIdentifier(identifier);
                }}
                className="text-slate-500 hover:text-amber-600 dark:text-neutral-400 dark:hover:text-amber-400 transition-colors font-medium cursor-pointer"
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
                  Verificando credenciales...
                </span>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Autenticación Rápida para Pruebas / Demostración */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/[0.06]">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-neutral-500 text-center font-semibold mb-2.5 flex items-center justify-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-500" />
              <span>Credenciales Rápidas de Prueba</span>
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
        </div>
      </main>

      {/* Modal: Recuperación / Generación de Contraseña Temporal (WI-8.03) */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#161822] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    Recuperar Contraseña
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    Generación segura de clave temporal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {forgotError && (
                <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}

              {!forgotResult ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-xs text-slate-600 dark:text-neutral-300">
                    Ingresa tu nombre de usuario o correo corporativo. El sistema generará una contraseña temporal para que puedas iniciar sesión e inmediatamente configurar una nueva clave.
                  </p>
                  
                  {/* Sin etiquetas <label> */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-neutral-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Usuario o correo electrónico corporativo"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0d0e13]/80 border border-slate-200 dark:border-white/[0.08] focus:border-amber-500/60 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      {forgotLoading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                          <span>Generando...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Generar Clave Temporal</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-800 dark:text-emerald-200">
                      <p className="font-semibold">{forgotResult.message}</p>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        Guarda esta contraseña temporal. Al acceder al sistema serás redirigido a la pantalla de cambio obligatorio.
                      </p>
                    </div>
                  </div>

                  {forgotResult.temporaryPassword && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-emerald-800 dark:text-emerald-300 uppercase tracking-wider font-bold">
                          Contraseña Temporal Generada:
                        </span>
                        <span className="text-[10px] bg-emerald-200/80 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded font-mono font-semibold">
                          Sin SMTP / Lista para Usar
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 p-2.5 bg-white dark:bg-[#0d0e13] rounded-lg border border-emerald-200 dark:border-emerald-700/50">
                        <code className="text-base font-mono font-bold text-emerald-700 dark:text-emerald-400 select-all tracking-wider">
                          {forgotResult.temporaryPassword}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(forgotResult.temporaryPassword!)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copied ? "¡Copiada!" : "Copiar"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition"
                    >
                      Cerrar
                    </button>
                    {forgotResult.temporaryPassword && (
                      <button
                        type="button"
                        onClick={() => useTemporaryPassword(forgotResult.temporaryPassword!)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Usar e Iniciar Sesión</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Minimalista */}
      <footer className="relative z-10 w-full py-4 px-6 text-center text-xs text-slate-400 dark:text-neutral-500 border-t border-slate-200 dark:border-white/[0.04]">
        <p>© 2026 ReCoffee Solutions — Planta Central. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0d0e13]">
          <div className="h-8 w-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
