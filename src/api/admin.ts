import { apiGet, apiPatch, apiPost, apiPut } from "./client";

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

export const inventoryItemStatusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "discontinued", label: "Discontinued" },
] as const;

export type InventoryItemStatusValue = (typeof inventoryItemStatusOptions)[number]["value"];

export const inventoryUnitOptions = [
  { value: "each", label: "Each" },
  { value: "gram", label: "Gram" },
  { value: "kilogram", label: "Kilogram" },
  { value: "milliliter", label: "Milliliter" },
  { value: "liter", label: "Liter" },
  { value: "ounce", label: "Ounce" },
  { value: "pound", label: "Pound" },
  { value: "case", label: "Case" },
] as const;

export type InventoryUnitValue = (typeof inventoryUnitOptions)[number]["value"];

export const inventoryStockStatusOptions = [
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock" },
  { value: "out_of_stock", label: "Out of stock" },
  { value: "inactive", label: "Inactive" },
] as const;

export type InventoryStockStatusValue = (typeof inventoryStockStatusOptions)[number]["value"];

export const productStatusOptions = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
] as const;

export type ProductStatusValue = (typeof productStatusOptions)[number]["value"];

export const productTypeOptions = [
  { value: "prepared_item", label: "Prepared Item" },
  { value: "retail_item", label: "Retail Item" },
  { value: "modifier", label: "Modifier" },
  { value: "bundle", label: "Bundle" },
] as const;

export type ProductTypeValue = (typeof productTypeOptions)[number]["value"];

export const recipeStatusOptions = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
] as const;

export type RecipeStatusValue = (typeof recipeStatusOptions)[number]["value"];

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

export type AdminProduct = {
  _id: string;
  name: string;
  sku: string;
  type: ProductTypeValue;
  status: ProductStatusValue;
  recipeId?: string | null;
  recipe?: {
    _id: string;
    name: string;
    code: string;
    status: string;
    costPerYieldCents: number | null;
    costStatus: "calculated" | "incomplete";
  } | null;
  priceCents: number;
  laborCostCents: number;
  otherCostCents: number;
  ingredientCostCents: number | null;
  productCostCents: number | null;
  costStatus: "calculated" | "incomplete" | "missing_recipe";
  category: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateAdminProductInput = {
  name: string;
  sku: string;
  type: ProductTypeValue;
  status: ProductStatusValue;
  priceCents: number;
  laborCostCents: number;
  otherCostCents: number;
  category: string;
  description?: string;
  recipeId?: string;
};

export function getAdminProducts() {
  return apiGet<{ products: AdminProduct[] }>("/admin/products");
}

export function getAdminProduct(productId: string) {
  return apiGet<{ product: AdminProduct }>(`/admin/products/${productId}`);
}

export type AdminProductCost = {
  productId: string;
  name: string;
  sku: string;
  sellingPriceCents: number;
  ingredientCostCents: number | null;
  laborCostCents: number;
  otherCostCents: number;
  productCostCents: number | null;
  grossMarginCents: number | null;
  grossMarginPercent: number | null;
  costStatus: "calculated" | "incomplete" | "missing_recipe";
  recipe: AdminProduct["recipe"];
};

export function getAdminProductCost(productId: string) {
  return apiGet<{ productCost: AdminProductCost }>(`/admin/products/${productId}/cost`);
}

export function createAdminProduct(input: CreateAdminProductInput) {
  return apiPost<{ product: AdminProduct }>("/admin/products", input);
}

export function updateAdminProduct(productId: string, input: CreateAdminProductInput) {
  return apiPut<{ product: AdminProduct }>(`/admin/products/${productId}`, input);
}

export type AdminRecipeIngredient = {
  inventoryItemId: string;
  quantity: number;
  unit: InventoryUnitValue;
  preparationNote?: string | null;
  unitCostCents: number | null;
  ingredientCostCents: number | null;
  costStatus: "calculated" | "missing_inventory" | "missing_unit_cost" | "unit_not_available";
  item: {
    _id: string;
    name: string;
    sku: string;
    category: string;
    baseUnit: string;
  } | null;
};

export type AdminRecipe = {
  _id: string;
  name: string;
  code: string;
  status: RecipeStatusValue;
  version: number;
  yieldQuantity: number;
  yieldUnit: InventoryUnitValue;
  totalIngredientCostCents: number | null;
  costPerYieldCents: number | null;
  costStatus: "calculated" | "incomplete";
  ingredients: AdminRecipeIngredient[];
  createdAt?: string;
  updatedAt?: string;
};

export type CreateAdminRecipeInput = {
  name: string;
  code: string;
  status: RecipeStatusValue;
  version: number;
  yieldQuantity: number;
  yieldUnit: InventoryUnitValue;
  ingredients: Array<{
    inventoryItemId: string;
    quantity: number;
    unit: InventoryUnitValue;
    preparationNote?: string;
  }>;
};

export function getAdminRecipes() {
  return apiGet<{ recipes: AdminRecipe[] }>("/admin/recipes");
}

export function getAdminRecipe(recipeId: string) {
  return apiGet<{ recipe: AdminRecipe }>(`/admin/recipes/${recipeId}`);
}

export function createAdminRecipe(input: CreateAdminRecipeInput) {
  return apiPost<{ recipe: AdminRecipe }>("/admin/recipes", input);
}

export function updateAdminRecipe(recipeId: string, input: CreateAdminRecipeInput) {
  return apiPut<{ recipe: AdminRecipe }>(`/admin/recipes/${recipeId}`, input);
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

export type AdminInventoryStoreStock = {
  _id: string;
  store: {
    _id: string;
    name: string;
    storeNumber: string;
    slug: string;
    status: string;
  } | null;
  quantityOnHand: number;
  reorderPoint: number;
  parLevel: number;
  status: string;
  lastCountedAt?: string | null;
  lastRequestedAt?: string | null;
};

export type AdminInventoryItem = {
  _id: string;
  name: string;
  sku: string;
  category: string;
  purchaseUnit?: InventoryUnitValue;
  baseUnit: string;
  packagingLevels?: AdminInventoryPackagingLevel[];
  status: string;
  description?: string | null;
  purchasePriceCents?: number | null;
  smallestUnitCostCents?: number | null;
  stores: AdminInventoryStoreStock[];
  createdAt?: string;
  updatedAt?: string;
};

export type AdminInventoryPackagingLevel = {
  parentUnit: string;
  childUnit: string;
  quantity: number;
};

export type AdminInventoryList = {
  inventory: AdminInventoryItem[];
};

export type AdminInventoryDetail = {
  inventoryItem: AdminInventoryItem;
};

export function getAdminInventory() {
  return apiGet<AdminInventoryList>("/admin/inventory");
}

export function getAdminInventoryItem(inventoryItemId: string) {
  return apiGet<AdminInventoryDetail>(`/admin/inventory/${inventoryItemId}`);
}

export type CreateAdminInventoryItemInput = {
  name: string;
  sku: string;
  category: string;
  purchaseUnit: InventoryUnitValue;
  baseUnit: InventoryUnitValue;
  packagingLevels: AdminInventoryPackagingLevel[];
  purchasePriceCents: number;
  storeId: string;
  initialStockQuantity: number;
  status: InventoryItemStatusValue;
  description?: string;
};

export function createAdminInventoryItem(input: CreateAdminInventoryItemInput) {
  return apiPost<AdminInventoryDetail>("/admin/inventory", input);
}

export type UpdateAdminInventoryItemInput = {
  name: string;
  sku: string;
  category: string;
  purchaseUnit: InventoryUnitValue;
  baseUnit: InventoryUnitValue;
  packagingLevels: AdminInventoryPackagingLevel[];
  purchasePriceCents: number;
  status: InventoryItemStatusValue;
};

export function updateAdminInventoryItem(inventoryItemId: string, input: UpdateAdminInventoryItemInput) {
  return apiPatch<AdminInventoryDetail>(`/admin/inventory/${inventoryItemId}`, input);
}

export function updateAdminInventoryPackaging(
  inventoryItemId: string,
  packagingLevels: AdminInventoryPackagingLevel[],
) {
  return apiPatch<AdminInventoryDetail>(`/admin/inventory/${inventoryItemId}/packaging`, { packagingLevels });
}

export type UpdateAdminInventoryStockInput = {
  quantityOnHand: number;
  reorderPoint: number;
  parLevel: number;
  status: InventoryStockStatusValue;
};

export function updateAdminInventoryStock(
  inventoryItemId: string,
  storeId: string,
  input: UpdateAdminInventoryStockInput,
) {
  return apiPatch<AdminInventoryDetail>(`/admin/inventory/${inventoryItemId}/stores/${storeId}/stock`, input);
}

export type AdminInventoryRequestLine = {
  _id: string;
  inventoryItemId: string;
  item: {
    _id: string;
    name: string;
    sku: string;
    category: string;
    baseUnit: string;
  } | null;
  requestedQuantity: number;
  approvedQuantity: number | null;
  fulfilledQuantity: number;
  availableQuantity: number | null;
  status: string;
  notes?: string | null;
};

export type AdminInventoryRequest = {
  _id: string;
  requestNumber: string;
  status: string;
  store: {
    _id: string;
    name: string;
    storeNumber: string;
    slug: string;
    status: string;
  } | null;
  requestedBy: {
    _id: string;
    displayName?: string | null;
    employeeCode?: string | null;
    role: string;
    status: string;
  } | null;
  station: {
    _id: string;
    name: string;
    code: string;
    status: string;
  } | null;
  submittedAt?: string | null;
  resolvedAt?: string | null;
  notes?: string | null;
  lines: AdminInventoryRequestLine[];
  createdAt?: string;
  updatedAt?: string;
};

export function getAdminInventoryRequests(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiGet<{ requests: AdminInventoryRequest[] }>(`/admin/inventory-requests${query}`);
}

export function getAdminInventoryRequest(inventoryRequestId: string) {
  return apiGet<{ request: AdminInventoryRequest }>(`/admin/inventory-requests/${inventoryRequestId}`);
}

export function decideAdminInventoryRequest(
  inventoryRequestId: string,
  decision: "approve" | "reject",
  notes?: string,
) {
  return apiPatch<{ request: AdminInventoryRequest }>(`/admin/inventory-requests/${inventoryRequestId}/decision`, {
    decision,
    notes,
  });
}

export function fulfillAdminInventoryRequest(
  inventoryRequestId: string,
  lines: Array<{ lineId: string; quantity: number }>,
) {
  return apiPatch<{ request: AdminInventoryRequest }>(`/admin/inventory-requests/${inventoryRequestId}/fulfillment`, { lines });
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
