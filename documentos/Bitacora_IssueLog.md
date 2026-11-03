# BitÃ¡cora de Aportes del Equipo - Proyecto ERP ReCoffee

A continuaciÃ³n se detalla la matriz de aportes reales de los 6 integrantes del equipo de desarrollo, de acuerdo a la rÃºbrica de evaluaciÃ³n final (Criterio C6):

| Integrante | Rol en el Proyecto | MÃ³dulos y Entregables Desarrollados | Commits Clave |
|---|---|---|---|
| **Davis GonzÃ¡lez** (@pruebasdavis165-maker) | Tech Lead & Full-Stack Architect | Arquitectura E2E, Backend .NET 8, Frontend Next.js 14, Seeders y Algoritmos BOM/Kardex | ix(core), eat(m1-m8) |
| **Kenneth Palacios** (@KennethP17) | DBA & Product Engineer | Modelo Relacional PostgreSQL, NormalizaciÃ³n E-R y EstructuraciÃ³n BOM Multinivel | docs: modelo E-R, docs: BOM |
| **Melany SÃ¡nchez** (@MelanySanchez23) | QA Lead & Scrum Master | GestiÃ³n de Requerimientos, BitÃ¡cora de Aportes, Issue Log y Pruebas Transaccionales | docs: bitÃ¡cora, docs: issue log |
| **Wildor JarquÃ­n** (@JavierGonza26) | Automation & BI Engineer | TelemetrÃ­a IIoT (RO-3 Secado), Dashboard de KPIs, OEE y CÃ¡lculo de Costos | docs: telemetrÃ­a, docs: kpis |
| **Rebeca Areas** (@Becka252627) | Process & Industrial Engineer | Balance de Masa y EnergÃ­a (RO-3), CÃ¡lculo de Takt Time, Layout de Planta | docs: balance masa, docs: takt time |
| **Dayerling Cardoza** (@p2000card-lab) | Compliance & Technical Writer | Conclusiones TÃ©cnicas del ERP/MES, ValidaciÃ³n Normativa ISA-95 y Referencias APA 7 | docs: conclusiones, docs: apa7 |

## Registro de Problemas TÃ©cnicos (Issue Log)

Durante el ciclo de vida del desarrollo se resolvieron 4 desafÃ­os tÃ©cnicos crÃ­ticos:

| # | Problema Detectado | Causa RaÃ­z | SoluciÃ³n TÃ©cnica Implementada en el ERP |
|---|---|---|---|
| 1 | **VisualizaciÃ³n Plana del BOM** | El frontend consumÃ­a directamente una lista plana de componentes sin resolver la recursividad del subensamble SEM-001. | Se creÃ³ el servicio BomExplosionService.cs que ejecuta recursiÃ³n en profundidad para generar el Ã¡rbol jerÃ¡rquico a 2 niveles tanto para PT-001 como para PT-002. |
| 2 | **SimulaciÃ³n Demorada en Secado RO-3** | El ciclo fÃ­sico del secador rotativo dura 4 horas, lo que impedÃ­a verificar en tiempo real la telemetrÃ­a IIoT en una defensa acadÃ©mica. | Se implementÃ³ un algoritmo de simulaciÃ³n acelerada (1 segundo = 10 minutos de proceso) emitiendo curvas dinÃ¡micas de temperatura (75Â°C) y humedad residual (10%). |
| 3 | **RegresiÃ³n de Cookies en ProducciÃ³n** | En entornos sin HTTPS local, las cookies marcadas con Secure; SameSite=None eran descartadas por el navegador, bloqueando la navegaciÃ³n. | Se flexibilizÃ³ TokenService.cs y el middleware de Next.js para detectar el protocolo HTTP y admitir ecoffee_jwt con tolerancia de ambiente. |
| 4 | **Inconsistencia de Lotes en Despacho** | El despacho de Ã³rdenes de venta consumÃ­a existencias globales sin asignar trazabilidad a un lote fÃ­sico especÃ­fico en ALM-003. | Se integrÃ³ el algoritmo de consumo FIFO estricto en SalesController.cs descontando automÃ¡ticamente los lotes mÃ¡s antiguos y registrando SALIDA_VENTA en el Kardex. |