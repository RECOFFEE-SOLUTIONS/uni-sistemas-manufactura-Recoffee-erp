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
