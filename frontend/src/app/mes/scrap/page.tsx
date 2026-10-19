"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Layers,
  Factory,
} from "lucide-react";
import apiClient from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { NonConformanceReport, NcrDispositionResult } from "@/types";

export default function MesScrapPage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(false);

  // Modal de Disposición
  const [selectedNcr, setSelectedNcr] = useState<NonConformanceReport | null>(null);
  const [dispositionAction, setDispositionAction] = useState<"Retrabajo" | "Scrap">("Retrabajo");
  const [reworkInstructions, setReworkInstructions] = useState(
    "Reingreso a secado solar (RO-3) por 12 horas adicionales y remezclado (RO-4)."
  );
  const [scrapReason, setScrapReason] = useState(
    "Merma definitiva de lote por desviación crítica insubsanable."
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal de Cierre Manual
  const [ncrToClose, setNcrToClose] = useState<NonConformanceReport | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const loadNcrs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {};
      if (filterStatus !== "ALL") params.status = filterStatus;
      if (filterSeverity !== "ALL") params.severity = filterSeverity;

      const res = await apiClient.get<NonConformanceReport[]>("/api/quality/ncrs", { params });
      setNcrs(res.data);
    } catch (err: unknown) {
      console.error(err);
      showToast("Error al cargar Reportes de No Conformidad", "error");
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, filterSeverity, showToast]);

  useEffect(() => {
    loadNcrs();
  }, [loadNcrs]);

  // Ejecutar Disposición (Retrabajo o Scrap)
  const handleExecuteDisposition = async () => {
    if (!selectedNcr) return;

    try {
      setIsProcessing(true);
      const responsiblePerson = user?.username || user?.email || "Control de Calidad";

      if (dispositionAction === "Retrabajo") {
        const res = await apiClient.post<NcrDispositionResult>(
          `/api/quality/ncrs/${selectedNcr.id}/dispose-rework`,
          {
            instructions: reworkInstructions,
            responsiblePerson,
            notes: "Retrabajo dictaminado desde panel de Scrap/Retrabajo",
          }
        );
        showToast(res.data.message, "success");
      } else {
        const res = await apiClient.post<NcrDispositionResult>(
          `/api/quality/ncrs/${selectedNcr.id}/dispose-scrap`,
          {
            reason: scrapReason,
            responsiblePerson,
            notes: "Scrap dictaminado desde panel de Scrap/Retrabajo",
          }
        );
        showToast(res.data.message, "info");
      }

      setSelectedNcr(null);
      await loadNcrs();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Error al ejecutar disposición técnica";
      showToast(errorMsg, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Cerrar NCR
  const handleCloseNcr = async () => {
    if (!ncrToClose) return;

    if (!resolutionNotes.trim()) {
      showToast("Debes ingresar las notas de resolución técnica", "error");
      return;
    }

    try {
      setIsProcessing(true);
      const responsiblePerson = user?.username || user?.email || "Control de Calidad";
      await apiClient.post(`/api/quality/ncrs/${ncrToClose.id}/close`, {
        resolutionNotes: resolutionNotes.trim(),
        responsiblePerson,
        actionTaken: "Resolución Técnica",
      });
      showToast(`NCR ${ncrToClose.ncrNumber} cerrado exitosamente`, "success");
      setNcrToClose(null);
      await loadNcrs();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Error al cerrar reporte";
      showToast(errorMsg, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Cerrado":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> Cerrado
          </span>
        );
      case "En Tratamiento":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> En Tratamiento
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" /> Abierto
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-amber-500 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" /> Módulo de Disposición — Scrap & Retrabajo
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Gestión de Disposiciones de No Conformidad
          </h1>
          <p className="text-sm text-slate-400">
            Tratamiento formal de lotes desviados: reactivación de operaciones para Retrabajo o desecho a Merma (Scrap).
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadNcrs}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-slate-300 font-medium">Estado:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="Abierto">Abierto</option>
            <option value="En Tratamiento">En Tratamiento</option>
            <option value="Cerrado">Cerrado</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-300 font-medium">Severidad:</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Todas las Severidades</option>
            <option value="Menor">Menor</option>
            <option value="Mayor">Mayor</option>
            <option value="Crítica">Crítica</option>
          </select>
        </div>

        <div className="ml-auto text-slate-400">
          Mostrando <strong className="text-white">{ncrs.length}</strong> reportes
        </div>
      </div>

      {/* Grid de Reportes de No Conformidad */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ncrs.map((ncr) => (
          <div
            key={ncr.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-rose-400 text-sm">{ncr.ncrNumber}</span>
                {getStatusBadge(ncr.status)}
              </div>

              <div>
                <span className="text-[11px] text-slate-500 font-semibold uppercase">Lote Afectado</span>
                <div className="font-mono font-bold text-amber-400 text-sm">{ncr.lotNumber}</div>
                {ncr.productionOrderNumber && (
                  <span className="text-xs text-slate-400">OP: {ncr.productionOrderNumber}</span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Severidad:</span>
                  <span className="font-semibold text-rose-300">{ncr.severity}</span>
                </div>
                <div className="text-slate-300 font-medium pt-1 border-t border-slate-800/50">
                  {ncr.defectDescription}
                </div>
              </div>

              {ncr.resolutionNotes && (
                <div className="text-xs text-slate-400 italic bg-slate-950/40 p-2 rounded border border-slate-800/50">
                  Resolución: {ncr.resolutionNotes}
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
              {ncr.status !== "Cerrado" ? (
                <>
                  <button
                    onClick={() => {
                      setSelectedNcr(ncr);
                      setDispositionAction("Retrabajo");
                    }}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Disposición
                  </button>
                  <button
                    onClick={() => {
                      setNcrToClose(ncr);
                      setResolutionNotes("");
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                    title="Cerrar Reporte Manualmente"
                  >
                    Cerrar
                  </button>
                </>
              ) : (
                <div className="w-full text-center text-xs text-slate-500 py-1.5 bg-slate-950/40 rounded-xl">
                  Reporte Finalizado & Archivado
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Disposición */}
      {selectedNcr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-white text-base">
                  Dictamen de Disposición: {selectedNcr.ncrNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNcr(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div>
                <span className="text-slate-500">Lote:</span>{" "}
                <strong className="text-amber-400 font-mono">{selectedNcr.lotNumber}</strong>
              </div>
              <div>
                <span className="text-slate-500">Desvío:</span>{" "}
                <strong className="text-rose-300">{selectedNcr.defectDescription}</strong>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">
                Selecciona la Disposición a Ejecutar:
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDispositionAction("Retrabajo")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    dispositionAction === "Retrabajo"
                      ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  <RotateCcw className="w-5 h-5 mb-2 text-amber-400" />
                  <div className="font-bold text-sm text-white">Retrabajo</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Reactivar OP y operaciones de ruta (RO-3 / RO-4) para nuevo ciclo de secado o mezclado.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDispositionAction("Scrap")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    dispositionAction === "Scrap"
                      ? "bg-rose-500/20 border-rose-500 text-rose-300 shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  <Trash2 className="w-5 h-5 mb-2 text-rose-400" />
                  <div className="font-bold text-sm text-white">Scrap (Merma)</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Salida física de WIP en ALM-002 hacia pérdida total y registro inmutable en Kardex.
                  </p>
                </button>
              </div>

              {dispositionAction === "Retrabajo" ? (
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Instrucciones de Retrabajo:
                  </label>
                  <textarea
                    rows={3}
                    value={reworkInstructions}
                    onChange={(e) => setReworkInstructions(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Motivo de Merma / Scrap:
                  </label>
                  <textarea
                    rows={3}
                    value={scrapReason}
                    onChange={(e) => setScrapReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedNcr(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteDisposition}
                disabled={isProcessing}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 transition-colors shadow-md disabled:opacity-50 ${
                  dispositionAction === "Retrabajo"
                    ? "bg-amber-500 hover:bg-amber-400 shadow-amber-500/20"
                    : "bg-rose-500 hover:bg-rose-400 shadow-rose-500/20"
                }`}
              >
                {isProcessing
                  ? "Procesando..."
                  : dispositionAction === "Retrabajo"
                  ? "Reactivar Retrabajo"
                  : "Registrar Scrap / Merma"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cierre Manual */}
      {ncrToClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Cierre de NCR: {ncrToClose.ncrNumber}</h3>
              </div>
              <button onClick={() => setNcrToClose(null)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Documentar Resolución Técnica Implementada:
              </label>
              <textarea
                rows={4}
                required
                placeholder="Ej: Lote homogeneizado y estabilizado a 18% de humedad. Reinspección técnica conforme aprobada."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setNcrToClose(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCloseNcr}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 disabled:opacity-50"
              >
                {isProcessing ? "Guardando..." : "Confirmar Cierre"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
