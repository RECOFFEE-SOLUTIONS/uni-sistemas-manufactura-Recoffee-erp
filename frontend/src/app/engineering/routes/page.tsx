"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  GitBranch,
  Clock,
  Sun,
  UserCheck,
  Radio,
  ClipboardCheck,
  Building2,
  RefreshCw,
  Timer,
  FileText,
  ListOrdered,
} from "lucide-react";
import apiClient from "@/lib/api";
import { RoutingHeader } from "@/types";
import { useToast } from "@/context/ToastContext";
import InfoTooltip from "@/components/InfoTooltip";

export default function RoutingsPage() {
  const { showToast } = useToast();
  const [routings, setRoutings] = useState<RoutingHeader[]>([]);
  const [selectedRoutingId, setSelectedRoutingId] = useState<number | null>(null);
  const [currentRouting, setCurrentRouting] = useState<RoutingHeader | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");

  // Cargar rutas disponibles
  const fetchRoutings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<RoutingHeader[]>("/api/routings");
      if (res.data && res.data.length > 0) {
        setRoutings(res.data);
        const first = res.data[0];
        setSelectedRoutingId(first.id);
        // Si el endpoint ya incluye las operaciones, hidratar inmediatamente
        if (first.operations && first.operations.length > 0) {
          setCurrentRouting(first);
        }
      }
    } catch {
      showToast("Error al cargar las rutas de producción", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchRoutings();
  }, [fetchRoutings]);

  // Cargar detalle de la ruta seleccionada con operaciones
  useEffect(() => {
    if (!selectedRoutingId) return;

    // Verificar si la ruta seleccionada ya tiene operaciones en memoria
    const cached = routings.find((r) => r.id === selectedRoutingId);
    if (cached?.operations && cached.operations.length > 0) {
      setCurrentRouting(cached);
    }

    const fetchDetail = async () => {
      try {
        const res = await apiClient.get<RoutingHeader>(`/api/routings/${selectedRoutingId}`);
        if (res.data) {
          setCurrentRouting(res.data);
        }
      } catch (err) {
        console.error("Error al cargar el detalle de la ruta:", err);
        // Mostrar toast solo si no tenemos las operaciones en memoria
        if (!cached?.operations || cached.operations.length === 0) {
          showToast("Error al cargar el detalle de la ruta", "error");
        }
      }
    };

    fetchDetail();
  }, [selectedRoutingId, routings, showToast]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Title - Minimalista y sin párrafos largos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-500/20">
              Hito M2
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Ingeniería de Planta</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <GitBranch className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Rutas de Producción (RO-1..RO-8)
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Secuencia estandarizada de manufactura
            </p>
            <InfoTooltip content="Secuencia estandarizada de manufactura para la transformación de la borra de café con discriminación de tiempos de mano de obra vs proceso solar pasivo (32 horas continuas)." />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch de Vista: Timeline vs Tabla */}
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-sm">
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                viewMode === "timeline"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Línea de Tiempo
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Tabla Técnica
            </button>
          </div>

          <button
            onClick={fetchRoutings}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-colors cursor-pointer"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Selector de Ruta de Producción (Sin etiquetas <label>) */}
      {routings.length > 1 && (
        <div className="bg-white dark:bg-[#11131a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Ruta Activa:
          </span>
          <select
            value={selectedRoutingId || ""}
            onChange={(e) => setSelectedRoutingId(Number(e.target.value))}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
          >
            {routings.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code} — {r.name} ({r.version})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tarjetas KPI de Resumen de Tiempos (Totalmente Blancas en Modo Claro) */}
      {currentRouting && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tarjeta 1: Tiempo Manual */}
          <div className="bg-white dark:bg-[#11131a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Mano de Obra
                </p>
                <h3 className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                  {currentRouting.totalLaborMinutes} min
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {(currentRouting.totalLaborMinutes / 60).toFixed(1)} horas (7 ops)
                </p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200/50 dark:border-amber-500/20">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-1.5 rounded-full"
                style={{
                  width: `${(currentRouting.totalLaborMinutes / (currentRouting.totalCycleMinutes || 1)) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Tarjeta 2: Proceso Solar Pasivo */}
          <div className="bg-white dark:bg-[#11131a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Secado Solar Pasivo
                </p>
                <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                  {currentRouting.totalPassiveProcessMinutes} min
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {(currentRouting.totalPassiveProcessMinutes / 60).toFixed(0)} horas (RO-3)
                </p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl border border-orange-200/50 dark:border-orange-500/20">
                <Sun className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-orange-500 h-1.5 rounded-full"
                style={{
                  width: `${(currentRouting.totalPassiveProcessMinutes / (currentRouting.totalCycleMinutes || 1)) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Tarjeta 3: Tiempo Total de Ciclo */}
          <div className="bg-white dark:bg-[#11131a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tiempo de Ciclo Total
                </p>
                <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                  {currentRouting.totalCycleMinutes} min
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ~{(currentRouting.totalCycleMinutes / 60).toFixed(1)} h / lote piloto
                </p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200/50 dark:border-emerald-500/20">
                <Timer className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span>Manual + Secado solar integral</span>
            </div>
          </div>

          {/* Tarjeta 4: Total de Operaciones */}
          <div className="bg-white dark:bg-[#11131a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Secuencia Estándar
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {currentRouting.operations?.length || 8} Operaciones
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">RO-1 a RO-8 aprobadas</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200/50 dark:border-blue-500/20">
                <ListOrdered className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1">
              <span>1 Calidad • 1 Sensor IIoT</span>
            </div>
          </div>
        </div>
      )}

      {/* Banner Informativo Minimalista con Tooltip */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-emerald-500/10 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Distribución: Manual (121m) vs Solar Pasivo (1,920m)
              </h4>
              <InfoTooltip content="El proceso de secado solar representa el 94% del tiempo calendario de fabricación (32 horas sin consumo de operario), mientras que la manipulación manual comprende 2 horas y 1 minuto distribuidas en 7 estaciones de trabajo." />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Secado solar pasivo optimizado para máxima eficiencia energética.
            </p>
          </div>
        </div>
      </div>

      {/* VISTA 1: Timeline Interactivo */}
      {viewMode === "timeline" && currentRouting?.operations && (
        <div className="relative pl-6 sm:pl-8 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 space-y-5">
          {currentRouting.operations.map((op) => {
            const isPassive = op.passiveProcessMinutes > 0;
            const isQuality = op.isQualityCheck;
            const isTelemetry = op.requiresIIoTTelemetry;

            return (
              <div key={op.id || op.operationCode} className="relative group">
                {/* Marcador del Timeline */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-sm transition-transform group-hover:scale-110 ${
                    isTelemetry
                      ? "bg-orange-500 border-orange-200 dark:border-orange-800 text-white ring-4 ring-orange-100 dark:ring-orange-950/40"
                      : isQuality
                      ? "bg-purple-600 border-purple-200 dark:border-purple-800 text-white ring-4 ring-purple-100 dark:ring-purple-950/40"
                      : "bg-emerald-600 border-emerald-200 dark:border-emerald-800 text-white"
                  }`}
                >
                  {op.sequenceOrder}
                </div>

                {/* Card de Operación (Blanco puro en Light Mode) */}
                <div
                  className={`bg-white dark:bg-[#11131a] p-5 rounded-2xl border transition-all hover:shadow-md ${
                    isTelemetry
                      ? "border-orange-300 dark:border-orange-800/80 ring-1 ring-orange-200/50 dark:ring-orange-950/40"
                      : isQuality
                      ? "border-purple-300 dark:border-purple-800/80 ring-1 ring-purple-200/50 dark:ring-purple-950/40"
                      : "border-slate-200 dark:border-slate-800 shadow-sm"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-base">
                        {op.operationCode}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{op.name}</h3>

                      {/* Badges de Especialidad */}
                      {isTelemetry && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-500/10 text-orange-800 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 animate-pulse">
                          <Radio className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                          Telemetría IIoT
                        </span>
                      )}
                      {isQuality && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-500/10 text-purple-800 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
                          <ClipboardCheck className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          Inspección de Calidad
                        </span>
                      )}
                    </div>

                    {/* Centro de Trabajo */}
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>{op.workCenter}</span>
                    </div>
                  </div>

                  {/* Descripción y Tiempos */}
                  <div className="mt-3 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    <div className="lg:col-span-8">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{op.description}</p>
                      {op.standardInstructions && (
                        <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                          <span>
                            <strong>Instrucción Operativa:</strong> {op.standardInstructions}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Chips de Tiempo */}
                    <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-2">
                      {op.laborMinutes > 0 && (
                        <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Manual: {op.laborMinutes}m</span>
                        </div>
                      )}

                      {op.passiveProcessMinutes > 0 && (
                        <div className="px-3 py-1.5 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-800 dark:text-orange-400 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                          <Sun className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                          <span>Solar: {op.passiveProcessMinutes}m (32h)</span>
                        </div>
                      )}

                      {op.setupMinutes > 0 && (
                        <div className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700">
                          Setup: {op.setupMinutes}m
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VISTA 2: Tabla DataGrid Técnica */}
      {viewMode === "table" && currentRouting?.operations && (
        <div className="bg-white dark:bg-[#11131a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Hoja Técnica — {currentRouting.code} ({currentRouting.name})
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Versión {currentRouting.version}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                  <th className="py-3 px-4 text-center">Sec.</th>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Operación</th>
                  <th className="py-3 px-4">Centro de Trabajo</th>
                  <th className="py-3 px-4 text-right">T. Manual (min)</th>
                  <th className="py-3 px-4 text-right">T. Pasivo (min)</th>
                  <th className="py-3 px-4 text-right">Setup (min)</th>
                  <th className="py-3 px-4 text-center">Tipo / Controles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentRouting.operations.map((op) => (
                  <tr key={op.id || op.operationCode} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">
                      {op.sequenceOrder}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {op.operationCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{op.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">{op.description}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {op.workCenter}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-700 dark:text-amber-400">
                      {op.laborMinutes > 0 ? `${op.laborMinutes} min` : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-orange-600 dark:text-orange-400">
                      {op.passiveProcessMinutes > 0 ? `${op.passiveProcessMinutes} min` : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400">
                      {op.setupMinutes > 0 ? `${op.setupMinutes} min` : "0"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {op.requiresIIoTTelemetry && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-100 dark:bg-orange-500/10 text-orange-800 dark:text-orange-400 rounded-md border border-orange-200 dark:border-orange-500/20">
                            IIoT
                          </span>
                        )}
                        {op.isQualityCheck && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 dark:bg-purple-500/10 text-purple-800 dark:text-purple-400 rounded-md border border-purple-200 dark:border-purple-500/20">
                            Calidad
                          </span>
                        )}
                        {!op.requiresIIoTTelemetry && !op.isQualityCheck && (
                          <span className="px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md">
                            Estándar
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-900 dark:text-white border-t-2 border-slate-200 dark:border-slate-800">
                  <td colSpan={4} className="py-3 px-4 text-right uppercase text-xs">
                    Totales Acumulados de la Ruta:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-amber-700 dark:text-amber-400">
                    {currentRouting.totalLaborMinutes} min
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-orange-600 dark:text-orange-400">
                    {currentRouting.totalPassiveProcessMinutes} min
                  </td>
                  <td></td>
                  <td className="py-3 px-4 text-center text-emerald-700 dark:text-emerald-400 font-mono text-xs">
                    Ciclo: {currentRouting.totalCycleMinutes} min
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
