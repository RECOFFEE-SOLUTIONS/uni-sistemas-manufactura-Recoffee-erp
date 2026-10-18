# Evidencia de Ejecución E2E - Hito M3: Flujo Transaccional
## ReCoffee Solutions - Sistema de Manufactura ERP & MES

Este documento constituye la evidencia técnica, operacional y documental del **Flujo Transaccional E2E** correspondiente a la **Carpeta 3** del proyecto de sistemas de manufactura para **ReCoffee Solutions**.

---

## 1. Alcance y Caso de Estudio

El caso de estudio demuestra la trazabilidad completa, de punta a punta, para la **fabricación y venta de un lote comercial de 40 bolsas** de producto terminado:
- **Producto:** `PT-001` - ReCoffee Sustrato Compostable (Bolsa de 5 kg).
- **Meta Productiva:** 40 bolsas (200 kg netos de sustrato).
- **Flujo de Almacenes:**
  - `ALM-001`: Almacén de Materia Prima (Recepción de borra de café y cáscaras).
  - `ALM-004`: Almacén de Empaques e Insumos (Recepción de bolsas kraft y etiquetas).
  - `ALM-002`: Almacén de Trabajo en Proceso / WIP (Piso de planta).
  - `ALM-003`: Almacén de Ventas y Despacho (Producto Terminado listo para entrega).

---

## 2. Balance de Masas y Explosión de Materiales (BOM)

Para producir las **40 bolsas de PT-001**, el motor de ingeniería ejecutó la siguiente explosión multinivel:

| Código | Descripción | Cantidad Unitaria (1 bolsa) | Total Requerido (40 bolsas) | Almacén Origen | Lote Asignado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MP-001** | Borra de Café Procesada | 3.50 kg | **140.00 kg** | ALM-001 | `LOTE-MP-001-E2E-01` |
| **MP-002** | Cáscara de Banano | 0.50 kg | **20.00 kg** | ALM-001 | `LOTE-MP-002-E2E-01` |
| **MP-003** | Cáscara de Papa | 0.50 kg | **20.00 kg** | ALM-001 | `LOTE-MP-003-E2E-01` |
| **MP-004** | Cáscara de Huevo | 0.50 kg | **20.00 kg** | ALM-001 | `LOTE-MP-004-E2E-01` |
| **EMP-001**| Bolsa Kraft Biodegradable 5kg | 1.00 und | **40.00 und** | ALM-004 | `LOTE-EMP-001-E2E-01` |
| **EMP-002**| Etiqueta Identificadora ReCoffee | 1.00 und | **40.00 und** | ALM-004 | `LOTE-EMP-002-E2E-01` |
| **SEM-001**| Mezcla Base Deshidratada | 5.00 kg | **200.00 kg** | ALM-002 (WIP) | Subensamble en Proceso |
| **PT-001** | ReCoffee Sustrato Compostable 5kg | 1.00 bolsa | **40.00 bolsas** | ALM-003 | `LOTE-PT-001-E2E-001` |

---

## 3. Cronología Transaccional y Marcadores de Capturas UI

A continuación se detalla la secuencia de las transacciones operativas ejecutadas en el ERP, junto con los marcadores de posición (**Placeholders**) donde el equipo insertará las capturas de pantalla de la interfaz gráfica desarrollada en Next.js.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FLUJO TRANSACCIONAL E2E (M3)                         │
│                                                                             │
│  [1. COMPRAS] ────────► [2. INVENTARIOS] ───────► [3. PRODUCCIÓN]          │
│   Órdenes OC-E2E         Entrada a ALM-001/004     Explosión BOM            │
│   Recepción Física       Lotes generados           Consumo a WIP (ALM-002)  │
│                                                              │              │
│  [5. CLIENTES] ◄─────── [4. VENTAS/DESPACHO] ◄───────────────┘              │
│   Entregas CLI-001/002   Despacho con FIFO         Entrada a ALM-003        │
│   Salida en Kardex       Lote LOTE-PT-001-E2E-001  40 bolsas terminadas     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Fase 1: Abastecimiento y Recepción de Mercancía (Compras)

1. **Orden de Compra `OC-E2E-0001`**:
   - **Proveedor:** `PROV-001` (Beneficio Central La Finca).
   - **Artículos:** 200 kg de Borra de Café (`MP-001`).
   - **Lote Generado:** `LOTE-MP-001-E2E-01` ingresado a `ALM-001`.
   - **Monto Total:** C$ 2,000.00.

2. **Orden de Compra `OC-E2E-0002`**:
   - **Proveedor:** `PROV-002` (Distribuidora Agrícola El Mayoreo).
   - **Artículos:** 50 kg de Banano (`MP-002`), 50 kg de Papa (`MP-003`), 50 kg de Huevo (`MP-004`).
   - **Lotes Generados:** `LOTE-MP-002-E2E-01`, `LOTE-MP-003-E2E-01`, `LOTE-MP-004-E2E-01` en `ALM-001`.
   - **Monto Total:** C$ 700.00.

3. **Orden de Compra `OC-E2E-0003`**:
   - **Proveedor:** `PROV-004` (Empaques Ecológicos de Nicaragua).
   - **Artículos:** 100 bolsas kraft (`EMP-001`) y 100 etiquetas (`EMP-002`).
   - **Lotes Generados:** `LOTE-EMP-001-E2E-01` y `LOTE-EMP-002-E2E-01` en `ALM-004`.
   - **Monto Total:** C$ 650.00.

> [!NOTE]
> **Captura de Pantalla 1 - Listado de Órdenes de Compra y Recepción**
> 
> *Ruta UI:* `/transactions/purchases`
> 
> ![CAPTURA_1_ORDENES_COMPRA](placeholder_captura_1_ordenes_compra.png)
> *(Espacio reservado para captura de pantalla de la tabla de órdenes de compra en estado 'Recibida')*

> [!NOTE]
> **Captura de Pantalla 2 - Detalle de Recepción Física y Lotes Generados**
> 
> *Ruta UI:* `/transactions/purchases` (Modal Ver Detalle)
> 
> ![CAPTURA_2_RECEPCION_LOTES](placeholder_captura_2_recepcion_lotes.png)
> *(Espacio reservado para captura del modal con los lotes oficiales generados por línea)*

---

### Fase 2: Fabricación MES en Planta (Orden de Producción)

1. **Creación de Orden de Producción `OP-E2E-0040`**:
   - **Meta:** 40 bolsas de `PT-001`.
   - **Costo Estimado de Fabricación:** C$ 1,940.00 (C$ 48.50 por bolsa).

2. **Inicio de Producción y Consumo a WIP**:
   - Validación transaccional de existencias en `ALM-001` y `ALM-004`.
   - Salida automática de 140 kg de café, 20 kg banano, 20 kg papa, 20 kg huevo, 40 bolsas kraft y 40 etiquetas.
   - Transferencia a Trabajo en Proceso (WIP en `ALM-002`).

3. **Finalización de la Orden de Producción**:
   - Culminación de las operaciones de molienda, mezcla, secado solar y empaque.
   - Descarga de WIP de `ALM-002` (Kardex: `SALIDA_WIP`).
   - Generación de lote oficial: `LOTE-PT-001-E2E-001`.
   - Ingreso de las **40 bolsas conformes** a `ALM-003` (Kardex: `ENTRADA_PRODUCCION`).

> [!NOTE]
> **Captura de Pantalla 3 - Tablero Kanban de Producción (En Proceso / Completada)**
> 
> *Ruta UI:* `/transactions/production`
> 
> ![CAPTURA_3_KANBAN_PRODUCCION](placeholder_captura_3_kanban_produccion.png)
> *(Espacio reservado para captura del tablero Kanban interactivo con la orden OP-E2E-0040)*

> [!NOTE]
> **Captura de Pantalla 4 - Modal de Finalización y Acreditación de Lote en ALM-003**
> 
> *Ruta UI:* `/transactions/production` (Modal Finalizar Orden)
> 
> ![CAPTURA_4_CIERRE_PRODUCCION](placeholder_captura_4_cierre_produccion.png)
> *(Espacio reservado para captura del modal de culminación mostrando el lote de salida en ALM-003)*

---

### Fase 3: Comercialización y Despacho FIFO (Ventas)

Se comercializó el lote completo de 40 bolsas distribuyéndolo entre dos clientes estratégicos:

1. **Orden de Venta `OV-E2E-0001`**:
   - **Cliente:** `CLI-001` (Vivero Orgánico El Roble).
   - **Cantidad Solicitada:** 25 bolsas de `PT-001`.
   - **Despacho FIFO:** Asignación de 25 bolsas del lote `LOTE-PT-001-E2E-001` desde `ALM-003`.
   - **Facturación:** C$ 1,875.00 (Precio C$ 75.00/bolsa).
   - **Estado:** Despachada.

2. **Orden de Venta `OV-E2E-0002`**:
   - **Cliente:** `CLI-002` (AgroComercial del Norte S.A.).
   - **Cantidad Solicitada:** 15 bolsas de `PT-001`.
   - **Despacho FIFO:** Asignación de las 15 bolsas restantes del lote `LOTE-PT-001-E2E-001` desde `ALM-003`.
   - **Facturación:** C$ 1,125.00.
   - **Estado:** Despachada.

> [!NOTE]
> **Captura de Pantalla 5 - Pantalla de Gestión de Órdenes de Venta**
> 
> *Ruta UI:* `/transactions/sales`
> 
> ![CAPTURA_5_ORDENES_VENTA](placeholder_captura_5_ordenes_venta.png)
> *(Espacio reservado para captura de las órdenes OV-E2E-0001 y OV-E2E-0002 despachadas)*

> [!NOTE]
> **Captura de Pantalla 6 - Resultado del Algoritmo FIFO y Lotes Asignados**
> 
> *Ruta UI:* `/transactions/sales` (Modal de Despacho FIFO)
> 
> ![CAPTURA_6_DESPACHO_FIFO](placeholder_captura_6_despacho_fifo.png)
> *(Espacio reservado para captura del modal mostrando la asignación automática por FIFO de lotes)*

---

### Fase 4: Auditoría de Inventario y Kardex Inmutable

El historial completo de las 16 transacciones operativas quedó debidamente registrado en el Kardex inmutable. El balance final del caso de estudio refleja:
- `ALM-001`: Remanente disponible de 60 kg café, 30 kg banano, 30 kg papa, 30 kg huevo.
- `ALM-002`: Balance en 0 kg (WIP liquidado al finalizar OP).
- `ALM-003`: Balance en 0 bolsas (lote de 40 bolsas totalmente despachado a clientes).
- `ALM-004`: Remanente disponible de 60 bolsas kraft y 60 etiquetas identificadoras.

> [!NOTE]
> **Captura de Pantalla 7 - Kardex de Movimientos Filtrado por Lote y Tipo de Operación**
> 
> *Ruta UI:* `/transactions/inventory` (Pestaña Kardex)
> 
> ![CAPTURA_7_KARDEX_MOVIMIENTOS](placeholder_captura_7_kardex_movimientos.png)
> *(Espacio reservado para captura de la tabla de auditoría del Kardex con las 16 transacciones)*

> [!NOTE]
> **Captura de Pantalla 8 - Balances Físicos Actuales por Almacén y Lote**
> 
> *Ruta UI:* `/transactions/inventory` (Pestaña Existencias Físicas)
> 
> ![CAPTURA_8_EXISTENCIAS_ALMACEN](placeholder_captura_8_existencias_almacen.png)
> *(Espacio reservado para captura de existencias agrupadas por almacén oficial)*

---

## 4. Archivo CSV del Kardex Resultante

Los datos completos del Kardex inmutable para este caso de estudio se encuentran exportados en formato estándar delimitado por comas (CSV) en la ruta:
[`docs/evidencias/Kardex_Transaccional.csv`](file:///c:/Users/davis/OneDrive/Escritorio/Sistema_Recoffee/uni-sistemas-manufactura-Recoffee-erp/docs/evidencias/Kardex_Transaccional.csv)

### Resumen de Transacciones en el Kardex CSV:

| ID | Fecha | Tipo Operación | Código | Artículo | Origen | Destino | Lote | Cantidad | Costo Total (C$) | Referencia |
| :---: | :---: | :---: | :---: | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
| **1** | 2026-10-15 | `ENTRADA_COMPRA` | MP-001 | Borra de Café | — | ALM-001 | `LOTE-MP-001-E2E-01` | 200.00 kg | C$ 2,000.00 | `OC-E2E-0001` |
| **2** | 2026-10-15 | `ENTRADA_COMPRA` | MP-002 | Cáscara de Banano | — | ALM-001 | `LOTE-MP-002-E2E-01` | 50.00 kg | C$ 200.00 | `OC-E2E-0002` |
| **3** | 2026-10-15 | `ENTRADA_COMPRA` | MP-003 | Cáscara de Papa | — | ALM-001 | `LOTE-MP-003-E2E-01` | 50.00 kg | C$ 200.00 | `OC-E2E-0002` |
| **4** | 2026-10-15 | `ENTRADA_COMPRA` | MP-004 | Cáscara de Huevo | — | ALM-001 | `LOTE-MP-004-E2E-01` | 50.00 kg | C$ 300.00 | `OC-E2E-0002` |
| **5** | 2026-10-15 | `ENTRADA_COMPRA` | EMP-001 | Bolsa Kraft 5kg | — | ALM-004 | `LOTE-EMP-001-E2E-01` | 100.00 und | C$ 500.00 | `OC-E2E-0003` |
| **6** | 2026-10-15 | `ENTRADA_COMPRA` | EMP-002 | Etiqueta ReCoffee | — | ALM-004 | `LOTE-EMP-002-E2E-01` | 100.00 und | C$ 150.00 | `OC-E2E-0003` |
| **7** | 2026-10-16 | `SALIDA_PRODUCCION` | MP-001 | Borra de Café | ALM-001 | ALM-002 | `LOTE-MP-001-E2E-01` | 140.00 kg | C$ 1,400.00 | `OP-E2E-0040` |
| **8** | 2026-10-16 | `SALIDA_PRODUCCION` | MP-002 | Cáscara de Banano | ALM-001 | ALM-002 | `LOTE-MP-002-E2E-01` | 20.00 kg | C$ 80.00 | `OP-E2E-0040` |
| **9** | 2026-10-16 | `SALIDA_PRODUCCION` | MP-003 | Cáscara de Papa | ALM-001 | ALM-002 | `LOTE-MP-003-E2E-01` | 20.00 kg | C$ 80.00 | `OP-E2E-0040` |
| **10**| 2026-10-16 | `SALIDA_PRODUCCION` | MP-004 | Cáscara de Huevo | ALM-001 | ALM-002 | `LOTE-MP-004-E2E-01` | 20.00 kg | C$ 120.00 | `OP-E2E-0040` |
| **11**| 2026-10-16 | `SALIDA_PRODUCCION` | EMP-001 | Bolsa Kraft 5kg | ALM-004 | ALM-002 | `LOTE-EMP-001-E2E-01` | 40.00 und | C$ 200.00 | `OP-E2E-0040` |
| **12**| 2026-10-16 | `SALIDA_PRODUCCION` | EMP-002 | Etiqueta ReCoffee | ALM-004 | ALM-002 | `LOTE-EMP-002-E2E-01` | 40.00 und | C$ 60.00 | `OP-E2E-0040` |
| **13**| 2026-10-17 | `SALIDA_WIP` | PT-001 | Sustrato Compostable | ALM-002 | ALM-003 | `LOTE-PT-001-E2E-001` | 40.00 bolsas | C$ 1,940.00 | `OP-E2E-0040` |
| **14**| 2026-10-17 | `ENTRADA_PRODUCCION`| PT-001 | Sustrato Compostable | ALM-002 | ALM-003 | `LOTE-PT-001-E2E-001` | 40.00 bolsas | C$ 1,940.00 | `OP-E2E-0040` |
| **15**| 2026-10-17 | `SALIDA_VENTA` | PT-001 | Sustrato Compostable | ALM-003 | — | `LOTE-PT-001-E2E-001` | 25.00 bolsas | C$ 1,300.00 | `OV-E2E-0001` |
| **16**| 2026-10-17 | `SALIDA_VENTA` | PT-001 | Sustrato Compostable | ALM-003 | — | `LOTE-PT-001-E2E-001` | 15.00 bolsas | C$ 780.00 | `OV-E2E-0002` |

---

## 5. Conclusión del Hito M3

El ciclo transaccional demuestra el cumplimiento total de los requisitos de negocio:
1. **Compras trazables**: generación automática de códigos de lote de entrada por cada línea recibida.
2. **Manufactura controlada**: explosión precisa de BOM, validación de inventario con bloqueo transaccional, traslado a WIP y acreditación a producto terminado con costo real calculado.
3. **Ventas y Despacho FIFO**: asignación estricta por antigüedad de lote y bloqueo ante cualquier intento de salida sin stock disponible.
4. **Kardex inmutable**: auditoría completa y exportable de todas las transacciones físicas y monetarias del sistema.
