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
} from "lucide-react";
import apiClient from "@/lib/api";
import { PurchaseOrder, Supplier, Item } from "@/types";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/Modal";

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
          unitOfMeasure: l.unitOfMeasure,
        })),
      };

      const res = await apiClient.post<PurchaseOrder>("/api/purchases", payload);
      showToast(`Orden de compra ${res.data.orderNumber} creada exitosamente`, "success");
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Error al crear la orden de compra.";
      setModalError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReceiveModal = (order: PurchaseOrder) => {
    setOrderToReceive(order);
    setReceivingNotes(`Recepción conforme de mercancía para ${order.orderNumber}.`);
    setIsReceiveModalOpen(true);
  };

  const handleConfirmReception = async () => {
    if (!orderToReceive) return;
    setIsReceiving(true);
    try {
      const payload = {
        receptionDate: new Date().toISOString(),
        notes: receivingNotes,
      };
      await apiClient.post(`/api/purchases/${orderToReceive.id}/receive`, payload);
      showToast(
        `¡Mercancía de la orden ${orderToReceive.orderNumber} ingresada con éxito! Lotes generados y stock actualizado en almacenes.`,
        "success"
      );
      setIsReceiveModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Error al procesar la recepción de la orden.";
      showToast(msg, "error");
    } finally {
      setIsReceiving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Estadísticas Rápidas */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-amber-500" />
            Órdenes de Compra y Recepción
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestión de abastecimiento, ingreso físico de inventario y generación automática de lotes (ALM-001 y ALM-004).
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
            Nueva Orden de Compra
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
            <p className="text-xs text-slate-400 uppercase font-semibold">Órdenes Emitidas</p>
            <p className="text-2xl font-bold text-white">
              {orders.filter((o) => o.status === "Emitida").length}
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Órdenes Recibidas</p>
            <p className="text-2xl font-bold text-emerald-400">
              {orders.filter((o) => o.status === "Recibida").length}
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Inversión Total en Compras</p>
            <p className="text-2xl font-bold text-white">
              C$ {orders.reduce((acc, o) => acc + o.totalAmount, 0).toLocaleString("es-NI", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, proveedor..."
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
            <option value="Emitida">Emitidas</option>
            <option value="Recibida">Recibidas</option>
            <option value="Cancelada">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Tabla de Órdenes */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm">Cargando órdenes de compra...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ShoppingCart className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="text-base font-semibold text-slate-300">No se encontraron órdenes de compra</p>
            <p className="text-sm mt-1">Crea una nueva orden de compra para abastecer materias primas o insumos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">N° Orden</th>
                  <th className="px-4 py-3.5">Proveedor</th>
                  <th className="px-4 py-3.5">Fecha Emisión</th>
                  <th className="px-4 py-3.5">Fecha Entrega</th>
                  <th className="px-4 py-3.5 text-right">Líneas</th>
                  <th className="px-4 py-3.5 text-right">Monto Total</th>
                  <th className="px-4 py-3.5 text-center">Estado</th>
                  <th className="px-4 py-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.map((order) => {
                  const isReceived = order.status === "Recibida";
                  return (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-semibold text-white">{order.orderNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">{order.supplierName}</div>
                        <div className="text-xs text-slate-500 font-mono">{order.supplierCode}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(order.orderDate).toLocaleDateString("es-NI")}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {order.expectedDeliveryDate
                          ? new Date(order.expectedDeliveryDate).toLocaleDateString("es-NI")
                          : "Inmediata"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">
                        {order.linesCount}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-400">
                        C$ {order.totalAmount.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            isReceived
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : order.status === "Cancelada"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
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
                          {order.status === "Emitida" && (
                            <button
                              onClick={() => handleOpenReceiveModal(order)}
                              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition"
                              title="Recibir Mercancía e Ingresar Lotes"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              Recibir
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

      {/* Modal: Crear Nueva Orden de Compra */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
        title="Crear Nueva Orden de Compra"
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
                Proveedor *
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
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
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
              Notas u Observaciones
            </label>
            <textarea
              rows={2}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Sección de Líneas de Compra */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Artículos a Comprar (Materias Primas / Insumos)
              </label>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Artículo
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
                      <option value="">Seleccione artículo...</option>
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
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white text-right"
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
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white text-right"
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
              <span className="text-slate-300">Total Estimado de la Orden:</span>
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
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/50 p-3 rounded-lg border border-slate-800">
              <div>
                <p className="text-slate-500 uppercase font-semibold">Proveedor:</p>
                <p className="font-medium text-slate-200">
                  {selectedOrder.supplierName} ({selectedOrder.supplierCode})
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Estado:</p>
                <p className="font-medium text-amber-400">{selectedOrder.status}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Fecha Emisión:</p>
                <p className="text-slate-300">{new Date(selectedOrder.orderDate).toLocaleString("es-NI")}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-semibold">Fecha Recepción:</p>
                <p className="text-slate-300">
                  {selectedOrder.receivedDate
                    ? new Date(selectedOrder.receivedDate).toLocaleString("es-NI")
                    : "Pendiente"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Líneas de la Orden y Lotes de Entrada Asignados
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
                      {l.generatedLotNumber && (
                        <div className="mt-1 flex items-center gap-1.5 text-emerald-400 font-mono font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Lote Generado: {l.generatedLotNumber}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-amber-400">
                        C$ {l.subtotal.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Recibido: {l.receivedQuantity} {l.unitOfMeasure}
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

      {/* Modal de Confirmación de Recepción de Mercancía */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => !isReceiving && setIsReceiveModalOpen(false)}
        title={`Recepción de Mercancía - ${orderToReceive?.orderNumber || ""}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs flex gap-2.5">
            <Boxes className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-bold">Generación Automática de Lotes y Acreditación de Stock</p>
              <p className="mt-1">
                Al confirmar la recepción, el sistema generará automáticamente los códigos de lote oficiales (ej:
                LOTE-MP-001-YYYYMMDD-001) y acreditará el inventario físico en ALM-001 (Materia Prima) o ALM-004
                (Empaque), registrando los movimientos en el Kardex.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
              Notas de Recepción / Almacén
            </label>
            <textarea
              rows={2}
              value={receivingNotes}
              onChange={(e) => setReceivingNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              disabled={isReceiving}
              onClick={() => setIsReceiveModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              disabled={isReceiving}
              onClick={handleConfirmReception}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {isReceiving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isReceiving ? "Ingresando a Inventario..." : "Confirmar Recepción F贸sica"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
