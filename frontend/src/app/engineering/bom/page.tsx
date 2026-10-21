"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Layers,
  Calculator,
  RefreshCw,
  Boxes,
  DollarSign,
  ChevronRight,
  ChevronDown,
  Info,
  PackageCheck,
  Package,
  Cpu,
  Sparkles,
  TreePine,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Warehouse,
  Hash,
  Share2,
  FileSpreadsheet,
} from "lucide-react";
import apiClient from "@/lib/api";
import { BomExplosionResponse, BomTreeNode, BomHeaderSummary } from "@/types";
import { useToast } from "@/context/ToastContext";

export default function BomExplosionPage() {
  const { showToast } = useToast();
  const [boms, setBoms] = useState<BomHeaderSummary[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [simulatedQuantity, setSimulatedQuantity] = useState<number>(10);
  const [explosionData, setExplosionData] = useState<BomExplosionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"tree" | "consolidated">("tree");

  // Cargar lista de BOMs disponibles
  useEffect(() => {
    const fetchBoms = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<BomHeaderSummary[]>("/api/bom");
        setBoms(res.data);
        if (res.data.length > 0) {
          const defaultBom = res.data.find((b) => b.parentItemCode === "PT-001") || res.data[0];
          setSelectedItemId(defaultBom.parentItemId);
        }
      } catch {
        showToast("Error al cargar las listas de materiales (BOM)", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchBoms();
  }, [showToast]);

  // Ejecutar explosión de materiales cuando cambia el artículo o la cantidad
  const runExplosion = useCallback(async (itemId: number, qty: number) => {
    if (qty <= 0) return;
    try {
      setCalculating(true);
      const res = await apiClient.get<BomExplosionResponse>(`/api/bom/${itemId}/explosion`, {
        params: { quantity: qty },
      });
      setExplosionData(res.data);
    } catch {
      showToast("Error al calcular la explosión de materiales", "error");
    } finally {
      setCalculating(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (selectedItemId) {
      runExplosion(selectedItemId, simulatedQuantity);
    }
  }, [selectedItemId, simulatedQuantity, runExplosion]);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* ================= HEADER & COMMAND BAR ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
              Ingeniería de Producto
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">
              Estructura Jerárquica BOM Multinivel
            </span>
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Estructura de Materiales (BOM)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Desglose de receta técnica multinivel con diferenciación visual por etapas de manufactura y cálculo de costos en tiempo real.
          </p>
        </div>

        {/* View Switcher & Action Tools */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-xs">
            <button
              onClick={() => setActiveTab("tree")}
              className={`px-3.5 py-1.5 rounded-xl font-medium text-xs transition-all duration-150 flex items-center gap-1.5 ${
                activeTab === "tree"
                  ? "bg-white dark:bg-[#161821] text-amber-600 dark:text-amber-400 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <TreePine className="w-3.5 h-3.5" />
              Árbol Visual
            </button>
            <button
              onClick={() => setActiveTab("consolidated")}
              className={`px-3.5 py-1.5 rounded-xl font-medium text-xs transition-all duration-150 flex items-center gap-1.5 ${
                activeTab === "consolidated"
                  ? "bg-white dark:bg-[#161821] text-amber-600 dark:text-amber-400 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Tabla Insumos
            </button>
          </div>

          <button
            onClick={() => selectedItemId && runExplosion(selectedItemId, simulatedQuantity)}
            disabled={calculating}
            title="Recalcular explosión de materiales"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${calculating ? "animate-spin text-amber-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* ================= SIMULATION CONTROLS OMNIBAR (ZERO LABELS) ================= */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Selector de Receta / Producto (No Label) */}
        <div className="relative flex-1 min-w-[280px]">
          <Layers className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={selectedItemId || ""}
            onChange={(e) => setSelectedItemId(Number(e.target.value))}
            disabled={loading}
            className="w-full h-11 pl-10 pr-8 rounded-xl bg-slate-50 dark:bg-[#0c0d12] border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all appearance-none cursor-pointer"
          >
            {boms.map((bom) => (
              <option key={bom.id} value={bom.parentItemId}>
                [{bom.parentItemCode}] {bom.parentItemName} — {bom.code} ({bom.version})
              </option>
            ))}
          </select>
        </div>

        {/* Input Cantidad Lote (No Label) */}
        <div className="relative w-48">
          <Calculator className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Lote a simular..."
            value={simulatedQuantity}
            onChange={(e) => setSimulatedQuantity(Math.max(1, Number(e.target.value) || 1))}
            className="w-full h-11 pl-10 pr-16 rounded-xl bg-slate-50 dark:bg-[#0c0d12] border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-medium">
            {explosionData?.unitOfMeasure || "Uds"}
          </span>
        </div>

        {/* Quick Batch Selectors */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#0c0d12] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          {[1, 10, 40, 100].map((qty) => (
            <button
              key={qty}
              onClick={() => setSimulatedQuantity(qty)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                simulatedQuantity === qty
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {qty}
            </button>
          ))}
        </div>
      </div>

      {/* ================= TOP METRICS SUMMARY ================= */}
      {explosionData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Costo Acumulado BOM */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Costo Total Proyectado
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-mono font-bold text-amber-600 dark:text-amber-400 tracking-tight">
                C$ {explosionData.totalEstimatedCost.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span>C$ {(explosionData.totalEstimatedCost / (explosionData.requestedQuantity || 1)).toFixed(2)} / {explosionData.unitOfMeasure}</span>
              </div>
            </div>
          </div>

          {/* Metric 2: Insumos Consolidados */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Insumos Totales
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {explosionData.consolidatedMaterials.length} <span className="text-xs text-slate-500 font-normal">materiales</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span>Materias primas (ALM-001) y empaque (ALM-004)</span>
              </div>
            </div>
          </div>

          {/* Metric 3: Lote Simulado */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Lote de Fabricación
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <PackageCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                {explosionData.requestedQuantity} <span className="text-xs text-slate-500 font-normal">{explosionData.unitOfMeasure}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span>Base estándar: {explosionData.bomBaseQuantity} {explosionData.unitOfMeasure}</span>
              </div>
            </div>
          </div>

          {/* Metric 4: Versión BOM */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Especificación Técnica
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {explosionData.bomCode}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span>Versión {explosionData.bomVersion} • 2 Niveles Jerárquicos</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= LEVEL COLOR LEGEND ================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-100/70 dark:bg-[#121318] border border-slate-200/80 dark:border-slate-800/80 text-xs">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-500/20"></span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">Nivel 0: Producto Terminado (PT)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500 ring-2 ring-purple-500/20"></span>
            <span className="text-slate-600 dark:text-slate-300">Nivel 1: Subensamblaje Intermedio (SEM / WIP)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20"></span>
            <span className="text-slate-600 dark:text-slate-300">Nivel 2: Insumos Base / Materias Primas & Empaque</span>
          </div>
        </div>
        <div className="text-slate-400 text-[11px] font-mono">
          Estandarización ISA-95 • Estructura Padre-Hijo
        </div>
      </div>

      {/* ================= CONTENT VIEW: TREE vs CONSOLIDATED ================= */}
      {activeTab === "tree" && explosionData ? (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#161821] p-6 shadow-xs space-y-4">
          <ModernTreeNode node={explosionData.explosionTree} isRoot={true} />
        </div>
      ) : activeTab === "consolidated" && explosionData ? (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#161821] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-[#121318] border-b border-slate-200/80 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Código Insumo</th>
                  <th className="py-3.5 px-4">Descripción de Material</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4 text-right">Cantidad Requerida</th>
                  <th className="py-3.5 px-4">Unidad</th>
                  <th className="py-3.5 px-4 text-right">Costo Unitario</th>
                  <th className="py-3.5 px-4 text-right">Subtotal Proyectado</th>
                  <th className="py-3.5 px-4 text-center">Nivel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {explosionData.consolidatedMaterials.map((mat) => {
                  const isMateriaPrima = mat.category === "MP";
                  return (
                    <tr
                      key={mat.itemId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {mat.itemCode}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-800 dark:text-slate-200 font-medium">
                        {mat.itemName}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                            isMateriaPrima
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {isMateriaPrima ? "Materia Prima (ALM-001)" : "Empaque (ALM-004)"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {mat.requiredQuantity.toLocaleString("es-NI", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-sans">
                        {mat.unitOfMeasure}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">
                        C$ {mat.unitCost.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-600 dark:text-amber-400">
                        C$ {mat.totalCost.toLocaleString("es-NI", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
                          L{mat.level}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/60 dark:bg-[#121318] border-t-2 border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                  <td colSpan={3} className="py-4 px-4 text-right uppercase text-xs tracking-wider">
                    Costo Total Consolidado de Materiales:
                  </td>
                  <td colSpan={4} className="py-4 px-4 text-right font-mono text-amber-600 dark:text-amber-400 text-base">
                    C$ {explosionData.totalEstimatedCost.toLocaleString("es-NI", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Modern Tree Node Component with color-coded levels
function ModernTreeNode({ node, isRoot = false }: { node: BomTreeNode; isRoot?: boolean }) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const hasChildren = node.children && node.children.length > 0;

  // Level Color Styles:
  // Nivel 0 (PT): Amber/Gold
  // Nivel 1 (Subensamble): Purple/Indigo
  // Nivel 2 (Insumos/MP/EMP): Emerald/Teal
  const getLevelStyles = () => {
    if (isRoot || node.level === 0) {
      return {
        card: "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/40 dark:border-amber-500/30 ring-1 ring-amber-500/20",
        badge: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40",
        icon: <PackageCheck className="w-5 h-5 text-amber-500" />,
        label: "Nivel 0 • Terminado",
      };
    }
    if (node.isSubassembly || node.level === 1) {
      return {
        card: "bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/40 dark:border-purple-500/30 ring-1 ring-purple-500/20",
        badge: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40",
        icon: <Cpu className="w-5 h-5 text-purple-500" />,
        label: "Nivel 1 • Subensamblaje",
      };
    }
    return {
      card: "bg-slate-50 dark:bg-[#121318] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      icon: <Package className="w-4 h-4 text-emerald-500" />,
      label: `Nivel ${node.level} • Insumo`,
    };
  };

  const style = getLevelStyles();

  return (
    <div className="space-y-3">
      <div
        className={`p-4 rounded-2xl border transition-all ${style.card} shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4`}
      >
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          {hasChildren ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-7 h-7 flex items-center justify-center text-slate-400 text-xs">•</div>
          )}

          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
            {style.icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${style.badge}`}>
                {style.label}
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                {node.itemCode}
              </span>
              {node.bomCode && (
                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700 rounded">
                  {node.bomCode}
                </span>
              )}
            </div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
              {node.itemName}
            </h4>
          </div>
        </div>

        {/* Quantities & Costs */}
        <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/80 dark:border-slate-800/80">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Cantidad</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {node.requiredQuantity.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>{" "}
            <span className="text-xs text-slate-500 font-sans">{node.unitOfMeasure}</span>
          </div>

          <div className="text-right min-w-[100px]">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Subtotal</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
              C$ {node.subtotalCost.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Recursive Children Container */}
      {hasChildren && isExpanded && (
        <div className="pl-6 ml-3.5 border-l-2 border-slate-200 dark:border-slate-800 space-y-3">
          {node.children.map((child) => (
            <ModernTreeNode key={child.itemId} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}
