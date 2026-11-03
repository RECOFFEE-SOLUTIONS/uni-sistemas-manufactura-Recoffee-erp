# BitÃ¡cora de Aportes del Equipo - Proyecto ERP ReCoffee

A continuaciÃ³n se detalla la matriz de asignaciÃ³n de responsabilidades y aportes tÃ©cnicos de los 6 integrantes del equipo de desarrollo, alineada a los criterios de evaluaciÃ³n de la rÃºbrica oficial (Criterios C1 al C6):

| Integrante | Rol en el Proyecto | MÃ³dulos y Entregables Desarrollados | Horas | Commits y Evidencia Clave |
|---|---|---|---|---|
| **Davis GonzÃ¡lez** (@pruebasdavis165-maker) | Tech Lead & Full-Stack Architect | Arquitectura E2E, Backend .NET 8, Frontend Next.js 14, Seeders y Algoritmos BOM/Kardex | 110 h | `fix(core)`, `feat(m1-m8)` |
| **Kenneth Palacios** (@KennethP17) | DBA & Product Engineer | Modelo Relacional PostgreSQL, NormalizaciÃ³n E-R y EstructuraciÃ³n BOM Multinivel | 45 h | `docs: modelo E-R`, `docs: BOM` |
| **Melany SÃ¡nchez** (@MelanySanchez23) | QA Lead & Scrum Master | GestiÃ³n de Requerimientos, BitÃ¡cora de Aportes, Issue Log y Pruebas Transaccionales | 40 h | `docs: bitÃ¡cora`, `docs: issue log` |
| **Wildor JarquÃ­n** (@JavierGonza26) | Automation & BI Engineer | TelemetrÃ­a IIoT (RO-3 Secado), Dashboard de KPIs, OEE y CÃ¡lculo de Costos | 40 h | `docs: telemetrÃ­a`, `docs: kpis` |
| **Rebeca Areas** (@Becka252627) | Process & Industrial Engineer | Balance de Masa y EnergÃ­a (RO-3), CÃ¡lculo de Takt Time, Layout de Planta | 40 h | `docs: balance masa`, `docs: takt time` |
| **Dayerling Cardoza** (@p2000card-lab) | Compliance & Technical Writer | Conclusiones TÃ©cnicas del ERP/MES, ValidaciÃ³n Normativa ISA-95 y Referencias APA 7 | 35 h | `docs: conclusiones`, `docs: apa7` |

## Plan de Pruebas y ValidaciÃ³n Transaccional
Durante el Sprint de cierre se ejecutaron pruebas de extremo a extremo (E2E):
1. **Flujo de Abastecimiento:** CreaciÃ³n de OC-20261021-0001, recepciÃ³n fÃ­sica y generaciÃ³n automÃ¡tica de lote `LOT-MP-001` en `ALM-001`.
2. **Flujo de Manufactura:** Orden OP-20261021-0001, consumo de materiales en `ALM-002`, simulaciÃ³n de secado `RO-3`, control de calidad `RO-5` y pase a `ALM-003`.
3. **Flujo de Despacho Comercial:** Despacho de orden de venta OV-20261021-0001 con salida por Kardex inmutable.

## Registro Detallado de Problemas TÃ©cnicos (Issue Log)

Durante el ciclo de desarrollo se resolvieron 4 problemas tÃ©cnicos de alta criticidad, documentados mediante anÃ¡lisis de causa raÃ­z y verificaciÃ³n empÃ­rica:

### Incidencia 1: VisualizaciÃ³n Plana del BOM Multinivel
* **Severidad:** Alta (Afectaba Criterio C1).
* **Causa RaÃ­z:** El backend entregaba la lista plana de componentes de la orden sin resolver recursivamente los hijos del subensamble `SEM-001`.
* **SoluciÃ³n TÃ©cnica:** Se implementÃ³ `BomExplosionService.cs` en .NET 8 con recursiÃ³n tipada en `BomExplosionNodeDto`, estructurando el Ã¡rbol a 2 niveles reales (PT-001 -> SEM-001 -> MP-001..004) tanto en el backend como en el Ã¡rbol jerÃ¡rquico de Next.js (`/engineering/bom`).
* **VerificaciÃ³n:** VisualizaciÃ³n jerÃ¡rquica con badges de nivel 0 y nivel 1 funcionando correctamente.

### Incidencia 2: SimulaciÃ³n Demorada del Secador Rotativo RO-3
* **Severidad:** Media (Dificultad para demostraciÃ³n en vivo en defensa acadÃ©mica).
* **Causa RaÃ­z:** La curva fÃ­sica de secado requerÃ­a 4 horas de telemetrÃ­a continua para pasar de 65% a 10% de humedad.
* **SoluciÃ³n TÃ©cnica:** Se programÃ³ un motor de simulaciÃ³n acelerada temporal (1 segundo = 10 minutos de proceso), emitiendo registros periÃ³dicos a `IiotTelemetryLogs` con ruido gausiano realista y respuesta visual dinÃ¡mica en el grÃ¡fico SVG.
* **VerificaciÃ³n:** EjecuciÃ³n de ciclo completo de secado en ~24 segundos durante la prueba de piso de planta.

### Incidencia 3: Bloqueo de SesiÃ³n por Flags de Cookies Seguras
* **Severidad:** CrÃ­tica (ImpedÃ­a login en ambientes locales de desarrollo).
* **Causa RaÃ­z:** El middleware configuraba las cookies `recoffee_jwt` con atributos `Secure; SameSite=None` que eran bloqueados por navegadores en conexiones `http://localhost`.
* **SoluciÃ³n TÃ©cnica:** Se refactorizÃ³ `TokenService.cs` y el archivo `middleware.ts` para condicionar el flag `Secure` segÃºn el esquema de la peticiÃ³n entrante, permitiendo autenticaciÃ³n fluida en local y estricta en producciÃ³n.
* **VerificaciÃ³n:** Login verificado exitosamente para los 6 usuarios de prueba del Seeder.

### Incidencia 4: Despacho de Ventas sin AsignaciÃ³n FIFO de Lotes
* **Severidad:** Alta (Afectaba Criterio C2 y trazabilidad inmutable).
* **Causa RaÃ­z:** El endpoint de despacho realizaba un egreso genÃ©rico de existencias sin identificar el lote fÃ­sico de producto terminado en `ALM-003`.
* **SoluciÃ³n TÃ©cnica:** Se integrÃ³ un query de selecciÃ³n por fecha de ingreso ascendente (`OrderBy(x => x.EntryDate)`), descontando existencias por lote y grabando transacciones de tipo `SALIDA_VENTA` con el nÃºmero de lote respectivo en el Kardex.
* **VerificaciÃ³n:** Despacho de la orden `OV-20261021-0001` reflejado con lote exacto y egreso registrado en Kardex.

*Nota de contacto DBA:* Kenneth Palacios (kenneth.alonso94arauz@gmail.com / @KennethP17).