"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Play,
  CheckCircle2,
  Clock,
  Layers,
  Factory,
  Radio,
  ClipboardCheck,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Flame,
  Check,
  RotateCcw,
} from "lucide-react";
import apiClient from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { ProductionOrder, ProductionOrderMesDetail, ProductionOrderOperation } from "@/types";

export default function MesExecutionPage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [mesDetail, setMesDetail] = useState<ProductionOrderMesDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<number | null>(null);

  // Modal para completar operación con notas/minutos reales
  const [activeModalOp, setActiveModalOp] = useState<ProductionOrderOperation | null>(null);
  const [operatorNotes, setOperatorNotes] = useState("");
  const [customActualMinutes, setCustomActualMinutes] = useState<number | "">("");

  // Cargar órdenes de producción disponibles
  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<ProductionOrder[]>("/api/production/orders");
      setOrders(res.data);
      // Seleccionar la primera orden activa (En Proceso o Planificada) si no hay seleccionada
      if (res.data.length > 0 && selectedOrderId === null) {
        const active = res.data.find((o) => o.status === "En Proceso") || res.data[0];
        setSelectedOrderId(active.id);
      }
    } catch (err: unknown) {
      console.error(err);
      showToast("Error al cargar las órdenes de producción", "error");
    } finally {
      setIsLoading(false);
    }
  }, [selectedOrderId, showToast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Cargar operaciones MES de la orden seleccionada
  const loadMesDetail = useCallback(async (orderId: number) => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<ProductionOrderMesDetail>(`/api/mes/orders/${orderId}/operations`);
      setMesDetail(res.data);
    } catch (err: unknown) {
      console.error(err);
      showToast("Error al cargar operaciones MES de la orden", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (selectedOrderId) {
      loadMesDetail(selectedOrderId);
    }
  }, [selectedOrderId, loadMesDetail]);

  // Iniciar Operación en Piso de Planta
  const handleStartOperation = async (op: ProductionOrderOperation) => {
    try {
      setIsActionLoading(op.id);
      const operatorName = user?.username || user?.email || "Operador de Planta";
      await apiClient.post(`/api/mes/operations/${op.id}/start`, {
        operatorName,
        notes: "Iniciado desde panel MES de planta",
      });
      showToast(`Operación ${op.operationCode} iniciada exitosamente`, "success");
      if (selectedOrderId) {
        await loadMesDetail(selectedOrderId);
        await loadOrders();
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Error al iniciar operación";
      showToast(errorMsg, "error");
    } finally {
      setIsActionLoading(null);
    }
  };

  // Abrir modal de finalización
  const openCompleteModal = (op: ProductionOrderOperation) => {
    setActiveModalOp(op);
    setOperatorNotes("");
    setCustomActualMinutes("");
  };

  // Finalizar Operación
  const handleCompleteOperation = async () => {
    if (!activeModalOp) return;
    try {
      setIsActionLoading(activeModalOp.id);
      const operatorName = user?.username || user?.email || "Operador de Planta";
      await apiClient.post(`/api/mes/operations/${activeModalOp.id}/complete`, {
        operatorName,
        notes: operatorNotes || "Finalizado según especificación técnica",
        actualMinutes: typeof customActualMinutes === "number" && customActualMinutes > 0 ? customActualMinutes : null,
      });
      showToast(`Operación ${activeModalOp.operationCode} completada con éxito`, "success");
      setActiveModalOp(null);
      if (selectedOrderId) {
        await loadMesDetail(selectedOrderId);
        await loadOrders();
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Error al finalizar operación";
      showToast(errorMsg, "error");
    } finally {
      setIsActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completado":
      case "Completada":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Check className="w-3.5 h-3.5" /> Completado
          </span>
        );
      case "Iniciado":
      case "En Proceso":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> En Proceso
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            Pendiente
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-amber-500 uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" /> Módulo MES — Manufactura en Piso de Planta
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Control de Ejecución de Operaciones (RO-1 a RO-8)
          </h1>
          <p className="text-sm text-slate-400">
            Captura de tiempos reales, asignación de operarios y seguimiento paso a paso de la hoja de ruta.
          </p>
        </div>

        {/* Selector de OP */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-slate-400 font-medium mb-1">Orden de Producción Activa:</label>
            <select
              value={selectedOrderId || ""}
              onChange={(e) => setSelectedOrderId(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} — {o.itemCode} ({o.status})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => selectedOrderId && loadMesDetail(selectedOrderId)}
            className="p-2.5 mt-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title="Refrescar estado"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tarjeta de Resumen de la Orden */}
      {mesDetail && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-4 border-b border-slate-800/80">
            <div>
              <span className="text-xs text-slate-500 font-medium uppercase">Orden de Producción</span>
              <div className="text-lg font-bold text-amber-400 mt-0.5">{mesDetail.orderNumber}</div>
              <span className="text-xs text-slate-400">Lote: {mesDetail.lotNumber || "En asignación"}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium uppercase">Producto a Fabricar</span>
              <div className="text-sm font-semibold text-white mt-0.5">{mesDetail.itemName}</div>
              <span className="text-xs text-slate-400">Código: {mesDetail.itemCode}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium uppercase">Meta de Producción</span>
              <div className="text-sm font-semibold text-white mt-0.5">
                {mesDetail.producedQuantity} / {mesDetail.plannedQuantity} {mesDetail.unitOfMeasure}s
              </div>
              <span className="text-xs text-emerald-400">En proceso de manufactura</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium uppercase">Estado Global OP</span>
              <div className="mt-1">{getStatusBadge(mesDetail.status)}</div>
            </div>
          </div>

          {/* Barra de Progreso de la Hoja de Ruta */}
          <div className="mt-4 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" /> Progreso de Ruta de Fabricación:
              </span>
              <span className="text-amber-400">
                {mesDetail.completedOperationsCount} de {mesDetail.totalOperationsCount} operaciones ({mesDetail.progressPercentage}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700/60 p-0.5">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-sm shadow-amber-500/50"
                style={{ width: `${mesDetail.progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Grid de Operaciones de Ruta (RO-1 a RO-8) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Factory className="w-4 h-4 text-amber-400" /> Operaciones de Piso de Planta (Secuencia RO-1 a RO-8)
          </h2>
          <span className="text-xs text-slate-400">
            Operario activo: <strong className="text-slate-200">{user?.username || user?.email || "Operador de Planta"}</strong>
          </span>
        </div>

        {mesDetail && mesDetail.operations.length > 0 ? (
          <div className="grid grid-cols-1 gap-3.5">
            {mesDetail.operations.map((op) => {
              const isProcessing = isActionLoading === op.id;
              return (
                <div
                  key={op.id}
                  className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                    op.status === "Completado"
                      ? "bg-slate-900/40 border-slate-800/80 text-slate-300"
                      : op.status === "Iniciado"
                      ? "bg-slate-900 border-amber-500/50 shadow-md shadow-amber-950/20"
                      : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {/* Secuencia y Nombre de Operación */}
                  <div className="flex items-start gap-3.5 flex-1">
                    <div
                      className={`flex items-center justify-center w-9 h-9 rounded-xl font-bold text-sm shrink-0 ${
                        op.status === "Completado"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : op.status === "Iniciado"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {op.sequenceOrder}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-base">{op.operationCode}</span>
                        <span className="text-slate-400">—</span>
                        <span className="font-semibold text-slate-200">{op.name}</span>
                        {op.isQualityCheck && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <ClipboardCheck className="w-3 h-3" /> Control Calidad
                          </span>
                        )}
                        {op.requiresIIoTTelemetry && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            <Radio className="w-3 h-3" /> Telemetría IIoT
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                        <span>
                          Centro de Trabajo: <strong className="text-slate-300">{op.workCenter}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Tiempos Estándar: Mano de obra: <strong>{op.standardLaborMinutes} min</strong> | Máquina:{" "}
                          <strong>{op.standardMachineMinutes} min</strong>
                          {op.standardPassiveMinutes > 0 && ` | Pasivo: ${op.standardPassiveMinutes} min`}
                        </span>
                      </div>

                      {/* Info de Tiempos Reales */}
                      {(op.startedAt || op.completedAt || op.totalActualMinutes > 0) && (
                        <div className="flex items-center gap-3 text-xs text-amber-300/90 pt-1">
                          {op.startedAt && <span>Inicio: {new Date(op.startedAt).toLocaleTimeString()}</span>}
                          {op.completedAt && <span>| Fin: {new Date(op.completedAt).toLocaleTimeString()}</span>}
                          {op.totalActualMinutes > 0 && (
                            <span className="font-bold text-emerald-400">
                              | Tiempo Total Real: {op.totalActualMinutes} min
                            </span>
                          )}
                          {op.executedBy && <span>| Por: {op.executedBy}</span>}
                        </div>
                      )}

                      {op.operatorNotes && (
                        <p className="text-xs text-slate-400 italic bg-slate-950/40 p-1.5 rounded mt-1 border border-slate-800/40">
                          Nota: {op.operatorNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Estado y Botones de Acción */}
                  <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                    <div className="text-right mr-2">{getStatusBadge(op.status)}</div>

                    {op.status === "Pendiente" && (
                      <button
                        onClick={() => handleStartOperation(op)}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {isProcessing ? "Iniciando..." : "Iniciar Paso"}
                      </button>
                    )}

                    {op.status === "Iniciado" && (
                      <button
                        onClick={() => openCompleteModal(op)}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isProcessing ? "Finalizando..." : "Finalizar Paso"}
                      </button>
                    )}

                    {op.status === "Completado" && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium py-1.5 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <Check className="w-4 h-4" /> Concluido
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            {isLoading ? "Cargando operaciones..." : "Selecciona una orden de producción para visualizar su hoja de ruta."}
          </div>
        )}
      </div>

      {/* Modal de Finalización de Operación */}
      {activeModalOp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">
                  Finalizar Operación {activeModalOp.operationCode}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalOp(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Vas a registrar la culminación del paso: <strong>{activeModalOp.name}</strong>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Minutos reales transcurridos (opcional, calculado automáticamente):
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder={`Estándar: ${activeModalOp.standardLaborMinutes + activeModalOp.standardMachineMinutes} min`}
                  value={customActualMinutes}
                  onChange={(e) => setCustomActualMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Notas u Observaciones del Operador:
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej: Mezcla homogénea lograda sin grumos. Máquina operando a 1200 RPM..."
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setActiveModalOp(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCompleteOperation}
                disabled={isActionLoading === activeModalOp.id}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md shadow-emerald-500/20 disabled:opacity-50"
              >
                {isActionLoading === activeModalOp.id ? "Guardando..." : "Confirmar Finalización"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
