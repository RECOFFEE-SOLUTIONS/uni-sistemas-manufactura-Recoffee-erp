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