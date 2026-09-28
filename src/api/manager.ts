import { apiGet, apiPatch, apiPost } from "./client";
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

export type ManagerWarehouseTransfer = {
  _id: string;
  transferNumber: string;
  status: string;
  store: { _id: string; name: string; storeNumber: string; slug: string; status?: string } | null;
  lines: Array<{ _id: string; inventoryItemId: string; item: { _id: string; name: string; sku: string; baseUnit: string; purchaseUnit?: string } | null; quantity: number; unit: string; receivedQuantity: number; discrepancyReason?: string | null }>;
  requestedAt?: string;
  dispatchedAt?: string;
  receivedAt?: string;
  notes?: string | null;
  createdAt?: string;
};

export type ManagerWarehouseReturn = {
  _id: string;
  returnNumber: string;
  status: string;
  store: { _id: string; name: string; storeNumber: string; slug: string } | null;
  item: { _id: string; name: string; sku: string; baseUnit: string } | null;
  quantity: number;
  unit: string;
  reason: string;
  notes?: string | null;
  createdAt?: string;
};

export function getManagerWarehouseTransfers(storeId: string) {
  return apiGet<{ transfers: ManagerWarehouseTransfer[] }>(`/manager/stores/${storeId}/inventory-transfers`);
}

export function receiveManagerWarehouseTransfer(storeId: string, transferId: string, lines: Array<{ lineId: string; receivedQuantity: number; discrepancyReason?: string }>) {
  return apiPatch<{ transfer: ManagerWarehouseTransfer }>(`/manager/stores/${storeId}/inventory-transfers/${transferId}/receive`, { lines });
}

export function getManagerWarehouseReturns(storeId: string) {
  return apiGet<{ returns: ManagerWarehouseReturn[] }>(`/manager/stores/${storeId}/warehouse-returns`);
}

export function createManagerWarehouseReturn(storeId: string, input: { inventoryItemId: string; quantity: number; unit: string; reason: string; notes?: string }) {
  return apiPost<{ return: ManagerWarehouseReturn }>(`/manager/stores/${storeId}/warehouse-returns`, input);
}
