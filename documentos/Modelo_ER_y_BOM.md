# Modelo Entidad-Relación (E-R) y Estructura BOM del ERP ReCoffee

El sistema ERP ReCoffee implementa una arquitectura relacional normalizada en PostgreSQL que soporta la norma ISA-95 (Nivel 3 - MES y Nivel 4 - ERP Transaccional).

## Diagrama Entidad-Relación (Mermaid)

```mermaid
erDiagram
    ITEM ||--o{ BOM_HEADER : "defines_parent"
    ITEM ||--o{ BOM_COMPONENT : "used_as_component"
    ITEM ||--o{ ROUTING_HEADER : "manufactured_by"
    ITEM ||--o{ PURCHASE_ORDER_LINE : "purchased_in"
    ITEM ||--o{ INVENTORY_LOT : "stocked_as"
    ITEM ||--o{ INVENTORY_TRANSACTION : "recorded_in"
    ITEM ||--o{ PRODUCTION_ORDER : "produced_in"
    ITEM ||--o{ SALES_ORDER_LINE : "sold_in"
    ITEM ||--o{ QUALITY_INSPECTION : "inspected_in"

    WAREHOUSE ||--o{ INVENTORY_LOT : "stores"
    WAREHOUSE ||--o{ INVENTORY_TRANSACTION : "originates_from"
    WAREHOUSE ||--o{ INVENTORY_TRANSACTION : "destined_to"

    BOM_HEADER ||--|{ BOM_COMPONENT : "contains"
    BOM_HEADER ||--o{ PRODUCTION_ORDER : "recipe_for"

    ROUTING_HEADER ||--|{ ROUTING_OPERATION : "consists_of"
    ROUTING_HEADER ||--o{ PRODUCTION_ORDER : "routes"

    PURCHASE_ORDER ||--|{ PURCHASE_ORDER_LINE : "contains"
    PURCHASE_ORDER ||--o{ INVENTORY_LOT : "generates"

    PRODUCTION_ORDER ||--|{ PRODUCTION_ORDER_OPERATION : "executes"
    PRODUCTION_ORDER ||--o{ QUALITY_INSPECTION : "evaluated_in"
    PRODUCTION_ORDER ||--o{ IIOT_TELEMETRY_LOG : "monitored_by"

    ROUTING_OPERATION ||--o{ PRODUCTION_ORDER_OPERATION : "defines"
    PRODUCTION_ORDER_OPERATION ||--o{ QUALITY_INSPECTION : "validates"

    SALES_ORDER ||--|{ SALES_ORDER_LINE : "contains"

    ITEM {
        int Id PK
        string Code UK
        string Name
        string Category
        string UnitOfMeasure
        decimal Cost
        decimal StandardCost
        boolean IsActive
    }

    WAREHOUSE {
        int Id PK
        string Code UK
        string Name
        string Location
        string Description
        boolean IsActive
    }

    BOM_HEADER {
        int Id PK
        string Code UK
        int ParentItemId FK
        string Version
        decimal BaseQuantity
        string UnitOfMeasure
        boolean IsActive
    }

    BOM_COMPONENT {
        int Id PK
        int BomHeaderId FK
        int ComponentItemId FK
        decimal Quantity
        string UnitOfMeasure
        decimal ScrapPercentage
        int Level
        string Notes
    }

    ROUTING_HEADER {
        int Id PK
        string Code UK
        string Name
        int ItemId FK
        string Version
        int TotalLaborMinutes
        int TotalPassiveProcessMinutes
        int TotalCycleMinutes
    }

    ROUTING_OPERATION {
        int Id PK
        int RoutingHeaderId FK
        string OperationCode
        int SequenceOrder
        string Name
        string WorkCenter
        int LaborMinutes
        int PassiveProcessMinutes
        boolean IsQualityCheck
        boolean RequiresIIoTTelemetry
    }

    PURCHASE_ORDER {
        int Id PK
        string OrderNumber UK
        int SupplierId FK
        datetime OrderDate
        datetime ExpectedDeliveryDate
        datetime ReceivedDate
        string Status
        decimal TotalAmount
    }

    PURCHASE_ORDER_LINE {
        int Id PK
        int PurchaseOrderId FK
        int ItemId FK
        decimal Quantity
        decimal UnitPrice
        decimal Subtotal
        decimal ReceivedQuantity
        boolean IsReceived
        string GeneratedLotNumber
    }

    INVENTORY_LOT {
        int Id PK
        string LotNumber UK
        int ItemId FK
        int WarehouseId FK
        int PurchaseOrderId FK
        decimal InitialQuantity
        decimal CurrentQuantity
        datetime EntryDate
        string Status
    }

    INVENTORY_TRANSACTION {
        int Id PK
        datetime TransactionDate
        string TransactionType
        int ItemId FK
        int SourceWarehouseId FK
        int DestinationWarehouseId FK
        string LotNumber
        decimal Quantity
        decimal UnitCost
        decimal TotalCost
        string ReferenceNumber
        string PerformedBy
    }

    PRODUCTION_ORDER {
        int Id PK
        string OrderNumber UK
        int ItemId FK
        int BomHeaderId FK
        int RoutingHeaderId FK
        decimal PlannedQuantity
        decimal ProducedQuantity
        decimal ScrapQuantity
        string LotNumber
        string Status
        datetime ActualStartDate
        datetime ActualEndDate
        decimal TotalActualCost
    }

    PRODUCTION_ORDER_OPERATION {
        int Id PK
        int ProductionOrderId FK
        int RoutingOperationId FK
        string OperationCode
        string OperationName
        string Status
        datetime StartedAt
        datetime CompletedAt
        int ActualLaborMinutes
        int TotalActualMinutes
    }

    QUALITY_INSPECTION {
        int Id PK
        string InspectionCode UK
        string LotNumber
        int ProductionOrderId FK
        int ProductionOrderOperationId FK
        int ItemId FK
        datetime InspectionDate
        string InspectorName
        decimal HumidityPercentage
        decimal WeightKg
        decimal Ph
        string Status
        boolean HasNonConformance
    }

    SALES_ORDER {
        int Id PK
        string OrderNumber UK
        int CustomerId FK
        datetime OrderDate
        datetime DeliveryDate
        datetime DispatchedDate
        string Status
        decimal TotalAmount
    }

    SALES_ORDER_LINE {
        int Id PK
        int SalesOrderId FK
        int ItemId FK
        decimal Quantity
        decimal UnitPrice
        decimal Subtotal
        decimal DispatchedQuantity
        boolean IsDispatched
        string AssignedLotNumber
    }

    IIOT_TELEMETRY_LOG {
        int Id PK
        int ProductionOrderId FK
        string LotNumber
        string OperationCode
        string SensorId
        decimal TemperatureCelsius
        decimal MoisturePercent
        datetime Timestamp
    }
}
```

## Lista de Materiales (BOM) Multinivel

El ERP implementa una jerarquía real de 2 niveles (Nivel 0 y Nivel 1) con algoritmo recursivo de explosión de requerimientos (`BomExplosionService`):

### 1. PT-001 (Abono Orgánico ReCoffee Bolsa 5 kg) - Nivel 0
* **SEM-001** (Mezcla Base Harina de Café): 5.0 kg (Nivel 1)
* **EMP-001** (Bolsa Kraft 5 kg): 1 Unidad
* **EMP-002** (Etiqueta ReCoffee Solutions): 1 Unidad

### 2. PT-002 (Abono Orgánico ReCoffee Saco 25 kg) - Nivel 0
* **SEM-001** (Mezcla Base Harina de Café): 25.0 kg (Nivel 1)
* **EMP-003** (Saco Polipropileno 25 kg): 1 Unidad
* **EMP-002** (Etiqueta ReCoffee Solutions): 1 Unidad

### 3. Subensamble SEM-001 (Mezcla Base Harina de Café) - Nivel 1
* **MP-001** (Borra de Café Seca 10% H): 3.5 kg (70.0%)
* **MP-002** (Cáscara de Plátano Seca): 0.5 kg (10.0%)
* **MP-003** (Cáscara de Papa Seca): 0.5 kg (10.0%)
* **MP-004** (Cáscara de Huevo Triturada): 0.5 kg (10.0%)
* **Total Base:** 5.0 kg (100.0%)
