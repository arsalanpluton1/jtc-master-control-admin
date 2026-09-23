import { apiGet, apiPost, apiPut } from "./client";

export const storeStatusOptions = [
  { value: "planning", label: "Planning" },
  { value: "construction", label: "Construction" },
  { value: "open", label: "Open" },
  { value: "temporarily_closed", label: "Temporarily Closed" },
  { value: "closed", label: "Closed" },
] as const;

export type StoreStatusValue = (typeof storeStatusOptions)[number]["value"];

export const storeTypeOptions = [
  { value: "standard", label: "Standard" },
  { value: "flagship", label: "Flagship" },
  { value: "kiosk", label: "Kiosk" },
  { value: "drive_thru", label: "Drive-Thru" },
] as const;

export type StoreTypeValue = (typeof storeTypeOptions)[number]["value"];

export const managerRoleOptions = [{ value: "manager", label: "Store Manager / Store Leader" }] as const;
export type ManagerRoleValue = (typeof managerRoleOptions)[number]["value"];

export const storeEmployeeRoleOptions = [
  { value: "barista", label: "Barista" },
  { value: "trainee", label: "Trainee" },
  { value: "cleaner", label: "Cleaner" },
  { value: "other", label: "Other" },
] as const;
export type StoreEmployeeRoleValue = (typeof storeEmployeeRoleOptions)[number]["value"];

export const storeEmployeeStatusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "terminated", label: "Terminated" },
] as const;
export type StoreEmployeeStatusValue = (typeof storeEmployeeStatusOptions)[number]["value"];

export const accountStatusOptions = [
  { value: "invited", label: "Invited" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "disabled", label: "Disabled" },
] as const;
export type AccountStatusValue = (typeof accountStatusOptions)[number]["value"];

export const stationStatusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "maintenance", label: "Maintenance" },
] as const;
export type StationStatusValue = (typeof stationStatusOptions)[number]["value"];

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

export type AdminStore = {
  _id: string;
  name: string;
  storeNumber: string;
  slug: string;
  storeType: StoreTypeValue;
  status: StoreStatusValue;
  isActive: boolean;
  timezone: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  } | null;
  phone?: string | null;
  email?: string | null;
  manager?: string | null;
  expectedOpenDate?: string | null;
  coverPhoto?: {
    url?: string | null;
    path?: string | null;
    originalName?: string | null;
    mimeType?: string | null;
    size?: number | null;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminStoreList = {
  stores: AdminStore[];
};

export type AdminStation = {
  _id: string;
  storeId: string;
  name: string;
  code: string;
  status: StationStatusValue;
  sortOrder: number;
  store: {
    _id: string;
    name: string;
    storeNumber: string;
    slug: string;
    status?: StoreStatusValue;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminStationList = {
  stations: AdminStation[];
};

export type AdminStationDetail = {
  station: AdminStation;
};

export type AdminStorePerson = {
  _id: string;
  storeId?: string;
  displayName?: string | null;
  email?: string | null;
  role: "manager" | "employee" | StoreEmployeeRoleValue;
  positionTitle?: string | null;
  status: StoreEmployeeStatusValue;
  employeeCode?: string | null;
  contactPhone?: string | null;
  hiredAt?: string | null;
  terminatedAt?: string | null;
  user?: {
    _id: string;
    displayName: string;
    email: string;
    role: string;
    status: string;
  } | null;
  store?: {
    _id: string;
    name: string;
    storeNumber: string;
    slug: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type AdminStoreStation = {
  _id: string;
  name: string;
  code: string;
  status: "active" | "inactive" | "maintenance";
  sortOrder: number;
};

export type AdminStoreDetail = {
  store: AdminStore;
  manager: AdminStorePerson | null;
  employees: AdminStorePerson[];
  stations: AdminStoreStation[];
};

export type StoreManagerCredentials = {
  email: string;
  temporaryPassword: string;
  delivery: string;
};

export type AssignStoreManagerResult = AdminStoreDetail & {
  managerCredentials: StoreManagerCredentials;
};

export function getAdminStores() {
  return apiGet<AdminStoreList>("/admin/stores");
}

export function getAdminStore(storeId: string) {
  return apiGet<AdminStoreDetail>(`/admin/stores/${storeId}`);
}

export function getAdminStations() {
  return apiGet<AdminStationList>("/admin/stations");
}

export function getAdminStation(stationId: string) {
  return apiGet<AdminStationDetail>(`/admin/stations/${stationId}`);
}

export type StoreEmployeeList = {
  store: {
    _id: string;
    name: string;
    storeNumber: string;
    slug: string;
  };
  employees: AdminStorePerson[];
};

export type StoreEmployeeDetail = {
  employee: AdminStorePerson;
};

export function getAdminStoreEmployees(storeId: string) {
  return apiGet<StoreEmployeeList>(`/admin/stores/${storeId}/employees`);
}

export function getAdminStoreEmployee(storeId: string, employeeId: string) {
  return apiGet<StoreEmployeeDetail>(`/admin/stores/${storeId}/employees/${employeeId}`);
}

export type CreateAdminStoreInput = {
  name: string;
  storeNumber: string;
  status: StoreStatusValue;
  storeType: StoreTypeValue;
  isActive: boolean;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  expectedOpenDate?: string;
  manager?: string;
  phone?: string;
  email?: string;
  coverPhoto?: File | null;
};

export type UpdateAdminStoreInput = CreateAdminStoreInput;

function buildStoreFormData(input: CreateAdminStoreInput | UpdateAdminStoreInput) {
  const formData = new FormData();

  formData.set("name", input.name);
  formData.set("storeNumber", input.storeNumber);
  formData.set("status", input.status);
  formData.set("storeType", input.storeType);
  formData.set("isActive", String(input.isActive));

  for (const key of ["street", "city", "state", "country", "postalCode", "expectedOpenDate", "manager", "phone", "email"] as const) {
    const value = input[key];

    if (value) {
      formData.set(key, value);
    }
  }

  if (input.coverPhoto) {
    formData.set("coverPhoto", input.coverPhoto);
  }

  return formData;
}

export function createAdminStore(input: CreateAdminStoreInput) {
  const formData = buildStoreFormData(input);

  return apiPost<AdminStoreDetail>("/admin/stores", formData);
}

export function updateAdminStore(storeId: string, input: UpdateAdminStoreInput) {
  const formData = buildStoreFormData(input);

  return apiPut<AdminStoreDetail>(`/admin/stores/${storeId}`, formData);
}

export type CreateAdminStationInput = {
  name: string;
  storeId: string;
  code: string;
  status: StationStatusValue;
  sortOrder: number;
};

export function createAdminStation(input: CreateAdminStationInput) {
  return apiPost<AdminStationDetail>("/admin/stations", input);
}

export type AssignStoreManagerInput = {
  displayName: string;
  contactPhone?: string;
  email: string;
  role: ManagerRoleValue;
  accountStatus: AccountStatusValue;
  employeeCode?: string;
};

export function assignStoreManager(storeId: string, input: AssignStoreManagerInput) {
  return apiPost<AssignStoreManagerResult>(`/admin/stores/${storeId}/manager`, input);
}

export type CreateStoreEmployeeInput = {
  displayName: string;
  email?: string;
  contactPhone?: string;
  role: StoreEmployeeRoleValue;
  positionTitle?: string;
  status: StoreEmployeeStatusValue;
  employeeCode?: string;
  hiredAt?: string;
};

export function createStoreEmployee(storeId: string, input: CreateStoreEmployeeInput) {
  return apiPost<AdminStoreDetail>(`/admin/stores/${storeId}/employees`, input);
}
