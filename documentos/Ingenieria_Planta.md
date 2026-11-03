# Balance de Masa y EnergÃ­a en Planta Industrial ReCoffee

## Balance de Materia Integral en la OperaciÃ³n RO-3 (Secado TÃ©rmico)

La borra de cafÃ© recolectada de cafeterÃ­as y centros de acopio ingresa con un elevado contenido de humedad debido al proceso de extracciÃ³n de cafÃ© espresso o filtrado. Para garantizar la estabilidad biolÃ³gica del abono, el contenido de humedad debe reducirse al 10.0%.

### Datos Base de FormulaciÃ³n:
* **Producto Terminado:** Bolsa de abono de 5 kg (`PT-001`).
* **Borra Seca Requerida por Bolsa:** 3.50 kg (70% de la formulaciÃ³n).
* **Humedad Inicial de la Borra HÃºmeda:** 65.0% (0.65).
* **Humedad Final de la Borra Seca:** 10.0% (0.10).

---

### EcuaciÃ³n de ConservaciÃ³n de SÃ³lidos Secos (CafÃ© Puro):
La masa de sÃ³lidos inertes secos no se destruye durante la evaporaciÃ³n tÃ©rmica:

$$m_{solidos} = m_{seco} \times (1 - H_{final})$$
$$m_{solidos} = 3.50\,\text{kg} \times (1 - 0.10) = 3.50 \times 0.90 = 3.15\,\text{kg de sÃ³lidos puros}$$

### Masa de Borra HÃºmeda que debe Ingresar al Secador:
$$m_{humeda} = \frac{m_{solidos}}{1 - H_{inicial}} = \frac{3.15\,\text{kg}}{1 - 0.65} = \frac{3.15}{0.35} = 9.00\,\text{kg de borra hÃºmeda por bolsa}$$

### Masa de Agua Evaporada a la AtmÃ³sfera:
$$m_{agua} = m_{humeda} - m_{seco} = 9.00\,\text{kg} - 3.50\,\text{kg} = 5.50\,\text{kg de vapor de agua por bolsa}$$

---

### Balance para un Lote TÃ­pico de ProducciÃ³n (Batch de 40 bolsas = 200 kg de PT):
* **Borra hÃºmeda total a recibir en ALM-001:** 40 * 9.00 kg = 360.0 kg
* **Borra seca obtenida a la salida de RO-3:** 40 * 3.50 kg = 140.0 kg
* **Agua total eliminada:** 40 * 5.50 kg = 220.0 kg de vapor de agua

## Takt Time y DiseÃ±o del Layout Industrial

### 1. CÃ¡lculo del Takt Time de la Planta
El Takt Time establece el ritmo al que la planta debe producir unidades terminadas para satisfacer con exactitud la demanda comercial sin incurrir en costos de almacenamiento ni quiebres de stock.

* **Demanda Programada:** 40 bolsas de 5 kg por semana.
* **Jornada Laboral:** 5 dÃ­as/semana, 1 turno/dÃ­a de 8 horas = 40 horas disponibles netas por semana (160 horas por mes productivo).
* **CÃ¡lculo:**
  $$\text{Takt Time} = \frac{\text{Tiempo Disponible de Trabajo}}{\text{Demanda del Cliente}} = \frac{160\,\text{horas}}{40\,\text{bolsas}} = 4.0\,\text{horas por bolsa}$$

El ciclo del secador rotativo continuo (`RO-3`) procesa el batch con un tiempo de residencia ajustado exactamente a 4.0 horas, logrando un flujo de lÃ­nea balanceado (Poka-Yoke de cadencia).

---

### 2. Tiempos de Ciclo por OperaciÃ³n (Ruta de Manufactura)
* **RO-1 (Pesaje y ClasificaciÃ³n):** 15 minutos / batch
* **RO-2 (Lavado y DesinfecciÃ³n):** 20 minutos / batch
* **RO-3 (Secado TÃ©rmico Rotativo):** 240 minutos (4.0 horas) â€” *Cuello de Botella Operativo*
* **RO-4 (Molienda Fina):** 30 minutos / batch
* **RO-5 (Mezclado HomogÃ©neo y Calidad):** 25 minutos / batch
* **RO-6 (Envasado y Sellado HermÃ©tico):** 30 minutos / batch

---

### 3. DistribuciÃ³n Espacial de la Planta (Layout Industrial)
La planta fÃ­sica de ReCoffee estÃ¡ dividida en tres naves interconectadas bajo un flujo unidireccional en "U" para evitar contaminaciÃ³n cruzada:

1. **Nave 1 - RecepciÃ³n y Secado:**
   * AlmacÃ©n de Materia Prima HÃºmeda (`ALM-001`).
   * Ãrea de descarga con rejillas de drenaje.
   * Secador rotativo industrial a gas GLP con chimenea de venteo.
2. **Nave 2 - Molienda, FormulaciÃ³n y Envasado:**
   * AlmacÃ©n de Ingredientes Secos y Materiales de Empaque (`ALM-002`).
   * Molino de martillos con extractor de partÃ­culas.
   * Mezcladora de listones en acero inoxidable para dosificaciÃ³n de micronutrientes (K, P, Ca).
   * LÃ­nea de ensacado con bÃ¡scula electrÃ³nica y selladora tÃ©rmica.
3. **Nave 3 - AlmacÃ©n de Producto Terminado y LogÃ­stica:**
   * AlmacÃ©n de Producto Terminado (`ALM-003`) con estanterÃ­as industriales.
   * Muelle de carga vehicular para despacho de Ã³rdenes de venta.