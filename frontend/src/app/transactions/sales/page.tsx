"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  Building2,
  Boxes,
  ShieldAlert,
  ArrowUpRight,
  PackageCheck,
} from "lucide-react";
import apiClient from "@/lib/api";
import { SalesOrder, Customer, Item } from "@/types";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/Modal";

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
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [orderLines, setOrderLines] = useState<
    { itemId: number | ""; quantity: number; unitPrice: number; unitOfMeasure: string }[]
  >([{ itemId: "", quantity: 5, unitPrice: 0, unitOfMeasure: "bolsa" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Dispatch Modal State
  const [orderToDispatch, setOrderToDispatch] = useState<SalesOrder | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchNotes, setDispatchNotes] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Dispatch Success Summary Modal
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
      // Productos vendibles (PT)
      setItems(itemsRes.data.filter((i) => i.isActive && i.category === "PT"));
    } catch {
      showToast("Error al cargar pedidos de venta", "error");
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
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    setDeliveryDate(tomorrow);
    setOrderNotes("Pedido comercial de producto terminado.");
    const ptItem = items.find((i) => i.code === "PT-001") || items[0];
    if (ptItem) {
      setOrderLines([
        {
          itemId: ptItem.id,
          quantity: 5,
          unitPrice: ptItem.standardCost > 0 ? ptItem.standardCost : 75,
          unitOfMeasure: ptItem.unitOfMeasure || "bolsa",
        },
      ]);
    } else {
      setOrderLines([{ itemId: "", quantity: 1, unitPrice: 0, unitOfMeasure: "bolsa" }]);
    }
    setModalError(null);
    setIsCreateModalOpen(true);
  };

  const handleItemChangeInLine = (index: number, itemId: number) => {
    const foundItem = items.find((i) => i.id === itemId);
    const updated = [...orderLines];
    updated[index].itemId = itemId;
    if (foundItem) {
      updated[index].unitPrice = foundItem.standardCost > 0 ? foundItem.standardCost : foundItem.cost * 1.35;
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
        quantity: 5,
        unitPrice: ptItem ? (ptItem.standardCost > 0 ? ptItem.standardCost : 75) : 0,
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
      setModalError("Debe seleccionar un cliente.");
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
          unitOfMeasure: l.unitOfMeasure,
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
    setDispatchNotes(`Despacho con FIFO para entrega al cliente ${order.customerName}.`);
    setDispatchError(null);
    setIsDispatchModalOpen(true);
  };

  const handleConfirmDispatch = async () => {
    if (!orderToDispatch) return;
    setIsDispatching(true);
    setDispatchError(null);

    try {
      const payload = {
        dispatchDate: new Date().toISOString(),
        notes: dispatchNotes,
      };

      const res = await apiClient.post(`/api/sales/${orderToDispatch.id}/dispatch`, payload);
      showToast(
        `¡Orden ${orderToDispatch.orderNumber} despachada con éxito! Lotes FIFO asignados y salida registrada en Kardex.`,
        "success"
      );
      setIsDispatchModalOpen(false);
      setDispatchResult(res.data);
      setIsResultModalOpen(true);
      fetchData();
    } catch (err: unknown) {
      const errorData = (err as { response?: { data?: { message?: string; availableQuantity?: number; requiredQuantity?: number } } }).response?.data;
      const msg = errorData?.message || "Error al procesar el despacho por falta de existencias físicas en ALM-003.";
      setDispatchError(msg);
      showToast(msg, "error");
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-amber-500" />
            Órdenes de Venta y Despacho (FIFO)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Validación de stock en ALM-003, asignación automática de lotes según antigüedad (FIFO) y salida comercial en Kardex.
          </p>
        </div>
        <div className="flex items-center gap-3">
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
            Nueva Orden de Venta
          </button>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Órdenes por Despachar</p>
            <p className="text-2xl font-bold text-amber-400">
              {orders.filter((o) => o.status === "Confirmada").length}
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Despachadas con Éxito</p>
            <p className="text-2xl font-bold text-emerald-400">
              {orders.filter((o) => o.status === "Despachada").length}
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Facturación Total Ventas</p>
            <p className="text-2xl font-bold text-white">
              C$ {orders.reduce((acc, o) => acc + o.totalAmount, 0).toLocaleString("es-NI", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, N° orden..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-400">Estado:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="Confirmada">Confirmadas (Pendientes)</option>
            <option value="Despachada">Despachadas</option>
            <option value="Cancelada">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Tabla de Órdenes de Venta */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm">Cargando órdenes de venta...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Truck className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="text-base font-semibold text-slate-300">No hay órdenes de venta registradas</p>
            <p className="text-sm mt-1">Crea un nuevo pedido de cliente para comercializar producto terminado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">N° Orden</th>
                  <th className="px-4 py-3.5">Cliente</th>
                  <th className="px-4 py-3.5">Fecha Pedido</th>
                  <th className="px-4 py-3.5">Fecha Despacho</th>
                  <th className="px-4 py-3.5 text-right">Líneas</th>
                  <th className="px-4 py-3.5 text-right">Monto Total</th>
                  <th className="px-4 py-3.5 text-center">Estado</th>
                  <th className="px-4 py-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredOrders.map((order) => {
                  const isDispatched = order.status === "Despachada";
                  return (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-semibold text-white font-mono">{order.orderNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">{order.customerName}</div>
                        <div className="text-xs text-slate-500 font-mono">{order.customerCode}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(order.orderDate).toLocaleDateString("es-NI")}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {order.dispatchedDate
                          ? new Date(order.dispatchedDate).toLocaleString("es-NI")
                          : "Pendiente de despacho"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">
                        {order.linesCount}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-400 font-mono">
                        C$ {order.totalAmount.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            isDispatched
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : order.status === "Cancelada"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
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
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition"
                            title="Ver Detalle y Lotes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {order.status === "Confirmada" && (
                            <button
                              onClick={() => handleOpenDispatchModal(order)}
                              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition"
                              title="Despachar Pedido mediante FIFO"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              Despachar FIFO
                            </button>
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

      {/* Modal: Crear Nueva Orden de Venta */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
        title="Crear Nueva Orden de Venta (Cliente)"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2.5 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
                Cliente *
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
                Fecha Estimada Entrega
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
              Notas u Observaciones del Pedido
            </label>
            <textarea
              rows={2}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Sección de Líneas de Venta */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Productos Terminados a Despachar
              </label>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Línea
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {orderLines.map((line, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 p-2 bg-slate-950/60 border border-slate-800 rounded-lg items-center text-xs"
                >
                  <div className="col-span-5">
                    <select
                      value={line.itemId}
                      onChange={(e) => handleItemChangeInLine(idx, Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                      required
                    >
                      <option value="">Seleccione producto...</option>
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
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white text-right font-mono"
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
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white text-right font-mono"
                      required
                    />
                  </div>
                  <div className="col-span-2 text-right font-mono font-semibold text-slate-200">
                    C$ {((line.quantity || 0) * (line.unitPrice || 0)).toFixed(2)}
                  </div>
                  <div className="col-span-1 text-center">
                    {orderLines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="text-red-400 hover:text-red-300 font-bold"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center px-3 py-2 bg-slate-800/60 rounded-lg text-sm font-semibold">
              <span className="text-slate-300">Total del Pedido:</span>
              <span className="text-amber-400 text-base font-mono">
                C$ {calculateTotalOrder().toLocaleString("es-NI", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-500 shadow-md shadow-amber-600/20 transition disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Confirmando..." : "Confirmar Orden de Venta"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Despacho FIFO con Validación Estricta */}
      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => !isDispatching && setIsDispatchModalOpen(false)}
        title={`Despachar Orden de Venta - ${orderToDispatch?.orderNumber || ""}`}
      >
        <div className="space-y-4">
          {dispatchError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2.5 text-red-400 text-xs">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Bloqueo de Despacho: Stock Insuficiente en ALM-003</p>
                <p className="mt-1">{dispatchError}</p>
              </div>
            </div>
          )}

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs flex gap-2.5">
            <Boxes className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Algoritmo FIFO (First-In, First-Out)</p>
              <p className="mt-1">
                El sistema descontará automáticamente las cantidades solicitadas de los lotes de Producto Terminado más antiguos
                en existencia dentro de ALM-003, generando la correspondiente salida comercial en el Kardex inmutable.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
            <p className="text-slate-400">
              Cliente: <span className="text-white font-semibold">{orderToDispatch?.customerName}</span>
            </p>
            <p className="text-slate-400">
              Monto a Facturar:{" "}
              <span className="text-amber-400 font-mono font-bold">
                C$ {orderToDispatch?.totalAmount.toFixed(2)}
              </span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
              Observaciones de Entrega / Despacho
            </label>
            <textarea
              rows={2}
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              disabled={isDispatching}
              onClick={() => setIsDispatchModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              disabled={isDispatching}
              onClick={handleConfirmDispatch}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
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
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold">Despacho procesado para {dispatchResult.orderNumber}</p>
                <p className="mt-0.5">Cliente: {dispatchResult.customerName}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Lotes Asignados por FIFO y Descontados de ALM-003:
              </h4>
              <div className="space-y-2">
                {dispatchResult.allocatedLots.map((alloc, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white font-mono">
                        Lote: {alloc.lotNumber}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        [{alloc.itemCode}] {alloc.itemName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-400">
                        {alloc.allocatedQuantity} unidades
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Costo: C$ {alloc.totalCost.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex justify-between items-center text-xs">
              <span className="text-slate-400">Stock Remanente en ALM-003:</span>
              <span className="font-bold text-white font-mono text-sm">
                {dispatchResult.remainingStockInWarehouse.toFixed(2)} bolsas
              </span>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsResultModalOpen(false)}
                className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-500"
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
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/50 p-3 rounded-lg border border-slate-800">
              <div>
                <p className="text-slate-500 uppercase font-semibold">Cliente:</p>
                <p className="font-medium text-slate-200">
                  {selectedOrder.customerName} ({selectedOrder.customerCode})
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Estado:</p>
                <p className="font-medium text-amber-400">{selectedOrder.status}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Fecha Pedido:</p>
                <p className="text-slate-300">{new Date(selectedOrder.orderDate).toLocaleString("es-NI")}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Fecha Despacho:</p>
                <p className="text-slate-300">
                  {selectedOrder.dispatchedDate
                    ? new Date(selectedOrder.dispatchedDate).toLocaleString("es-NI")
                    : "Pendiente"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Líneas del Pedido y Lotes Asignados por FIFO
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {selectedOrder.lines.map((l) => (
                  <div
                    key={l.id}
                    className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        [{l.itemCode}] {l.itemName}
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        Cantidad: {l.quantity} {l.unitOfMeasure} × C$ {l.unitPrice.toFixed(2)}
                      </div>
                      {l.assignedLotNumber && (
                        <div className="mt-1 flex items-center gap-1.5 text-emerald-400 font-mono font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Lote FIFO Despachado: {l.assignedLotNumber}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-amber-400">
                        C$ {l.subtotal.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Despachado: {l.dispatchedQuantity} {l.unitOfMeasure}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
