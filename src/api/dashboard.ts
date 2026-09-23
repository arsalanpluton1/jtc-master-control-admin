import { getHealth, type HealthResponse } from "./health";

export type DashboardStatus =
  | { status: "loading" }
  | { status: "ready"; data: HealthResponse }
  | { status: "error"; message: string };

export async function getDashboardHealth() {
  return getHealth();
}
