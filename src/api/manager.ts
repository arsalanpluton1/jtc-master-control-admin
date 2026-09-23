import { apiGet } from "./client";
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

export type ManagerStoreEmployee = AdminStorePerson;
export type ManagerStoreEmployeeList = StoreEmployeeList;
export type ManagerStoreEmployeeDetail = StoreEmployeeDetail;

export function getManagerStoreEmployees(storeId: string) {
  return apiGet<ManagerStoreEmployeeList>(`/manager/stores/${storeId}/employees`);
}

export function getManagerStoreEmployee(storeId: string, employeeId: string) {
  return apiGet<ManagerStoreEmployeeDetail>(`/manager/stores/${storeId}/employees/${employeeId}`);
}
