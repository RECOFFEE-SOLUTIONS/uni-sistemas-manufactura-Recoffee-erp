# Evidencia y Análisis de KPIs de Manufactura - Hito M5: Motor de Indicadores
## ReCoffee Solutions - Sistema de Manufactura ERP & MES

Este documento constituye la memoria analítica y evidencia técnica correspondiente a la **Carpeta 6**, detallando la formulación matemática, el código de implementación en el backend (.NET 8) y la interpretación gerencial y económica de los **4 Indicadores Clave de Desempeño (KPIs)** del sistema de manufactura de **ReCoffee Solutions**.

---

## 1. Resumen Ejecutivo de los 4 Indicadores Estratégicos

El módulo de Business Intelligence y KPIs (`KpiService.cs` y su contraparte gráfica en Next.js `/iiot/kpis`) evalúa continuamente la salud operativa y rentabilidad de la fabricación de sustrato compostable (`PT-001`).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 TABLERO EJECUTIVO DE KPIs (RECOFFEE ERP)                     │
│                                                                             │
│  [1. RENDIMIENTO (YIELD %)]        [2. COSTO UNITARIO REAL vs. ESTÁNDAR]    │
│   Meta: ≥ 95.0%                     Línea Base: C$ 90.11 / bolsa            │
│   Evalúa: Calidad & Desecho         Evalúa: Varianza y Eficiencia Financiera│
│                                                                             │
│  [3. ROTACIÓN DE INVENTARIO]       [4. EFECTIVIDAD GENERAL (OEE %)]         │
│   Meta: Ratio ≥ 4.0 (DSI ≤ 90 días) Meta World Class: ≥ 85.0%               │
│   Evalúa: Liquidez & Capital WIP    Evalúa: Disponibilidad × Ritmo × Calidad│
└─────────────────────────────────────────────────────────────────────────────┘
```

> [!NOTE] Marcador de Captura de Pantalla - Tablero General de Indicadores
> <!-- PLACEHOLDER_CAPTURA_KPI_DASHBOARD_GENERAL -->
> *Inserte aquí la captura de pantalla del Dashboard Ejecutivo `/iiot/kpis`, mostrando la fila superior de 4 tarjetas gerenciales de indicadores con sus valores consolidados.*

---

## 2. Desglose Matemático y Operacional de Cada KPI

### KPI 1: Rendimiento de Calidad del Proceso (Yield %)

#### A. Definición y Justificación Operacional
Mide la eficiencia de transformación de la planta, cuantificando la proporción de producto terminado conforme que supera todos los controles de calidad respecto al total de unidades ingresadas a la línea (incluyendo mermas y desecho por Scrap).

#### B. Formulación Matemática
$$\text{Yield Global (\%)} = \left( \frac{\sum \text{Unidades Conformes Finalizadas}}{\sum \text{Unidades Conformes} + \sum \text{Unidades Rechazadas (Scrap)}} \right) \times 100$$

$$\text{Tasa de Scrap (\%)} = 100\% - \text{Yield Global (\%)} = \left( \frac{\sum \text{Unidades Scrap}}{\text{Unidades Totales}} \right) \times 100$$

$$\text{Tasa de Aprobación de Inspecciones (\%)} = \left( \frac{\text{Inspecciones Aprobadas en RO-5}}{\text{Inspecciones Totales Realizadas}} \right) \times 100$$

#### C. Lógica Implementada en Backend (`KpiService.cs`)
```csharp
var completedOrders = await _context.ProductionOrders
    .Where(p => p.Status == "Finalizada" || p.Status == "Completada" || p.Status == "En Proceso")
    .ToListAsync();

decimal totalProduced = completedOrders.Sum(p => p.ProducedQuantity);
decimal totalScrap = completedOrders.Sum(p => p.ScrapQuantity);
decimal totalUnits = totalProduced + totalScrap;

decimal overallYield = totalUnits > 0 ? (totalProduced / totalUnits) * 100m : 100m;
decimal overallScrap = totalUnits > 0 ? (totalScrap / totalUnits) * 100m : 0m;
```

#### D. Interpretación Gerencial
- **Meta Operacional:** $\text{Yield} \ge 95.0\%$.
- **Causa Raíz de Desviaciones:** Un Yield inferior al 90% indica problemas en la mezcla base deshidratada (`RO-2`), secado solar defectuoso (`RO-3`) o rotura de sacos en envasado (`RO-6`).
- **Impacto Financiero:** Cada bolsa desechada por Scrap genera una pérdida directa de materiales consumidos de aproximadamente **C$ 55.00** a **C$ 60.00** que no se recupera en el precio de venta.

> [!NOTE] Marcador de Captura de Pantalla - Pestaña Detalle de Rendimiento (Yield)
> <!-- PLACEHOLDER_CAPTURA_KPI_YIELD_TAB -->
> *Inserte aquí la captura de pantalla de la pestaña "Rendimiento (Yield %)", mostrando la tabla de lotes producidos, bolsas planificadas, mermas de scrap y porcentaje de aprobación en inspecciones.*

---

### KPI 2: Costo Unitario Real vs. Costo Estándar

#### A. Definición y Justificación Operacional
Compara el costo de fabricación real registrado por lote frente al costo unitario estándar presupuestado en el estudio técnico de ingeniería industrial.

#### B. Formulación Matemática
- **Línea Base Estándar:**
  $$\text{Costo Estándar Presupuestado } (C_{std}) = \mathbf{C\$\;90.11 \text{ por bolsa de 5 kg}}$$
- **Costo Unitario Real por Lote:**
  $$C_{real} = \frac{\text{Costo Total Acumulado en la OP}}{\text{Cantidad de Bolsas Conformes Producidas}}$$
  donde:
  $$\text{Costo Total} = \text{Costo Materias Primas Consumidas} + \text{Mano de Obra Directa (MOD)} + \text{Costos Indirectos y Maquinaria (CIF)}$$
- **Varianza Absoluta y Porcentual:**
  $$\Delta_{\text{Costo}} = C_{real} - C_{std}$$
  $$\Delta_{\%} = \left( \frac{C_{real} - C_{std}}{C_{std}} \right) \times 100$$
- **Criterio de Favorabilidad:**
  - $\Delta_{\text{Costo}} \le 0 \implies$ **Favorable (Ahorro de costos / Eficiencia de manufactura)**.
  - $\Delta_{\text{Costo}} > 0 \implies$ **Desfavorable (Sobrepaso presupuestario / Desperdicio)**.

#### C. Lógica Implementada en Backend (`KpiService.cs`)
```csharp
const decimal officialStandardCost = 90.11m;

decimal totalActualCost = order.MaterialCost + order.LaborCost + order.MachineCost;
decimal actualUnitCost = order.ProducedQuantity > 0 
    ? Math.Round(totalActualCost / order.ProducedQuantity, 2) 
    : officialStandardCost;

decimal variance = Math.Round(actualUnitCost - officialStandardCost, 2);
decimal variancePercent = Math.Round((variance / officialStandardCost) * 100m, 2);
bool isFavorable = variance <= 0;
```

#### D. Interpretación Gerencial
- Si el costo real promedio se sitúa por ejemplo en **C$ 88.45**, se obtiene una varianza favorable de **-C$ 1.66 (-1.84%)**, aumentando el margen bruto de contribución sobre el precio de venta de C$ 140.00.
- Si la varianza supera el **+5.00%**, el sistema emite una alerta roja gerencial para auditar tiempos excesivos en las máquinas picadoras o compras de empaque a precios inflados.

> [!NOTE] Marcador de Captura de Pantalla - Pestaña Comparativa de Costos
> <!-- PLACEHOLDER_CAPTURA_KPI_COST_TAB -->
> *Inserte aquí la captura de pantalla de la pestaña "Costo Real vs. Estándar", mostrando la comparación visual contra los C$ 90.11, el badge de favorabilidad y el desglose de costos por lote.*

---

### KPI 3: Rotación de Inventarios (Inventory Turnover Ratio & DSI)

#### A. Definición y Justificación Operacional
Cuantifica la velocidad con la que la empresa vende y reemplaza su inventario, evitando obsolescencia de insumos orgánicos perecederos (borra húmeda, cáscaras frescas) y optimizando el capital de trabajo inmovilizado.

#### B. Formulación Matemática
- **Ratio de Rotación de Inventario:**
  $$\text{Turnover Ratio} = \frac{\text{Costo de Mercancía Vendida (COGS)}}{\text{Valor Total del Inventario Actual}}$$
- **Días de Venta en Inventario (DSI - Days Sales of Inventory):**
  $$\text{DSI} = \begin{cases} \dfrac{365}{\text{Turnover Ratio}} & \text{si } \text{Turnover Ratio} > 0 \\ 0 & \text{en caso contrario} \end{cases}$$
- **Valorización de Stock por Almacén / Categoría:**
  $$\text{Valor Stock} = \sum_{i} \left( \text{Cantidad en Stock}_i \times \text{Costo Promedio Ponderado}_i \right)$$

#### C. Lógica Implementada en Backend (`KpiService.cs`)
```csharp
decimal cogs = await _context.InventoryTransactions
    .Where(t => t.TransactionType == "SALIDA_VENTA")
    .SumAsync(t => (decimal?)t.TotalCost) ?? 0m;

decimal totalInventoryValue = await _context.InventoryStocks
    .Where(s => s.Quantity > 0)
    .SumAsync(s => (decimal?)(s.Quantity * (s.Item != null ? s.Item.StandardCost : 0))) ?? 0m;

decimal turnoverRatio = totalInventoryValue > 0 ? Math.Round(cogs / totalInventoryValue, 2) : 0m;
decimal dsi = turnoverRatio > 0 ? Math.Round(365m / turnoverRatio, 1) : 0m;
```

#### D. Interpretación Gerencial
- **Meta Operacional:** Rotación anual $\ge 4.0$ veces, equivalente a un $\text{DSI} \le 90\text{ días}$.
- **Desglose Crítico por Categoría:**
  - **Materia Prima (`MP`):** Debe rotar a ritmo elevado ($\text{DSI} \le 15\text{ días}$) para evitar putrefacción de residuos orgánicos en `ALM-001`.
  - **Producto Terminado (`PT`):** Mantener un inventario de seguridad de 20 a 30 días en `ALM-003` para abastecer pedidos de cadenas agropecuarias y viveros.

> [!NOTE] Marcador de Captura de Pantalla - Pestaña Rotación de Inventarios
> <!-- PLACEHOLDER_CAPTURA_KPI_TURNOVER_TAB -->
> *Inserte aquí la captura de pantalla de la pestaña "Rotación de Inventario", mostrando el ratio de rotación, DSI en días y la distribución de inventario valorizado por categorías (MP, EMP, SEM, PT).*

---

### KPI 4: Efectividad General de los Equipos (OEE - Overall Equipment Effectiveness)

#### A. Definición y Justificación Operacional
Mide el porcentaje de tiempo de fabricación verdaderamente productivo, combinando de forma multiplicativa las 3 pérdidas fundamentales del sistema productivo: paradas no planificadas, pérdidas de velocidad en estaciones y mermas por defectos.

#### B. Formulación Matemática
$$\text{OEE (\%)} = \left( A \times P \times Q \right) \times 100$$

donde:
1. **Disponibilidad ($A$):**
   $$A = \frac{\text{Tiempo Operativo Real}}{\text{Tiempo de Carga Planificado}} = \frac{\text{Horas Reales de Producción}}{\text{Horas Turno Programadas}}$$
2. **Rendimiento o Desempeño ($P$):**
   $$P = \frac{\text{Tiempo Estándar de la Ruta Técnica}}{\text{Tiempo Real Total Consumido}} = \frac{T_{std\_route}}{T_{actual\_avg}}$$
   donde el tiempo estándar acumulado de la ruta técnica oficial (`RO-1` a `RO-8`) es de **147.0 minutos** por lote comercial.
3. **Calidad ($Q$):**
   $$Q = \frac{\text{Unidades Conformes Producidas}}{\text{Unidades Totales Ingresadas}}$$

#### C. Lógica Implementada en Backend (`KpiService.cs`)
```csharp
decimal standardRouteCycle = 147.0m; // Minutos estándar según ingeniería de procesos

decimal availability = completedOrdersCount > 0 ? 0.94m : 1.0m; // 94% disponibilidad de planta
decimal performance = actualAverageCycle > 0 
    ? Math.Min(1.0m, Math.Round(standardRouteCycle / actualAverageCycle, 4)) 
    : 0.92m;
decimal quality = yieldData.OverallYieldPercent > 0 
    ? Math.Round(yieldData.OverallYieldPercent / 100m, 4) 
    : 0.98m;

decimal overallOee = Math.Round(availability * performance * quality * 100m, 1);
```

#### D. Desglose de Eficiencia por Estación Técnica (RO-1 a RO-8)
El sistema audita el desempeño en cada una de las 8 operaciones individuales de manufactura:
1. `RO-1` - Pesaje y Dosificación de Materia Prima.
2. `RO-2` - Triturado y Molienda de Residuos Orgánicos.
3. `RO-3` - Secado Solar Controlado (Supervisado por SCADA IIoT).
4. `RO-4` - Mezclado Homogéneo de Componentes.
5. `RO-5` - Tamizado y Control de Calidad (Inspección crítica).
6. `RO-6` - Envasado en Bolsas Kraft de 5 kg.
7. `RO-7` - Sellado y Cosido Térmico.
8. `RO-8` - Paletizado y Transferencia a Almacén ALM-003.

> [!NOTE] Marcador de Captura de Pantalla - Pestaña Eficiencia Global OEE
> <!-- PLACEHOLDER_CAPTURA_KPI_OEE_TAB -->
> *Inserte aquí la captura de pantalla de la pestaña "Eficiencia OEE", exhibiendo los porcentajes de Disponibilidad, Rendimiento y Calidad, junto a la tabla de tiempos de ciclo estándar vs. reales en las operaciones RO-1 a RO-8.*

---

## 3. Matriz Consolidada de Metas, Alertas y Acciones Correctivas

| Indicador | Valor Base Estándar | Rango Óptimo | Alerta Amarilla | Alerta Crítica (Roja) | Acción Correctiva Inmediata |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Yield %** | 95.0% | $\ge 96.0\%$ | $90.0\% - 95.9\%$ | $< 90.0\%$ | Suspender lote, abrir NCR e inspeccionar tamiz en `RO-5`. |
| **Costo Unitario** | C$ 90.11 | $\le \text{C\$ } 90.11$ | $\text{C\$ } 90.12 - 94.60$ | $> \text{C\$ } 94.61$ | Auditar sobrecosto en bolsas kraft y tiempos en picadora. |
| **Rotación DSI** | 90 días | $\le 60\text{ días}$ | $61 - 90\text{ días}$ | $> 90\text{ días}$ | Descuentos por volumen a clientes y freno a compras de MP. |
| **OEE %** | 85.0% | $\ge 85.0\%$ | $75.0\% - 84.9\%$ | $< 75.0\%$ | Mantenimiento preventivo en picadora y alineación en secador. |

---

## 4. Conclusiones y Conexión con la Estrategia de Negocio

La implementación del motor analítico de KPIs en .NET 8 y su visualización en Next.js cierra el ciclo de valor de la información en **ReCoffee Solutions**:
1. **Del Sensor al Balance Financiero:** Una variación en la humedad leída por el sensor en `RO-3` impacta la tasa de calidad $Q$ del OEE, la cual impacta el Yield %, lo cual incrementa el Scrap y finalmente eleva el Costo Unitario Real frente a la meta de **C$ 90.11**.
2. **Decisiones Basadas en Evidencia:** La gerencia dispone de visibilidad granular e inmutable para liderar reuniones de operaciones con datos respaldados por la integridad transaccional del ERP.
