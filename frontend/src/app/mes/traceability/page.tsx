"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  GitBranch,
  Search,
  ArrowRight,
  ArrowDown,
  Layers,
  Factory,
  ShoppingCart,
  Truck,
  Boxes,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Building,
  RefreshCw,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import apiClient from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { LotTraceabilityResponse, TraceableLotSummary } from "@/types";

export default function MesTraceabilityPage() {
  const { showToast } = useToast();

  const [searchLot, setSearchLot] = useState("");
  const [availableLots, setAvailableLots] = useState<TraceableLotSummary[]>([]);
  const [traceabilityData, setTraceabilityData] = useState<LotTraceabilityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"diagram" | "timeline">("diagram");

  // Cargar lotes disponibles para sugerencias rápidas
  const loadAvailableLots = useCallback(async () => {
    try {
      const res = await apiClient.get<TraceableLotSummary[]>("/api/traceability/lots");
      setAvailableLots(res.data);
      if (res.data.length > 0 && !searchLot) {
        // Seleccionar primer lote de producto terminado si existe, o el primero
        const defaultLot = res.data.find((l) => l.category === "PT") || res.data[0];
        setSearchLot(defaultLot.lotNumber);
        fetchTraceability(defaultLot.lotNumber);
      }
    } catch (err: unknown) {
      console.error(err);
    }
  }, [searchLot]);

  useEffect(() => {
    loadAvailableLots();
  }, [loadAvailableLots]);

  // Consultar trazabilidad genealógica del lote
  const fetchTraceability = async (lotToSearch: string) => {
    if (!lotToSearch.trim()) {
      showToast("Ingresa un número de lote a rastrear", "error");
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiClient.get<LotTraceabilityResponse>(
        `/api/traceability/lot/${encodeURIComponent(lotToSearch.trim())}`
      );
      setTraceabilityData(res.data);
      showToast(`Trazabilidad cargada para lote ${res.data.lotNumber}`, "success");
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        `No se encontró información de trazabilidad para el lote '${lotToSearch}'`;
      showToast(errorMsg, "error");
      setTraceabilityData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTraceability(searchLot);
  };

  const selectQuickLot = (lotNum: string) => {
    setSearchLot(lotNum);
    fetchTraceability(lotNum);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-amber-500 uppercase tracking-wider mb-1">
            <GitBranch className="w-4 h-4" /> Módulo de Trazabilidad & Genealogía
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Genealogía Bidireccional de Lotes
          </h1>
          <p className="text-sm text-slate-400">
            Rastreo genealógico Upstream (Hacia atrás: Proveedores y OCs) y Downstream (Hacia adelante: Ventas y Clientes).
          </p>
        </div>

        {/* Buscador de Lote */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar lote: ej. LOTE-PT-001..."
              value={searchLot}
              onChange={(e) => setSearchLot(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-md shadow-amber-500/20 disabled:opacity-50"
          >
            {isLoading ? "Buscando..." : "Rastrear"}
          </button>
        </form>
      </div>

      {/* Lotes Disponibles (Pills rápidas) */}
      {availableLots.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 shrink-0 font-medium">Lotes disponibles:</span>
          {availableLots.map((l) => (
            <button
              key={l.lotNumber}
              onClick={() => selectQuickLot(l.lotNumber)}
              className={`px-3 py-1 rounded-lg border font-mono transition-colors shrink-0 ${
                traceabilityData?.lotNumber === l.lotNumber
                  ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              {l.lotNumber} ({l.itemCode})
            </button>
          ))}
        </div>
      )}

      {/* Tarjeta de Resumen del Lote Consultado */}
      {traceabilityData && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Identificador de Lote</span>
              <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
                {traceabilityData.lotNumber}
              </div>
              <span className="text-xs text-slate-400">Tipo: {traceabilityData.lotType}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Artículo Asociado</span>
              <div className="text-sm font-semibold text-white mt-0.5">{traceabilityData.itemName}</div>
              <span className="text-xs text-slate-400">
                Código: <strong className="text-slate-300">{traceabilityData.itemCode}</strong> ({traceabilityData.category})
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Existencias y Ubicación</span>
              <div className="text-sm font-semibold text-white mt-0.5">
                {traceabilityData.currentQuantity} / {traceabilityData.initialQuantity} {traceabilityData.unitOfMeasure}
              </div>
              <span className="text-xs text-slate-400">
                Almacén: <strong className="text-slate-300">{traceabilityData.warehouseCode}</strong> ({traceabilityData.warehouseName})
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Estado de Calidad</span>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    traceabilityData.status === "Disponible"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : traceabilityData.status === "En Cuarentena"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> {traceabilityData.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selector de Vista: Diagrama Interactivo o Timeline Kardex */}
      {traceabilityData && (
        <div className="flex border-b border-slate-800 text-sm font-medium gap-2">
          <button
            onClick={() => setActiveTab("diagram")}
            className={`flex items-center gap-2 pb-3 px-3 transition-colors border-b-2 ${
              activeTab === "diagram"
                ? "border-amber-500 text-amber-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <GitBranch className="w-4 h-4" /> Diagrama de Flujo Genealógico Interactivo
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`flex items-center gap-2 pb-3 px-3 transition-colors border-b-2 ${
              activeTab === "timeline"
                ? "border-amber-500 text-amber-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-4 h-4" /> Historial de Movimientos Kardex ({traceabilityData.kardexTimeline.length})
          </button>
        </div>
      )}

      {/* VISTA 1: DIAGRAMA GENEALÓGICO INTERACTIVO */}
      {traceabilityData && activeTab === "diagram" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* COLUMNA 1: UPSTREAM (Hacia Atrás) */}
            <div className="space-y-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-sm uppercase tracking-wider">
                  <Truck className="w-4 h-4" /> Upstream (Hacia Atrás)
                </div>
                <span className="text-xs text-slate-400 font-semibold">
                  {traceabilityData.upstream.length} insumos consumidos
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Materias primas y empaques utilizados en la fabricación, con sus respectivas Órdenes de Compra y Proveedores.
              </p>

              {traceabilityData.upstream.length > 0 ? (
                <div className="space-y-3">
                  {traceabilityData.upstream.map((u, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs hover:border-sky-500/40 transition-colors shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{u.itemName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          {u.category}
                        </span>
                      </div>

                      <div className="text-slate-400 space-y-0.5">
                        <div>
                          Lote Consumido: <strong className="text-amber-400 font-mono">{u.lotNumber}</strong>
                        </div>
                        <div>
                          Cantidad: <strong className="text-white">{u.consumedQuantity} {u.unitOfMeasure}</strong> (desde {u.sourceWarehouseCode})
                        </div>
                      </div>

                      {/* Orden de Compra y Proveedor */}
                      <div className="pt-2 border-t border-slate-800/70 text-slate-400 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <ShoppingCart className="w-3.5 h-3.5 text-sky-400" />
                          <span>OC: <strong className="text-white">{u.purchaseOrderNumber || "Stock Inicial"}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Building className="w-3.5 h-3.5 text-amber-400" />
                          <span>Proveedor: <strong className="text-slate-200">{u.supplierName || "Inventario Base"}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-500">
                  Este lote es materia prima base o no cuenta con consumo registrado de órdenes previas.
                </div>
              )}
            </div>

            {/* COLUMNA 2: NODO CENTRAL DE TRANSFORMACIÓN (OP) */}
            <div className="space-y-4 bg-slate-900/80 border border-amber-500/30 rounded-2xl p-5 shadow-xl shadow-amber-950/20 relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider">
                  <Factory className="w-4 h-4" /> Proceso de Fabricación (MES)
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Transformación
                </span>
              </div>

              {traceabilityData.productionOrder ? (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Orden de Producción:</span>
                      <strong className="text-amber-400 font-mono text-sm">
                        {traceabilityData.productionOrder.orderNumber}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Estado de Manufactura:</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300">
                        {traceabilityData.productionOrder.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Cantidad Fabricada:</span>
                      <strong className="text-white text-sm">
                        {traceabilityData.productionOrder.producedQuantity} / {traceabilityData.productionOrder.plannedQuantity}{" "}
                        {traceabilityData.productionOrder.unitOfMeasure}
                      </strong>
                    </div>

                    <div className="pt-2 border-t border-slate-800 space-y-1 text-slate-400">
                      <div>Estructura BOM: <strong className="text-slate-200">{traceabilityData.productionOrder.bomCode || "BOM Oficial"}</strong></div>
                      <div>Hoja de Ruta: <strong className="text-slate-200">{traceabilityData.productionOrder.routingCode || "Ruta Estándar"}</strong></div>
                    </div>
                  </div>

                  {/* Nodo del Lote Actual */}
                  <div className="bg-gradient-to-r from-amber-950/30 to-amber-900/20 border border-amber-500/40 rounded-xl p-4 text-center space-y-1">
                    <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">
                      Lote Producto Terminado
                    </span>
                    <div className="text-base font-bold text-white font-mono">{traceabilityData.lotNumber}</div>
                    <p className="text-xs text-amber-300/80">
                      Ubicación Actual: {traceabilityData.warehouseCode} ({traceabilityData.warehouseName})
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-500">
                  Lote de ingreso directo por compra o inventario inicial (sin orden de producción vinculada).
                </div>
              )}
            </div>

            {/* COLUMNA 3: DOWNSTREAM (Hacia Adelante) */}
            <div className="space-y-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
                  <ShoppingCart className="w-4 h-4" /> Downstream (Hacia Adelante)
                </div>
                <span className="text-xs text-slate-400 font-semibold">
                  {traceabilityData.downstream.length} despachos
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Clientes finales y Órdenes de Venta donde se despacharon unidades de este lote específico (FIFO).
              </p>

              {traceabilityData.downstream.length > 0 ? (
                <div className="space-y-3">
                  {traceabilityData.downstream.map((d, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs hover:border-emerald-500/40 transition-colors shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{d.customerName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {d.salesOrderNumber}
                        </span>
                      </div>

                      <div className="text-slate-400 space-y-0.5">
                        <div>
                          Cantidad Despachada: <strong className="text-emerald-400 font-bold">{d.dispatchedQuantity} {d.unitOfMeasure}</strong>
                        </div>
                        <div>
                          Precio Unitario: <strong className="text-slate-200">${d.unitPrice.toFixed(2)}</strong> | Total:{" "}
                          <strong className="text-white">${d.subtotal.toFixed(2)}</strong>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/70 text-slate-400 flex items-center justify-between text-[11px]">
                        <span>Fecha Venta: {new Date(d.orderDate).toLocaleDateString()}</span>
                        {d.dispatchedDate && (
                          <span className="text-emerald-400 font-medium">
                            Despachado: {new Date(d.dispatchedDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-500">
                  Este lote aún no ha sido despachado en órdenes de venta (permanece en existencias).
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: TIMELINE DE MOVIMIENTOS KARDEX */}
      {traceabilityData && activeTab === "timeline" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> Línea de Tiempo Inmutable (Kardex de Lote)
            </h2>
            <span className="text-xs text-slate-400">
              {traceabilityData.kardexTimeline.length} transacciones registradas
            </span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {traceabilityData.kardexTimeline.map((tx) => (
              <div key={tx.id} className="relative flex items-start gap-4 text-xs">
                {/* Indicador de Punto */}
                <div
                  className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-slate-950 ${
                    tx.transactionType.includes("ENTRADA")
                      ? "border-emerald-500"
                      : tx.transactionType.includes("SALIDA")
                      ? "border-rose-500"
                      : "border-amber-500"
                  }`}
                />

                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-white text-sm">{tx.transactionType}</span>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(tx.transactionDate).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-300 flex-wrap">
                    <span>
                      Cantidad: <strong className="text-amber-400 font-bold">{tx.quantity}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Costo Unit: <strong>${tx.unitCost.toFixed(2)}</strong> | Total:{" "}
                      <strong>${tx.totalCost.toFixed(2)}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Ruta: <strong>{tx.sourceWarehouseCode || "Externo"}</strong> →{" "}
                      <strong>{tx.destinationWarehouseCode || "Consumo/Cliente"}</strong>
                    </span>
                  </div>

                  {tx.referenceNumber && (
                    <div className="text-slate-400">
                      Referencia: <strong className="text-slate-200">{tx.referenceNumber}</strong>
                    </div>
                  )}

                  {tx.notes && <p className="text-slate-400 italic pt-1">{tx.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
