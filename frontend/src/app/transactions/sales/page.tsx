"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Truck,
  Plus,
  Search,
  PackageCheck,
  Eye,
  Loader2,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  AlertCircle,
  RefreshCw,
  Boxes,
  FileText,
  ShieldAlert,
  X,
  Hash,
  Coins,
} from "lucide-react";
import apiClient from "@/lib/api";
import { SalesOrder, Customer, Item } from "@/types";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/Modal";
import ActionTooltipButton from "@/components/ActionTooltip";

interface DispatchedLotAllocation {
  itemCode: string;
  itemName: string;
  lotNumber: string;
  allocatedQuantity: number;
  warehouseCode: string;
  unitCost: number;
  totalCost: number;
}

interface DispatchSuccessResult {
  orderNumber: string;
  customerName: string;
  dispatchedDate: string;
  totalDispatchedQuantity: number;
  allocatedLots: DispatchedLotAllocation[];
  remainingStockInWarehouse: number;
}

export default function SalesPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create Order Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [orderLines, setOrderLines] = useState<
    { itemId: number | ""; quantity: number; unitPrice: number; unitOfMeasure: string }[]
  >([{ itemId: "", quantity: 5, unitPrice: 140, unitOfMeasure: "bolsa" }]);

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Dispatch Modal State (FIFO Confirmation)
  const [orderToDispatch, setOrderToDispatch] = useState<SalesOrder | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchNotes, setDispatchNotes] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Result FIFO Modal
  const [dispatchResult, setDispatchResult] = useState<DispatchSuccessResult | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, customersRes, itemsRes] = await Promise.all([
        apiClient.get<SalesOrder[]>("/api/sales"),
        apiClient.get<Customer[]>("/api/customers"),
        apiClient.get<Item[]>("/api/items"),
      ]);
      setOrders(ordersRes.data);
      setCustomers(customersRes.data.filter((c) => c.isActive));
      // Filtrar items comercializables (PT)
      setItems(itemsRes.data.filter((i) => i.isActive && i.category === "PT"));
    } catch {
      showToast("Error al cargar datos del módulo de ventas", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const handleOpenCreateModal = () => {
    setSelectedCustomerId(customers.length > 0 ? customers[0].id : "");
    setDeliveryDate(new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]);
    setOrderNotes("Pedido comercial de sustrato compostable.");
    const ptItem = items.find((i) => i.code === "PT-001") || items[0];
    if (ptItem) {
      setOrderLines([
        {
          itemId: ptItem.id,
          quantity: 20,
          unitPrice: 140.0,
          unitOfMeasure: ptItem.unitOfMeasure || "bolsa",
        },
      ]);
    } else {
      setOrderLines([{ itemId: "", quantity: 5, unitPrice: 140, unitOfMeasure: "bolsa" }]);
    }
    setModalError(null);
    setIsCreateModalOpen(true);
  };

  const handleItemChangeInLine = (index: number, itemId: number) => {
    const foundItem = items.find((i) => i.id === itemId);
    const updated = [...orderLines];
    updated[index].itemId = itemId;
    if (foundItem) {
      updated[index].unitOfMeasure = foundItem.unitOfMeasure;
    }
    setOrderLines(updated);
  };

  const handleAddLine = () => {
    const ptItem = items[0];
    setOrderLines([
      ...orderLines,
      {
        itemId: ptItem ? ptItem.id : "",
        quantity: 10,
        unitPrice: 140.0,
        unitOfMeasure: ptItem ? ptItem.unitOfMeasure : "bolsa",
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (orderLines.length === 1) return;
    setOrderLines(orderLines.filter((_, i) => i !== index));
  };

  const calculateTotalOrder = () => {
    return orderLines.reduce((acc, curr) => acc + (curr.quantity || 0) * (curr.unitPrice || 0), 0);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setModalError("Debe seleccionar un cliente válido.");
      return;
    }

    const invalidLine = orderLines.find((l) => !l.itemId || l.quantity <= 0);
    if (invalidLine) {
      setModalError("Todas las líneas deben tener un producto válido y cantidad mayor a 0.");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const payload = {
        customerId: Number(selectedCustomerId),
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : null,
        notes: orderNotes,
        lines: orderLines.map((l) => ({
          itemId: Number(l.itemId),
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
        })),
      };

      const res = await apiClient.post<SalesOrder>("/api/sales", payload);
      showToast(`Orden de venta ${res.data.orderNumber} confirmada exitosamente`, "success");
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Error al crear la orden de venta.";
      setModalError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDispatchModal = (order: SalesOrder) => {
    setOrderToDispatch(order);
    setDispatchNotes(`Despacho FIFO para el cliente ${order.customerName}.`);
    setDispatchError(null);
    setIsDispatchModalOpen(true);
  };

  const handleConfirmDispatch = async () => {
    if (!orderToDispatch) return;
    setIsDispatching(true);
    setDispatchError(null);
    try {
      const res = await apiClient.post<DispatchSuccessResult>(
        `/api/sales/${orderToDispatch.id}/dispatch`,
        { notes: dispatchNotes }
      );
      showToast(
        `¡Orden ${orderToDispatch.orderNumber} despachada con éxito! Lotes asignados según política FIFO.`,
        "success"
      );
      setIsDispatchModalOpen(false);
      setDispatchResult(res.data);
      setIsResultModalOpen(true);
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Error al ejecutar el despacho por existencias insuficientes en almacén ALM-003.";
      setDispatchError(msg);
      showToast(msg, "error");
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Flujo Transaccional • M3
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Total: {filteredOrders.length} pedidos
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Órdenes de Venta y Despacho (FIFO)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Validación de stock en ALM-003, asignación automática de lotes según antigüedad (FIFO) y salida comercial en Kardex.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            title="Recargar órdenes"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-500" : ""}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-md shadow-amber-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Orden de Venta</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="p-4 bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
              Órdenes por Despachar
            </p>
            <p className="text-2xl font-bold text-amber-500">
              {orders.filter((o) => o.status === "Confirmada").length}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
              Despachadas con Éxito
            </p>
            <p className="text-2xl font-bold text-emerald-500">
              {orders.filter((o) => o.status === "Despachada").length}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-500">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
              Facturación Total Ventas
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              C$ {orders.reduce((acc, o) => acc + o.totalAmount, 0).toLocaleString("es-NI", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, N° orden..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="Confirmada">Confirmadas (Pendientes)</option>
            <option value="Despachada">Despachadas</option>
            <option value="Cancelada">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Tabla de Órdenes de Venta */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#161821] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm">Cargando órdenes de venta...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Truck className="w-12 h-12 mx-auto text-slate-400 mb-3" />
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No hay órdenes de venta registradas
            </p>
            <p className="text-xs mt-1 text-slate-500">
              Crea un nuevo pedido de cliente para comercializar producto terminado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#11131a] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">N° Orden</th>
                  <th className="px-4 py-3.5">Cliente</th>
                  <th className="px-4 py-3.5">Fecha Pedido</th>
                  <th className="px-4 py-3.5">Fecha Despacho</th>
                  <th className="px-4 py-3.5 text-right">Líneas</th>
                  <th className="px-4 py-3.5 text-right">Monto Total</th>
                  <th className="px-4 py-3.5 text-center">Estado</th>
                  <th className="px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {filteredOrders.map((order) => {
                  const isDispatched = order.status === "Despachada";
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3.5 font-bold font-mono text-slate-900 dark:text-white">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-900 dark:text-slate-200">
                          {order.customerName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {order.customerCode}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                        {new Date(order.orderDate).toLocaleDateString("es-NI")}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                        {order.dispatchedDate
                          ? new Date(order.dispatchedDate).toLocaleString("es-NI")
                          : "Pendiente"}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-slate-600 dark:text-slate-300">
                        {order.linesCount}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold font-mono text-amber-600 dark:text-amber-400">
                        C$ {order.totalAmount.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                            isDispatched
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : order.status === "Cancelada"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {isDispatched ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ActionTooltipButton
                            icon={Eye}
                            tooltip="Ver Detalle y Lotes"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailModalOpen(true);
                            }}
                            variant="default"
                          />
                          {order.status === "Confirmada" && (
                            <ActionTooltipButton
                              icon={PackageCheck}
                              tooltip="Despachar Pedido (FIFO)"
                              onClick={() => handleOpenDispatchModal(order)}
                              variant="success"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Crear Nueva Orden de Venta (Sin etiquetas <label>) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
        title="Crear Nueva Orden de Venta (Cliente)"
        description="Seleccione el cliente comercial y los productos terminados a despachar."
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-500 dark:text-rose-400 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              >
                <option value="" disabled>Seleccione Cliente *</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="date"
                title="Fecha Estimada de Entrega"
                placeholder="Fecha Estimada Entrega"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <textarea
              rows={2}
              placeholder="Notas u observaciones del pedido (destino, contacto en recepción)..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Sección de Líneas de Venta */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                Productos Terminados a Despachar
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Línea
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {orderLines.map((line, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 p-2 bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl items-center text-xs"
                >
                  <div className="col-span-5 relative">
                    <select
                      value={line.itemId}
                      onChange={(e) => handleItemChangeInLine(idx, Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      required
                    >
                      <option value="" disabled>Seleccione producto...</option>
                      {items.map((it) => (
                        <option key={it.id} value={it.id}>
                          [{it.code}] {it.name} ({it.unitOfMeasure})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      placeholder="Cantidad"
                      value={line.quantity}
                      onChange={(e) => {
                        const updated = [...orderLines];
                        updated[idx].quantity = parseFloat(e.target.value) || 0;
                        setOrderLines(updated);
                      }}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white text-right font-mono"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Precio Unit."
                      value={line.unitPrice}
                      onChange={(e) => {
                        const updated = [...orderLines];
                        updated[idx].unitPrice = parseFloat(e.target.value) || 0;
                        setOrderLines(updated);
                      }}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white text-right font-mono"
                      required
                    />
                  </div>
                  <div className="col-span-2 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                    C$ {((line.quantity || 0) * (line.unitPrice || 0)).toFixed(2)}
                  </div>
                  <div className="col-span-1 text-center">
                    {orderLines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                        title="Quitar línea"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center px-3 py-2 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-300">Total del Pedido:</span>
              <span className="text-amber-600 dark:text-amber-400 text-sm font-mono font-bold">
                C$ {calculateTotalOrder().toLocaleString("es-NI", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Confirmando..." : "Confirmar Orden de Venta"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Despacho FIFO con Validación Estricta (Sin etiquetas <label>) */}
      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => !isDispatching && setIsDispatchModalOpen(false)}
        title={`Despachar Orden de Venta - ${orderToDispatch?.orderNumber || ""}`}
        description="Salida comercial con asignación automática de lotes según política FIFO."
      >
        <div className="space-y-4">
          {dispatchError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-500 dark:text-rose-400 text-xs">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Bloqueo de Despacho: Stock Insuficiente en ALM-003</p>
                <p className="mt-1">{dispatchError}</p>
              </div>
            </div>
          )}

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-300 text-xs flex gap-2.5">
            <Boxes className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Algoritmo FIFO (First-In, First-Out)</p>
              <p className="mt-1">
                El sistema descontará automáticamente las cantidades solicitadas de los lotes de Producto Terminado más antiguos
                en existencia dentro de ALM-003, generando la correspondiente salida comercial en el Kardex inmutable.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
            <p className="text-slate-500 dark:text-slate-400">
              Cliente: <span className="text-slate-900 dark:text-white font-semibold">{orderToDispatch?.customerName}</span>
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              Monto a Facturar:{" "}
              <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">
                C$ {orderToDispatch?.totalAmount.toFixed(2)}
              </span>
            </p>
          </div>

          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <textarea
              rows={2}
              placeholder="Observaciones de entrega, transporte y despacho físico..."
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              disabled={isDispatching}
              onClick={() => setIsDispatchModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              disabled={isDispatching}
              onClick={handleConfirmDispatch}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isDispatching && <Loader2 className="w-4 h-4 animate-spin" />}
              {isDispatching ? "Verificando Stock FIFO..." : "Confirmar Despacho Físico"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Resultado Exitoso de Despacho FIFO */}
      <Modal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        title="Despacho Ejecutado Exitosamente"
      >
        {dispatchResult && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">Despacho procesado para {dispatchResult.orderNumber}</p>
                <p className="mt-0.5">Cliente: {dispatchResult.customerName}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                Lotes Asignados por FIFO y Descontados de ALM-003:
              </h4>
              <div className="space-y-2">
                {dispatchResult.allocatedLots.map((alloc, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white font-mono">
                        Lote: {alloc.lotNumber}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                        [{alloc.itemCode}] {alloc.itemName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {alloc.allocatedQuantity} unidades
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Costo: C$ {alloc.totalCost.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex justify-between items-center text-xs">
              <span className="text-slate-600 dark:text-slate-400">Stock Remanente en ALM-003:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                {dispatchResult.remainingStockInWarehouse.toFixed(2)} bolsas
              </span>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsResultModalOpen(false)}
                className="px-5 py-2 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Detalle de Orden de Venta */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Detalle de Orden ${selectedOrder?.orderNumber || ""}`}
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-slate-500 uppercase font-semibold">Cliente:</p>
                <p className="font-medium text-slate-900 dark:text-slate-200">
                  {selectedOrder.customerName} ({selectedOrder.customerCode})
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Estado:</p>
                <p className="font-medium text-amber-500">{selectedOrder.status}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Fecha Pedido:</p>
                <p className="text-slate-700 dark:text-slate-300">
                  {new Date(selectedOrder.orderDate).toLocaleString("es-NI")}
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Fecha Despacho:</p>
                <p className="text-slate-700 dark:text-slate-300">
                  {selectedOrder.dispatchedDate
                    ? new Date(selectedOrder.dispatchedDate).toLocaleString("es-NI")
                    : "Pendiente"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                Líneas del Pedido y Lotes Asignados por FIFO
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {selectedOrder.lines.map((l) => (
                  <div
                    key={l.id}
                    className="p-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        [{l.itemCode}] {l.itemName}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                        Cantidad: {l.quantity} {l.unitOfMeasure} × C$ {l.unitPrice.toFixed(2)}
                      </div>
                      {l.assignedLotNumber && (
                        <div className="mt-1 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Lote FIFO Despachado: {l.assignedLotNumber}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        C$ {l.subtotal.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Despachado: {l.dispatchedQuantity} {l.unitOfMeasure}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
