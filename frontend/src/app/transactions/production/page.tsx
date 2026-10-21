"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
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
  LayoutGrid,
  List,
  Calendar,
  Boxes,
  ShieldAlert,
  Edit2,
  Send,
  Coffee,
  PlusCircle,
  Hash,
  FileText,
  Percent,
  Search,
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import apiClient from "@/lib/api";
import { ProductionOrder, Item } from "@/types";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/Modal";
import ActionTooltipButton from "@/components/ActionTooltip";

// Componente KanbanCard - Diseño Stitch UI/UX World-Class
export function KanbanCard({
  order,
  onOpenDetail,
  onOpenStart,
  onOpenComplete,
}: {
  order: ProductionOrder;
  onOpenDetail: (order: ProductionOrder) => void;
  onOpenStart: (order: ProductionOrder) => void;
  onOpenComplete: (order: ProductionOrder) => void;
}) {
  const progressPercentage = useMemo(() => {
    if (order.status === "Completada") return 100;
    if (order.status === "En Proceso") {
      if (order.plannedQuantity > 0 && order.producedQuantity > 0) {
        return Math.min(95, Math.round((order.producedQuantity / order.plannedQuantity) * 100));
      }
      return 65;
    }
    return 0;
  }, [order]);

  return (
    <div className="group bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-200 space-y-4">
      {/* Encabezado de la Tarjeta */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200/50 dark:border-slate-700/50">
            {order.lotNumber || order.orderNumber}
          </span>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border shrink-0 ${
            order.status === "Completada"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : order.status === "En Proceso"
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
          }`}
        >
          {order.status}
        </span>
      </div>

      {/* Información del Producto */}
      <div>
        <h4 className="font-bold text-base text-slate-900 dark:text-white tracking-tight leading-snug line-clamp-1">
          {order.itemName}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-amber-600 dark:text-amber-400">
            {order.itemCode}
          </span>
          <span>•</span>
          <span>Volumen: <strong className="text-slate-800 dark:text-slate-200 font-bold">{order.producedQuantity || 0}</strong> / {order.plannedQuantity} {order.unitOfMeasure}</span>
        </p>
      </div>

      {/* Barra de Progreso Minimalista */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-sans">Progreso de Fase Industrial</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">{progressPercentage}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              order.status === "Completada"
                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                : "bg-gradient-to-r from-amber-500 to-amber-400"
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Footer de Acciones con Tooltips Flotantes */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60">
        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
          OP: {order.orderNumber}
        </span>
        <div className="flex items-center gap-1">
          <ActionTooltipButton
            icon={Eye}
            tooltip="Ver Detalles y Explosión BOM"
            onClick={() => onOpenDetail(order)}
            variant="default"
          />

          {order.status === "Planificada" && (
            <ActionTooltipButton
              icon={Play}
              tooltip="Iniciar Fabricación y Transferir a WIP"
              onClick={() => onOpenStart(order)}
              variant="blue"
            />
          )}

          {order.status === "En Proceso" && (
            <ActionTooltipButton
              icon={CheckCircle2}
              tooltip="Finalizar Orden y Transferir a ALM-003"
              onClick={() => onOpenComplete(order)}
              variant="success"
            />
          )}

          <Link href="/mes/execution">
            <ActionTooltipButton
              icon={Send}
              tooltip="Abrir Estación de Piso de Planta (MES)"
              onClick={() => {}}
              variant="amber"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Componente ProductionSkeleton - Animado y Estructurado
export function ProductionSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
      {[1, 2, 3].map((col) => (
        <div key={col} className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-32" />
            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-8" />
          </div>
          {[1, 2].map((card) => (
            <div
              key={card}
              className="bg-white/60 dark:bg-[#161821]/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-28" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full w-20" />
              </div>
              <div className="space-y-2">
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-4/5" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full w-full" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16" />
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-20" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Componente ProductionEmptyState - Con Ilustración Sutil y Botón de Acción
export function ProductionEmptyState({
  onCreateNew,
}: {
  onCreateNew: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[480px] p-12 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-[#11131a]/40 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/10 to-amber-500/5 text-amber-500 border border-amber-500/20 flex items-center justify-center mb-6 shadow-xl shadow-amber-500/5">
        <Coffee className="w-10 h-10" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-heading">
        No hay órdenes de producción activas
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md leading-relaxed">
        Comienza creando una nueva orden de trabajo para desplegar la explosión de materiales (BOM), la ruta técnica en 8 estaciones y el control de calidad.
      </p>
      <button
        onClick={onCreateNew}
        className="mt-8 flex items-center gap-2.5 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-all shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer"
      >
        <PlusCircle className="w-4 h-4" />
        <span>Crear Nueva Orden de Producción</span>
      </button>
    </div>
  );
}

export default function ProductionOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [searchTerm, setSearchTerm] = useState("");

  // Create Order Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | "">("");
  const [plannedQuantity, setPlannedQuantity] = useState<number>(10);
  const [plannedStartDate, setPlannedStartDate] = useState<string>("");
  const [plannedEndDate, setPlannedEndDate] = useState<string>("");
  const [orderNotes, setOrderNotes] = useState<string>(
    "Fabricación de lote estándar de sustrato orgánico compostable."
  );
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
  const [completeNotes, setCompleteNotes] = useState<string>(
    "Fabricación finalizada y conforme en inspección técnica RO-5."
  );
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
      const manufacturable = itemsRes.data.filter(
        (i) => i.isActive && (i.category === "PT" || i.category === "SEM")
      );
      setItems(manufacturable);
    } catch {
      showToast("Error al cargar órdenes de producción desde el ERP", "error");
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
        `¡Orden ${orderToStart.orderNumber} iniciada! Materiales transferidos a WIP en ALM-002.`,
        "success"
      );
      setIsStartModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Error al iniciar la orden por falta de existencias de materias primas.";
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
      const res = await apiClient.post(
        `/api/production/orders/${orderToComplete.id}/complete`,
        payload
      );
      showToast(
        `¡Orden ${orderToComplete.orderNumber} completada! Lote Oficial emitido: ${res.data.finishedGoodsLotNumber}`,
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

  // Filtered orders
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    const q = searchTerm.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.lotNumber && o.lotNumber.toLowerCase().includes(q)) ||
        o.itemName.toLowerCase().includes(q) ||
        o.itemCode.toLowerCase().includes(q)
    );
  }, [orders, searchTerm]);

  // Kanban Columns
  const plannedOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === "Planificada"),
    [filteredOrders]
  );
  const inProgressOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === "En Proceso"),
    [filteredOrders]
  );
  const completedOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === "Completada"),
    [filteredOrders]
  );

  return (
    <div className="space-y-8 p-2 md:p-4">
      {/* Encabezado Principal y Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Operaciones Industriales • MES
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Total: {orders.length} órdenes registradas
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2 font-heading">
            Centro de Control de Producción
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Orquestación en tiempo real: balance de masas, consumo a WIP (ALM-002), ejecución de ruta técnica y acreditación a Producto Terminado (ALM-003).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Vista Kanban / Tabla */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/80">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>DataGrid</span>
            </button>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            title="Recargar órdenes de producción"
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#161821] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-500" : ""}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Orden</span>
          </button>
        </div>
      </div>

      {/* Indicadores Clave de Producción - Tarjetas Minimalistas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">
              Planificadas (En Espera)
            </p>
            <p className="text-3xl font-extrabold text-amber-500 mt-2 font-mono">
              {plannedOrders.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Órdenes listas para arranque</p>
          </div>
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500">
            <Clock className="w-7 h-7" />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">
              En Proceso en Planta (WIP)
            </p>
            <p className="text-3xl font-extrabold text-blue-500 mt-2 font-mono">
              {inProgressOrders.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Biomasa en ALM-002 activo</p>
          </div>
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-500">
            <Factory className="w-7 h-7" />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">
              Completadas (ALM-003)
            </p>
            <p className="text-3xl font-extrabold text-emerald-500 mt-2 font-mono">
              {completedOrders.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Lotes liberados y en stock</p>
          </div>
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500">
            <CheckCircle2 className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por lote, N° de orden o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div className="text-xs font-mono text-slate-400 hidden sm:block">
          Mostrando {filteredOrders.length} de {orders.length}
        </div>
      </div>

      {/* Contenido Dinámico: Skeleton, Empty State o Visualización */}
      {loading ? (
        <ProductionSkeleton />
      ) : orders.length === 0 ? (
        <ProductionEmptyState onCreateNew={handleOpenCreateModal} />
      ) : viewMode === "kanban" ? (
        /* TABLERO KANBAN DE ALTO IMPACTO */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUMNA 1: PLANIFICADAS */}
          <div className="bg-slate-100/60 dark:bg-[#11131a]/60 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 flex flex-col">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-heading">
                  Planificadas
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-xs font-mono font-bold text-amber-500 border border-slate-200 dark:border-slate-700">
                {plannedOrders.length}
              </span>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-[640px] pr-1">
              {plannedOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No hay órdenes en espera
                </div>
              ) : (
                plannedOrders.map((order) => (
                  <KanbanCard
                    key={order.id}
                    order={order}
                    onOpenDetail={setSelectedOrder}
                    onOpenStart={handleOpenStartModal}
                    onOpenComplete={handleOpenCompleteModal}
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMNA 2: EN PROCESO (WIP) */}
          <div className="bg-slate-100/60 dark:bg-[#11131a]/60 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 flex flex-col">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-heading">
                  En Proceso (WIP ALM-002)
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-xs font-mono font-bold text-blue-500 border border-slate-200 dark:border-slate-700">
                {inProgressOrders.length}
              </span>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-[640px] pr-1">
              {inProgressOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No hay órdenes en ejecución
                </div>
              ) : (
                inProgressOrders.map((order) => (
                  <KanbanCard
                    key={order.id}
                    order={order}
                    onOpenDetail={setSelectedOrder}
                    onOpenStart={handleOpenStartModal}
                    onOpenComplete={handleOpenCompleteModal}
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMNA 3: COMPLETADAS */}
          <div className="bg-slate-100/60 dark:bg-[#11131a]/60 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 flex flex-col">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-heading">
                  Completadas (ALM-003)
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-xs font-mono font-bold text-emerald-500 border border-slate-200 dark:border-slate-700">
                {completedOrders.length}
              </span>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-[640px] pr-1">
              {completedOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No hay órdenes completadas
                </div>
              ) : (
                completedOrders.map((order) => (
                  <KanbanCard
                    key={order.id}
                    order={order}
                    onOpenDetail={setSelectedOrder}
                    onOpenStart={handleOpenStartModal}
                    onOpenComplete={handleOpenCompleteModal}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* VISTA DE TABLA DATAGRID */
        <div className="bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-[#11131a] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-4">N° Orden</th>
                  <th className="px-5 py-4">Artículo Fabricado</th>
                  <th className="px-5 py-4 text-right">Cant. Planificada</th>
                  <th className="px-5 py-4 text-right">Cant. Producida</th>
                  <th className="px-5 py-4">Lote Oficial</th>
                  <th className="px-5 py-4 text-right">Costo Estimado</th>
                  <th className="px-5 py-4 text-center">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {filteredOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                      {o.orderNumber}
                    </td>
                    <td className="px-5 py-4 font-sans">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        [{o.itemCode}]
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {o.itemName}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-slate-800 dark:text-white">
                      {o.plannedQuantity} {o.unitOfMeasure}
                    </td>
                    <td className="px-5 py-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                      {o.producedQuantity} {o.unitOfMeasure}
                    </td>
                    <td className="px-5 py-4 text-amber-600 dark:text-amber-400 font-bold">
                      {o.lotNumber || "—"}
                    </td>
                    <td className="px-5 py-4 text-right text-slate-600 dark:text-slate-300">
                      C$ {o.totalEstimatedCost.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-center font-sans">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${
                          o.status === "Completada"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : o.status === "En Proceso"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <ActionTooltipButton
                          icon={Eye}
                          tooltip="Ver Detalle"
                          onClick={() => {
                            setSelectedOrder(o);
                            setIsDetailModalOpen(true);
                          }}
                          variant="default"
                        />
                        {o.status === "Planificada" && (
                          <ActionTooltipButton
                            icon={Play}
                            tooltip="Iniciar Fabricación"
                            onClick={() => handleOpenStartModal(o)}
                            variant="blue"
                          />
                        )}
                        {o.status === "En Proceso" && (
                          <ActionTooltipButton
                            icon={CheckCircle2}
                            tooltip="Finalizar Orden"
                            onClick={() => handleOpenCompleteModal(o)}
                            variant="success"
                          />
                        )}
                        <Link href="/mes/execution">
                          <ActionTooltipButton
                            icon={Send}
                            tooltip="Ejecutar Operación MES"
                            onClick={() => {}}
                            variant="amber"
                          />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Crear Orden de Producción (Sin etiquetas <label>, solo placeholders con iconos) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
        title="Crear Nueva Orden de Producción (MES)"
        description="Seleccione el artículo a fabricar y la cantidad requerida."
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          {modalError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-500 dark:text-rose-400 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="relative">
            <Boxes className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(Number(e.target.value))}
              className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            >
              <option value="" disabled>
                Seleccione Artículo a Fabricar (PT / SEM) *
              </option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  [{i.code}] {i.name} ({i.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Hash className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="number"
                step="0.01"
                min="0.1"
                placeholder="Cantidad a producir *"
                value={plannedQuantity}
                onChange={(e) => setPlannedQuantity(parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white font-mono"
                required
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                title="Fecha Inicio Planificada"
                placeholder="Fecha Inicio"
                value={plannedStartDate}
                onChange={(e) => setPlannedStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                title="Fecha Fin Planificada"
                placeholder="Fecha Fin"
                value={plannedEndDate}
                onChange={(e) => setPlannedEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="relative">
            <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <textarea
              rows={2}
              placeholder="Observaciones / Orden de Trabajo (especificaciones técnicas)..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsCreateModalOpen(false)}
              className="px-5 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-2xl shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Creando..." : "Crear Orden Planificada"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Iniciar Fabricación (Sin etiquetas <label>) */}
      <Modal
        isOpen={isStartModalOpen}
        onClose={() => !isStarting && setIsStartModalOpen(false)}
        title={`Iniciar Fabricación - ${orderToStart?.orderNumber || ""}`}
        description="Verificación de existencias de materias primas y explosión BOM."
      >
        <div className="space-y-4">
          {startError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-500 dark:text-rose-400 text-xs">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Bloqueo Transaccional por Falta de Stock</p>
                <p className="mt-1">{startError}</p>
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-600 dark:text-blue-300 space-y-1.5">
            <p className="font-bold">Explosión de BOM y Salida a WIP (ALM-002)</p>
            <p>
              Al iniciar la orden, el sistema verificará las existencias de materias primas en ALM-001 y empaques en ALM-004.
              Si hay stock suficiente, se dará salida automática de inventario y se transferirá al Trabajo en Proceso (WIP en ALM-002).
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
            <p className="text-slate-500 dark:text-slate-400">
              Artículo a fabricar: <span className="text-slate-900 dark:text-white font-semibold">{orderToStart?.itemName}</span>
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              Meta planificada: <span className="text-slate-900 dark:text-white font-bold">{orderToStart?.plannedQuantity} {orderToStart?.unitOfMeasure}</span>
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              disabled={isStarting}
              onClick={() => setIsStartModalOpen(false)}
              className="px-5 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              disabled={isStarting}
              onClick={handleConfirmStart}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-2xl shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isStarting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isStarting ? "Verificando Stock..." : "Confirmar e Iniciar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Finalizar Fabricación (Sin etiquetas <label>) */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => !isCompleting && setIsCompleteModalOpen(false)}
        title={`Finalizar Fabricación - ${orderToComplete?.orderNumber || ""}`}
        description="Acreditación de producto terminado al almacén ALM-003."
      >
        <div className="space-y-4">
          {completeError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-500 dark:text-rose-400 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{completeError}</span>
            </div>
          )}

          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-600 dark:text-emerald-300 space-y-1">
            <p className="font-bold">Cierre de Fabricación y Entrada a Producto Terminado</p>
            <p>
              Se dará de baja el Trabajo en Proceso (WIP en ALM-002) y se ingresarán las unidades terminadas al almacén de
              despacho ALM-003, generando el Lote Oficial correspondiente.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Hash className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="number"
                step="0.01"
                min="0.1"
                placeholder="Cantidad producida conforme *"
                value={producedQty}
                onChange={(e) => setProducedQty(parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white font-mono font-bold"
                required
              />
            </div>
            <div className="relative">
              <Percent className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Merma / Scrap (opcional)"
                value={scrapQty}
                onChange={(e) => setScrapQty(parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="relative">
            <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <textarea
              rows={2}
              placeholder="Observaciones de Control de Calidad y Cierre de Orden..."
              value={completeNotes}
              onChange={(e) => setCompleteNotes(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              disabled={isCompleting}
              onClick={() => setIsCompleteModalOpen(false)}
              className="px-5 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              disabled={isCompleting}
              onClick={handleConfirmComplete}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
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
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-slate-500 uppercase font-semibold">Producto:</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  [{selectedOrder.itemCode}] {selectedOrder.itemName}
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Estado Actual:</p>
                <p className="font-bold text-amber-500">{selectedOrder.status}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Cantidad Planificada:</p>
                <p className="text-slate-700 dark:text-slate-300">
                  {selectedOrder.plannedQuantity} {selectedOrder.unitOfMeasure}
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Cantidad Producida:</p>
                <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {selectedOrder.producedQuantity} {selectedOrder.unitOfMeasure}
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Lote Oficial Generado:</p>
                <p className="text-amber-600 dark:text-amber-300 font-mono font-bold">
                  {selectedOrder.lotNumber || "Sin lote asignado"}
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Costo Real:</p>
                <p className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                  C$ {selectedOrder.totalActualCost.toFixed(2)}
                </p>
              </div>
            </div>

            {selectedOrder.materials && selectedOrder.materials.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                  Materiales e Insumos Consumidos (Explosión BOM)
                </h4>
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {selectedOrder.materials.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          [{m.itemCode}] {m.itemName}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                          Origen: {m.sourceWarehouseCode} | Lote: {m.lotNumber || "N/A"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {m.consumedQuantity || m.requiredQuantity} {m.unitOfMeasure}
                        </div>
                        <div className="text-[11px] text-amber-500 font-mono">
                          C$ {m.totalCost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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
