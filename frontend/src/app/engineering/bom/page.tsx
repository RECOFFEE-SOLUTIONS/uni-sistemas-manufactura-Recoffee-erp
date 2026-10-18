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
  const [activeTab, setActiveTab] = useState<"consolidated" | "tree">("consolidated");

  // Cargar lista de BOMs disponibles
  useEffect(() => {
    const fetchBoms = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<BomHeaderSummary[]>("/api/bom");
        setBoms(res.data);
        if (res.data.length > 0) {
          // Seleccionar por defecto PT-001 si existe, o el primero
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
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
              Hito M2
            </span>
            <span className="text-xs text-slate-500">Ingeniería de Producto</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mt-1">
            <Layers className="w-7 h-7 text-emerald-600" />
            Lista de Materiales (BOM) y Simulación de Explosión
          </h1>
          <p className="text-sm text-slate-600">
            Explosión jerárquica multinivel (Nivel 0 y Nivel 1) con cálculo exacto de materias primas e insumos de empaque en tiempo real.
          </p>
        </div>

        <button
          onClick={() => selectedItemId && runExplosion(selectedItemId, simulatedQuantity)}
          disabled={calculating}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${calculating ? "animate-spin" : ""}`} />
          Recalcular Explosión
        </button>
      </div>

      {/* Panel de Configuración de Simulación */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          {/* Selector de Receta / Producto */}
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Producto / Receta de Fabricación
            </label>
            <select
              value={selectedItemId || ""}
              onChange={(e) => setSelectedItemId(Number(e.target.value))}
              disabled={loading}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
            >
              {boms.map((bom) => (
                <option key={bom.id} value={bom.parentItemId}>
                  {bom.parentItemCode} — {bom.parentItemName} ({bom.code} - {bom.version})
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad a Simular */}
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Cantidad a Producir (Lote)</span>
              <span className="text-xs font-normal text-emerald-600">
                Base: {explosionData?.bomBaseQuantity || 1} {explosionData?.unitOfMeasure}
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                value={simulatedQuantity}
                onChange={(e) => setSimulatedQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-full pl-10 pr-16 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calculator className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-medium text-slate-500 uppercase">
                {explosionData?.unitOfMeasure || "unidades"}
              </div>
            </div>
          </div>

          {/* Botones de Selección Rápida */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Lotes Frecuentes
            </label>
            <div className="flex gap-2">
              {[1, 10, 40, 100].map((qty) => (
                <button
                  key={qty}
                  onClick={() => setSimulatedQuantity(qty)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    simulatedQuantity === qty
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {qty}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas KPI Resumen del Lote */}
      {explosionData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Producto Simulado</p>
              <h3 className="text-base font-bold text-slate-800">
                {explosionData.requestedQuantity} {explosionData.unitOfMeasure}
              </h3>
              <p className="text-xs text-slate-500">{explosionData.parentItemCode}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Insumos Consolidados</p>
              <h3 className="text-base font-bold text-slate-800">
                {explosionData.consolidatedMaterials.length} Materiales
              </h3>
              <p className="text-xs text-slate-500">Materias primas y empaque</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Costo Total Materiales</p>
              <h3 className="text-base font-bold text-amber-700">
                C$ {explosionData.totalEstimatedCost.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-slate-500">
                C$ {(explosionData.totalEstimatedCost / (explosionData.requestedQuantity || 1)).toFixed(2)} / {explosionData.unitOfMeasure}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">BOM Activo</p>
              <h3 className="text-base font-bold text-slate-800">{explosionData.bomCode}</h3>
              <p className="text-xs text-slate-500">Versión {explosionData.bomVersion} (2 Niveles)</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs de Navegación: Vista Resumen Consolidado vs Árbol Jerárquico */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3">
          <button
            onClick={() => setActiveTab("consolidated")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "consolidated"
                ? "border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-sm"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Boxes className="w-4 h-4" />
            Resumen Consolidado de Insumos (Material Requirements)
          </button>
          <button
            onClick={() => setActiveTab("tree")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "tree"
                ? "border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-sm"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <TreePine className="w-4 h-4" />
            Estructura Jerárquica del Árbol (Multilevel Tree)
          </button>
        </div>

        {/* Tab 1: Tabla Consolidada de Materiales */}
        {activeTab === "consolidated" && (
          <div className="p-5">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-600" />
                Insumos Totales Requeridos para procesar {simulatedQuantity} {explosionData?.unitOfMeasure} de {explosionData?.parentItemCode}
              </h3>
              <span className="text-xs text-slate-500">
                Suma consolidada de hojas terminales (Nivel 0 y Nivel 1)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Material / Insumo</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4 text-right">Cantidad Requerida</th>
                    <th className="py-3 px-4">Unidad</th>
                    <th className="py-3 px-4 text-right">Costo Unit. (C$)</th>
                    <th className="py-3 px-4 text-right">Costo Subtotal (C$)</th>
                    <th className="py-3 px-4 text-center">Nivel BOM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {explosionData?.consolidatedMaterials.map((mat) => {
                    const isMateriaPrima = mat.category === "MP";
                    return (
                      <tr key={mat.itemId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {mat.itemCode}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {mat.itemName}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isMateriaPrima
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {isMateriaPrima ? "Materia Prima" : "Empaque"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-base">
                          {mat.requiredQuantity.toLocaleString("es-NI", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {mat.unitOfMeasure}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">
                          C$ {mat.unitCost.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          C$ {mat.totalCost.toLocaleString("es-NI", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded font-semibold">
                            L{mat.level}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/80 font-bold text-slate-900 border-t-2 border-slate-200">
                    <td colSpan={3} className="py-3.5 px-4 text-right uppercase text-xs tracking-wider">
                      Costo Total Proyectado de Materiales:
                    </td>
                    <td colSpan={4} className="py-3.5 px-4 text-right font-mono text-emerald-700 text-lg">
                      C$ {explosionData?.totalEstimatedCost.toLocaleString("es-NI", {
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
        )}

        {/* Tab 2: Árbol Jerárquico Visual */}
        {activeTab === "tree" && explosionData && (
          <div className="p-6 bg-slate-900 text-slate-100">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <TreePine className="w-4 h-4 text-emerald-400" />
                Desglose Jerárquico Padre-Hijo (Multilevel Bill of Materials)
              </h3>
              <span className="text-xs text-slate-400">
                Nivel 0: Producto Terminado → Nivel 1: Subensamble y Empaque → Nivel 2: Materias Primas
              </span>
            </div>

            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
              <TreeNodeView node={explosionData.explosionTree} isRoot={true} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente recursivo para renderizar cada nodo del árbol
function TreeNodeView({ node, isRoot = false }: { node: BomTreeNode; isRoot?: boolean }) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="text-sm">
      <div
        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
          isRoot
            ? "bg-emerald-950/70 border-emerald-600 text-emerald-100 shadow-lg"
            : node.isSubassembly
            ? "bg-slate-800/80 border-slate-700 text-slate-200 hover:border-slate-600"
            : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
        }`}
      >
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <span className="w-6 inline-block text-center text-slate-600 text-xs">•</span>
        )}

        {/* Icono por tipo */}
        {isRoot ? (
          <PackageCheck className="w-5 h-5 text-emerald-400" />
        ) : node.isSubassembly ? (
          <Cpu className="w-5 h-5 text-amber-400" />
        ) : (
          <Package className="w-4 h-4 text-blue-400" />
        )}

        {/* Código y Nombre */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-white text-sm">{node.itemCode}</span>
            <span className="text-slate-200 truncate">{node.itemName}</span>
            {node.bomCode && (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-emerald-400 border border-slate-700 rounded">
                {node.bomCode}
              </span>
            )}
          </div>
        </div>

        {/* Nivel Badge */}
        <span
          className={`px-2 py-0.5 text-xs font-semibold rounded ${
            node.level === 0
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : node.level === 1
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
          }`}
        >
          Nivel {node.level}
        </span>

        {/* Cantidad Requerida */}
        <div className="text-right pl-4">
          <span className="font-mono font-bold text-emerald-400 text-sm">
            {node.requiredQuantity.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>{" "}
          <span className="text-xs text-slate-400">{node.unitOfMeasure}</span>
        </div>

        {/* Costo Subtotal */}
        <div className="text-right w-28 pl-2">
          <span className="text-xs text-slate-400">Subtotal:</span>
          <div className="font-mono font-semibold text-slate-200 text-xs">
            C$ {node.subtotalCost.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Renderizado de hijos recursivo */}
      {hasChildren && isExpanded && (
        <div className="pl-6 ml-3 border-l-2 border-slate-700/60 mt-2 space-y-2">
          {node.children.map((child) => (
            <TreeNodeView key={child.itemId} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}
