"use client";

import React, { useState, useEffect, useMemo } from "react";
import apiClient from "@/lib/api";
import { UserSummary, AccessLogItem } from "@/types";
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Copy,
  X,
  Layers,
  Database,
  ShoppingCart,
  Boxes,
  Factory,
  Radio,
  FileSpreadsheet,
  Terminal,
  Activity,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

const MODULE_DEFINITIONS = [
  {
    key: "master-data",
    name: "M1: Datos Maestros",
    description: "Almacenes, Artículos, Proveedores y Clientes",
    icon: Database,
    color: "text-amber-500",
  },
  {
    key: "engineering",
    name: "M2: Ingeniería & BOM",
    description: "Estructuras de Materiales multinivel y Rutas Técnicas",
    icon: Layers,
    color: "text-purple-500",
  },
  {
    key: "transactions",
    name: "M3: Transaccional & Kardex",
    description: "Compras, Movimientos de Inventario, Producción y Ventas",
    icon: Boxes,
    color: "text-blue-500",
  },
  {
    key: "mes",
    name: "M4: MES & Calidad de Planta",
    description: "Ejecución de Piso, Registro RO-5, Scrap y Trazabilidad",
    icon: Activity,
    color: "text-emerald-500",
  },
  {
    key: "iiot",
    name: "M5: Telemetría & IIoT",
    description: "Monitoreo en Vivo de Curva de Secado y Dashboard KPIs / OEE",
    icon: Radio,
    color: "text-cyan-500",
  },
  {
    key: "users",
    name: "M8: Gestión de Usuarios & Accesos",
    description: "Administración perimetral, RBAC, permisos y auditoría",
    icon: Shield,
    color: "text-rose-500",
  },
];

export default function UserManagementPage() {
  const [activeTab, setActiveTab] = useState<"users" | "audit">("users");
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLogItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modales
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [permissionModalUser, setPermissionModalUser] = useState<UserSummary | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Formulario nuevo usuario
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("Produccion");
  const [newAllowedModules, setNewAllowedModules] = useState<string[]>([
    "transactions",
    "mes",
  ]);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createdUserResult, setCreatedUserResult] = useState<{
    user: UserSummary;
    temporaryPassword: string;
  } | null>(null);

  // Modal de notificación de reseteo de clave
  const [resetModalResult, setResetModalResult] = useState<{
    username: string;
    temporaryPassword: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Carga inicial de usuarios
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await apiClient.get<UserSummary[]>("/api/users");
      setUsers(res.data);
    } catch {
      showNotification("error", "Error al cargar el directorio de usuarios.");
    } finally {
      setLoadingUsers(false);
    }
  };

  // Carga de historial de accesos
  const loadAccessLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await apiClient.get<AccessLogItem[]>("/api/users/access-logs?limit=80");
      setAccessLogs(res.data);
    } catch {
      showNotification("error", "Error al cargar la auditoría de accesos.");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (activeTab === "audit") {
      loadAccessLogs();
    }
  }, [activeTab]);

  const showNotification = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole =
        roleFilter === "ALL" || u.roles.some((r) => r.toLowerCase() === roleFilter.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "TEMPORARY" && u.mustChangePassword) ||
        (statusFilter === "DEFINITIVE" && !u.mustChangePassword);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Manejador para abrir modal de permisos
  const openPermissionModal = (u: UserSummary) => {
    setPermissionModalUser(u);
    // Si es Admin, por defecto tiene todos
    if (u.roles.includes("Admin")) {
      setSelectedPermissions(MODULE_DEFINITIONS.map((m) => m.key));
    } else {
      setSelectedPermissions(u.allowedModules || []);
    }
  };

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSavePermissions = async () => {
    if (!permissionModalUser) return;
    setSavingPermissions(true);
    try {
      await apiClient.put(`/api/users/${permissionModalUser.id}/permissions`, {
        allowedModules: selectedPermissions,
      });
      showNotification("success", `Permisos actualizados para @${permissionModalUser.username}`);
      setPermissionModalUser(null);
      await loadUsers();
    } catch {
      showNotification("error", "No se pudieron actualizar los permisos del usuario.");
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleResetPassword = async (u: UserSummary) => {
    try {
      const res = await apiClient.post<{ message: string; temporaryPassword: string }>(
        `/api/users/${u.id}/reset-password`
      );
      setResetModalResult({
        username: u.username,
        temporaryPassword: res.data.temporaryPassword,
      });
      await loadUsers();
    } catch {
      showNotification("error", "Error al generar la contraseña temporal.");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newEmail.trim()) {
      showNotification("error", "Nombre de usuario y correo son obligatorios.");
      return;
    }

    setCreatingUser(true);
    try {
      const res = await apiClient.post<{
        message: string;
        user: UserSummary;
        temporaryPassword: string;
      }>("/api/users", {
        username: newUsername.trim(),
        email: newEmail.trim(),
        role: newRole,
        allowedModules: newRole === "Admin" ? MODULE_DEFINITIONS.map((m) => m.key) : newAllowedModules,
      });

      setCreatedUserResult({
        user: res.data.user,
        temporaryPassword: res.data.temporaryPassword,
      });

      setNewUsername("");
      setNewEmail("");
      await loadUsers();
      showNotification("success", "Usuario creado exitosamente con contraseña provisional.");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axErr = err as { response?: { data?: { message?: string } } };
        showNotification("error", axErr.response?.data?.message || "No se pudo crear el usuario.");
      } else {
        showNotification("error", "Error al conectar con el servidor.");
      }
    } finally {
      setCreatingUser(false);
    }
  };

  const getRoleBadge = (roles: string[]) => {
    if (roles.includes("Admin")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <Shield className="w-3 h-3" />
          <span>Administrador</span>
        </span>
      );
    }
    if (roles.includes("Calidad")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Activity className="w-3 h-3" />
          <span>Calidad RO-5</span>
        </span>
      );
    }
    if (roles.includes("Almacen")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Boxes className="w-3 h-3" />
          <span>Almacén / Kardex</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <Factory className="w-3 h-3" />
        <span>{roles[0] || "Operador"}</span>
      </span>
    );
  };

  // KPIs calculados
  const totalUsers = users.length;
  const tempPasswordCount = users.filter((u) => u.mustChangePassword).length;
  const activeDefinitiveCount = totalUsers - tempPasswordCount;
  const adminCount = users.filter((u) => u.roles.includes("Admin")).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notificación */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 p-3.5 rounded-xl shadow-lg border text-sm backdrop-blur-md animate-in slide-in-from-top-2 ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Header Principal */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Gestión de Usuarios y Accesos
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              RBAC v2.4 Activo
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Administración perimetral de credenciales, roles operativos y matriz granular de permisos por módulo.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (activeTab === "users") loadUsers();
              else loadAccessLogs();
            }}
            className="flex items-center gap-2 h-9 px-3.5 rounded-xl bg-white dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] text-xs font-medium transition cursor-pointer"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers || loadingLogs ? "animate-spin" : ""}`} />
            <span>Sincronizar</span>
          </button>
          <button
            onClick={() => {
              setCreatedUserResult(null);
              setCreateUserModalOpen(true);
            }}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-semibold shadow-sm transition active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Operador / Usuario</span>
          </button>
        </div>
      </div>

      {/* Quick KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#14161f]/70 border border-slate-200 dark:border-white/[0.08] backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-medium uppercase tracking-wider">
            <span>Directorio Total</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {totalUsers} <span className="text-xs font-normal text-slate-400">usuarios</span>
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {activeDefinitiveCount} Activos
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-white/[0.06] h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all"
              style={{ width: `${totalUsers > 0 ? (activeDefinitiveCount / totalUsers) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#14161f]/70 border border-slate-200 dark:border-white/[0.08] backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-medium uppercase tracking-wider">
            <span>Administradores Globales</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {adminCount}
            </span>
            <span className="text-xs font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              Acceso 100%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-white/[0.06] h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#14161f]/70 border border-slate-200 dark:border-white/[0.08] backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-medium uppercase tracking-wider">
            <span>Claves Provisionales</span>
            <KeyRound className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {tempPasswordCount}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded border ${
                tempPasswordCount > 0
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              }`}
            >
              {tempPasswordCount > 0 ? "Pendiente Cambio" : "Todo Seguro"}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-white/[0.06] h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full"
              style={{ width: `${totalUsers > 0 ? (tempPasswordCount / totalUsers) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#14161f]/70 border border-slate-200 dark:border-white/[0.08] backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs font-medium uppercase tracking-wider">
            <span>Seguridad Perimetral</span>
            <Shield className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              AES-256
            </span>
            <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded border border-emerald-500/20">
              HttpOnly + RSA
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-white/[0.06] h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08]">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 py-3 border-b-2 font-medium text-sm transition cursor-pointer ${
              activeTab === "users"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Directorio de Usuarios</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-neutral-300 font-mono text-xs">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 py-3 border-b-2 font-medium text-sm transition cursor-pointer ${
              activeTab === "audit"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Historial de Accesos / Auditoría</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 dark:text-neutral-500 pb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sincronización de Sesiones en Tiempo Real</span>
        </div>
      </div>

      {/* TAB 1: DIRECTORIO DE USUARIOS */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Barra de Filtros (Sin Etiquetas <label>) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/70 dark:bg-[#14161f]/70 border border-slate-200 dark:border-white/[0.08]">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Buscador */}
              <div className="relative w-full max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-neutral-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por usuario o correo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-[#0d0e13] border border-slate-200 dark:border-white/[0.08] focus:border-amber-500/60 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition"
                />
              </div>

              {/* Filtro Rol */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-8 px-3 bg-slate-50 dark:bg-[#0d0e13] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-700 dark:text-neutral-300 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ALL">Todos los Roles</option>
                <option value="Admin">Administrador</option>
                <option value="Almacen">Almacén</option>
                <option value="Produccion">Producción</option>
                <option value="Calidad">Calidad</option>
                <option value="Ventas">Ventas</option>
              </select>

              {/* Filtro Estado Contraseña */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-3 bg-slate-50 dark:bg-[#0d0e13] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-700 dark:text-neutral-300 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ALL">Estado: Todos</option>
                <option value="DEFINITIVE">Clave Definitiva (Activo)</option>
                <option value="TEMPORARY">Clave Temporal (Pendiente)</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 dark:text-neutral-400">
              Mostrando <span className="font-semibold text-slate-900 dark:text-white font-mono">{filteredUsers.length}</span> de <span className="font-mono">{users.length}</span>
            </div>
          </div>

          {/* Tabla de Usuarios */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white/70 dark:bg-[#14161f]/70 overflow-hidden shadow-sm backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.08] text-slate-400 dark:text-neutral-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Rol / Nivel</th>
                    <th className="py-3 px-4">Módulos Concedidos</th>
                    <th className="py-3 px-4">Estado Credencial</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-neutral-500">
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                          <span>Cargando directorio de usuarios...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-neutral-500">
                        No se encontraron usuarios coincidentes.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isAdmin = u.roles.includes("Admin");
                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-white/[0.04] border border-amber-500/20 dark:border-white/[0.08] flex items-center justify-center font-bold text-amber-600 dark:text-amber-400">
                                {u.username.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white">
                                  {u.name || u.username}
                                </div>
                                <div className="text-[11px] text-slate-400 dark:text-neutral-400 font-mono">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">{getRoleBadge(u.roles)}</td>

                          <td className="py-3.5 px-4">
                            {isAdmin ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                Todos los módulos (Admin)
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {u.allowedModules && u.allowedModules.length > 0 ? (
                                  u.allowedModules.map((modKey) => {
                                    const modDef = MODULE_DEFINITIONS.find((m) => m.key === modKey);
                                    return (
                                      <span
                                        key={modKey}
                                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-neutral-300"
                                      >
                                        {modDef?.name.split(":")[0] || modKey}
                                      </span>
                                    );
                                  })
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">
                                    Sin módulos asignados
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {u.mustChangePassword ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <KeyRound className="w-3 h-3" />
                                <span>Clave Temporal Activa</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Clave Definitiva</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openPermissionModal(u)}
                                className="h-7 px-2.5 rounded-lg border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-neutral-300 flex items-center gap-1 transition cursor-pointer"
                                title="Editar Permisos Granulares"
                              >
                                <Lock className="w-3 h-3 text-amber-500" />
                                <span>Permisos</span>
                              </button>

                              <button
                                onClick={() => handleResetPassword(u)}
                                className="h-7 px-2 rounded-lg border border-slate-200 dark:border-white/[0.08] hover:bg-rose-500/10 text-slate-500 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                                title="Generar Contraseña Temporal"
                              >
                                <KeyRound className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HISTORIAL DE ACCESOS / AUDITORÍA */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/70 dark:bg-[#14161f]/70 border border-slate-200 dark:border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                Registro de Autenticaciones y Auditoría Perimetral (Últimos 80 eventos)
              </span>
            </div>
            <button
              onClick={loadAccessLogs}
              className="flex items-center gap-1 px-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition"
            >
              <RefreshCw className={`w-3 h-3 ${loadingLogs ? "animate-spin" : ""}`} />
              <span>Actualizar Log</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white/70 dark:bg-[#14161f]/70 overflow-hidden shadow-sm backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.08] text-slate-400 dark:text-neutral-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Dirección IP</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Detalle / Diagnóstico</th>
                    <th className="py-3 px-4">Terminal / UserAgent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {loadingLogs ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-neutral-500">
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                          <span>Cargando eventos de auditoría...</span>
                        </div>
                      </td>
                    </tr>
                  ) : accessLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-neutral-500">
                        No hay registros de acceso en la base de datos aún.
                      </td>
                    </tr>
                  ) : (
                    accessLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition"
                      >
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-neutral-300">
                          {new Date(log.timestamp).toLocaleString("es-NI")}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          @{log.username}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-neutral-400">
                          {log.ipAddress}
                        </td>
                        <td className="py-3 px-4">
                          {log.success ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Éxito</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              <XCircle className="w-3 h-3" />
                              <span>Fallo</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-neutral-300">
                          {log.failureReason || "Autenticación RSA + Cookie HttpOnly correcta"}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-400 dark:text-neutral-500 font-mono max-w-xs truncate">
                          {log.userAgent || "Terminal Web Directo"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: EDITAR PERMISOS POR MÓDULO (DRAWER / MODAL) */}
      {permissionModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white dark:bg-[#161822] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col justify-between">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
                  {permissionModalUser.username.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    Matriz de Permisos por Módulo
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-neutral-400">
                    <span>@{permissionModalUser.username}</span>
                    <span>•</span>
                    <span className="font-mono">{permissionModalUser.email}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPermissionModalUser(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body: Lista de Módulos (Sin etiquetas <label>) */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar">
              {permissionModalUser.roles.includes("Admin") && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300">
                  <span className="font-semibold">Nota de Seguridad:</span> Este usuario posee el rol de Administrador Global. Tiene acceso inherente a todos los módulos del sistema.
                </div>
              )}

              <div className="space-y-2">
                {MODULE_DEFINITIONS.map((mod) => {
                  const Icon = mod.icon;
                  const isChecked = selectedPermissions.includes(mod.key);
                  return (
                    <div
                      key={mod.key}
                      onClick={() => togglePermission(mod.key)}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer select-none ${
                        isChecked
                          ? "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30"
                          : "bg-slate-50 dark:bg-[#0d0e13]/60 border-slate-200 dark:border-white/[0.06] opacity-75 hover:opacity-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-neutral-700 text-amber-600 focus:ring-0 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${mod.color}`} />
                          <span className="font-semibold text-xs text-slate-900 dark:text-white">
                            {mod.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                          {mod.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-neutral-400">
                {selectedPermissions.length} de {MODULE_DEFINITIONS.length} módulos autorizados
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPermissionModalUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={savingPermissions}
                  onClick={handleSavePermissions}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  {savingPermissions ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Guardar Matriz de Permisos</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: NUEVO USUARIO CON CONTRASEÑA TEMPORAL */}
      {createUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#161822] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    Registrar Nuevo Usuario
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    Se generará una contraseña temporal automática
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateUserModalOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!createdUserResult ? (
              <form onSubmit={handleCreateUser} className="py-4 space-y-4">
                {/* Inputs sin etiquetas <label> */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Nombre de usuario (ej. carlos.mora)"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-[#0d0e13] border border-slate-200 dark:border-white/[0.08] focus:border-amber-500/60 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Database className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="Correo corporativo (ej. cmora@recoffee.internal)"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-[#0d0e13] border border-slate-200 dark:border-white/[0.08] focus:border-amber-500/60 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>

                {/* Selector de Rol */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                    Rol Operativo Asignado
                  </span>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 dark:bg-[#0d0e13] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Admin">Administrador (Acceso Total)</option>
                    <option value="Produccion">Operador / Supervisor Producción</option>
                    <option value="Calidad">Auditor de Calidad (RO-5)</option>
                    <option value="Almacen">Kardex & Almacén Central</option>
                    <option value="Ventas">Ventas & Despacho</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200">
                  <span className="font-semibold">Política WI-8.02:</span> El usuario se creará con una contraseña temporal de un solo uso. En su primer inicio de sesión se le exigirá obligatoriamente crear una contraseña definitiva.
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateUserModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingUser}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {creatingUser ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                        <span>Creando...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Crear Usuario</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-4 space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-800 dark:text-emerald-200">
                    <p className="font-semibold">¡Usuario creado exitosamente!</p>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Proporciona la siguiente credencial provisional al colaborador.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-100 dark:bg-[#0d0e13] border border-slate-200 dark:border-white/[0.08] rounded-xl space-y-1.5">
                  <span className="text-[11px] text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">
                    Contraseña Temporal Asignada:
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400 select-all">
                      {createdUserResult.temporaryPassword}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdUserResult.temporaryPassword)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] text-xs flex items-center gap-1 hover:text-amber-500 transition"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey ? "Copiado!" : "Copiar"}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateUserModalOpen(false);
                      setCreatedUserResult(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs transition"
                  >
                    Entendido / Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: NOTIFICACIÓN DE CONTRASEÑA RESETEADA */}
      {resetModalResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#161822] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                  Contraseña Provisional Generada
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResetModalResult(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-neutral-300">
              Se ha regenerado la clave de acceso para <strong className="text-slate-900 dark:text-white">@{resetModalResult.username}</strong>. En su próximo acceso será redirigido a configurar una clave definitiva.
            </p>

            <div className="p-3 bg-slate-100 dark:bg-[#0d0e13] border border-slate-200 dark:border-white/[0.08] rounded-xl space-y-1.5">
              <span className="text-[11px] text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">
                Nueva Clave Temporal:
              </span>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400 select-all">
                  {resetModalResult.temporaryPassword}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(resetModalResult.temporaryPassword)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] text-xs flex items-center gap-1 hover:text-amber-500 transition"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedKey ? "Copiado!" : "Copiar"}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setResetModalResult(null)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs transition"
              >
                Listo / Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
