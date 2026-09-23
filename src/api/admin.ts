import { apiGet } from "./client";

export type AdminOverview = {
  counts: {
    stores: number;
    stations: number;
    inventoryItems: number;
    recipes: number;
    products: number;
    inventoryRequests: number;
  };
};

export function getAdminOverview() {
  return apiGet<AdminOverview>("/admin/overview");
}
