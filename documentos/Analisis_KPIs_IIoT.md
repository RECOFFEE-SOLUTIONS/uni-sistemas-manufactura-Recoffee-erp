# AnÃ¡lisis de TelemetrÃ­a IIoT y Control de Procesos (M5)

## SimulaciÃ³n Acelerada y TelemetrÃ­a del Secador Rotativo (RO-3)

La operaciÃ³n unitaria de Secado TÃ©rmico (`RO-3`) constituye la etapa de mayor consumo energÃ©tico y control crÃ­tico de variables fÃ­sicas de la planta ReCoffee. 

### ParÃ¡metros de Monitoreo en Tiempo Real
* **Sensor TÃ©rmico (PT-100 / Termocupla Tipo K):** Mantiene la temperatura dentro de la cÃ¡mara de secado a 75Â°C +/- 2Â°C. Si la temperatura supera los 85Â°C, se activa el interlock de seguridad para prevenir la pirÃ³lisis de la materia orgÃ¡nica.
* **Sensor de Humedad Capacitivo de Alta Temperatura:** Mide la humedad del lecho granular de borra de cafÃ© en descenso continuo desde 65.0% inicial hasta el lÃ­mite normativo de 10.0%.

### Modelo MatemÃ¡tico de Secado en Lecho MÃ³vil
La tasa de pÃ©rdida de humedad sigue una ecuaciÃ³n de decaimiento exponencial conforme a la ley de secado en rÃ©gimen decreciente:

$$H(t) = H_{final} + (H_{inicial} - H_{final}) \cdot e^{-k \cdot t}$$

Donde:
* H_{inicial} = 65.0%
* H_{final} = 10.0%
* k = 0.0125 min^-1 (constante de secado experimental para borra de cafÃ© a 75Â°C)
* t = tiempo de residencia efectivo (240 minutos nominales)

### Formato del Paquete de TelemetrÃ­a JSON (EstÃ¡ndar MQTT / HTTP)
```json
{
  "productionOrderId": 1,
  "lotNumber": "LOT-MP-001-SEC",
  "operationCode": "RO-3",
  "sensorId": "SENSOR-TEMP-DRY-01",
  "temperatureCelsius": 75.4,
  "moisturePercent": 10.2,
  "timestamp": "2026-10-21T14:35:00Z"
}
```

## Dashboard de KPIs Operacionales y Efectividad Global del Equipo (OEE)

El mÃ³dulo M5 consolida los datos del piso de planta y los traduce en indicadores de desempeÃ±o gerencial:

### 1. Rendimiento de Manufactura (Yield = 98.0%)
* **FÃ³rmula:** Yield = (Cantidad Producida Conforme / Cantidad Planeada Total) * 100%
* **InterpretaciÃ³n:** De un batch programado de 40 bolsas de abono, se obtienen 39.2 unidades equivalentes netas conformes. Las mermas (2.0%) se originan en polvo fino retenido en el ciclÃ³n de molienda (`RO-4`) y residuos en la tolva de envasado (`RO-6`).

### 2. Estructura de Costo Unitario de ProducciÃ³n (C$ 90.11 por bolsa de 5 kg)
* **Materia Prima Directa (MP):** C$ 39.50 (Mezcla de borra seca, plÃ¡tano, papa y cÃ¡scara de huevo)
* **Materiales de Empaque (EMP):** C$ 9.00 (Bolsa Kraft 5 kg C$ 6.00 + Etiqueta C$ 3.00)
* **Mano de Obra Directa (MOD):** C$ 24.15 (Operarios en recepciÃ³n, envasado y sellado)
* **Costos Indirectos de FabricaciÃ³n (CIF):** C$ 17.46 (Gas GLP de secador, electricidad y mantenimiento)
* **Costo Total:** C$ 90.11 por bolsa de 5 kg. Margen bruto al precio de venta de C$ 150.00: 39.9%.

### 3. RotaciÃ³n de Inventarios (2.50x por ciclo mensual)
Indica que el inventario promedio de producto terminado se renueva 2.5 veces al mes (cada 12 dÃ­as), lo que previene la compactaciÃ³n y la humedad fÃºngica en el almacÃ©n `ALM-003`.

### 4. Desglose del OEE (Overall Equipment Effectiveness = 85.0%)
La lÃ­nea piloto de ReCoffee opera bajo estÃ¡ndares de manufactura de clase mundial (World Class Manufacturing):

$$\text{OEE} = \text{Disponibilidad} \times \text{Rendimiento} \times \text{Calidad}$$

* **Disponibilidad (92.0%):** Tiempo de operaciÃ³n real frente al tiempo planificado. Se descuentan 3.2 horas semanales para limpieza de tambor y mantenimiento preventivo.
* **Rendimiento (95.0%):** Velocidad real de procesamiento respecto a la capacidad nominal del secador y molino (pÃ©rdidas mÃ­nimas por carga manual).
* **Calidad (97.2%):** Unidades conformes que aprueban la inspecciÃ³n `RO-5` sin requerir retrabajo por humedad fuera de norma.
* **CÃ¡lculo:** OEE = 0.92 * 0.95 * 0.972 = 85.0%.