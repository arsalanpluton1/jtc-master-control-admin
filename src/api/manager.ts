import { apiGet } from "./client";
import { apiPost } from "./client";
import type { AdminStorePerson, StoreEmployeeList, StoreEmployeeDetail } from "./admin";

export type StoreSummary = {
  store: {
    _id: string;
    name: string;
    code: string;
    slug: string;
    status: string;
    timezone: string;
  };
  counts: {
    stations: number;
    stockItems: number;
    openInventoryRequests: number;
  };
};

export function getStoreSummary(storeId: string) {
  return apiGet<StoreSummary>(`/manager/stores/${storeId}/summary`);
}

export type ManagerInventoryRecord = {
  _id: string;
  inventoryItemId: string;
  item: {
    _id: string;
    name: string;
    sku: string;
    category: string;
    baseUnit: string;
    smallestUnitCostCents?: number | null;
  };
  quantityOnHand: number;
  reorderPoint: number;
  parLevel: number;
  status: string;
};

export type ManagerInventoryList = {
  store: {
    _id: string;
    name: string;
    storeNumber: string;
    slug: string;
  };
  inventory: ManagerInventoryRecord[];
};

export type ManagerStationOption = {
  _id: string;
  name: string;
  code: string;
  status: string;
  sortOrder: number;
};

export type ManagerInventoryRequestLine = {
  _id: string;
  inventoryItemId: string;
  item: {
    _id: string;
    name: string;
    sku: string;
    baseUnit: string;
  } | null;
  requestedQuantity: number;
  approvedQuantity: number | null;
  fulfilledQuantity: number;
  status: string;
  notes?: string | null;
};

export type ManagerInventoryRequest = {
  _id: string;
  requestNumber: string;
  status: string;
  requestedByEmployee: {
    _id: string;
    displayName?: string | null;
    employeeCode?: string | null;
  } | null;
  stationId: string | null;
  submittedAt?: string | null;
  notes?: string | null;
  lines: ManagerInventoryRequestLine[];
  createdAt?: string;
  updatedAt?: string;
};

export function getManagerStoreInventory(storeId: string) {
  return apiGet<ManagerInventoryList>(`/manager/stores/${storeId}/inventory`);
}

export function getManagerStoreStations(storeId: string) {
  return apiGet<{ stations: ManagerStationOption[] }>(`/manager/stores/${storeId}/stations`);
}

export function getManagerInventoryRequests(storeId: string) {
  return apiGet<{ requests: ManagerInventoryRequest[] }>(`/manager/stores/${storeId}/inventory-requests`);
}

export type CreateManagerInventoryRequestInput = {
  stationId?: string;
  notes?: string;
  items: Array<{
    inventoryItemId: string;
    requestedQuantity: number;
    notes?: string;
  }>;
};

export function createManagerInventoryRequest(storeId: string, input: CreateManagerInventoryRequestInput) {
  return apiPost<{ request: ManagerInventoryRequest }>(`/manager/stores/${storeId}/inventory-requests`, input);
}

export type ManagerStoreEmployee = AdminStorePerson;
export type ManagerStoreEmployeeList = StoreEmployeeList;
export type ManagerStoreEmployeeDetail = StoreEmployeeDetail;

export function getManagerStoreEmployees(storeId: string) {
  return apiGet<ManagerStoreEmployeeList>(`/manager/stores/${storeId}/employees`);
}

export function getManagerStoreEmployee(storeId: string, employeeId: string) {
  return apiGet<ManagerStoreEmployeeDetail>(`/manager/stores/${storeId}/employees/${employeeId}`);
}
