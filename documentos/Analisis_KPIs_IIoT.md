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