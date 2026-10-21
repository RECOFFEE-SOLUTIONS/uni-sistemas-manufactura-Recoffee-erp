"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Boxes,
  Search,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  SlidersHorizontal,
  Layers,
  Building2,
  Tag,
  FileSpreadsheet,
  Wallet,
  TrendingUp,
  AlertTriangle,
  RotateCw,
  PackageCheck,
  Calendar,
  XCircle,
  FileText,
} from "lucide-react";
import apiClient from "@/lib/api";
import { InventoryTransaction, InventoryStock, Warehouse, Item } from "@/types";
import { useToast } from "@/context/ToastContext";

// Skeleton Loader Component
function KardexSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Metrics Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
            </div>
            <div className="mt-4">
              <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
              <div className="h-3 w-40 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Omnibar Skeleton */}
      <div className="h-14 bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl"></div>

      {/* Table Skeleton */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#161821] p-6 space-y-4">
        <div className="h-8 bg-slate-200 dark:bg-slate-800/60 rounded-xl w-full"></div>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-12 bg-slate-100 dark:bg-slate-800/30 rounded-lg w-full"
          ></div>
        ))}
      </div>
    </div>
  );
}

// Empty State Component
function KardexEmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <div className="p-16 flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 mb-6 rounded-3xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
        <Boxes className="w-12 h-12 stroke-[1.5]" />
      </div>
      <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
        No se encontraron movimientos registrados
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        No hay registros que coincidan con los criterios de búsqueda o filtros seleccionados en el Kardex PEPS.
      </p>
      {onReset && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-sm shadow-sm transition-all duration-150 active:scale-95"
        >
          <RotateCw className="w-4 h-4" />
          Restablecer Filtros
        </button>
      )}
    </div>
  );
}

export default function InventoryKardexPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"kardex" | "stock">("kardex");

  // Data states
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [stocks, setStocks] = useState<InventoryStock[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters (Zero labels - strictly placeholder & icons)
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string>("ALL");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("ALL");
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

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedItemId("ALL");
    setSelectedWarehouseId("ALL");
    setTypeFilter("ALL");
  };

  // Filtered Kardex Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesItem = selectedItemId === "ALL" || tx.itemId === Number(selectedItemId);
      const matchesWarehouse =
        selectedWarehouseId === "ALL" ||
        tx.sourceWarehouseId === Number(selectedWarehouseId) ||
        tx.destinationWarehouseId === Number(selectedWarehouseId);
      const matchesSearch =
        !searchTerm ||
        (tx.lotNumber && tx.lotNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.referenceNumber && tx.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.itemCode && tx.itemCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.itemName && tx.itemName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter === "ALL" || tx.transactionType === typeFilter;

      return matchesItem && matchesWarehouse && matchesSearch && matchesType;
    });
  }, [transactions, selectedItemId, selectedWarehouseId, searchTerm, typeFilter]);

  // Filtered Current Stocks
  const filteredStocks = useMemo(() => {
    return stocks.filter((st) => {
      const matchesItem = selectedItemId === "ALL" || st.itemId === Number(selectedItemId);
      const matchesWarehouse =
        selectedWarehouseId === "ALL" || st.warehouseId === Number(selectedWarehouseId);
      const matchesSearch =
        !searchTerm ||
        (st.lotNumber && st.lotNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (st.itemCode && st.itemCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (st.itemName && st.itemName.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesItem && matchesWarehouse && matchesSearch;
    });
  }, [stocks, selectedItemId, selectedWarehouseId, searchTerm]);

  // Metric Computations
  const totalValuation = useMemo(() => {
    return stocks.reduce((acc, st) => {
      const it = items.find((i) => i.id === st.itemId);
      const cost = it ? it.standardCost : 0;
      return acc + st.quantity * cost;
    }, 0);
  }, [stocks, items]);

  const [totalMovimientosHoy, setTotalMovimientosHoy] = useState(0);

  useEffect(() => {
    if (transactions.length > 0) {
      const today = new Date().toDateString();
      setTotalMovimientosHoy(
        transactions.filter((t) => new Date(t.transactionDate).toDateString() === today).length
      );
    }
  }, [transactions]);

  const stockPT = useMemo(
    () =>
      stocks
        .filter((s) => s.warehouseCode === "ALM-003")
        .reduce((acc, s) => acc + s.quantity, 0),
    [stocks]
  );

  const stockWIP = useMemo(
    () =>
      stocks
        .filter((s) => s.warehouseCode === "ALM-002")
        .reduce((acc, s) => acc + s.quantity, 0),
    [stocks]
  );

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "ENTRADA_COMPRA":
        return {
          icon: ArrowDownLeft,
          bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          label: "Entrada Compra",
        };
      case "ENTRADA_PRODUCCION":
        return {
          icon: ArrowDownLeft,
          bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
          label: "Entrada PT",
        };
      case "SALIDA_PRODUCCION":
      case "SALIDA_WIP":
        return {
          icon: ArrowUpRight,
          bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
          label: type === "SALIDA_WIP" ? "Salida WIP" : "Salida Producción",
        };
      case "SALIDA_VENTA":
        return {
          icon: ArrowUpRight,
          bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          label: "Salida Venta (FIFO)",
        };
      case "TRANSFERENCIA":
        return {
          icon: Repeat,
          bg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
          label: "Transferencia",
        };
      default:
        return {
          icon: SlidersHorizontal,
          bg: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
          label: type,
        };
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* ================= HEADER & STATUS BADGE ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
              Ledger NIC 2 / PEPS
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">
              Kardex Inmutable en Tiempo Real
            </span>
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Kardex e Inventario Valorizado
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Trazabilidad continua de transacciones por lote, valoración PEPS/FIFO y existencias físicas multialmacén.
          </p>
        </div>

        {/* View Switcher & Refresh Pill */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-xs">
            <button
              onClick={() => setActiveTab("kardex")}
              className={`px-3.5 py-1.5 rounded-xl font-medium text-xs transition-all duration-150 flex items-center gap-1.5 ${
                activeTab === "kardex"
                  ? "bg-white dark:bg-[#161821] text-amber-600 dark:text-amber-400 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Kardex ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab("stock")}
              className={`px-3.5 py-1.5 rounded-xl font-medium text-xs transition-all duration-150 flex items-center gap-1.5 ${
                activeTab === "stock"
                  ? "bg-white dark:bg-[#161821] text-amber-600 dark:text-amber-400 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Existencias Físicas ({stocks.length})
            </button>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            title="Sincronizar y actualizar datos"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* ================= TOP METRICS CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Valuation */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Valoración Total PEPS
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-3xl font-mono font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              C$ {totalValuation.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Valuación contable estándar</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Today's Transactions */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Movimientos Registrados
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <RotateCw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-3xl font-mono font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {transactions.length} <span className="text-xs text-slate-500 font-normal">total</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>{totalMovimientosHoy} transacciones registradas hoy</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Producto Terminado ALM-003 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Prod. Terminado (ALM-003)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {stockPT.toLocaleString("es-NI", { minimumFractionDigits: 1 })} <span className="text-xs text-slate-500 font-normal">bolsas</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>Listo para despacho y venta FIFO</span>
            </div>
          </div>
        </div>

        {/* Metric 4: WIP en Proceso ALM-002 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              En Proceso WIP (ALM-002)
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-3xl font-mono font-bold text-purple-600 dark:text-purple-400 tracking-tight">
              {stockWIP.toLocaleString("es-NI", { minimumFractionDigits: 1 })} <span className="text-xs text-slate-500 font-normal">kg</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>Etapas de secado, molido y mezclado</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= HYPER-MINIMALIST OMNIBAR FILTER (NO LABELS) ================= */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          {/* Search SKU / Lote / Referencia */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por SKU, lote, referencia..."
              className="w-full h-10 pl-10 pr-3 rounded-xl bg-slate-50 dark:bg-[#0c0d12] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          {/* Filter: Almacén (No Label) */}
          <div className="relative min-w-[180px]">
            <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="w-full h-10 pl-10 pr-8 rounded-xl bg-slate-50 dark:bg-[#0c0d12] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">Todos los Almacenes</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  [{w.code}] {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter: SKU / Artículo (No Label) */}
          <div className="relative min-w-[190px]">
            <Tag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full h-10 pl-10 pr-8 rounded-xl bg-slate-50 dark:bg-[#0c0d12] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">Todos los Artículos</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  [{i.code}] {i.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter: Tipo de Transacción (No Label, Kardex only) */}
          {activeTab === "kardex" && (
            <div className="relative min-w-[180px]">
              <SlidersHorizontal className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full h-10 pl-10 pr-8 rounded-xl bg-slate-50 dark:bg-[#0c0d12] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all appearance-none cursor-pointer"
              >
                <option value="ALL">Todas las Operaciones</option>
                <option value="ENTRADA_COMPRA">Entrada por Compra</option>
                <option value="SALIDA_PRODUCCION">Salida a Producción</option>
                <option value="SALIDA_WIP">Salida de WIP</option>
                <option value="ENTRADA_PRODUCCION">Entrada PT</option>
                <option value="SALIDA_VENTA">Salida Venta (FIFO)</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
            </div>
          )}
        </div>

        {/* Clear Filters Button */}
        {(searchTerm || selectedItemId !== "ALL" || selectedWarehouseId !== "ALL" || typeFilter !== "ALL") && (
          <button
            onClick={handleResetFilters}
            title="Limpiar todos los filtros"
            className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs flex items-center gap-1.5 transition-all"
          >
            <XCircle className="w-4 h-4 text-slate-400" />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* ================= CONTENT TABLE CONTAINER ================= */}
      {loading ? (
        <KardexSkeleton />
      ) : activeTab === "kardex" ? (
        /* KARDEX TRANSACTIONS TABLE */
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#161821] overflow-hidden shadow-xs">
          {filteredTransactions.length === 0 ? (
            <KardexEmptyState onReset={handleResetFilters} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-[#121318] border-b border-slate-200/80 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Fecha & Hora</th>
                    <th className="py-3.5 px-4">Tipo Operación</th>
                    <th className="py-3.5 px-4">SKU / Artículo</th>
                    <th className="py-3.5 px-4">Origen / Destino</th>
                    <th className="py-3.5 px-4">Lote Auditado</th>
                    <th className="py-3.5 px-4 text-right">Cantidad</th>
                    <th className="py-3.5 px-4 text-right">Costo Unit.</th>
                    <th className="py-3.5 px-4 text-right">Costo Total</th>
                    <th className="py-3.5 px-4">Referencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {filteredTransactions.map((tx) => {
                    const badge = getTransactionBadge(tx.transactionType);
                    const Icon = badge.icon;
                    const isOutgoing = tx.transactionType.startsWith("SALIDA");
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(tx.transactionDate).toLocaleString("es-NI", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${badge.bg}`}
                          >
                            <Icon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                            {tx.itemCode}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                            {tx.itemName}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs">{tx.sourceWarehouseCode || "—"}</span>
                            <span className="text-slate-400">→</span>
                            <span className="font-mono text-xs">{tx.destinationWarehouseCode || "—"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20 text-xs">
                            {tx.lotNumber || "Sin Lote"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold">
                          <span className={isOutgoing ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                            {isOutgoing ? "-" : "+"}
                            {tx.quantity.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">
                          C$ {tx.unitCost.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-amber-600 dark:text-amber-400">
                          C$ {tx.totalCost.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-mono border border-slate-200 dark:border-slate-700/60">
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

          {/* Table Footer with Summary */}
          {filteredTransactions.length > 0 && (
            <div className="px-6 py-4 bg-slate-50/60 dark:bg-[#121318] border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div>
                Mostrando <span className="font-semibold text-slate-900 dark:text-slate-200">{filteredTransactions.length}</span> transacciones auditadas
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span>Norma NIC 2 Valuación PEPS Consistente</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* CURRENT PHYSICAL STOCKS TABLE */
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#161821] overflow-hidden shadow-xs">
          {filteredStocks.length === 0 ? (
            <KardexEmptyState onReset={handleResetFilters} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-[#121318] border-b border-slate-200/80 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Almacén</th>
                    <th className="py-3.5 px-4">SKU / Artículo</th>
                    <th className="py-3.5 px-4">Categoría</th>
                    <th className="py-3.5 px-4">Lote Físico</th>
                    <th className="py-3.5 px-4 text-right">Existencia Física</th>
                    <th className="py-3.5 px-4">Unidad</th>
                    <th className="py-3.5 px-4">Última Actualización</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {filteredStocks.map((st) => (
                    <tr
                      key={st.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-sans">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          [{st.warehouseCode}]
                        </span>{" "}
                        <span className="text-slate-500 dark:text-slate-400 text-xs">
                          {st.warehouseName}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {st.itemCode}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                          {st.itemName}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] border border-slate-200 dark:border-slate-700/60">
                          {st.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20 text-xs">
                          {st.lotNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {st.quantity.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-sans">
                        {st.unitOfMeasure}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(st.lastUpdated).toLocaleString("es-NI", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer with Summary */}
          {filteredStocks.length > 0 && (
            <div className="px-6 py-4 bg-slate-50/60 dark:bg-[#121318] border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div>
                Mostrando <span className="font-semibold text-slate-900 dark:text-slate-200">{filteredStocks.length}</span> registros de saldo por lote
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span>Auditoría Física y Contable Sincronizada</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
