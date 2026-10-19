"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Radio,
  Activity,
  Droplets,
  Thermometer,
  Clock,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertCircle,
  Flame,
  Sun,
  Layers,
  Pause,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import apiClient from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { IiotTelemetryItem, ProductionOrder } from "@/types";

interface ChartDataPoint {
  time: string;
  moisture: number;
  temperature: number;
  step?: number;
  lotNumber: string;
}

export default function IiotSensorPage() {
  const { showToast } = useToast();

  const [telemetryHistory, setTelemetryHistory] = useState<IiotTelemetryItem[]>([]);
  const [latestItem, setLatestItem] = useState<IiotTelemetryItem | null>(null);
  const [activeOrders, setActiveOrders] = useState<ProductionOrder[]>([]);
  const [selectedLot, setSelectedLot] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(3);
  const [isSimulatingInUi, setIsSimulatingInUi] = useState(false);

  const simulationStepRef = useRef<number>(1);

  // Cargar historial de telemetría desde el backend
  const loadTelemetry = useCallback(async (lot?: string) => {
    try {
      setIsLoading(true);
      const params: Record<string, string | number> = { limit: 50 };
      if (lot) params.lotNumber = lot;

      const [historyRes, latestRes] = await Promise.all([
        apiClient.get<IiotTelemetryItem[]>("/api/iiot/telemetry/history", { params }),
        apiClient.get<IiotTelemetryItem>("/api/iiot/telemetry/latest", {
          params: lot ? { lotNumber: lot } : {},
        }).catch(() => ({ data: null })),
      ]);

      setTelemetryHistory(historyRes.data);
      if (latestRes.data) {
        setLatestItem(latestRes.data);
      } else if (historyRes.data.length > 0) {
        setLatestItem(historyRes.data[historyRes.data.length - 1]);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar órdenes activas
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await apiClient.get<ProductionOrder[]>("/api/production/orders");
        setActiveOrders(res.data);
        const inProcess = res.data.find((o) => o.status === "En Proceso") || res.data[0];
        if (inProcess && inProcess.lotNumber) {
          setSelectedLot(inProcess.lotNumber);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchOrders();
  }, []);

  // Cargar datos al montar y al cambiar de lote
  useEffect(() => {
    loadTelemetry(selectedLot);
  }, [selectedLot, loadTelemetry]);

  // Polling automático para telemetría en vivo
  useEffect(() => {
    if (!isLiveActive || autoRefreshSec <= 0) return;

    const interval = setInterval(() => {
      loadTelemetry(selectedLot);
    }, autoRefreshSec * 1000);

    return () => clearInterval(interval);
  }, [isLiveActive, autoRefreshSec, selectedLot, loadTelemetry]);

  // Disparar un ciclo de simulación interactiva directo desde la UI
  const handleTriggerSimulatedReading = async () => {
    try {
      setIsSimulatingInUi(true);
      const step = simulationStepRef.current;
      simulationStepRef.current = (step % 32) + 1;

      // Descenso logarítmico: M(t) = 14 + (65 - 14) * exp(-0.07185 * t)
      const idealMoisture = 14.0 + 51.0 * Math.exp(-0.07185 * (step - 1));
      const simulatedMoisture = Number(Math.max(18.0, Math.min(65.0, idealMoisture + (Math.random() * 0.4 - 0.2))).toFixed(2));

      // Variación térmica diurna (24°C a 44°C)
      const hourOfDay = (step + 7) % 24;
      const solarFactor = hourOfDay >= 6 && hourOfDay <= 18 ? Math.sin(((hourOfDay - 6) * Math.PI) / 12) : 0;
      const simulatedTemp = Number((25.0 + 18.0 * solarFactor + (Math.random() * 1.5 - 0.75)).toFixed(2));

      const lot = selectedLot || `LOTE-PT-001-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-001`;

      const payload = {
        lotNumber: lot,
        operationCode: "RO-3",
        sensorId: "SENSOR-RO3-SOLAR-01",
        temperatureCelsius: simulatedTemp,
        moisturePercent: simulatedMoisture,
        timestamp: new Date().toISOString(),
        step,
        totalSteps: 32,
      };

      await apiClient.post("/api/iiot/telemetry", payload);
      showToast(`Telemetría inyectada: Humedad ${simulatedMoisture}%, Temp ${simulatedTemp}°C`, "success");
      await loadTelemetry(selectedLot);
    } catch (err: unknown) {
      showToast("Error al emitir telemetría simulada", "error");
    } finally {
      setIsSimulatingInUi(false);
    }
  };

  // Formatear datos para el gráfico de Recharts
  const chartData: ChartDataPoint[] = telemetryHistory.map((item, idx) => {
    const dateObj = new Date(item.timestamp);
    const timeFormatted = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      : `Paso ${idx + 1}`;

    return {
      time: timeFormatted,
      moisture: Number(item.moisturePercent),
      temperature: Number(item.temperatureCelsius),
      step: idx + 1,
      lotNumber: item.lotNumber,
    };
  });

  const isTargetAchieved = latestItem && latestItem.moisturePercent <= 20.0;

  return (
    <div className="space-y-6">
      {/* Encabezado SCADA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" /> Telemetría IIoT en Vivo — Patio de Secado Solar (RO-3)
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Monitor SCADA & Curva Cinética de Secado
          </h1>
          <p className="text-sm text-slate-400">
            Adquisición continua de humedad y gradiente térmico desde sensor IoT industrial (SENSOR-RO3-SOLAR-01).
          </p>
        </div>

        {/* Controles de Telemetría */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Lote */}
          <select
            value={selectedLot}
            onChange={(e) => setSelectedLot(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="">-- Todos los Lotes Monitoreados --</option>
            {activeOrders.map((o) => (
              <option key={o.id} value={o.lotNumber || ""}>
                {o.orderNumber} ({o.lotNumber || "Sin Lote"})
              </option>
            ))}
          </select>

          {/* Toggle Live */}
          <button
            onClick={() => setIsLiveActive((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
              isLiveActive
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            }`}
          >
            {isLiveActive ? (
              <>
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> Live (Auto {autoRefreshSec}s)
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" /> Pausado
              </>
            )}
          </button>

          {/* Botón Simular Paso en Vivo */}
          <button
            onClick={handleTriggerSimulatedReading}
            disabled={isSimulatingInUi}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-md shadow-amber-500/20 disabled:opacity-50"
            title="Emitir lectura de prueba hacia el Webhook .NET"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isSimulatingInUi ? "Inyectando..." : "Emitir Pulso IoT"}
          </button>

          <button
            onClick={() => loadTelemetry(selectedLot)}
            disabled={isLoading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* TARJETAS DE LECTURA EN TIEMPO REAL */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tarjeta 1: Humedad Actual */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Humedad Actual</span>
            <Droplets className="w-4 h-4 text-sky-400" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {latestItem ? `${latestItem.moisturePercent.toFixed(1)}%` : "--.-%"}
            </span>
            <span className="text-xs text-slate-400">Objetivo: &le; 20%</span>
          </div>

          {/* Barra de progreso de humedad */}
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isTargetAchieved ? "bg-emerald-500" : "bg-sky-500"
              }`}
              style={{ width: `${Math.min(100, (latestItem?.moisturePercent || 65) * 1.4)}%` }}
            />
          </div>

          <div className="pt-1 flex items-center justify-between text-[11px]">
            <span className={isTargetAchieved ? "text-emerald-400 font-bold" : "text-amber-400"}>
              {isTargetAchieved ? "🎯 Meta de Calidad Cumplida" : "En Deshidratación Solar"}
            </span>
            <span className="text-slate-500">Inicial: 65%</span>
          </div>
        </div>

        {/* Tarjeta 2: Temperatura de Cama Solar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Temperatura Lecho</span>
            <Thermometer className="w-4 h-4 text-amber-400" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400 tracking-tight">
              {latestItem ? `${latestItem.temperatureCelsius.toFixed(1)}°C` : "--.-°C"}
            </span>
            <span className="text-xs text-slate-400">Ambiente Solar</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-amber-300/80 pt-1">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Gradiente diurno activo (22°C - 45°C)</span>
          </div>
        </div>

        {/* Tarjeta 3: Lote y Sensor Activo */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Dispositivo Sensor</span>
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="font-mono font-bold text-white text-sm truncate">
            {latestItem?.sensorId || "SENSOR-RO3-SOLAR-01"}
          </div>

          <div className="text-xs text-slate-400">
            Lote Monitoreado:{" "}
            <strong className="text-amber-400 font-mono block truncate">
              {latestItem?.lotNumber || "Esperando señal..."}
            </strong>
          </div>
        </div>

        {/* Tarjeta 4: Estado del Proceso de Secado */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Estado Operación RO-3</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="mt-1">
            {isTargetAchieved ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" /> Secado Completado (&le;20%)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30 animate-pulse">
                <Flame className="w-4 h-4" /> Deshidratación Activa
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400 pt-1">
            Última telemetría:{" "}
            {latestItem ? new Date(latestItem.timestamp).toLocaleTimeString() : "--:--:--"}
          </p>
        </div>
      </div>

      {/* GRÁFICO PRINCIPAL DE LA CURVA DE SECADO IIOT (RECHARTS) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" /> Curva Cinética de Deshidratación Solar (Humedad vs Temperatura)
            </h2>
            <p className="text-xs text-slate-400">
              Descenso logarítmico de humedad (%) con variaciones térmicas diurnas de cama solar (°C).
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-sky-400">
              <div className="w-3 h-3 rounded-full bg-sky-400" />
              <span>Humedad (%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <span>Temperatura (°C)</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <div className="w-3 h-0.5 bg-rose-400" />
              <span>Límite Calidad (20%)</span>
            </div>
          </div>
        </div>

        {/* Gráfico Recharts con Doble Eje Y */}
        <div className="w-full h-80 pt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                {/* Eje Y1: Humedad (0% a 70%) */}
                <YAxis
                  yAxisId="left"
                  domain={[10, 70]}
                  stroke="#38bdf8"
                  fontSize={11}
                  tickFormatter={(val) => `${val}%`}
                  tickLine={false}
                />
                {/* Eje Y2: Temperatura (15°C a 55°C) */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[15, 55]}
                  stroke="#fbbf24"
                  fontSize={11}
                  tickFormatter={(val) => `${val}°C`}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#090d16",
                    borderColor: "#334155",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                    color: "#f8fafc",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                  }}
                  formatter={(value: any, name: any) => {
                    const num = typeof value === "number" ? value : Number(value);
                    if (name === "Humedad (%)") return [`${num.toFixed(1)}%`, "Humedad"];
                    if (name === "Temperatura (°C)") return [`${num.toFixed(1)}°C`, "Temperatura"];
                    return [num, name];
                  }}
                  labelFormatter={(label) => `Hora / Lectura: ${label}`}
                />
                <ReferenceLine
                  yAxisId="left"
                  y={20}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  label={{
                    value: "Meta de Calidad: 20%",
                    fill: "#f43f5e",
                    fontSize: 10,
                    position: "insideTopLeft",
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="moisture"
                  name="Humedad (%)"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: "#38bdf8" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="temperature"
                  name="Temperatura (°C)"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  dot={{ r: 2, fill: "#fbbf24" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs space-y-2">
              <Radio className="w-8 h-8 text-slate-600 animate-pulse" />
              <p>Esperando telemetría del simulador IIoT o haz clic en &quot;Emitir Pulso IoT&quot;.</p>
              <button
                onClick={handleTriggerSimulatedReading}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm"
              >
                Disparar Primera Lectura
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TABLA DE ÚLTIMAS 10 LECTURAS REGISTRADAS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" /> Registro Detallado de Paquetes Recibidos
          </h3>
          <span className="text-xs text-slate-400">Total en sesión: {telemetryHistory.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-2.5">ID</th>
                <th className="p-2.5">Sensor</th>
                <th className="p-2.5">Lote Asociado</th>
                <th className="p-2.5">Humedad (%)</th>
                <th className="p-2.5">Temperatura (°C)</th>
                <th className="p-2.5">Condición de Calidad</th>
                <th className="p-2.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {telemetryHistory.slice(-10).reverse().map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-2.5 font-mono text-slate-400">{t.id}</td>
                  <td className="p-2.5 text-slate-200">{t.sensorId}</td>
                  <td className="p-2.5 font-mono text-amber-400 font-semibold">{t.lotNumber}</td>
                  <td className="p-2.5 font-bold text-sky-400">{Number(t.moisturePercent).toFixed(2)}%</td>
                  <td className="p-2.5 font-bold text-amber-400">{Number(t.temperatureCelsius).toFixed(2)}°C</td>
                  <td className="p-2.5">
                    {t.moisturePercent <= 20.0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Meta Alcanzada (&le;20%)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        Secando ({Number(t.moisturePercent).toFixed(1)}%)
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-slate-400">
                    {new Date(t.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
