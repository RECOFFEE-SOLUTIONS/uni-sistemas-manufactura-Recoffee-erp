"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  ShoppingCart,
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
  DollarSign,
  Hash,
  X,
} from "lucide-react";
import apiClient from "@/lib/api";
import { PurchaseOrder, Supplier, Item } from "@/types";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/Modal";
import ActionTooltipButton from "@/components/ActionTooltip";

export default function PurchasesPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create Order Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [selectedSupplierId, setSelectedSupplierId] = useState<number | "">("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [orderLines, setOrderLines] = useState<
    { itemId: number | ""; quantity: number; unitPrice: number; unitOfMeasure: string }[]
  >([{ itemId: "", quantity: 10, unitPrice: 0, unitOfMeasure: "kg" }]);

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Receive Modal / Action State
  const [orderToReceive, setOrderToReceive] = useState<PurchaseOrder | null>(null);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receivingNotes, setReceivingNotes] = useState("");
  const [isReceiving, setIsReceiving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, suppliersRes, itemsRes] = await Promise.all([
        apiClient.get<PurchaseOrder[]>("/api/purchases"),
        apiClient.get<Supplier[]>("/api/suppliers"),
        apiClient.get<Item[]>("/api/items"),
      ]);
      setOrders(ordersRes.data);
      setSuppliers(suppliersRes.data.filter((s) => s.isActive));
      // Filtrar para compra materias primas e insumos de empaque
      setItems(itemsRes.data.filter((i) => i.isActive && (i.category === "MP" || i.category === "EMP")));
    } catch {
      showToast("Error al cargar datos del módulo de compras", "error");
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
        o.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.supplierCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const handleOpenCreateModal = () => {
    setSelectedSupplierId(suppliers.length > 0 ? suppliers[0].id : "");
    setExpectedDeliveryDate(new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]);
    setOrderNotes("Pedido de reabastecimiento para materias primas e insumos.");
    if (items.length > 0) {
      setOrderLines([
        {
          itemId: items[0].id,
          quantity: 50,
          unitPrice: items[0].cost || 10,
          unitOfMeasure: items[0].unitOfMeasure || "kg",
        },
      ]);
    } else {
      setOrderLines([{ itemId: "", quantity: 1, unitPrice: 0, unitOfMeasure: "kg" }]);
    }
    setModalError(null);
    setIsCreateModalOpen(true);
  };

  const handleItemChangeInLine = (index: number, itemId: number) => {
    const foundItem = items.find((i) => i.id === itemId);
    const updated = [...orderLines];
    updated[index].itemId = itemId;
    if (foundItem) {
      updated[index].unitPrice = foundItem.cost;
      updated[index].unitOfMeasure = foundItem.unitOfMeasure;
    }
    setOrderLines(updated);
  };

  const handleAddLine = () => {
    const firstItem = items[0];
    setOrderLines([
      ...orderLines,
      {
        itemId: firstItem ? firstItem.id : "",
        quantity: 10,
        unitPrice: firstItem ? firstItem.cost : 0,
        unitOfMeasure: firstItem ? firstItem.unitOfMeasure : "kg",
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
    if (!selectedSupplierId) {
      setModalError("Debe seleccionar un proveedor válido.");
      return;
    }

    const invalidLine = orderLines.find((l) => !l.itemId || l.quantity <= 0);
    if (invalidLine) {
      setModalError("Todas las líneas deben tener un artículo seleccionado y cantidad mayor a 0.");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const payload = {
        supplierId: Number(selectedSupplierId),
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate).toISOString() : null,
        notes: orderNotes,
        lines: orderLines.map((l) => ({
          itemId: Number(l.itemId),
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
        })),
      };

      const res = await apiClient.post<PurchaseOrder>("/api/purchases", payload);
      showToast(`Orden de compra ${res.data.orderNumber} emitida exitosamente`, "success");
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Error al emitir la orden de compra.";
      setModalError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReceiveModal = (order: PurchaseOrder) => {
    setOrderToReceive(order);
    setReceivingNotes(`Recepción física de mercancía para la orden ${order.orderNumber}.`);
    setIsReceiveModalOpen(true);
  };

  const handleConfirmReception = async () => {
    if (!orderToReceive) return;
    setIsReceiving(true);
    try {
      await apiClient.post(`/api/purchases/${orderToReceive.id}/receive`, {
        notes: receivingNotes,
      });
      showToast(
        `¡Mercancía de ${orderToReceive.orderNumber} recibida! Lotes generados y stock actualizado en almacenes.`,
        "success"
      );
      setIsReceiveModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Error al procesar la recepción de mercancía.";
      showToast(msg, "error");
    } finally {
      setIsReceiving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Flujo Transaccional • M3
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Total: {filteredOrders.length} órdenes
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Órdenes de Compra y Recepción
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Adquisición y recepción física de materias primas (ALM-001) e insumos de empaque (ALM-004) con trazabilidad por lotes.
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
            <span>Nueva Orden de Compra</span>
          </button>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por N° orden o proveedor..."
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
            <option value="Emitida">Emitidas</option>
            <option value="Recibida">Recibidas</option>
            <option value="Cancelada">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Tabla de Órdenes */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#161821] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm">Cargando órdenes de compra...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ShoppingCart className="w-12 h-12 mx-auto text-slate-400 mb-3" />
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No se encontraron órdenes de compra
            </p>
            <p className="text-xs mt-1 text-slate-500">
              Crea una nueva orden de compra para abastecer materias primas o insumos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#11131a] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">N° Orden</th>
                  <th className="px-4 py-3.5">Proveedor</th>
                  <th className="px-4 py-3.5">Fecha Emisión</th>
                  <th className="px-4 py-3.5">Fecha Entrega</th>
                  <th className="px-4 py-3.5 text-right">Líneas</th>
                  <th className="px-4 py-3.5 text-right">Monto Total</th>
                  <th className="px-4 py-3.5 text-center">Estado</th>
                  <th className="px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {filteredOrders.map((order) => {
                  const isReceived = order.status === "Recibida";
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
                          {order.supplierName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {order.supplierCode}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                        {new Date(order.orderDate).toLocaleDateString("es-NI")}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                        {order.expectedDeliveryDate
                          ? new Date(order.expectedDeliveryDate).toLocaleDateString("es-NI")
                          : "Inmediata"}
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
                            isReceived
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : order.status === "Cancelada"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {isReceived ? (
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
                          {order.status === "Emitida" && (
                            <ActionTooltipButton
                              icon={PackageCheck}
                              tooltip="Recibir Mercancía e Ingresar Lotes"
                              onClick={() => handleOpenReceiveModal(order)}
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

      {/* Modal: Crear Nueva Orden de Compra (Sin etiquetas <label>) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
        title="Crear Nueva Orden de Compra"
        description="Seleccione el proveedor, fecha estimada y líneas de artículos a abastecer."
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
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              >
                <option value="" disabled>Seleccione Proveedor *</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
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
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <textarea
              rows={2}
              placeholder="Notas u observaciones de la compra (condiciones de pago, transporte)..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Sección de Líneas de Compra */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                Artículos a Comprar (Materias Primas / Insumos)
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Artículo
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
                      <option value="" disabled>Seleccione artículo...</option>
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
                        title="Quitar fila"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center px-3 py-2 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-300">Total Estimado de la Orden:</span>
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
              {isSubmitting ? "Emitiendo..." : "Emitir Orden de Compra"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Detalle de Orden de Compra y Lotes */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Detalle de Orden ${selectedOrder?.orderNumber || ""}`}
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-slate-500 uppercase font-semibold">Proveedor:</p>
                <p className="font-medium text-slate-900 dark:text-slate-200">
                  {selectedOrder.supplierName} ({selectedOrder.supplierCode})
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Estado:</p>
                <p className="font-medium text-amber-500">{selectedOrder.status}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Fecha Emisión:</p>
                <p className="text-slate-700 dark:text-slate-300">
                  {new Date(selectedOrder.orderDate).toLocaleString("es-NI")}
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Fecha Recepción:</p>
                <p className="text-slate-700 dark:text-slate-300">
                  {selectedOrder.receivedDate
                    ? new Date(selectedOrder.receivedDate).toLocaleString("es-NI")
                    : "Pendiente"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                Líneas de la Orden y Lotes de Entrada Asignados
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
                      {l.generatedLotNumber && (
                        <div className="mt-1 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Lote Generado: {l.generatedLotNumber}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        C$ {l.subtotal.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Recibido: {l.receivedQuantity} {l.unitOfMeasure}
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

      {/* Modal de Confirmación de Recepción de Mercancía (Sin etiquetas <label>) */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => !isReceiving && setIsReceiveModalOpen(false)}
        title={`Recepción de Mercancía - ${orderToReceive?.orderNumber || ""}`}
        description="Generación automática de lotes y acreditación física en ALM-001 / ALM-004."
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-300 text-xs flex gap-2.5">
            <Boxes className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Generación Automática de Lotes y Acreditación de Stock</p>
              <p className="mt-1">
                Al confirmar la recepción, el sistema generará automáticamente los códigos de lote oficiales (ej:
                LOTE-MP-001-YYYYMMDD-001) y acreditará el inventario físico en ALM-001 (Materia Prima) o ALM-004
                (Empaque), registrando los movimientos en el Kardex.
              </p>
            </div>
          </div>

          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <textarea
              rows={2}
              placeholder="Notas de recepción e inspección física en almacén..."
              value={receivingNotes}
              onChange={(e) => setReceivingNotes(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              disabled={isReceiving}
              onClick={() => setIsReceiveModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              disabled={isReceiving}
              onClick={handleConfirmReception}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isReceiving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isReceiving ? "Ingresando a Inventario..." : "Confirmar Recepción Física"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
