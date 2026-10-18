"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Factory,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  Layers,
  LayoutGrid,
  List,
  Calendar,
  Sparkles,
  Boxes,
  ShieldAlert,
} from "lucide-react";
import apiClient from "@/lib/api";
import { ProductionOrder, Item } from "@/types";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/Modal";

export default function ProductionOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  // Create Order Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | "">("");
  const [plannedQuantity, setPlannedQuantity] = useState<number>(10);
  const [plannedStartDate, setPlannedStartDate] = useState<string>("");
  const [plannedEndDate, setPlannedEndDate] = useState<string>("");
  const [orderNotes, setOrderNotes] = useState<string>("Lote de producción estándar de sustrato compostable.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Start Order Modal State
  const [orderToStart, setOrderToStart] = useState<ProductionOrder | null>(null);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Complete Order Modal State
  const [orderToComplete, setOrderToComplete] = useState<ProductionOrder | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [producedQty, setProducedQty] = useState<number>(10);
  const [scrapQty, setScrapQty] = useState<number>(0);
  const [completeNotes, setCompleteNotes] = useState<string>("Fabricación finalizada y conforme en control de calidad.");
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, itemsRes] = await Promise.all([
        apiClient.get<ProductionOrder[]>("/api/production/orders"),
        apiClient.get<Item[]>("/api/items"),
      ]);
      setOrders(ordersRes.data);
      // Items aptos para fabricación (PT y SEM)
      const manufacturable = itemsRes.data.filter((i) => i.isActive && (i.category === "PT" || i.category === "SEM"));
      setItems(manufacturable);
    } catch {
      showToast("Error al cargar órdenes de producción", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    const ptItem = items.find((i) => i.code === "PT-001") || items[0];
    setSelectedItemId(ptItem ? ptItem.id : "");
    setPlannedQuantity(10);
    const now = new Date();
    setPlannedStartDate(now.toISOString().split("T")[0]);
    const later = new Date(now.getTime() + 86400000 * 2);
    setPlannedEndDate(later.toISOString().split("T")[0]);
    setOrderNotes("Fabricación de lote sustrato compostable para demanda comercial.");
    setModalError(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      setModalError("Debe seleccionar un producto a fabricar.");
      return;
    }
    if (plannedQuantity <= 0) {
      setModalError("La cantidad a producir debe ser mayor a 0.");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const payload = {
        itemId: Number(selectedItemId),
        plannedQuantity: Number(plannedQuantity),
        plannedStartDate: plannedStartDate ? new Date(plannedStartDate).toISOString() : null,
        plannedEndDate: plannedEndDate ? new Date(plannedEndDate).toISOString() : null,
        notes: orderNotes,
      };

      const res = await apiClient.post<ProductionOrder>("/api/production/orders", payload);
      showToast(`Orden de producción ${res.data.orderNumber} creada exitosamente`, "success");
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Error al crear la orden de producción.";
      setModalError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenStartModal = (order: ProductionOrder) => {
    setOrderToStart(order);
    setStartError(null);
    setIsStartModalOpen(true);
  };

  const handleConfirmStart = async () => {
    if (!orderToStart) return;
    setIsStarting(true);
    setStartError(null);
    try {
      await apiClient.post(`/api/production/orders/${orderToStart.id}/start`, {});
      showToast(
        `¡Orden ${orderToStart.orderNumber} iniciada! Materiales transferidos desde ALM-001/004 a WIP en ALM-002.`,
        "success"
      );
      setIsStartModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Error al iniciar la orden de producción por falta de existencias en almacén.";
      setStartError(msg);
      showToast(msg, "error");
    } finally {
      setIsStarting(false);
    }
  };

  const handleOpenCompleteModal = (order: ProductionOrder) => {
    setOrderToComplete(order);
    setProducedQty(order.plannedQuantity);
    setScrapQty(0);
    setCompleteError(null);
    setIsCompleteModalOpen(true);
  };

  const handleConfirmComplete = async () => {
    if (!orderToComplete) return;
    setIsCompleting(true);
    setCompleteError(null);
    try {
      const payload = {
        completionDate: new Date().toISOString(),
        producedQuantity: Number(producedQty),
        scrapQuantity: Number(scrapQty),
        notes: completeNotes,
      };
      const res = await apiClient.post(`/api/production/orders/${orderToComplete.id}/complete`, payload);
      showToast(
        `¡Orden ${orderToComplete.orderNumber} completada! Se acreditó el producto terminado en ALM-003 con Lote oficial: ${res.data.finishedGoodsLotNumber}`,
        "success"
      );
      setIsCompleteModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Error al finalizar la orden de producción.";
      setCompleteError(msg);
      showToast(msg, "error");
    } finally {
      setIsCompleting(false);
    }
  };

  // Kanban Columns
  const plannedOrders = useMemo(() => orders.filter((o) => o.status === "Planificada"), [orders]);
  const inProgressOrders = useMemo(() => orders.filter((o) => o.status === "En Proceso"), [orders]);
  const completedOrders = useMemo(() => orders.filter((o) => o.status === "Completada"), [orders]);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Factory className="w-7 h-7 text-amber-500" />
            Órdenes de Producción y Control MES
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestión del piso de planta: explosión de materiales, consumo a WIP (ALM-002) e ingreso de PT (ALM-003).
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Selector de Vista Kanban / Tabla */}
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === "kanban" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="Vista Tablero Kanban"
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === "table" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="Vista Lista de Registros"
            >
              <List className="w-4 h-4" />
              Tabla
            </button>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-500" : ""}`} />
            Actualizar
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-500 shadow-md shadow-amber-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Nueva Orden de Producción
          </button>
        </div>
      </div>

      {/* Indicadores Clave de Producción */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Planificadas (En Espera)</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{plannedOrders.length}</p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">En Proceso en Planta (WIP)</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{inProgressOrders.length}</p>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
            <Factory className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Completadas (En ALM-003)</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{completedOrders.length}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm">Cargando órdenes de producción...</p>
        </div>
      ) : viewMode === "kanban" ? (
        /* TABLERO KANBAN DE ESTADOS DE PRODUCCIÓN */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMNA 1: PLANIFICADAS */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Planificadas
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs font-mono font-semibold text-amber-400">
                {plannedOrders.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[620px] pr-1">
              {plannedOrders.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No hay órdenes planificadas</p>
              ) : (
                plannedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-lg shadow-sm hover:border-slate-700 transition space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {order.orderNumber}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDetailModalOpen(true);
                        }}
                        className="text-slate-400 hover:text-white p-1"
                        title="Ver Detalles"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        [{order.itemCode}] {order.itemName}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Meta: <span className="font-bold text-white">{order.plannedQuantity} {order.unitOfMeasure}</span>
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
                      <span>Costo Est:</span>
                      <span className="text-amber-300 font-semibold">
                        C$ {order.totalEstimatedCost.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenStartModal(order)}
                      className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 shadow-sm transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Iniciar Fabricación (Consumir a WIP)
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMNA 2: EN PROCESO */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  En Proceso (Planta)
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs font-mono font-semibold text-blue-400">
                {inProgressOrders.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[620px] pr-1">
              {inProgressOrders.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No hay órdenes en proceso</p>
              ) : (
                inProgressOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 bg-slate-900 border border-blue-500/30 rounded-lg shadow-sm hover:border-blue-500/50 transition space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-blue-400">
                        {order.orderNumber}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDetailModalOpen(true);
                        }}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        [{order.itemCode}] {order.itemName}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Lote de Salida Previsto: <span className="font-mono text-blue-300 font-bold">{order.lotNumber}</span>
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
                      <span>Inicio Real:</span>
                      <span className="text-slate-300">
                        {order.actualStartDate ? new Date(order.actualStartDate).toLocaleDateString("es-NI") : "Hoy"}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenCompleteModal(order)}
                      className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 shadow-sm transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Finalizar y Dar Entrada a ALM-003
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMNA 3: COMPLETADAS */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Completadas
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs font-mono font-semibold text-emerald-400">
                {completedOrders.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[620px] pr-1">
              {completedOrders.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No hay órdenes completadas</p>
              ) : (
                completedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-lg shadow-sm hover:border-slate-700 transition space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        {order.orderNumber}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDetailModalOpen(true);
                        }}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        [{order.itemCode}] {order.itemName}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Producido: <span className="font-bold text-emerald-400">{order.producedQuantity} {order.unitOfMeasure}</span>
                      </p>
                    </div>

                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-[11px] font-mono text-emerald-300">
                      Lote en ALM-003: {order.lotNumber}
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400 pt-1 font-mono">
                      <span>Costo Real:</span>
                      <span className="text-slate-200 font-bold">
                        C$ {order.totalActualCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* VISTA DE TABLA CON TODAS LAS ÓRDENES */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">N° Orden</th>
                  <th className="px-4 py-3">Artículo Fabricado</th>
                  <th className="px-4 py-3 text-right">Cant. Planificada</th>
                  <th className="px-4 py-3 text-right">Cant. Producida</th>
                  <th className="px-4 py-3">Lote Asignado</th>
                  <th className="px-4 py-3 text-right">Costo Estimado</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-bold text-white">{o.orderNumber}</td>
                    <td className="px-4 py-3 font-sans">
                      <div className="font-semibold text-white">[{o.itemCode}]</div>
                      <div className="text-slate-400 text-[11px]">{o.itemName}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      {o.plannedQuantity} {o.unitOfMeasure}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-bold">
                      {o.producedQuantity} {o.unitOfMeasure}
                    </td>
                    <td className="px-4 py-3 text-amber-300 font-bold">
                      {o.lotNumber || "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      C$ {o.totalEstimatedCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center font-sans">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                          o.status === "Completada"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : o.status === "En Proceso"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-sans">
                      <button
                        onClick={() => {
                          setSelectedOrder(o);
                          setIsDetailModalOpen(true);
                        }}
                        className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded hover:bg-slate-700"
                        title="Ver Detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Crear Orden de Producción */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
        title="Crear Nueva Orden de Producción (MES)"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2.5 text-red-400 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
              Artículo a Fabricar (PT / SEM con Receta BOM) *
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  [{i.code}] {i.name} ({i.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
                Cantidad a Producir *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={plannedQuantity}
                onChange={(e) => setPlannedQuantity(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
                Fecha Inicio Planificada
              </label>
              <input
                type="date"
                value={plannedStartDate}
                onChange={(e) => setPlannedStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
                Fecha Fin Planificada
              </label>
              <input
                type="date"
                value={plannedEndDate}
                onChange={(e) => setPlannedEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
              Observaciones / Orden de Trabajo
            </label>
            <textarea
              rows={2}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-500 shadow-md shadow-amber-600/20 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Creando..." : "Crear Orden Planificada"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Iniciar Fabricación (Verificación y Consumo a WIP) */}
      <Modal
        isOpen={isStartModalOpen}
        onClose={() => !isStarting && setIsStartModalOpen(false)}
        title={`Iniciar Fabricación - ${orderToStart?.orderNumber || ""}`}
      >
        <div className="space-y-4">
          {startError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2.5 text-red-400 text-xs">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Bloqueo Transaccional por Falta de Stock</p>
                <p className="mt-1">{startError}</p>
              </div>
            </div>
          )}

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300 space-y-1.5">
            <p className="font-bold">Explosión de BOM y Salida a WIP (ALM-002)</p>
            <p>
              Al iniciar la orden, el sistema verificará las existencias de materias primas en ALM-001 y empaques en ALM-004.
              Si hay stock suficiente, se dará salida automática de inventario y se transferirá al Trabajo en Proceso (WIP en ALM-002).
            </p>
          </div>

          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
            <p className="text-slate-400">
              Artículo a fabricar: <span className="text-white font-semibold">{orderToStart?.itemName}</span>
            </p>
            <p className="text-slate-400">
              Meta planificada: <span className="text-white font-bold">{orderToStart?.plannedQuantity} {orderToStart?.unitOfMeasure}</span>
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              disabled={isStarting}
              onClick={() => setIsStartModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              disabled={isStarting}
              onClick={handleConfirmStart}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 shadow-md shadow-blue-600/20 transition disabled:opacity-50"
            >
              {isStarting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isStarting ? "Verificando Stock..." : "Confirmar e Iniciar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Finalizar Fabricación (Acreditación a ALM-003) */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => !isCompleting && setIsCompleteModalOpen(false)}
        title={`Finalizar Fabricación - ${orderToComplete?.orderNumber || ""}`}
      >
        <div className="space-y-4">
          {completeError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2.5 text-red-400 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{completeError}</span>
            </div>
          )}

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 space-y-1">
            <p className="font-bold">Cierre de Fabricación y Entrada a Producto Terminado</p>
            <p>
              Se dará de baja el Trabajo en Proceso (WIP en ALM-002) y se ingresarán las unidades terminadas al almacén de
              despacho ALM-003, generando el Lote Oficial correspondiente.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
                Cantidad Producida Conforme *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={producedQty}
                onChange={(e) => setProducedQty(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
                Merma / Scrap (Opcional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={scrapQty}
                onChange={(e) => setScrapQty(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
              Observaciones de Control de Calidad
            </label>
            <textarea
              rows={2}
              value={completeNotes}
              onChange={(e) => setCompleteNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              disabled={isCompleting}
              onClick={() => setIsCompleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              disabled={isCompleting}
              onClick={handleConfirmComplete}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {isCompleting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isCompleting ? "Completando..." : "Confirmar y Acreditar en ALM-003"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Detalle de Orden y Materiales Consumidos */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Detalle de OP ${selectedOrder?.orderNumber || ""}`}
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/50 p-3 rounded-lg border border-slate-800">
              <div>
                <p className="text-slate-500 uppercase font-semibold">Producto:</p>
                <p className="font-semibold text-white">
                  [{selectedOrder.itemCode}] {selectedOrder.itemName}
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Estado Actual:</p>
                <p className="font-bold text-amber-400">{selectedOrder.status}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Cantidad Planificada:</p>
                <p className="text-slate-300">
                  {selectedOrder.plannedQuantity} {selectedOrder.unitOfMeasure}
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Cantidad Producida:</p>
                <p className="text-emerald-400 font-bold">
                  {selectedOrder.producedQuantity} {selectedOrder.unitOfMeasure}
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Lote Oficial Generado:</p>
                <p className="text-amber-300 font-mono font-bold">
                  {selectedOrder.lotNumber || "Sin lote asignado"}
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Costo Real:</p>
                <p className="text-slate-200 font-mono font-bold">
                  C$ {selectedOrder.totalActualCost.toFixed(2)}
                </p>
              </div>
            </div>

            {selectedOrder.materials && selectedOrder.materials.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Materiales e Insumos Consumidos (Explosión BOM)
                </h4>
                <div className="max-h-56 overflow-y-auto space-y-2">
                  {selectedOrder.materials.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-lg text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-semibold text-white">
                          [{m.itemCode}] {m.itemName}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          Origen: {m.sourceWarehouseCode} | Lote: {m.lotNumber || "N/A"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-200">
                          {m.consumedQuantity || m.requiredQuantity} {m.unitOfMeasure}
                        </div>
                        <div className="text-[11px] text-amber-400 font-mono">
                          C$ {m.totalCost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
