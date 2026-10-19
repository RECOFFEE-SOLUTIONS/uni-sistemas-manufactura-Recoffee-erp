"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Flame,
  Droplets,
  Scale,
  Eye,
  RotateCcw,
  Trash2,
  RefreshCw,
  Search,
  Check,
  X,
  FileText,
  Clock,
  Layers,
} from "lucide-react";
import apiClient from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import {
  QualityInspection,
  NonConformanceReport,
  ProductionOrder,
  NcrDispositionResult,
} from "@/types";

export default function MesQualityPage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  // Estados del Formulario de Inspección
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | "">("");
  const [lotNumber, setLotNumber] = useState("");
  const [inspectorName, setInspectorName] = useState(user?.username || user?.email || "Control de Calidad");
  const [humidity, setHumidity] = useState<number | "">(18.5); // 15% - 25%
  const [weight, setWeight] = useState<number | "">(5.0); // 5.0kg
  const [appearance, setAppearance] = useState(
    "Textura granulada fina, color café oscuro homogéneo sin grumos."
  );
  const [ph, setPh] = useState<number | "">(6.5);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Historial de Inspecciones y NCRs
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "inspections" | "ncrs">("form");

  // Modal de Disposición Inmediata de NCR
  const [activeNcrModal, setActiveNcrModal] = useState<NonConformanceReport | null>(null);
  const [dispositionType, setDispositionType] = useState<"Retrabajo" | "Scrap">("Retrabajo");
  const [reworkInstructions, setReworkInstructions] = useState(
    "Reingreso a patio de secado solar (RO-3) y homogeneizado (RO-4) para estabilización de humedad."
  );
  const [scrapReason, setScrapReason] = useState("Lote irrecuperable por contaminación o defecto crítico.");
  const [isDisposing, setIsDisposing] = useState(false);

  // Límites técnicos de ReCoffee Solutions
  const minHumidity = 15.0;
  const maxHumidity = 25.0;
  const targetWeight = 5.0;
  const minWeight = 4.85;
  const maxWeight = 5.15;

  // Detección dinámica de desvíos en tiempo real
  const numHumidity = typeof humidity === "number" ? humidity : 0;
  const numWeight = typeof weight === "number" ? weight : 0;

  const isHumidityOutOfRange = numHumidity < minHumidity || numHumidity > maxHumidity;
  const isWeightOutOfRange = numWeight < minWeight || numWeight > maxWeight;
  const hasDeviation = isHumidityOutOfRange || isWeightOutOfRange;

  // Cargar datos iniciales
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [ordersRes, inspectionsRes, ncrsRes] = await Promise.all([
        apiClient.get<ProductionOrder[]>("/api/production/orders"),
        apiClient.get<QualityInspection[]>("/api/quality/inspections"),
        apiClient.get<NonConformanceReport[]>("/api/quality/ncrs"),
      ]);

      setOrders(ordersRes.data);
      setInspections(inspectionsRes.data);
      setNcrs(ncrsRes.data);

      // Si hay órdenes activas, seleccionar lote de la primera
      const activeOrder = ordersRes.data.find((o) => o.status === "En Proceso") || ordersRes.data[0];
      if (activeOrder && !lotNumber) {
        setSelectedOrderId(activeOrder.id);
        setLotNumber(activeOrder.lotNumber || `LOTE-${activeOrder.itemCode}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-001`);
      }
    } catch (err: unknown) {
      console.error(err);
      showToast("Error al cargar datos del módulo de calidad", "error");
    } finally {
      setIsLoading(false);
    }
  }, [lotNumber, showToast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Al cambiar orden seleccionada, actualizar lote correspondiente
  const handleOrderChange = (orderId: number) => {
    setSelectedOrderId(orderId);
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      setLotNumber(order.lotNumber || `LOTE-${order.itemCode}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-001`);
    }
  };

  // Registrar Inspección de Calidad
  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lotNumber.trim()) {
      showToast("Debes ingresar el número de lote a inspeccionar", "error");
      return;
    }

    if (typeof humidity !== "number" || typeof weight !== "number") {
      showToast("Humedad y peso son campos numéricos obligatorios", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        lotNumber: lotNumber.trim(),
        productionOrderId: selectedOrderId ? Number(selectedOrderId) : null,
        inspectorName: inspectorName.trim() || "Control de Calidad",
        humidityPercentage: humidity,
        weightKg: weight,
        appearance,
        ph: typeof ph === "number" ? ph : 6.5,
        notes,
        proposedActionIfRejected: dispositionType === "Scrap" ? "Scrap" : "Retrabajo",
      };

      const res = await apiClient.post<QualityInspection>("/api/quality/inspections", payload);
      const created = res.data;

      if (created.status === "Aprobado") {
        showToast(`Inspección ${created.inspectionCode} APROBADA satisfactoriamente`, "success");
      } else {
        showToast(
          `Inspección ${created.inspectionCode} RECHAZADA. Se generó el NCR ${created.ncrNumber || ""}`,
          "error"
        );
        // Cargar NCR generado y desplegar modal de disposición inmediata
        const ncrRes = await apiClient.get<NonConformanceReport[]>("/api/quality/ncrs");
        setNcrs(ncrRes.data);
        const latestNcr = ncrRes.data.find(
          (n) => n.qualityInspectionId === created.id || n.ncrNumber === created.ncrNumber
        );
        if (latestNcr) {
          setActiveNcrModal(latestNcr);
        }
      }

      await loadInitialData();
      setActiveTab("inspections");
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Error al registrar inspección técnica";
      showToast(errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ejecutar Disposición de NCR (Retrabajo o Scrap)
  const handleExecuteDisposition = async () => {
    if (!activeNcrModal) return;

    try {
      setIsDisposing(true);
      if (dispositionType === "Retrabajo") {
        const res = await apiClient.post<NcrDispositionResult>(
          `/api/quality/ncrs/${activeNcrModal.id}/dispose-rework`,
          {
            instructions: reworkInstructions,
            responsiblePerson: inspectorName,
            notes: "Retrabajo dictaminado desde panel de Control de Calidad",
          }
        );
        showToast(res.data.message, "success");
      } else {
        const res = await apiClient.post<NcrDispositionResult>(
          `/api/quality/ncrs/${activeNcrModal.id}/dispose-scrap`,
          {
            reason: scrapReason,
            responsiblePerson: inspectorName,
            notes: "Scrap dictaminado desde panel de Control de Calidad",
          }
        );
        showToast(res.data.message, "info");
      }

      setActiveNcrModal(null);
      await loadInitialData();
      setActiveTab("ncrs");
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Error al ejecutar disposición de NCR";
      showToast(errorMsg, "error");
    } finally {
      setIsDisposing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-amber-500 uppercase tracking-wider mb-1">
            <ClipboardCheck className="w-4 h-4" /> Módulo de Calidad & No Conformidades
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Inspección Técnica de Calidad (Paso RO-5)
          </h1>
          <p className="text-sm text-slate-400">
            Validación de parámetros fisicoquímicos (Humedad 15%-25%, Peso 5.0kg) y dictamen de No Conformidades (NCR).
          </p>
        </div>

        {/* Métricas rápidas */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Inspecciones</span>
            <div className="text-base font-bold text-white">{inspections.length}</div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">NCRs Abiertos</span>
            <div className="text-base font-bold text-rose-400">
              {ncrs.filter((n) => n.status !== "Cerrado").length}
            </div>
          </div>
          <button
            onClick={loadInitialData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex border-b border-slate-800 text-sm font-medium gap-2">
        <button
          onClick={() => setActiveTab("form")}
          className={`flex items-center gap-2 pb-3 px-3 transition-colors border-b-2 ${
            activeTab === "form"
              ? "border-amber-500 text-amber-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <ClipboardCheck className="w-4 h-4" /> Registrar Inspección RO-5
        </button>
        <button
          onClick={() => setActiveTab("inspections")}
          className={`flex items-center gap-2 pb-3 px-3 transition-colors border-b-2 ${
            activeTab === "inspections"
              ? "border-amber-500 text-amber-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Historial de Inspecciones ({inspections.length})
        </button>
        <button
          onClick={() => setActiveTab("ncrs")}
          className={`flex items-center gap-2 pb-3 px-3 transition-colors border-b-2 ${
            activeTab === "ncrs"
              ? "border-rose-500 text-rose-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Reportes de No Conformidad ({ncrs.length})
        </button>
      </div>

      {/* PESTAÑA 1: FORMULARIO DE INSPECCIÓN */}
      {activeTab === "form" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario Principal */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-amber-500" /> Parámetros de Calidad del Lote
            </h2>

            <form onSubmit={handleSubmitInspection} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Selector de OP */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Orden de Producción Asociada:
                  </label>
                  <select
                    value={selectedOrderId}
                    onChange={(e) => handleOrderChange(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Sin orden directa / Lote manual --</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} — {o.itemCode} ({o.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Número de Lote */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Identificador de Lote:
                  </label>
                  <input
                    type="text"
                    required
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    placeholder="Ej: LOTE-PT-001-20261018-001"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Inspector */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Responsable de Inspección:
                </label>
                <input
                  type="text"
                  required
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Parámetros Técnicos Críticos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                {/* Humedad */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-sky-400" /> Humedad (%)
                    </label>
                    <span className="text-[11px] text-slate-400">Rango: 15.0% - 25.0%</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={humidity}
                    onChange={(e) => setHumidity(e.target.value === "" ? "" : Number(e.target.value))}
                    className={`w-full bg-slate-900 border rounded-xl px-3 py-2.5 text-base font-bold focus:outline-none transition-colors ${
                      isHumidityOutOfRange
                        ? "border-rose-500 text-rose-400 bg-rose-950/20"
                        : "border-slate-700 text-white focus:border-emerald-500"
                    }`}
                  />
                  {isHumidityOutOfRange && (
                    <p className="text-xs text-rose-400 font-medium mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {numHumidity < minHumidity ? "Muestra reseca (< 15%)" : "Humedad excesiva (> 25%)"}
                    </p>
                  )}
                </div>

                {/* Peso */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-amber-400" /> Peso por Bolsa (kg)
                    </label>
                    <span className="text-[11px] text-slate-400">Meta: 5.0 kg ± 0.15</span>
                  </div>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={weight}
                    onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                    className={`w-full bg-slate-900 border rounded-xl px-3 py-2.5 text-base font-bold focus:outline-none transition-colors ${
                      isWeightOutOfRange
                        ? "border-rose-500 text-rose-400 bg-rose-950/20"
                        : "border-slate-700 text-white focus:border-emerald-500"
                    }`}
                  />
                  {isWeightOutOfRange && (
                    <p className="text-xs text-rose-400 font-medium mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {numWeight < minWeight ? "Bajo peso (< 4.85kg)" : "Sobrepeso (> 5.15kg)"}
                    </p>
                  )}
                </div>
              </div>

              {/* Apariencia y pH */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Evaluación de Apariencia:
                  </label>
                  <input
                    type="text"
                    value={appearance}
                    onChange={(e) => setAppearance(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">pH Medido:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={ph}
                    onChange={(e) => setPh(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Notas de Muestreo / Lote:
                </label>
                <textarea
                  rows={2}
                  placeholder="Observaciones adicionales del inspector de calidad..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Banner Dinámico de Advertencia si hay desvío */}
              {hasDeviation ? (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <span className="font-bold text-rose-200">
                      ¡Desviación Técnica Detectada! Lote Sujeto a No Conformidad
                    </span>
                    <p className="text-rose-300/90">
                      Al guardar, el estado de inspección será <strong>RECHAZADO</strong> y se generará
                      automáticamente el <strong>Reporte de No Conformidad (NCR)</strong>. Podrás elegir
                      inmediatamente la disposición (Retrabajo o Scrap).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center gap-2.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Parámetros dentro de la tolerancia técnica de ReCoffee Solutions. El lote será{" "}
                    <strong>APROBADO</strong>.
                  </span>
                </div>
              )}

              {/* Botón de Enviar */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${
                    hasDeviation
                      ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                  }`}
                >
                  <ClipboardCheck className="w-4 h-4" />
                  {isSubmitting
                    ? "Evaluando Parámetros..."
                    : hasDeviation
                    ? "Registrar Desvío y Generar NCR"
                    : "Registrar y Aprobar Inspección"}
                </button>
              </div>
            </form>
          </div>

          {/* Panel Lateral: Estándares Oficiales */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" /> Ficha Técnica Oficial (PT-001)
              </h3>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block mb-0.5">Parámetro 1: Humedad</span>
                  <div className="font-semibold text-white">15.00% a 25.00%</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Garantiza estabilidad biológica y previene proliferación fúngica.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block mb-0.5">Parámetro 2: Peso Neto</span>
                  <div className="font-semibold text-white">5.00 kg (± 0.15 kg)</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tolerancia legal de envasado en saco de papel Kraft multicapa.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block mb-0.5">Parámetro 3: Apariencia</span>
                  <div className="font-semibold text-white">Granulado Fino Homogéneo</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Color café oscuro sin aglomeraciones, aroma terroso característico.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-300/90 space-y-2">
              <span className="font-bold text-amber-200 block">Política de Calidad ReCoffee:</span>
              <p>
                Ningún lote con reporte de no conformidad activo puede ingresar a ALM-003 ni ser despachado a
                clientes. Todo desvío requiere disposición formal por Retrabajo o Scrap.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: HISTORIAL DE INSPECCIONES */}
      {activeTab === "inspections" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Registro Histórico de Inspecciones
            </h2>
            <span className="text-xs text-slate-400">Total: {inspections.length} registros</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Lote Inspeccionado</th>
                  <th className="p-3">Humedad</th>
                  <th className="p-3">Peso</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Inspector</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">NCR Asociado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {inspections.length > 0 ? (
                  inspections.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-semibold text-white">{i.inspectionCode}</td>
                      <td className="p-3 font-mono text-amber-400">{i.lotNumber}</td>
                      <td className="p-3">
                        <span
                          className={`font-semibold ${
                            i.humidityPercentage < minHumidity || i.humidityPercentage > maxHumidity
                              ? "text-rose-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {i.humidityPercentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-semibold ${
                            i.weightKg < minWeight || i.weightKg > maxWeight
                              ? "text-rose-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {i.weightKg.toFixed(2)} kg
                        </span>
                      </td>
                      <td className="p-3">
                        {i.status === "Aprobado" ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Aprobado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Rechazado
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300">{i.inspectorName}</td>
                      <td className="p-3 text-slate-400">{new Date(i.inspectionDate).toLocaleDateString()}</td>
                      <td className="p-3">
                        {i.ncrNumber ? (
                          <span className="font-mono text-rose-400 font-bold">{i.ncrNumber}</span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-500">
                      No hay inspecciones registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: REPORTES DE NO CONFORMIDAD (NCR) */}
      {activeTab === "ncrs" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" /> Registro de Reportes de No Conformidad (NCR)
            </h2>
            <span className="text-xs text-slate-400">Total: {ncrs.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">NCR #</th>
                  <th className="p-3">Lote Afectado</th>
                  <th className="p-3">Severidad</th>
                  <th className="p-3">Defecto Detectado</th>
                  <th className="p-3">Acción Propuesta</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Acciones de Disposición</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {ncrs.length > 0 ? (
                  ncrs.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-rose-400">{n.ncrNumber}</td>
                      <td className="p-3 font-mono text-amber-400">{n.lotNumber}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {n.severity}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs truncate text-slate-300">{n.defectDescription}</td>
                      <td className="p-3 text-slate-200">{n.proposedAction}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            n.status === "Cerrado"
                              ? "bg-slate-800 text-slate-400 border border-slate-700"
                              : n.status === "En Tratamiento"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse"
                          }`}
                        >
                          {n.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {n.status !== "Cerrado" ? (
                          <button
                            onClick={() => setActiveNcrModal(n)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm shadow-amber-500/20 flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Dictaminar
                          </button>
                        ) : (
                          <span className="text-slate-500 italic">Resuelto</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      No hay Reportes de No Conformidad registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE DISPOSICIÓN DE NO CONFORMIDAD (NCR) */}
      {activeNcrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-white text-base">
                  Disposición Técnica para {activeNcrModal.ncrNumber}
                </h3>
              </div>
              <button
                onClick={() => setActiveNcrModal(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Resumen del Defecto */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div>
                <span className="text-slate-500">Lote No Conforme:</span>{" "}
                <strong className="text-amber-400 font-mono">{activeNcrModal.lotNumber}</strong>
              </div>
              <div>
                <span className="text-slate-500">Desvío Detectado:</span>{" "}
                <strong className="text-rose-300">{activeNcrModal.defectDescription}</strong>
              </div>
            </div>

            {/* Opciones de Disposición */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">
                Selecciona la Disposición a Ejecutar:
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDispositionType("Retrabajo")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    dispositionType === "Retrabajo"
                      ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-950/20"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <RotateCcw className="w-5 h-5 mb-2 text-amber-400" />
                  <div className="font-bold text-sm text-white">Retrabajo</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Reactivar OP y operaciones de ruta (RO-3 / RO-4) para nuevo ciclo de secado o mezclado.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDispositionType("Scrap")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    dispositionType === "Scrap"
                      ? "bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-950/20"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <Trash2 className="w-5 h-5 mb-2 text-rose-400" />
                  <div className="font-bold text-sm text-white">Scrap (Merma)</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Salida de inventario WIP en ALM-002 hacia pérdida total y registro en Kardex.
                  </p>
                </button>
              </div>

              {/* Campos específicos según la disposición */}
              {dispositionType === "Retrabajo" ? (
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Instrucciones Técnicas de Retrabajo:
                  </label>
                  <textarea
                    rows={3}
                    value={reworkInstructions}
                    onChange={(e) => setReworkInstructions(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    El sistema reactivará automáticamente las operaciones MES necesarias y mantendrá el lote
                    bloqueado hasta una reinspección aprobada.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Justificación de Merma / Scrap:
                  </label>
                  <textarea
                    rows={3}
                    value={scrapReason}
                    onChange={(e) => setScrapReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
                  />
                  <p className="text-[11px] text-rose-400 mt-1">
                    Atención: Esta acción descontará físicamente los materiales en ALM-002 y registrará la
                    merma irreversible en el Kardex.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveNcrModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cerrar sin Dictamen
              </button>
              <button
                type="button"
                onClick={handleExecuteDisposition}
                disabled={isDisposing}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 transition-colors shadow-md disabled:opacity-50 ${
                  dispositionType === "Retrabajo"
                    ? "bg-amber-500 hover:bg-amber-400 shadow-amber-500/20"
                    : "bg-rose-500 hover:bg-rose-400 shadow-rose-500/20"
                }`}
              >
                {isDisposing
                  ? "Procesando Transacción..."
                  : dispositionType === "Retrabajo"
                  ? "Confirmar Retrabajo en Planta"
                  : "Confirmar Salida por Scrap"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
