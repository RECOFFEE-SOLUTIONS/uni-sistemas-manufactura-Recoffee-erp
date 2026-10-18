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

