# AnÃ¡lisis de TelemetrÃ­a IIoT y Control de Procesos (M5)

## SimulaciÃ³n Acelerada de Secado (OperaciÃ³n RO-3)
La operaciÃ³n RO-3 (Secado TÃ©rmico) es el cuello de botella fÃ­sico de la planta de producciÃ³n. Para garantizar el cumplimiento del control de calidad RO-5:
* **Sensor TÃ©rmico (PT-100 / Termocupla):** Monitorea la temperatura en la cÃ¡mara del secador rotativo, manteniendo el rango Ã³ptimo de ^\circ\text{C} \pm 2^\circ\text{C}$.
* **Sensor de Humedad Capacitivo:** Registra la disminuciÃ³n exponencial de la humedad relativa del lecho de borra desde el 65.0% inicial hasta el 10.0% final requerido para la mezcla balanceada.
* **IntegraciÃ³n ISA-95:** Los paquetes de datos generados en tiempo real se almacenan en la tabla IiotTelemetryLogs vinculados a la orden de producciÃ³n activa y al lote en proceso.

## Dashboard Gerencial de Indicadores Clave (KPIs & OEE)

El mÃ³dulo de inteligencia operacional procesa 4 mÃ©tricas de alto impacto para la toma de decisiones:

1. **Rendimiento de Proceso (Yield = 98.0%):**
   Refleja la eficiencia de conversiÃ³n de materia prima seca en producto terminado. El scrap promedio se mantiene acotado al 2.0%, generado principalmente en pÃ©rdidas por molienda (RO-4) y envasado (RO-6).

2. **Costo Unitario de Manufactura (C\$ 90.11 por bolsa de 5 kg):**
   Compuesto por:
   * Costos Directos de Materiales (MP + Empaques): C\$ 48.50
   * Mano de Obra Directa (MOD en envasado y mezclado): C\$ 24.15
   * Costos Indirectos de FabricaciÃ³n (EnergÃ­a elÃ©ctrica y gas de secado): C\$ 17.46

3. **RotaciÃ³n de Inventario (2.50x por ciclo):**
   Indica una alta velocidad de evacuaciÃ³n del producto terminado en ALM-003 hacia el canal de distribuciÃ³n agrÃ­cola, evitando costos de almacenamiento prolongado y degradaciÃ³n orgÃ¡nica.

4. **Efectividad Global del Equipo (OEE = 85.0%):**
   * **Disponibilidad:** 92.0% (mantenimiento preventivo quincenal del secador y molino).
   * **Rendimiento:** 95.0% (operaciÃ³n a velocidad nominal del tambor rotativo).
   * **Calidad:** 97.2% (lotes conformes en primera pasada sin retrabajo).
   * $\text{OEE} = 0.92 \times 0.95 \times 0.972 \approx 85.0\%$ (Clase Mundial).