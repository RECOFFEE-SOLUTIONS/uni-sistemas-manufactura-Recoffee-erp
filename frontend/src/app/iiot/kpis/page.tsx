"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Activity,
  Boxes,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Factory,
  BarChart3,
  Award,
  CircleDollarSign,
  Calendar,
  Sparkles,
} from "lucide-react";
import apiClient from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import {
  KpiDashboardSummary,
  YieldKpiResponse,
  UnitCostKpiResponse,
  InventoryTurnoverKpiResponse,
  OeeKpiResponse,
} from "@/types";

export default function IiotKpisPage() {
  const { showToast } = useToast();

  const [summary, setSummary] = useState<KpiDashboardSummary | null>(null);
  const [yieldData, setYieldData] = useState<YieldKpiResponse | null>(null);
  const [costData, setCostData] = useState<UnitCostKpiResponse | null>(null);
  const [turnoverData, setTurnoverData] = useState<InventoryTurnoverKpiResponse | null>(null);
  const [oeeData, setOeeData] = useState<OeeKpiResponse | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<"yield" | "cost" | "turnover" | "oee">("yield");

  const loadKpiData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [sumRes, yldRes, costRes, turnRes, oeeRes] = await Promise.all([
        apiClient.get<KpiDashboardSummary>("/api/kpi/dashboard"),
        apiClient.get<YieldKpiResponse>("/api/kpi/yield"),
        apiClient.get<UnitCostKpiResponse>("/api/kpi/unit-cost"),
        apiClient.get<InventoryTurnoverKpiResponse>("/api/kpi/inventory-turnover"),
        apiClient.get<OeeKpiResponse>("/api/kpi/oee"),
      ]);

      setSummary(sumRes.data);
      setYieldData(yldRes.data);
      setCostData(costRes.data);
      setTurnoverData(turnRes.data);
      setOeeData(oeeRes.data);
    } catch (err: unknown) {
      console.error(err);
      showToast("Error al cargar indicadores clave de desempeño (KPIs)", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadKpiData();
  }, [loadKpiData]);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-amber-500 uppercase tracking-wider mb-1">
            <LayoutDashboard className="w-4 h-4" /> Módulo M5 — Métricas Ejecutivas & Analítica
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Dashboard Ejecutivo de Manufactura & OEE
          </h1>
          <p className="text-sm text-slate-400">
            Monitoreo en tiempo real de los 4 KPIs estratégicos calculados desde la base de datos transaccional.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-400">
            Actualizado:{" "}
            <strong className="text-slate-200">
              {summary ? new Date(summary.calculatedAt).toLocaleTimeString() : "--:--"}
            </strong>
          </div>
          <button
            onClick={loadKpiData}
            disabled={isLoading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title="Actualizar KPIs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* GRID DE LAS 4 TARJETAS CLAVE DE KPIS (TAILWIND CSS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* KPI 1: Rendimiento de Calidad (Yield %) */}
        <div
          onClick={() => setActiveDetailTab("yield")}
          className={`cursor-pointer rounded-2xl p-5 border transition-all shadow-xl space-y-3 ${
            activeDetailTab === "yield"
              ? "bg-slate-900 border-emerald-500/60 ring-2 ring-emerald-500/20"
              : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Rendimiento (Yield)
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Award className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {summary ? `${summary.yieldPercent.toFixed(1)}%` : "0.0%"}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mt-1">
              <TrendingUp className="w-4 h-4" />
              <span>Calidad de proceso conforme</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Merma (Scrap): <strong className="text-rose-400">{summary?.scrapPercent.toFixed(1)}%</strong></span>
            <span>Meta: <strong className="text-slate-300">&gt; 95%</strong></span>
          </div>
        </div>

        {/* KPI 2: Costo Unitario Real vs. Estándar */}
        <div
          onClick={() => setActiveDetailTab("cost")}
          className={`cursor-pointer rounded-2xl p-5 border transition-all shadow-xl space-y-3 ${
            activeDetailTab === "cost"
              ? "bg-slate-900 border-amber-500/60 ring-2 ring-amber-500/20"
              : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Costo Unitario Real
            </span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <CircleDollarSign className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {summary ? `C$ ${summary.actualUnitCost.toFixed(2)}` : "C$ 0.00"}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium mt-1">
              {summary && summary.costVariance <= 0 ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  Ahorro: C$ {Math.abs(summary.costVariance).toFixed(2)} ({Math.abs(summary.costVariancePercent).toFixed(1)}%)
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Sobrecosto: C$ {summary?.costVariance.toFixed(2)} ({summary?.costVariancePercent.toFixed(1)}%)
                </span>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Estándar: <strong className="text-slate-200">C$ {summary?.standardUnitCost.toFixed(2)}</strong></span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {summary && summary.costVariance <= 0 ? "Favorable" : "Desviado"}
            </span>
          </div>
        </div>

        {/* KPI 3: Rotación de Inventario */}
        <div
          onClick={() => setActiveDetailTab("turnover")}
          className={`cursor-pointer rounded-2xl p-5 border transition-all shadow-xl space-y-3 ${
            activeDetailTab === "turnover"
              ? "bg-slate-900 border-sky-500/60 ring-2 ring-sky-500/20"
              : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Rotación de Inventario
            </span>
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {summary ? `${summary.inventoryTurnoverRatio.toFixed(2)}x` : "0.0x"}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-sky-400 font-medium mt-1">
              <Clock className="w-4 h-4" />
              <span>{summary ? `${summary.daysSalesOfInventory.toFixed(0)} días en mano (DSI)` : "--"}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Valor Stock: <strong className="text-slate-200">${turnoverData ? turnoverData.totalCurrentInventoryValue.toLocaleString() : "0"}</strong></span>
            <span className="text-emerald-400 font-semibold">Saludable</span>
          </div>
        </div>

        {/* KPI 4: OEE Global */}
        <div
          onClick={() => setActiveDetailTab("oee")}
          className={`cursor-pointer rounded-2xl p-5 border transition-all shadow-xl space-y-3 ${
            activeDetailTab === "oee"
              ? "bg-slate-900 border-indigo-500/60 ring-2 ring-indigo-500/20"
              : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Eficiencia Global (OEE)
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {summary ? `${summary.oeePercent.toFixed(1)}%` : "0.0%"}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium mt-1">
              <Sparkles className="w-4 h-4" />
              <span>Benchmark Clase Mundial (&gt;80%)</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>A: <strong className="text-white">{summary?.availabilityPercent.toFixed(0)}%</strong></span>
            <span>P: <strong className="text-white">{summary?.performancePercent.toFixed(0)}%</strong></span>
            <span>Q: <strong className="text-white">{summary?.qualityPercent.toFixed(0)}%</strong></span>
          </div>
        </div>
      </div>

      {/* PESTAÑAS DE DETALLE ANALÍTICO DE CADA KPI */}
      <div className="space-y-4">
        <div className="flex border-b border-slate-800 text-sm font-medium gap-2">
          <button
            onClick={() => setActiveDetailTab("yield")}
            className={`flex items-center gap-2 pb-3 px-3 transition-colors border-b-2 ${
              activeDetailTab === "yield"
                ? "border-emerald-500 text-emerald-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Award className="w-4 h-4" /> Detalle de Rendimiento (Yield)
          </button>
          <button
            onClick={() => setActiveDetailTab("cost")}
            className={`flex items-center gap-2 pb-3 px-3 transition-colors border-b-2 ${
              activeDetailTab === "cost"
                ? "border-amber-500 text-amber-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <CircleDollarSign className="w-4 h-4" /> Desglose de Costo Real vs. Estándar
          </button>
          <button
            onClick={() => setActiveDetailTab("turnover")}
            className={`flex items-center gap-2 pb-3 px-3 transition-colors border-b-2 ${
              activeDetailTab === "turnover"
                ? "border-sky-500 text-sky-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Boxes className="w-4 h-4" /> Rotación de Inventarios por Almacén
          </button>
          <button
            onClick={() => setActiveDetailTab("oee")}
            className={`flex items-center gap-2 pb-3 px-3 transition-colors border-b-2 ${
              activeDetailTab === "oee"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-4 h-4" /> Tiempos de Ciclo de Ruta MES (RO-1 a RO-8)
          </button>
        </div>

        {/* DETALLE 1: YIELD */}
        {activeDetailTab === "yield" && yieldData && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Rendimiento por Orden de Producción</h3>
                <p className="text-xs text-slate-400">
                  Unidades producidas conformes vs unidades desviadas a Merma (Scrap).
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-slate-400">
                  Tasa de Aprobación de Inspecciones:{" "}
                  <strong className="text-emerald-400">{yieldData.inspectionApprovalRate.toFixed(1)}%</strong>
                </span>
                <span className="text-slate-400">
                  NCRs Activos: <strong className="text-rose-400">{yieldData.activeNcrsCount}</strong>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Orden #</th>
                    <th className="p-3">Lote Asignado</th>
                    <th className="p-3">Planificado</th>
                    <th className="p-3">Producido</th>
                    <th className="p-3">Scrap</th>
                    <th className="p-3">Yield (%)</th>
                    <th className="p-3">Estado OP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {yieldData.lotDetails.map((lot) => (
                    <tr key={lot.productionOrderId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-semibold text-white">{lot.orderNumber}</td>
                      <td className="p-3 font-mono text-amber-400">{lot.lotNumber}</td>
                      <td className="p-3">{lot.plannedQuantity} bolsas</td>
                      <td className="p-3 font-bold text-emerald-400">{lot.producedQuantity} bolsas</td>
                      <td className="p-3 text-rose-400">{lot.scrapQuantity} bolsas</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{lot.yieldPercent.toFixed(1)}%</span>
                          <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, lot.yieldPercent)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {lot.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DETALLE 2: COSTO UNITARIO */}
        {activeDetailTab === "cost" && costData && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Comparativa de Costo Unitario Real vs. Estándar (C$ {costData.officialStandardCost.toFixed(2)})
                </h3>
                <p className="text-xs text-slate-400">
                  Auditoría de variaciones de costo real por lote contra la estructura presupuestada oficial.
                </p>
              </div>
              <div className="text-xs text-slate-400">
                Moneda: <strong className="text-amber-400">{costData.currency}</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Lote de Fabricación</th>
                    <th className="p-3">OP #</th>
                    <th className="p-3">Cantidad</th>
                    <th className="p-3">Costo Total Real</th>
                    <th className="p-3">Costo Unit. Real</th>
                    <th className="p-3">Costo Unit. Estándar</th>
                    <th className="p-3">Varianza (C$)</th>
                    <th className="p-3">Dictamen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {costData.lotComparisons.map((c) => (
                    <tr key={c.productionOrderId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-amber-400">{c.lotNumber}</td>
                      <td className="p-3 font-semibold text-white">{c.orderNumber}</td>
                      <td className="p-3">{c.producedQuantity} bolsas</td>
                      <td className="p-3">C$ {c.totalActualCost.toFixed(2)}</td>
                      <td className="p-3 font-bold text-white">C$ {c.actualUnitCost.toFixed(2)}</td>
                      <td className="p-3 text-slate-400">C$ {c.standardUnitCost.toFixed(2)}</td>
                      <td className="p-3">
                        <span
                          className={`font-semibold ${
                            c.isFavorable ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {c.variance > 0 ? `+C$ ${c.variance.toFixed(2)}` : `-C$ ${Math.abs(c.variance).toFixed(2)}`} (
                          {c.variancePercent.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            c.isFavorable
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {c.isFavorable ? "Ahorro Favorable" : "Sobrecosto"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DETALLE 3: ROTACIÓN DE INVENTARIO */}
        {activeDetailTab === "turnover" && turnoverData && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Composición y Rotación de Inventarios</h3>
                <p className="text-xs text-slate-400">
                  Valorización de existencias y velocidad de consumo por categoría de material.
                </p>
              </div>
              <div className="text-xs text-slate-400">
                COGS Total: <strong className="text-emerald-400">${turnoverData.costOfGoodsSoldCogs.toLocaleString()}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {turnoverData.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{cat.category}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300">
                      {cat.turnoverRatio.toFixed(1)}x / año
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{cat.categoryName}</p>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Valor Stock:</span>
                    <strong className="text-white">${cat.currentStockValue.toLocaleString()}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Días en Mano:</span>
                    <strong className="text-amber-400">{cat.daysOnHand.toFixed(0)} días</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DETALLE 4: OEE Y TIEMPOS DE CICLO */}
        {activeDetailTab === "oee" && oeeData && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Desglose de Tiempos de Ciclo de Ruta (RO-1 a RO-8)</h3>
                <p className="text-xs text-slate-400">
                  Comparativa de minutos teóricos estándar vs minutos reales capturados en planta.
                </p>
              </div>
              <div className="text-xs text-slate-400">
                Tiempo Estándar Ruta: <strong className="text-indigo-400">{oeeData.standardRouteCycleMinutes} min</strong> (34.0 h)
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Operación</th>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Centro de Trabajo</th>
                    <th className="p-3">Estándar (min)</th>
                    <th className="p-3">Real Promedio (min)</th>
                    <th className="p-3">Eficiencia (%)</th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {oeeData.operationsCycleBreakdown.map((op) => (
                    <tr key={op.operationCode} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold text-amber-400 font-mono">{op.operationCode}</td>
                      <td className="p-3 font-semibold text-white">{op.operationName}</td>
                      <td className="p-3 text-slate-400">{op.workCenter}</td>
                      <td className="p-3">{op.totalStandardMinutes} min</td>
                      <td className="p-3 font-bold text-white">{op.totalActualMinutes} min</td>
                      <td className="p-3">
                        <span
                          className={`font-semibold ${
                            op.efficiencyPercent >= 90 ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {op.efficiencyPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
                          {op.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
