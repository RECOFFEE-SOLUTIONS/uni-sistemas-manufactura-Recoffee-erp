"use client";

import React, { useEffect, useState } from "react";
import {
  GitBranch,
  Clock,
  Sun,
  UserCheck,
  CheckCircle2,
  Radio,
  ClipboardCheck,
  Building2,
  RefreshCw,
  Timer,
  AlertTriangle,
  FileText,
  ListOrdered,
  Calendar,
  Layers,
} from "lucide-react";
import apiClient from "@/lib/api";
import { RoutingHeader, RoutingOperation } from "@/types";
import { useToast } from "@/context/ToastContext";

export default function RoutingsPage() {
  const { showToast } = useToast();
  const [routings, setRoutings] = useState<RoutingHeader[]>([]);
  const [selectedRoutingId, setSelectedRoutingId] = useState<number | null>(null);
  const [currentRouting, setCurrentRouting] = useState<RoutingHeader | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");

  // Cargar rutas disponibles
  const fetchRoutings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<RoutingHeader[]>("/api/routings");
      setRoutings(res.data);
      if (res.data.length > 0) {
        setSelectedRoutingId(res.data[0].id);
      }
    } catch {
      showToast("Error al cargar las rutas de producción", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutings();
  }, []);

  // Cargar detalle de la ruta seleccionada con operaciones
  useEffect(() => {
    if (!selectedRoutingId) return;

    const fetchDetail = async () => {
      try {
        const res = await apiClient.get<RoutingHeader>(`/api/routings/${selectedRoutingId}`);
        setCurrentRouting(res.data);
      } catch {
        showToast("Error al cargar el detalle de la ruta", "error");
      }
    };

    fetchDetail();
  }, [selectedRoutingId, showToast]);

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
              Hito M2
            </span>
            <span className="text-xs text-slate-500">Ingeniería de Planta</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mt-1">
            <GitBranch className="w-7 h-7 text-emerald-600" />
            Rutas de Producción Estándar y Operaciones (RO-1 a RO-8)
          </h1>
          <p className="text-sm text-slate-600">
            Secuencia estandarizada de manufactura para la transformación de la borra de café con discriminación de tiempos de mano de obra vs proceso solar pasivo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch de Vista: Timeline vs Tabla */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                viewMode === "timeline"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Línea de Tiempo
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                viewMode === "table"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tabla Técnica
            </button>
          </div>

          <button
            onClick={fetchRoutings}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refrescar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selector de Ruta de Producción */}
      {routings.length > 1 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Ruta Activa:
          </label>
          <select
            value={selectedRoutingId || ""}
            onChange={(e) => setSelectedRoutingId(Number(e.target.value))}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium"
          >
            {routings.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code} — {r.name} ({r.version})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tarjetas KPI de Resumen de Tiempos */}
      {currentRouting && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tarjeta 1: Tiempo Manual */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Mano de Obra Manual</p>
                <h3 className="text-2xl font-bold text-amber-700 mt-1">
                  {currentRouting.totalLaborMinutes} min
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {(currentRouting.totalLaborMinutes / 60).toFixed(1)} horas (7 operaciones)
                </p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <UserCheck className="w-7 h-7" />
              </div>
            </div>
            <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-1.5 rounded-full"
                style={{
                  width: `${(currentRouting.totalLaborMinutes / (currentRouting.totalCycleMinutes || 1)) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Tarjeta 2: Proceso Solar Pasivo */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Secado Solar Pasivo</p>
                <h3 className="text-2xl font-bold text-orange-600 mt-1">
                  {currentRouting.totalPassiveProcessMinutes} min
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {(currentRouting.totalPassiveProcessMinutes / 60).toFixed(0)} horas continuas (RO-3)
                </p>
              </div>
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                <Sun className="w-7 h-7" />
              </div>
            </div>
            <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-orange-500 h-1.5 rounded-full"
                style={{
                  width: `${(currentRouting.totalPassiveProcessMinutes / (currentRouting.totalCycleMinutes || 1)) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Tarjeta 3: Tiempo Total de Ciclo */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tiempo de Ciclo Total</p>
                <h3 className="text-2xl font-bold text-emerald-700 mt-1">
                  {currentRouting.totalCycleMinutes} min
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ~{(currentRouting.totalCycleMinutes / 60).toFixed(1)} horas / lote piloto
                </p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Timer className="w-7 h-7" />
              </div>
            </div>
            <div className="mt-3 text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <span>Mano de obra + Secado solar integral</span>
            </div>
          </div>

          {/* Tarjeta 4: Total de Operaciones */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Secuencia Estándar</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">
                  {currentRouting.operations?.length || 8} Operaciones
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">RO-1 a RO-8 aprobadas</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <ListOrdered className="w-7 h-7" />
              </div>
            </div>
            <div className="mt-3 text-xs text-blue-700 font-semibold flex items-center gap-1">
              <span>1 Control Calidad • 1 Sensor IIoT</span>
            </div>
          </div>
        </div>
      )}

      {/* Comparativa Visual de Tiempos (Banner Informativo) */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              Desglose de Tiempos de Manufactura: Manuales (121 min) vs. Pasivos (1,920 min)
            </h4>
            <p className="text-xs text-slate-600">
              El proceso de secado solar representa el 94% del tiempo calendario de fabricación (32 horas sin consumo de operario), mientras que la manipulación manual comprende 2 horas y 1 minuto distribuidas en 7 estaciones de trabajo.
            </p>
          </div>
        </div>
      </div>

      {/* VISTA 1: Timeline Interactivo */}
      {viewMode === "timeline" && currentRouting?.operations && (
        <div className="relative pl-6 sm:pl-8 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 space-y-6">
          {currentRouting.operations.map((op, index) => {
            const isPassive = op.passiveProcessMinutes > 0;
            const isQuality = op.isQualityCheck;
            const isTelemetry = op.requiresIIoTTelemetry;

            return (
              <div key={op.id} className="relative group">
                {/* Marcador del Timeline */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-sm transition-transform group-hover:scale-110 ${
                    isTelemetry
                      ? "bg-orange-500 border-orange-200 text-white ring-4 ring-orange-100"
                      : isQuality
                      ? "bg-purple-600 border-purple-200 text-white ring-4 ring-purple-100"
                      : "bg-emerald-600 border-emerald-200 text-white"
                  }`}
                >
                  {op.sequenceOrder}
                </div>

                {/* Card de Operación */}
                <div
                  className={`bg-white p-5 rounded-xl border transition-shadow hover:shadow-md ${
                    isTelemetry
                      ? "border-orange-300 ring-1 ring-orange-200/50"
                      : isQuality
                      ? "border-purple-300 ring-1 ring-purple-200/50"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-800 text-base">
                        {op.operationCode}
                      </span>
                      <span className="text-slate-300">•</span>
                      <h3 className="font-bold text-slate-800 text-base">{op.name}</h3>

                      {/* Badges de Especialidad */}
                      {isTelemetry && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200 animate-pulse">
                          <Radio className="w-3 h-3 text-orange-600" />
                          Telemetría IIoT Activa
                        </span>
                      )}
                      {isQuality && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                          <ClipboardCheck className="w-3 h-3 text-purple-600" />
                          Inspección de Calidad
                        </span>
                      )}
                    </div>

                    {/* Centro de Trabajo */}
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{op.workCenter}</span>
                    </div>
                  </div>

                  {/* Descripción y Tiempos */}
                  <div className="mt-3 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    <div className="lg:col-span-8">
                      <p className="text-sm text-slate-600">{op.description}</p>
                      {op.standardInstructions && (
                        <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2">
                          <FileText className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                          <span>
                            <strong>Instrucción Operativa:</strong> {op.standardInstructions}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Chips de Tiempo */}
                    <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-2">
                      {op.laborMinutes > 0 && (
                        <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span>Mano de Obra: {op.laborMinutes} min</span>
                        </div>
                      )}

                      {op.passiveProcessMinutes > 0 && (
                        <div className="px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                          <Sun className="w-3.5 h-3.5 text-orange-600" />
                          <span>Solar Pasivo: {op.passiveProcessMinutes} min (32h)</span>
                        </div>
                      )}

                      {op.setupMinutes > 0 && (
                        <div className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                          Setup: {op.setupMinutes} min
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Hoja de Ruta Técnica — {currentRouting.code} ({currentRouting.name})
            </h3>
            <span className="text-xs text-slate-500">Versión {currentRouting.version}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
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
              <tbody className="divide-y divide-slate-100">
                {currentRouting.operations.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">
                      {op.sequenceOrder}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                      {op.operationCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{op.name}</div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">{op.description}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {op.workCenter}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                      {op.laborMinutes > 0 ? `${op.laborMinutes} min` : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-orange-600">
                      {op.passiveProcessMinutes > 0 ? `${op.passiveProcessMinutes} min` : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {op.setupMinutes > 0 ? `${op.setupMinutes} min` : "0"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {op.requiresIIoTTelemetry && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-800 rounded">
                            IIoT
                          </span>
                        )}
                        {op.isQualityCheck && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 rounded">
                            Calidad
                          </span>
                        )}
                        {!op.requiresIIoTTelemetry && !op.isQualityCheck && (
                          <span className="px-2 py-0.5 text-[10px] text-slate-500 bg-slate-100 rounded">
                            Estándar
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                  <td colSpan={4} className="py-3 px-4 text-right uppercase text-xs">
                    Totales Acumulados de la Ruta:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-amber-700">
                    {currentRouting.totalLaborMinutes} min
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-orange-600">
                    {currentRouting.totalPassiveProcessMinutes} min
                  </td>
                  <td></td>
                  <td className="py-3 px-4 text-center text-emerald-700 font-mono text-xs">
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
