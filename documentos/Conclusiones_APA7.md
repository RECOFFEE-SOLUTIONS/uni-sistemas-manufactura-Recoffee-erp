# Conclusiones TÃ©cnicas y Recomendaciones del Proyecto ERP ReCoffee

## Conclusiones del Sistema de Manufactura y GestiÃ³n ERP
1. **Cumplimiento Integral de la PirÃ¡mide ISA-95:** La soluciÃ³n desarrollada integra con Ã©xito el Nivel 4 (ERP - GestiÃ³n de compras, inventario, ventas y costos) con el Nivel 3 (MES - Piso de planta, Ã³rdenes de producciÃ³n y control de calidad) y el Nivel 2 (TelemetrÃ­a de sensores IIoT de secado), permitiendo visibilidad operacional total en tiempo real.
2. **Inmutabilidad y Cero Errores Contables:** La implementaciÃ³n de un Kardex perpetuo de solo inserciÃ³n (`Append-Only`) garantiza que ninguna transacciÃ³n de inventario pueda ser alterada retroactivamente, cumpliendo los mÃ¡s altos estÃ¡ndares de auditorÃ­a financiera y trazabilidad de lotes.
3. **OptimizaciÃ³n de Procesos de EconomÃ­a Circular:** Se demostrÃ³ la viabilidad tÃ©cnica y financiera de transformar residuos orgÃ¡nicos urbanos (borra de cafÃ©) en abono balanceado de alto rendimiento agronÃ³mico, logrando un margen de contribuciÃ³n del 39.9% con costos de fabricaciÃ³n controlados (C$ 90.11/bolsa).
4. **DiseÃ±o de Software Robusto y Modular:** La arquitectura en capas basada en .NET 8 Web API, PostgreSQL y Next.js 14 demostrÃ³ alto rendimiento, desacoplamiento de servicios y seguridad robusta con autenticaciÃ³n JWT y control de acceso basado en roles (RBAC).

## Referencias BibliogrÃ¡ficas (Norma APA 7.Âª EdiciÃ³n)

1. Groover, M. P. (2020). *Fundamentals of modern manufacturing: Materials, processes, and systems* (7th ed.). John Wiley & Sons.
   * *Aporte al proyecto:* Modelado de procesos de conformado, secado tÃ©rmico y balance de lÃ­neas de producciÃ³n continua.

2. International Society of Automation. (2018). *Enterprise-control system integration - Part 1: Common object models and attributes* (ANSI/ISA-95.00.01-2018). ISA Publications.
   * *Aporte al proyecto:* EstructuraciÃ³n de los modelos de objetos para Ã³rdenes de manufactura, operaciones de ruta y atributos de telemetrÃ­a de piso de planta.

3. Jacobs, F. R., & Chase, R. B. (2021). *Operations and supply chain management* (16th ed.). McGraw-Hill Education.
   * *Aporte al proyecto:* MetodologÃ­a de planeaciÃ³n de requerimientos de materiales (MRP), cÃ¡lculo de Takt Time y gestiÃ³n de inventarios con polÃ­ticas FIFO.

4. Mussatto, S. I., Machado, E. M., Martins, S., & Teixeira, J. A. (2011). Production, composition, and application of coffee and its industrial residues. *Food and Bioprocess Technology*, 4(5), 661-672. https://doi.org/10.1007/s11947-011-0565-z
   * *Aporte al proyecto:* CaracterizaciÃ³n fÃ­sico-quÃ­mica de la borra de cafÃ©, contenido de humedad y formulaciÃ³n balanceada de micronutrientes orgÃ¡nicos.

5. Slack, N., & Brandon-Jones, A. (2019). *Operations management* (9th ed.). Pearson Education Limited.
   * *Aporte al proyecto:* Fundamentos para el diseÃ±o de layout industrial en plantas de procesamiento y formulaciÃ³n del indicador de efectividad global del equipo (OEE).