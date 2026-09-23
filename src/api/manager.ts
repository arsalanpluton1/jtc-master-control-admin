import { apiGet } from "./client";

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
