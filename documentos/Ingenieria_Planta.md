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