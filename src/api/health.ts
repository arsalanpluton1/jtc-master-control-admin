import { apiGet } from "./client";

export type HealthResponse = {
  service: string;
  status: "ok";
  database: {
    connected: boolean;
    readyState: number;
  };
  timestamp: string;
};

export function getHealth() {
  return apiGet<HealthResponse>("/health");
}
