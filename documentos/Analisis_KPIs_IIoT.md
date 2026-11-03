# AnÃ¡lisis de TelemetrÃ­a IIoT y Control de Procesos (M5)

## SimulaciÃ³n Acelerada de Secado (OperaciÃ³n RO-3)
La operaciÃ³n RO-3 (Secado TÃ©rmico) es el cuello de botella fÃ­sico de la planta de producciÃ³n. Para garantizar el cumplimiento del control de calidad RO-5:
* **Sensor TÃ©rmico (PT-100 / Termocupla):** Monitorea la temperatura en la cÃ¡mara del secador rotativo, manteniendo el rango Ã³ptimo de ^\circ\text{C} \pm 2^\circ\text{C}$.
* **Sensor de Humedad Capacitivo:** Registra la disminuciÃ³n exponencial de la humedad relativa del lecho de borra desde el 65.0% inicial hasta el 10.0% final requerido para la mezcla balanceada.
* **IntegraciÃ³n ISA-95:** Los paquetes de datos generados en tiempo real se almacenan en la tabla IiotTelemetryLogs vinculados a la orden de producciÃ³n activa y al lote en proceso.