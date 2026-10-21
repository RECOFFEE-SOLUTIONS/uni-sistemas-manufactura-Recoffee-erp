export interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  roles: string[];
}

export interface LoginResponse {
  token?: string;
  message?: string;
  user: User;
  mustChangePassword?: boolean;
}

export interface UserSummary {
  id: string;
  username: string;
  email: string;
  name?: string;
  roles: string[];
  mustChangePassword: boolean;
  allowedModules: string[];
}

export interface AccessLogItem {
  id: number;
  timestamp: string;
  ipAddress: string;
  username: string;
  success: boolean;
  failureReason?: string | null;
  userAgent?: string | null;
}

export interface ApiStatus {
  status: string;
  service: string;
  security?: string;
  timestamp?: string;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  location?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface Item {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  category: "MP" | "EMP" | "SEM" | "PT" | string;
  unitOfMeasure: string;
  cost: number;
  standardCost: number;
  isActive: boolean;
  createdAt?: string;
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface Customer {
  id: number;
  code: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt?: string;
}

// M2: Tipos para BOM y Rutas
export interface BomExplosionItem {
  itemId: number;
  itemCode: string;
  itemName: string;
  category: string;
  requiredQuantity: number;
  scrapPercentage: number;
  grossQuantity: number;
  unitOfMeasure: string;
  unitCost: number;
  totalCost: number;
  level: number;
}

export interface BomTreeNode {
  itemId: number;
  itemCode: string;
  itemName: string;
  category: string;
  requiredQuantity: number;
  unitOfMeasure: string;
  scrapPercentage: number;
  grossQuantity: number;
  unitCost: number;
  subtotalCost: number;
  level: number;
  bomCode?: string | null;
  isSubassembly: boolean;
  children: BomTreeNode[];
}

export interface BomExplosionResponse {
  parentItemId: number;
  parentItemCode: string;
  parentItemName: string;
  parentCategory: string;
  requestedQuantity: number;
  unitOfMeasure: string;
  bomCode: string;
  bomVersion: string;
  bomBaseQuantity: number;
  totalEstimatedCost: number;
  calculationTimestamp: string;
  consolidatedMaterials: BomExplosionItem[];
  explosionTree: BomTreeNode;
}

export interface BomHeaderSummary {
  id: number;
  code: string;
  parentItemId: number;
  parentItemCode: string;
  parentItemName: string;
  version: string;
  description?: string | null;
  baseQuantity: number;
  unitOfMeasure: string;
  isActive: boolean;
  componentsCount: number;
  createdAt: string;
}

export interface RoutingOperation {
  id: number;
  routingHeaderId: number;
  sequenceOrder: number;
  operationCode: string;
  name: string;
  description?: string | null;
  workCenter: string;
  laborMinutes: number;
  machineMinutes: number;
  passiveProcessMinutes: number;
  setupMinutes: number;
  isQualityCheck: boolean;
  requiresIIoTTelemetry: boolean;
  standardInstructions?: string | null;
}

export interface RoutingHeader {
  id: number;
  code: string;
  name: string;
  itemId: number;
  itemCode?: string;
  itemName?: string;
  item?: Item;
  version: string;
  description?: string | null;
  isActive: boolean;
  totalLaborMinutes: number;
  totalMachineMinutes: number;
  totalPassiveProcessMinutes: number;
  totalCycleMinutes: number;
  operationsCount?: number;
  operations?: RoutingOperation[];
  createdAt: string;
}

// M3: Flujo Transaccional E2E Tipos

// 1. Compras
export interface PurchaseOrderLine {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  unitOfMeasure: string;
  receivedQuantity: number;
  isReceived: boolean;
  generatedLotNumber?: string | null;
}

export interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate?: string | null;
  receivedDate?: string | null;
  status: "Emitida" | "Recibida" | "Cancelada" | string;
  totalAmount: number;
  notes?: string | null;
  linesCount: number;
  lines: PurchaseOrderLine[];
  createdAt: string;
}

// 2. Inventario y Kardex
export interface InventoryStock {
  id: number;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  category: string;
  unitOfMeasure: string;
  lotNumber: string;
  quantity: number;
  lastUpdated: string;
}

export interface InventoryTransaction {
  id: number;
  transactionDate: string;
  transactionType: "ENTRADA_COMPRA" | "ENTRADA_PRODUCCION" | "SALIDA_PRODUCCION" | "SALIDA_VENTA" | "SALIDA_WIP" | "TRANSFERENCIA" | "AJUSTE" | string;
  itemId: number;
  itemCode: string;
  itemName: string;
  sourceWarehouseId?: number | null;
  sourceWarehouseCode?: string | null;
  sourceWarehouseName?: string | null;
  destinationWarehouseId?: number | null;
  destinationWarehouseCode?: string | null;
  destinationWarehouseName?: string | null;
  lotNumber: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  referenceNumber?: string | null;
  notes?: string | null;
  performedBy?: string | null;
  createdAt: string;
}

// 3. Órdenes de Producción
export interface ProductionOrderMaterial {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  category: string;
  requiredQuantity: number;
  consumedQuantity: number;
  unitOfMeasure: string;
  unitCost: number;
  totalCost: number;
  sourceWarehouseCode: string;
  lotNumber?: string | null;
  isConsumed: boolean;
}

export interface ProductionOrder {
  id: number;
  orderNumber: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  bomHeaderId: number;
  plannedQuantity: number;
  producedQuantity: number;
  scrapQuantity: number;
  unitOfMeasure: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  status: "Planificada" | "En Proceso" | "Completada" | "Cancelada" | string;
  notes?: string | null;
  lotNumber?: string | null;
  totalEstimatedCost: number;
  totalActualCost: number;
  materials: ProductionOrderMaterial[];
  createdAt: string;
}

// 4. Ventas
export interface SalesOrderLine {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  unitOfMeasure: string;
  dispatchedQuantity: number;
  isDispatched: boolean;
  assignedLotNumber?: string | null;
}

export interface SalesOrder {
  id: number;
  orderNumber: string;
  customerId: number;
  customerCode: string;
  customerName: string;
  orderDate: string;
  deliveryDate?: string | null;
  dispatchedDate?: string | null;
  status: "Confirmada" | "Despachada" | "Cancelada" | string;
  totalAmount: number;
  notes?: string | null;
  linesCount: number;
  lines: SalesOrderLine[];
  createdAt: string;
}

// M4: Capa MES, Trazabilidad y Calidad Tipos

export interface ProductionOrderOperation {
  id: number;
  productionOrderId: number;
  sequenceOrder: number;
  operationCode: string; // RO-1 a RO-8
  name: string;
  workCenter: string;
  status: "Pendiente" | "Iniciado" | "Completado" | "Pausado" | string;
  standardLaborMinutes: number;
  standardMachineMinutes: number;
  standardPassiveMinutes: number;
  startedAt?: string | null;
  completedAt?: string | null;
  actualLaborMinutes: number;
  actualMachineMinutes: number;
  actualPassiveMinutes: number;
  totalActualMinutes: number;
  isQualityCheck: boolean;
  requiresIIoTTelemetry: boolean;
  executedBy?: string | null;
  operatorNotes?: string | null;
}

export interface ProductionOrderMesDetail {
  productionOrderId: number;
  orderNumber: string;
  itemCode: string;
  itemName: string;
  plannedQuantity: number;
  producedQuantity: number;
  unitOfMeasure: string;
  status: string;
  lotNumber?: string | null;
  plannedStartDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  totalOperationsCount: number;
  completedOperationsCount: number;
  progressPercentage: number;
  operations: ProductionOrderOperation[];
}

export interface QualityInspection {
  id: number;
  inspectionCode: string;
  lotNumber: string;
  productionOrderId?: number | null;
  productionOrderNumber?: string | null;
  productionOrderOperationId?: number | null;
  operationCode?: string | null;
  itemId?: number | null;
  itemCode?: string | null;
  itemName?: string | null;
  inspectionDate: string;
  inspectorName: string;
  humidityPercentage: number;
  weightKg: number;
  appearance?: string | null;
  ph?: number | null;
  status: "Aprobado" | "Rechazado" | string;
  hasNonConformance: boolean;
  nonConformanceReason?: string | null;
  notes?: string | null;
  ncrId?: number | null;
  ncrNumber?: string | null;
  createdAt: string;
}

export interface NonConformanceReport {
  id: number;
  ncrNumber: string;
  qualityInspectionId: number;
  inspectionCode: string;
  lotNumber: string;
  productionOrderId?: number | null;
  productionOrderNumber?: string | null;
  reportDate: string;
  severity: "Menor" | "Mayor" | "Crítica" | string;
  defectDescription: string;
  humidityDeviation?: string | null;
  weightDeviation?: string | null;
  rootCause?: string | null;
  proposedAction: string;
  status: "Abierto" | "En Tratamiento" | "Cerrado" | string;
  responsiblePerson?: string | null;
  resolutionNotes?: string | null;
  closedAt?: string | null;
  createdAt: string;
}

export interface NcrDispositionResult {
  ncrId: number;
  ncrNumber: string;
  dispositionType: "Scrap" | "Retrabajo" | string;
  ncrStatus: string;
  lotNumber: string;
  lotStatus: string;
  productionOrderId?: number | null;
  productionOrderNumber?: string | null;
  productionOrderStatus?: string | null;
  scrappedQuantity: number;
  totalCostScrapped: number;
  reactivatedOperations: string[];
  message: string;
  dispositionDate: string;
}

export interface TraceabilityUpstreamItem {
  itemId: number;
  itemCode: string;
  itemName: string;
  category: string;
  consumedQuantity: number;
  unitOfMeasure: string;
  lotNumber: string;
  sourceWarehouseCode: string;
  purchaseOrderId?: number | null;
  purchaseOrderNumber?: string | null;
  purchaseOrderDate?: string | null;
  receptionDate?: string | null;
  supplierId?: number | null;
  supplierCode?: string | null;
  supplierName?: string | null;
  supplierContact?: string | null;
}

export interface TraceabilityDownstreamItem {
  salesOrderId: number;
  salesOrderNumber: string;
  customerId: number;
  customerCode: string;
  customerName: string;
  customerAddress?: string | null;
  customerContact?: string | null;
  orderDate: string;
  dispatchedDate?: string | null;
  dispatchedQuantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  subtotal: number;
  assignedLot: string;
}

export interface TraceabilityKardexEntry {
  id: number;
  transactionDate: string;
  transactionType: string;
  sourceWarehouseCode?: string | null;
  destinationWarehouseCode?: string | null;
  quantity: number;
  unitCost: number;
  totalCost: number;
  referenceNumber?: string | null;
  notes?: string | null;
  performedBy?: string | null;
}

export interface LotTraceabilityResponse {
  lotNumber: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  category: string;
  warehouseId?: number | null;
  warehouseCode: string;
  warehouseName: string;
  initialQuantity: number;
  currentQuantity: number;
  unitOfMeasure: string;
  entryDate: string;
  status: string;
  lotType: string;
  productionOrder?: {
    orderId: number;
    orderNumber: string;
    status: string;
    plannedQuantity: number;
    producedQuantity: number;
    unitOfMeasure: string;
    plannedStartDate?: string | null;
    actualStartDate?: string | null;
    actualEndDate?: string | null;
    totalEstimatedCost: number;
    totalActualCost: number;
    bomCode?: string | null;
    routingCode?: string | null;
  } | null;
  upstream: TraceabilityUpstreamItem[];
  downstream: TraceabilityDownstreamItem[];
  kardexTimeline: TraceabilityKardexEntry[];
}

export interface TraceableLotSummary {
  lotNumber: string;
  itemCode: string;
  itemName: string;
  category: string;
  warehouseCode: string;
  currentQuantity: number;
  unitOfMeasure: string;
  entryDate: string;
  status: string;
}

// M5: KPI Engine & IIoT Telemetry Tipos

export interface KpiDashboardSummary {
  yieldPercent: number;
  scrapPercent: number;
  standardUnitCost: number;
  actualUnitCost: number;
  costVariance: number;
  costVariancePercent: number;
  inventoryTurnoverRatio: number;
  daysSalesOfInventory: number;
  oeePercent: number;
  availabilityPercent: number;
  performancePercent: number;
  qualityPercent: number;
  totalProductionOrders: number;
  completedOrders: number;
  totalProducedUnits: number;
  calculatedAt: string;
}

export interface LotYield {
  productionOrderId: number;
  orderNumber: string;
  lotNumber: string;
  itemCode: string;
  itemName: string;
  plannedQuantity: number;
  producedQuantity: number;
  scrapQuantity: number;
  totalUnits: number;
  yieldPercent: number;
  scrapPercent: number;
  status: string;
}

export interface YieldKpiResponse {
  overallYieldPercent: number;
  overallScrapPercent: number;
  totalPlannedUnits: number;
  totalProducedUnits: number;
  totalScrappedUnits: number;
  totalInspectionsCount: number;
  approvedInspectionsCount: number;
  rejectedInspectionsCount: number;
  inspectionApprovalRate: number;
  activeNcrsCount: number;
  lotDetails: LotYield[];
  calculatedAt: string;
}

export interface LotCostComparison {
  productionOrderId: number;
  orderNumber: string;
  lotNumber: string;
  itemCode: string;
  itemName: string;
  producedQuantity: number;
  totalActualCost: number;
  actualUnitCost: number;
  standardUnitCost: number;
  variance: number;
  variancePercent: number;
  isFavorable: boolean;
  completionDate?: string | null;
}

export interface UnitCostKpiResponse {
  officialStandardCost: number;
  averageActualUnitCost: number;
  overallCostVariance: number;
  overallVariancePercent: number;
  isOverallFavorable: boolean;
  currency: string;
  totalOrdersEvaluated: number;
  lotComparisons: LotCostComparison[];
  calculatedAt: string;
}

export interface CategoryInventory {
  category: string;
  categoryName: string;
  currentStockValue: number;
  totalConsumedOrSoldValue: number;
  turnoverRatio: number;
  daysOnHand: number;
}

export interface InventoryTurnoverKpiResponse {
  inventoryTurnoverRatio: number;
  daysSalesOfInventory: number;
  costOfGoodsSoldCogs: number;
  totalCurrentInventoryValue: number;
  totalPhysicalUnitsInStock: number;
  categoryBreakdown: CategoryInventory[];
  calculatedAt: string;
}

export interface OperationCycleTime {
  operationCode: string;
  operationName: string;
  workCenter: string;
  standardLaborMinutes: number;
  standardMachineMinutes: number;
  standardPassiveMinutes: number;
  totalStandardMinutes: number;
  totalActualMinutes: number;
  efficiencyPercent: number;
  executionsCount: number;
  status: string;
}

export interface OeeKpiResponse {
  overallOeePercent: number;
  availabilityPercent: number;
  performancePercent: number;
  qualityPercent: number;
  standardRouteCycleMinutes: number;
  actualAverageCycleMinutes: number;
  operationsCycleBreakdown: OperationCycleTime[];
  calculatedAt: string;
}

export interface IiotTelemetryItem {
  id: number;
  productionOrderId?: number | null;
  orderNumber?: string | null;
  lotNumber: string;
  operationCode: string;
  sensorId: string;
  temperatureCelsius: number;
  moisturePercent: number;
  timestamp: string;
  isTargetMoistureAchieved: boolean;
  createdAt: string;
}

