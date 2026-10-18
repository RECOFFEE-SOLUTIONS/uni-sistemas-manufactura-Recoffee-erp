export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  user: User;
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

