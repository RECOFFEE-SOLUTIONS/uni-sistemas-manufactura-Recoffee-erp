"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Coffee,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Users,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    setUsername(uname);
    setPassword("Password123!");
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage("Por favor ingrese su usuario y contraseña.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(username.trim(), password);
      router.push(redirectUrl);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axErr = err as { response?: { data?: { message?: string } } };
        setErrorMessage(
          axErr.response?.data?.message ||
            "Credenciales incorrectas o error en la autenticación."
        );
      } else {
        setErrorMessage("No se pudo conectar con el servidor de autenticación (.NET API).");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 p-4">
      {/* Tarjeta de Login */}
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Cabecera Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-600/30">
            <Coffee className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            ReCoffee Solutions
          </h1>
          <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
            Sistema de Manufactura ERP & MES
          </p>
        </div>

        {/* Alerta de sesión expirada */}
        {sessionExpired && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Su sesión ha expirado. Por favor ingrese sus credenciales nuevamente.</span>
          </div>
        )}

        {/* Alerta de error */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Usuario o Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej. davis o davis@recoffee.com"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-950/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-950/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:scale-[0.99] transition-all shadow-md shadow-amber-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>

        {/* Sección de Credenciales Rápidas para Pruebas del Equipo */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Usuarios de Prueba (Equipo ReCoffee):</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {quickUsers.map((qu) => (
              <button
                key={qu.username}
                type="button"
                onClick={() => handleQuickFill(qu.username)}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer group"
              >
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-amber-400 truncate">
                    {qu.name.split(" ")[0]}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{qu.role}</p>
                </div>
                <span className="text-[10px] text-amber-400 font-mono opacity-60 group-hover:opacity-100">
                  Fill
                </span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 text-center">
            Contraseña por defecto: <code className="text-amber-400">Password123!</code>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
