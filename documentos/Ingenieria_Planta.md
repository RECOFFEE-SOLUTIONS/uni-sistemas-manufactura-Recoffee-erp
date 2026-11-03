# Balance de Masa y EnergÃ­a en Planta ReCoffee

## Balance de Materia en la OperaciÃ³n RO-3 (Secado TÃ©rmico)
Para formular una bolsa de 5 kg de abono terminado (PT-001), se requieren estrictamente **3.5 kg de borra de cafÃ© seca** con un contenido de humedad residual del **10.0%**.

La borra de cafÃ© recolectada de cafeterÃ­as y centros de acopio ingresa con un contenido de humedad inicial del **65.0%**.

### EcuaciÃ³n de Balance de SÃ³lidos Secos:
m_{\text{sÃ³lidos}} = m_{\text{seco}} \times (1 - H_{\text{final}}) = 3.5\,\text{kg} \times (1 - 0.10) = 3.15\,\text{kg de cafÃ© puro}

### CÃ¡lculo de Masa de Borra HÃºmeda a Alimentar ({\text{hÃºmeda}}$):
m_{\text{hÃºmeda}} = \frac{m_{\text{sÃ³lidos}}}{1 - H_{\text{inicial}}} = \frac{3.15\,\text{kg}}{1 - 0.65} = \frac{3.15}{0.35} = \mathbf{9.00\,\text{kg de borra hÃºmeda}}

### Masa de Agua Evaporada ({\text{agua}}$):
m_{\text{agua}} = 9.00\,\text{kg} - 3.50\,\text{kg} = \mathbf{5.50\,\text{kg de vapor de agua por bolsa}}

## Takt Time y DistribuciÃ³n de Planta (Layout Industrial)

### 1. CÃ¡lculo del Takt Time
* **Demanda de Mercado Programada:** 40 bolsas (5 kg) por semana de trabajo.
* **Tiempo Disponible de ProducciÃ³n:** 5 dÃ­as/semana $\times$ 8 horas/dÃ­a = 40 horas laborables netas (160 horas efectivas por lote mensual).
* **Takt Time Nominal:**
  \text{Takt Time} = \frac{\text{Tiempo Operativo Disponible}}{\text{Demanda Requerida}} = \frac{160\,\text{horas}}{40\,\text{bolsas}} = \mathbf{4.0\,\text{horas/bolsa}}

El ciclo de la operacion crÃ­tica RO-3 (Secado TÃ©rmico en lote de tambor) calza exactamente con la cadencia del Takt Time de la planta, asegurando flujo continuo sin sobreproducciÃ³n.

### 2. DistribuciÃ³n Espacial de la Planta (Layout)
La planta estÃ¡ estructurada en 3 naves funcionales comunicadas mediante pasillos de transporte de material:
* **Nave 1 - RecepciÃ³n y Secado:** Aloja el almacÃ©n ALM-001 (Materia Prima HÃºmeda), la estaciÃ³n de clasificaciÃ³n y el secador rotativo continuo (RO-3).
* **Nave 2 - Molienda, Mezclado y Envasado:** Zona limpia que contiene el molino de martillos (RO-4), la mezcladora de doble listÃ³n (RO-5) y la tolva dosificadora de envasado (RO-6).
* **Nave 3 - AlmacÃ©n de Producto Terminado y Despacho:** Contiene el almacÃ©n ALM-003, racks certificados para paletizado y muelle de carga vehicular para Ã³rdenes de venta.