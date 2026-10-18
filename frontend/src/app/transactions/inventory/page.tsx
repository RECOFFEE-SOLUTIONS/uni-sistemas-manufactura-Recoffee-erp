"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Boxes,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  SlidersHorizontal,
  Layers,
  Calendar,
  Building2,
  Tag,
  FileSpreadsheet,
} from "lucide-react";
import apiClient from "@/lib/api";
import { InventoryTransaction, InventoryStock, Warehouse, Item } from "@/types";
import { useToast } from "@/context/ToastContext";

export default function InventoryKardexPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"kardex" | "stock">("kardex");

  // Data states
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [stocks, setStocks] = useState<InventoryStock[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedItemId, setSelectedItemId] = useState<string>("ALL");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("ALL");
  const [lotFilter, setLotFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, stockRes, whRes, itemsRes] = await Promise.all([
        apiClient.get<InventoryTransaction[]>("/api/inventory/kardex"),
        apiClient.get<InventoryStock[]>("/api/inventory/stock"),
        apiClient.get<Warehouse[]>("/api/warehouses"),
        apiClient.get<Item[]>("/api/items"),
      ]);
      setTransactions(txRes.data);
      setStocks(stockRes.data);
      setWarehouses(whRes.data);
      setItems(itemsRes.data);
    } catch {
      showToast("Error al cargar datos de inventario y Kardex", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Kardex Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesItem = selectedItemId === "ALL" || tx.itemId === Number(selectedItemId);
      const matchesWarehouse =
        selectedWarehouseId === "ALL" ||
        tx.sourceWarehouseId === Number(selectedWarehouseId) ||
        tx.destinationWarehouseId === Number(selectedWarehouseId);
      const matchesLot =
        !lotFilter ||
        (tx.lotNumber && tx.lotNumber.toLowerCase().includes(lotFilter.toLowerCase())) ||
        (tx.referenceNumber && tx.referenceNumber.toLowerCase().includes(lotFilter.toLowerCase()));
      const matchesType = typeFilter === "ALL" || tx.transactionType === typeFilter;

      return matchesItem && matchesWarehouse && matchesLot && matchesType;
    });
  }, [transactions, selectedItemId, selectedWarehouseId, lotFilter, typeFilter]);

  // Filtered Current Stocks
  const filteredStocks = useMemo(() => {
    return stocks.filter((st) => {
      const matchesItem = selectedItemId === "ALL" || st.itemId === Number(selectedItemId);
      const matchesWarehouse = selectedWarehouseId === "ALL" || st.warehouseId === Number(selectedWarehouseId);
      const matchesLot =
        !lotFilter || (st.lotNumber && st.lotNumber.toLowerCase().includes(lotFilter.toLowerCase()));

      return matchesItem && matchesWarehouse && matchesLot;
    });
  }, [stocks, selectedItemId, selectedWarehouseId, lotFilter]);

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "ENTRADA_COMPRA":
        return {
          icon: ArrowDownLeft,
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          label: "Entrada Compra",
        };
      case "ENTRADA_PRODUCCION":
        return {
          icon: ArrowDownLeft,
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          label: "Entrada Producción",
        };
      case "SALIDA_PRODUCCION":
      case "SALIDA_WIP":
        return {
          icon: ArrowUpRight,
          bg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          label: type === "SALIDA_WIP" ? "Salida WIP" : "Salida a Producción",
        };
      case "SALIDA_VENTA":
        return {
          icon: ArrowUpRight,
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          label: "Salida Venta (FIFO)",
        };
      case "TRANSFERENCIA":
        return {
          icon: Repeat,
          bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
          label: "Transferencia",
        };
      default:
        return {
          icon: SlidersHorizontal,
          bg: "bg-slate-500/10 text-slate-400 border-slate-500/20",
          label: type,
        };
    }
  };

  // KPI Calculations
  const totalStockAlm001 = useMemo(
    () => stocks.filter((s) => s.warehouseCode === "ALM-001").reduce((acc, s) => acc + s.quantity, 0),
    [stocks]
  );
  const totalStockAlm002 = useMemo(
    () => stocks.filter((s) => s.warehouseCode === "ALM-002").reduce((acc, s) => acc + s.quantity, 0),
    [stocks]
  );
  const totalStockAlm003 = useMemo(
    () => stocks.filter((s) => s.warehouseCode === "ALM-003").reduce((acc, s) => acc + s.quantity, 0),
    [stocks]
  );
  const totalStockAlm004 = useMemo(
    () => stocks.filter((s) => s.warehouseCode === "ALM-004").reduce((acc, s) => acc + s.quantity, 0),
    [stocks]
  );

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-amber-500" />
            Control de Inventario y Kardex Inmutable
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Auditoría cronológica de transacciones por lote, trazabilidad de entradas/salidas y existencias actuales por almacén.
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
        </div>
      </div>

      {/* Tarjetas KPI de Existencias por Almacén Oficial */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs text-slate-400 uppercase font-semibold flex items-center justify-between">
            <span>ALM-001: Materia Prima</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">MP</span>
          </p>
          <p className="text-2xl font-bold text-emerald-400 mt-2 font-mono">
            {totalStockAlm001.toLocaleString("es-NI", { minimumFractionDigits: 2 })} <span className="text-sm text-slate-400 font-normal">kg</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Café, Banano, Papa, Huevo</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs text-slate-400 uppercase font-semibold flex items-center justify-between">
            <span>ALM-002: En Proceso</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">WIP</span>
          </p>
          <p className="text-2xl font-bold text-purple-400 mt-2 font-mono">
            {totalStockAlm002.toLocaleString("es-NI", { minimumFractionDigits: 2 })} <span className="text-sm text-slate-400 font-normal">kg/und</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Subensambles SEM-001</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs text-slate-400 uppercase font-semibold flex items-center justify-between">
            <span>ALM-003: Prod. Terminado</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">PT</span>
          </p>
          <p className="text-2xl font-bold text-amber-400 mt-2 font-mono">
            {totalStockAlm003.toLocaleString("es-NI", { minimumFractionDigits: 2 })} <span className="text-sm text-slate-400 font-normal">bolsas</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Sustrato Compostable PT-001</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs text-slate-400 uppercase font-semibold flex items-center justify-between">
            <span>ALM-004: Empaques</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">EMP</span>
          </p>
          <p className="text-2xl font-bold text-blue-400 mt-2 font-mono">
            {totalStockAlm004.toLocaleString("es-NI", { minimumFractionDigits: 2 })} <span className="text-sm text-slate-400 font-normal">und</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Bolsas Kraft y Etiquetas</p>
        </div>
      </div>

      {/* Pestañas de Navegación: Kardex vs Stock Actual */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab("kardex")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === "kardex"
              ? "border-amber-500 text-amber-400 bg-slate-900/40"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Kardex de Transacciones ({filteredTransactions.length})
        </button>
        <button
          onClick={() => setActiveTab("stock")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === "stock"
              ? "border-amber-500 text-amber-400 bg-slate-900/40"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          Existencias Físicas por Lote ({filteredStocks.length})
        </button>
      </div>

      {/* Filtros Globales (Lote, Artículo, Almacén, Tipo) */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Filtro por Artículo */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
            Filtrar por Artículo
          </label>
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">Todos los Artículos</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                [{i.code}] {i.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Almacén */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
            Filtrar por Almacén
          </label>
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">Todos los Almacenes</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                [{w.code}] {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* Búsqueda por Lote o Referencia */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
            Buscar Lote o N° Referencia
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Ej: LOTE-MP-001..."
              value={lotFilter}
              onChange={(e) => setLotFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Filtro por Tipo de Transacción (visible en Kardex) */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
            Tipo Transacción
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            disabled={activeTab !== "kardex"}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
          >
            <option value="ALL">Todas las Operaciones</option>
            <option value="ENTRADA_COMPRA">Entrada por Compra</option>
            <option value="SALIDA_PRODUCCION">Salida a Producción</option>
            <option value="SALIDA_WIP">Salida de WIP</option>
            <option value="ENTRADA_PRODUCCION">Entrada Producto Terminado</option>
            <option value="SALIDA_VENTA">Salida Venta (FIFO)</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </select>
        </div>
      </div>

      {/* Contenido de la Pestaña Activa */}
      {loading ? (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm">Consultando registros del motor de inventario...</p>
        </div>
      ) : activeTab === "kardex" ? (
        /* Vista de Kardex Inmutable */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-base font-semibold text-slate-300">No hay movimientos en el Kardex</p>
              <p className="text-sm mt-1">Ajusta los filtros o realiza transacciones de compras, producción o ventas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-3.5 py-3">Fecha</th>
                    <th className="px-3.5 py-3">Tipo Operación</th>
                    <th className="px-3.5 py-3">Artículo</th>
                    <th className="px-3.5 py-3">Origen</th>
                    <th className="px-3.5 py-3">Destino</th>
                    <th className="px-3.5 py-3">Lote Involucrado</th>
                    <th className="px-3.5 py-3 text-right">Cantidad</th>
                    <th className="px-3.5 py-3 text-right">Costo Unit.</th>
                    <th className="px-3.5 py-3 text-right">Costo Total</th>
                    <th className="px-3.5 py-3">Referencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredTransactions.map((tx) => {
                    const badge = getTransactionBadge(tx.transactionType);
                    const Icon = badge.icon;
                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-3.5 py-2.5 text-slate-400 whitespace-nowrap">
                          {new Date(tx.transactionDate).toLocaleString("es-NI")}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-sans font-medium border ${badge.bg}`}
                          >
                            <Icon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 font-sans">
                          <div className="font-semibold text-white">[{tx.itemCode}]</div>
                          <div className="text-[11px] text-slate-400">{tx.itemName}</div>
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-300 font-sans">
                          {tx.sourceWarehouseCode || "—"}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-300 font-sans">
                          {tx.destinationWarehouseCode || "—"}
                        </td>
                        <td className="px-3.5 py-2.5 text-amber-300 font-bold whitespace-nowrap">
                          {tx.lotNumber || "Sin Lote"}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-white">
                          {tx.quantity.toFixed(2)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-slate-400">
                          C$ {tx.unitCost.toFixed(2)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-amber-400">
                          C$ {tx.totalCost.toFixed(2)}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-300 font-sans">
                          <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-300 text-[11px]">
                            {tx.referenceNumber || "N/A"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Vista de Existencias por Almacén y Lote */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {filteredStocks.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Boxes className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-base font-semibold text-slate-300">No hay existencias registradas con los filtros actuales</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Almacén</th>
                    <th className="px-4 py-3">Artículo</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Lote Físico</th>
                    <th className="px-4 py-3 text-right">Existencia Física</th>
                    <th className="px-4 py-3">Unidad Medida</th>
                    <th className="px-4 py-3">Última Actualización</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredStocks.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-sans">
                        <span className="font-semibold text-white">[{st.warehouseCode}]</span>{" "}
                        <span className="text-slate-400">{st.warehouseName}</span>
                      </td>
                      <td className="px-4 py-3 font-sans">
                        <div className="font-semibold text-white">[{st.itemCode}]</div>
                        <div className="text-slate-400">{st.itemName}</div>
                      </td>
                      <td className="px-4 py-3 font-sans">
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded text-[11px]">
                          {st.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-amber-300 font-bold whitespace-nowrap">
                        {st.lotNumber}
                      </td>
                      <td className="px-4 py-3 text-right text-base font-bold text-emerald-400">
                        {st.quantity.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-sans">{st.unitOfMeasure}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(st.lastUpdated).toLocaleString("es-NI")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
