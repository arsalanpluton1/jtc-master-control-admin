import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useState } from "react";
import {
  accountStatusOptions,
  assignStoreManager,
  createAdminStation,
  createAdminStore,
  createStoreEmployee,
  getAdminOverview,
  getAdminStation,
  getAdminStations,
  getAdminStore,
  getAdminStoreEmployee,
  getAdminStoreEmployees,
  getAdminStores,
  managerRoleOptions,
  stationStatusOptions,
  storeEmployeeRoleOptions,
  storeEmployeeStatusOptions,
  storeStatusOptions,
  storeTypeOptions,
  updateAdminStore,
  type AdminOverview,
  type AdminStation,
  type AdminStore,
  type AdminStoreDetail,
  type AdminStorePerson,
  type AdminStoreStation,
  type StoreEmployeeList,
  type StoreManagerCredentials,
  type AssignStoreManagerInput,
  type CreateAdminStationInput,
  type CreateAdminStoreInput,
  type CreateStoreEmployeeInput,
  type UpdateAdminStoreInput,
} from "../api/admin";
import type { SessionUser } from "../api/auth";
import { getManagerStoreEmployee, getManagerStoreEmployees, getStoreSummary, type StoreSummary } from "../api/manager";
import { EmptyState, ErrorState, LoadingState } from "../components/PageStates";
import type { AppRoute } from "../routes";

type ScreenType = "list" | "detail" | "create" | "edit";

const screenTypes: ScreenType[] = ["list", "detail", "create", "edit"];
const storeCreatedMessageKey = "jtc-store-created-message";
const storeUpdatedMessageKey = "jtc-store-updated-message";
const stationCreatedMessageKey = "jtc-station-created-message";

type ResourcePageProps = {
  pathname: string;
  route: AppRoute;
  user: SessionUser;
  onNavigate: (path: string) => void;
};

export function ResourcePage({ pathname, route, user, onNavigate }: ResourcePageProps) {
  if (route.key === "stores") {
    return <StoreManagementPage pathname={pathname} onNavigate={onNavigate} />;
  }

  if (route.key === "stations") {
    return <StationManagementPage pathname={pathname} onNavigate={onNavigate} />;
  }

  if (route.key === "store-employees") {
    return <ManagerEmployeesPage pathname={pathname} user={user} onNavigate={onNavigate} />;
  }

  return <ProtectedResourcePage route={route} user={user} />;
}

function ProtectedResourcePage({ route, user }: { route: AppRoute; user: SessionUser }) {
  const isManagerArea = route.area === "Store Manager";
  const [adminOverview, setAdminOverview] = useState<AdminOverview | null>(null);
  const [storeSummary, setStoreSummary] = useState<StoreSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProtectedData() {
      setIsLoading(true);
      setError(null);
      setAdminOverview(null);
      setStoreSummary(null);

      try {
        if (route.area === "Admin") {
          const data = await getAdminOverview();

          if (isMounted) {
            setAdminOverview(data);
          }
        } else if (user.storeId) {
          const data = await getStoreSummary(user.storeId);

          if (isMounted) {
            setStoreSummary(data);
          }
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load protected data");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProtectedData();

    return () => {
      isMounted = false;
    };
  }, [route.area, user.storeId]);

  return (
    <div className="page-stack">
      {isLoading ? <LoadingState title="Loading protected data" message="Checking your access..." /> : null}
      {error ? <ErrorState title="Access check failed" message={error} /> : null}
      {adminOverview ? <AdminOverviewPanel overview={adminOverview} /> : null}
      {storeSummary ? <StoreSummaryPanel summary={storeSummary} /> : null}

      <section className="screen-grid" aria-label={`${route.title} screen layouts`}>
        {screenTypes.map((screenType) => (
          <ScreenLayoutPreview key={screenType} route={route} screenType={screenType} />
        ))}
      </section>

      <EmptyState
        title={isManagerArea ? "Store Manager area reserved" : `${route.title} module ready`}
        message={
          isManagerArea
            ? "Navigation and layout space are in place for future store manager workflows."
            : "This placeholder gives the next tasks a consistent landing point for list, detail, create, and edit screens."
        }
      />
    </div>
  );
}

function StoreManagementPage({ pathname, onNavigate }: { pathname: string; onNavigate: (path: string) => void }) {
  const normalizedPath = pathname.replace(/\/$/, "") || "/stores";
  const isCreatePath = normalizedPath === "/stores/new";
  const storeEditMatch = normalizedPath.match(/^\/stores\/([^/]+)\/edit$/);
  const employeeDetailMatch = normalizedPath.match(/^\/stores\/([^/]+)\/employees\/([^/]+)$/);
  const employeeListMatch = normalizedPath.match(/^\/stores\/([^/]+)\/employees$/);
  const storeDetailMatch = normalizedPath.match(/^\/stores\/([^/]+)$/);
  const editStoreId = storeEditMatch?.[1];
  const employeeListStoreId = employeeListMatch?.[1];
  const employeeDetailStoreId = employeeDetailMatch?.[1];
  const employeeId = employeeDetailMatch?.[2];
  const storeId = !isCreatePath && !editStoreId ? storeDetailMatch?.[1] : undefined;

  if (isCreatePath) {
    return <StoreCreatePage onNavigate={onNavigate} />;
  }

  if (editStoreId) {
    return <StoreEditPage storeId={editStoreId} onNavigate={onNavigate} />;
  }

  if (employeeDetailStoreId && employeeId) {
    return (
      <EmployeeDetailPage
        employeeId={employeeId}
        loadEmployee={(requestedEmployeeId) => getAdminStoreEmployee(employeeDetailStoreId, requestedEmployeeId)}
        listPath={`/stores/${employeeDetailStoreId}/employees`}
        onNavigate={onNavigate}
        requestKey={`${employeeDetailStoreId}:${employeeId}`}
      />
    );
  }

  if (employeeListStoreId) {
    return (
      <EmployeeListPage
        detailPath={(employee) => `/stores/${employeeListStoreId}/employees/${employee._id}`}
        loadEmployees={() => getAdminStoreEmployees(employeeListStoreId)}
        onNavigate={onNavigate}
        parentPath={`/stores/${employeeListStoreId}`}
        parentText="Back to Store"
        requestKey={employeeListStoreId}
        titleEyebrow="Admin Store Employees"
      />
    );
  }

  if (storeId) {
    return <StoreDetailPage storeId={storeId} onNavigate={onNavigate} />;
  }

  return <StoreListPage onNavigate={onNavigate} />;
}

function StationManagementPage({ pathname, onNavigate }: { pathname: string; onNavigate: (path: string) => void }) {
  const normalizedPath = pathname.replace(/\/$/, "") || "/stations";
  const isCreatePath = normalizedPath === "/stations/new";
  const stationDetailMatch = normalizedPath.match(/^\/stations\/([^/]+)$/);
  const stationId = !isCreatePath ? stationDetailMatch?.[1] : undefined;

  if (isCreatePath) {
    return <StationCreatePage onNavigate={onNavigate} />;
  }

  if (stationId) {
    return <StationDetailPage stationId={stationId} onNavigate={onNavigate} />;
  }

  return <StationListPage onNavigate={onNavigate} />;
}

function StationListPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [stations, setStations] = useState<AdminStation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStations() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getAdminStations();

        if (isMounted) {
          setStations(data.stations);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load stations");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStations();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="page-stack">
      <StationActionBar onNavigate={onNavigate} />
      {isLoading ? <LoadingState title="Loading stations" message="Fetching station records from the API..." /> : null}
      {error ? <ErrorState title="Stations unavailable" message={error} /> : null}
      {!isLoading && !error && stations.length === 0 ? (
        <EmptyState title="No stations found" message="Create a station to assign production areas to a store." />
      ) : null}
      {!isLoading && !error && stations.length > 0 ? (
        <StationTable stations={stations} onNavigate={onNavigate} />
      ) : null}
    </div>
  );
}

function StationActionBar({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="resource-toolbar">
      <div>
        <p className="eyebrow">Admin Station Management</p>
        <h2>Station directory</h2>
      </div>
      <button type="button" onClick={() => onNavigate("/stations/new")}>
        Create Station
      </button>
    </div>
  );
}

function StationTable({ stations, onNavigate }: { stations: AdminStation[]; onNavigate: (path: string) => void }) {
  return (
    <section className="table-panel" aria-label="Stations">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Station Name</th>
            <th scope="col">Assigned Store</th>
            <th scope="col">Station Code</th>
            <th scope="col">Status</th>
            <th scope="col">Sort Order</th>
            <th scope="col">Details</th>
          </tr>
        </thead>
        <tbody>
          {stations.map((station) => (
            <tr key={station._id}>
              <td>
                <strong>{station.name}</strong>
              </td>
              <td>{station.store ? `${station.store.name} (${station.store.storeNumber})` : "Store unavailable"}</td>
              <td>{station.code}</td>
              <td>
                <StatusBadge value={station.status} />
              </td>
              <td>{station.sortOrder}</td>
              <td>
                <a
                  href={`/stations/${station._id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigate(`/stations/${station._id}`);
                  }}
                >
                  View details
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function StationCreatePage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [form, setForm] = useState<CreateAdminStationInput>({
    name: "",
    storeId: "",
    code: "",
    status: "active",
    sortOrder: 0,
  });
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadStores() {
      setIsLoadingStores(true);
      setLoadError(null);

      try {
        const data = await getAdminStores();

        if (isMounted) {
          setStores(data.stores);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Unable to load stores");
        }
      } finally {
        if (isMounted) {
          setIsLoadingStores(false);
        }
      }
    }

    void loadStores();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateField(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === "sortOrder" ? Number(value) : value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateStationForm(form);
    setFieldErrors(errors);
    setSubmitError(null);

    if (Object.values(errors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await createAdminStation({
        ...form,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
      });
      window.sessionStorage.setItem(stationCreatedMessageKey, `${data.station.name} was created successfully.`);
      onNavigate(`/stations/${data.station._id}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create station");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="resource-toolbar">
        <div>
          <p className="eyebrow">Admin Station Management</p>
          <h2>Create station</h2>
        </div>
        <button type="button" onClick={() => onNavigate("/stations")}>
          Back to Stations
        </button>
      </div>

      {isLoadingStores ? <LoadingState title="Loading stores" message="Preparing store assignments..." /> : null}
      {loadError ? <ErrorState title="Stores unavailable" message={loadError} /> : null}
      {submitError ? <ErrorState title="Station creation failed" message={submitError} /> : null}

      {!isLoadingStores && !loadError ? (
        <form className="store-form" onSubmit={handleSubmit} noValidate>
          <section aria-label="Station configuration">
            <h3>Station configuration</h3>
            <div className="form-grid">
              <Field label="Station Name" error={fieldErrors.name} required>
                <input name="name" value={form.name} onChange={updateField} aria-invalid={Boolean(fieldErrors.name)} />
              </Field>
              <Field label="Assigned Store" error={fieldErrors.storeId} required>
                <select name="storeId" value={form.storeId} onChange={updateField} aria-invalid={Boolean(fieldErrors.storeId)}>
                  <option value="">Select a store</option>
                  {stores.map((store) => (
                    <option key={store._id} value={store._id}>
                      {store.name} ({store.storeNumber})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Station Code" error={fieldErrors.code} required>
                <input name="code" value={form.code} onChange={updateField} aria-invalid={Boolean(fieldErrors.code)} />
              </Field>
              <Field label="Station Status" error={fieldErrors.status}>
                <select name="status" value={form.status} onChange={updateField} aria-invalid={Boolean(fieldErrors.status)}>
                  {stationStatusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Sort Order" error={fieldErrors.sortOrder}>
                <input
                  min="0"
                  name="sortOrder"
                  type="number"
                  value={form.sortOrder}
                  onChange={updateField}
                  aria-invalid={Boolean(fieldErrors.sortOrder)}
                />
              </Field>
            </div>
          </section>

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={() => onNavigate("/stations")}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || stores.length === 0}>
              {isSubmitting ? "Creating..." : "Create Station"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function validateStationForm(form: CreateAdminStationInput) {
  const errors: Record<string, string> = {};

  if (!form.name.trim()) {
    errors.name = "Station name is required.";
  }

  if (!form.storeId) {
    errors.storeId = "Store is required.";
  }

  if (!form.code.trim()) {
    errors.code = "Station code is required.";
  } else if (!/^[A-Za-z0-9_-]+$/.test(form.code)) {
    errors.code = "Use letters, numbers, underscores, or hyphens.";
  }

  if (!form.status) {
    errors.status = "Station status is required.";
  }

  if (!Number.isInteger(form.sortOrder) || form.sortOrder < 0) {
    errors.sortOrder = "Sort order must be a whole number greater than or equal to 0.";
  }

  return errors;
}

function StationDetailPage({ stationId, onNavigate }: { stationId: string; onNavigate: (path: string) => void }) {
  const [station, setStation] = useState<AdminStation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const storedMessage = window.sessionStorage.getItem(stationCreatedMessageKey);

    if (storedMessage) {
      setSuccessMessage(storedMessage);
      window.sessionStorage.removeItem(stationCreatedMessageKey);
    }

    async function loadStation() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getAdminStation(stationId);

        if (isMounted) {
          setStation(data.station);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load station details");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStation();

    return () => {
      isMounted = false;
    };
  }, [stationId]);

  return (
    <div className="page-stack">
      <div className="resource-toolbar">
        <div>
          <p className="eyebrow">Station Details</p>
          <h2>{station?.name ?? "Station record"}</h2>
        </div>
        <button type="button" className="secondary-button" onClick={() => onNavigate("/stations")}>
          Back to Stations
        </button>
      </div>
      {isLoading ? <LoadingState title="Loading station details" message="Fetching this station from the API..." /> : null}
      {successMessage ? <SuccessState message={successMessage} title="Station created" /> : null}
      {error ? <ErrorState title="Station unavailable" message={error} /> : null}
      {!isLoading && !error && station ? <StationDetailPanel station={station} onNavigate={onNavigate} /> : null}
    </div>
  );
}

function StationDetailPanel({ station, onNavigate }: { station: AdminStation; onNavigate: (path: string) => void }) {
  const details = [
    ["Station Name", station.name],
    ["Assigned Store", station.store ? `${station.store.name} (${station.store.storeNumber})` : "Store unavailable"],
    ["Station Code", station.code],
    ["Station Status", formatStationStatus(station.status)],
    ["Sort Order", String(station.sortOrder)],
    ["Created", formatOptionalDate(station.createdAt)],
    ["Updated", formatOptionalDate(station.updatedAt)],
  ] as const;

  return (
    <div className="store-detail-stack">
      <section className="detail-panel" aria-label={`${station.name} details`}>
        {details.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>
      {station.store ? (
        <div className="section-action-row">
          <button type="button" className="secondary-button" onClick={() => onNavigate(`/stores/${station.store?._id}`)}>
            View Assigned Store
          </button>
        </div>
      ) : null}
    </div>
  );
}

function StoreCreatePage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [form, setForm] = useState<CreateAdminStoreInput>({
    name: "",
    storeNumber: "",
    status: "planning",
    storeType: "standard",
    isActive: true,
    street: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    expectedOpenDate: "",
    manager: "",
    phone: "",
    email: "",
    coverPhoto: null,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateTextField(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  }

  function updateActiveState(event: ChangeEvent<HTMLInputElement>) {
    setForm((current) => ({ ...current, isActive: event.target.checked }));
    setFieldErrors((current) => ({ ...current, isActive: "" }));
  }

  function updateCoverPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    const nextErrors = { ...fieldErrors, coverPhoto: "" };

    if (file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      nextErrors.coverPhoto = "Cover photo must be a JPEG, PNG, or WebP image.";
    }

    if (file && file.size > 5 * 1024 * 1024) {
      nextErrors.coverPhoto = "Cover photo must be 5 MB or smaller.";
    }

    setForm((current) => ({ ...current, coverPhoto: file }));
    setFieldErrors(nextErrors);
  }

  function validateForm() {
    return validateStoreForm(form);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateForm();
    setFieldErrors(errors);
    setSubmitError(null);

    if (Object.values(errors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await createAdminStore({
        ...form,
        name: form.name.trim(),
        storeNumber: form.storeNumber.trim(),
      });
      window.sessionStorage.setItem(storeCreatedMessageKey, `${data.store.name} was created successfully.`);
      onNavigate(`/stores/${data.store._id}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create store");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="resource-toolbar">
        <div>
          <p className="eyebrow">Admin Store Management</p>
          <h2>Create store</h2>
        </div>
        <button type="button" onClick={() => onNavigate("/stores")}>
          Back to Stores
        </button>
      </div>

      {submitError ? <ErrorState title="Store creation failed" message={submitError} /> : null}

      <form className="store-form" onSubmit={handleSubmit} noValidate>
        <section aria-label="Required store details">
          <h3>Required details</h3>
          <div className="form-grid">
            <Field label="Store Name" error={fieldErrors.name} required>
              <input name="name" value={form.name} onChange={updateTextField} aria-invalid={Boolean(fieldErrors.name)} />
            </Field>
            <Field label="Store Number" error={fieldErrors.storeNumber} required>
              <input
                name="storeNumber"
                value={form.storeNumber}
                onChange={updateTextField}
                aria-invalid={Boolean(fieldErrors.storeNumber)}
              />
            </Field>
            <Field label="Store Status" error={fieldErrors.status} required>
              <select name="status" value={form.status} onChange={updateTextField} aria-invalid={Boolean(fieldErrors.status)}>
                {storeStatusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Store Type" error={fieldErrors.storeType} required>
              <select name="storeType" value={form.storeType} onChange={updateTextField} aria-invalid={Boolean(fieldErrors.storeType)}>
                {storeTypeOptions.map((storeType) => (
                  <option key={storeType.value} value={storeType.value}>
                    {storeType.label}
                  </option>
                ))}
              </select>
            </Field>
            <label className="checkbox-field">
              <input type="checkbox" checked={form.isActive} onChange={updateActiveState} />
              <span>Active store</span>
            </label>
          </div>
        </section>

        <section aria-label="Optional store details">
          <h3>Optional details</h3>
          <div className="form-grid">
            <Field label="Street" error={fieldErrors.street}>
              <input name="street" value={form.street} onChange={updateTextField} />
            </Field>
            <Field label="City" error={fieldErrors.city}>
              <input name="city" value={form.city} onChange={updateTextField} />
            </Field>
            <Field label="State" error={fieldErrors.state}>
              <input name="state" value={form.state} onChange={updateTextField} />
            </Field>
            <Field label="Country" error={fieldErrors.country}>
              <input name="country" value={form.country} onChange={updateTextField} />
            </Field>
            <Field label="Postal Code" error={fieldErrors.postalCode}>
              <input name="postalCode" value={form.postalCode} onChange={updateTextField} />
            </Field>
            <Field label="Expected Open Date" error={fieldErrors.expectedOpenDate}>
              <input name="expectedOpenDate" type="date" value={form.expectedOpenDate} onChange={updateTextField} />
            </Field>
            <Field label="Manager" error={fieldErrors.manager}>
              <input name="manager" value={form.manager} onChange={updateTextField} />
            </Field>
            <Field label="Phone" error={fieldErrors.phone}>
              <input name="phone" value={form.phone} onChange={updateTextField} />
            </Field>
            <Field label="Email" error={fieldErrors.email}>
              <input name="email" type="email" value={form.email} onChange={updateTextField} aria-invalid={Boolean(fieldErrors.email)} />
            </Field>
            <Field label="Cover Photo" error={fieldErrors.coverPhoto}>
              <input accept="image/jpeg,image/png,image/webp" name="coverPhoto" type="file" onChange={updateCoverPhoto} />
            </Field>
          </div>
        </section>

        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={() => onNavigate("/stores")}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Store"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StoreEditPage({ storeId, onNavigate }: { storeId: string; onNavigate: (path: string) => void }) {
  const [form, setForm] = useState<UpdateAdminStoreInput | null>(null);
  const [storeName, setStoreName] = useState("Store record");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadStore() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await getAdminStore(storeId);

        if (isMounted) {
          setStoreName(data.store.name);
          setForm(storeToForm(data.store));
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Unable to load store details");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStore();

    return () => {
      isMounted = false;
    };
  }, [storeId]);

  function updateTextField(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((current) => (current ? { ...current, [name]: value } : current));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  }

  function updateActiveState(event: ChangeEvent<HTMLInputElement>) {
    setForm((current) => (current ? { ...current, isActive: event.target.checked } : current));
    setFieldErrors((current) => ({ ...current, isActive: "" }));
  }

  function updateCoverPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    const nextErrors = { ...fieldErrors, coverPhoto: "" };

    if (file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      nextErrors.coverPhoto = "Cover photo must be a JPEG, PNG, or WebP image.";
    }

    if (file && file.size > 5 * 1024 * 1024) {
      nextErrors.coverPhoto = "Cover photo must be 5 MB or smaller.";
    }

    setForm((current) => (current ? { ...current, coverPhoto: file } : current));
    setFieldErrors(nextErrors);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form) {
      return;
    }

    const errors = validateStoreForm(form);
    setFieldErrors(errors);
    setSubmitError(null);

    if (Object.values(errors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await updateAdminStore(storeId, {
        ...form,
        name: form.name.trim(),
        storeNumber: form.storeNumber.trim(),
      });
      window.sessionStorage.setItem(storeUpdatedMessageKey, `${data.store.name} was updated successfully.`);
      onNavigate(`/stores/${data.store._id}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to update store");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="resource-toolbar">
        <div>
          <p className="eyebrow">Admin Store Management</p>
          <h2>Edit {storeName}</h2>
        </div>
        <button type="button" onClick={() => onNavigate(`/stores/${storeId}`)}>
          Back to Details
        </button>
      </div>

      {isLoading ? <LoadingState title="Loading store details" message="Preparing this store for editing..." /> : null}
      {loadError ? <ErrorState title="Store unavailable" message={loadError} /> : null}
      {submitError ? <ErrorState title="Store update failed" message={submitError} /> : null}

      {!isLoading && !loadError && form ? (
        <form className="store-form" onSubmit={handleSubmit} noValidate>
          <StoreFormSections
            fieldErrors={fieldErrors}
            form={form}
            onActiveChange={updateActiveState}
            onCoverPhotoChange={updateCoverPhoto}
            onTextChange={updateTextField}
          />
          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={() => onNavigate(`/stores/${storeId}`)}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function validateStoreForm(form: CreateAdminStoreInput | UpdateAdminStoreInput) {
  const errors: Record<string, string> = {};

  if (!form.name.trim()) {
    errors.name = "Store name is required.";
  }

  if (!form.storeNumber.trim()) {
    errors.storeNumber = "Store number is required.";
  }

  if (!form.status) {
    errors.status = "Store status is required.";
  }

  if (!form.storeType) {
    errors.storeType = "Store type is required.";
  }

  if (typeof form.isActive !== "boolean") {
    errors.isActive = "Active state is required.";
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (form.coverPhoto && !["image/jpeg", "image/png", "image/webp"].includes(form.coverPhoto.type)) {
    errors.coverPhoto = "Cover photo must be a JPEG, PNG, or WebP image.";
  }

  if (form.coverPhoto && form.coverPhoto.size > 5 * 1024 * 1024) {
    errors.coverPhoto = "Cover photo must be 5 MB or smaller.";
  }

  return errors;
}

function storeToForm(store: AdminStore): UpdateAdminStoreInput {
  return {
    name: store.name,
    storeNumber: store.storeNumber,
    status: store.status,
    storeType: store.storeType,
    isActive: store.isActive,
    street: store.address?.line1 ?? "",
    city: store.address?.city ?? "",
    state: store.address?.region ?? "",
    country: store.address?.country ?? "",
    postalCode: store.address?.postalCode ?? "",
    expectedOpenDate: store.expectedOpenDate ? store.expectedOpenDate.slice(0, 10) : "",
    manager: store.manager ?? "",
    phone: store.phone ?? "",
    email: store.email ?? "",
    coverPhoto: null,
  };
}

function StoreFormSections({
  fieldErrors,
  form,
  onActiveChange,
  onCoverPhotoChange,
  onTextChange,
}: {
  fieldErrors: Record<string, string>;
  form: CreateAdminStoreInput | UpdateAdminStoreInput;
  onActiveChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCoverPhotoChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onTextChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  return (
    <>
      <section aria-label="Required store details">
        <h3>Required details</h3>
        <div className="form-grid">
          <Field label="Store Name" error={fieldErrors.name} required>
            <input name="name" value={form.name} onChange={onTextChange} aria-invalid={Boolean(fieldErrors.name)} />
          </Field>
          <Field label="Store Number" error={fieldErrors.storeNumber} required>
            <input
              name="storeNumber"
              value={form.storeNumber}
              onChange={onTextChange}
              aria-invalid={Boolean(fieldErrors.storeNumber)}
            />
          </Field>
          <Field label="Store Status" error={fieldErrors.status} required>
            <select name="status" value={form.status} onChange={onTextChange} aria-invalid={Boolean(fieldErrors.status)}>
              {storeStatusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Store Type" error={fieldErrors.storeType} required>
            <select name="storeType" value={form.storeType} onChange={onTextChange} aria-invalid={Boolean(fieldErrors.storeType)}>
              {storeTypeOptions.map((storeType) => (
                <option key={storeType.value} value={storeType.value}>
                  {storeType.label}
                </option>
              ))}
            </select>
          </Field>
          <label className="checkbox-field">
            <input type="checkbox" checked={form.isActive} onChange={onActiveChange} />
            <span>Active store</span>
          </label>
        </div>
      </section>

      <section aria-label="Optional store details">
        <h3>Optional details</h3>
        <div className="form-grid">
          <Field label="Street" error={fieldErrors.street}>
            <input name="street" value={form.street} onChange={onTextChange} />
          </Field>
          <Field label="City" error={fieldErrors.city}>
            <input name="city" value={form.city} onChange={onTextChange} />
          </Field>
          <Field label="State" error={fieldErrors.state}>
            <input name="state" value={form.state} onChange={onTextChange} />
          </Field>
          <Field label="Country" error={fieldErrors.country}>
            <input name="country" value={form.country} onChange={onTextChange} />
          </Field>
          <Field label="Postal Code" error={fieldErrors.postalCode}>
            <input name="postalCode" value={form.postalCode} onChange={onTextChange} />
          </Field>
          <Field label="Expected Open Date" error={fieldErrors.expectedOpenDate}>
            <input name="expectedOpenDate" type="date" value={form.expectedOpenDate} onChange={onTextChange} />
          </Field>
          <Field label="Manager" error={fieldErrors.manager}>
            <input name="manager" value={form.manager} onChange={onTextChange} />
          </Field>
          <Field label="Phone" error={fieldErrors.phone}>
            <input name="phone" value={form.phone} onChange={onTextChange} />
          </Field>
          <Field label="Email" error={fieldErrors.email}>
            <input name="email" type="email" value={form.email} onChange={onTextChange} aria-invalid={Boolean(fieldErrors.email)} />
          </Field>
          <Field label="Cover Photo" error={fieldErrors.coverPhoto}>
            <input accept="image/jpeg,image/png,image/webp" name="coverPhoto" type="file" onChange={onCoverPhotoChange} />
          </Field>
        </div>
      </section>
    </>
  );
}

function Field({
  children,
  error,
  label,
  required = false,
}: {
  children: ReactNode;
  error?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="form-field">
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      {children}
      {error ? <strong>{error}</strong> : null}
    </label>
  );
}

function StoreListPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStores() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getAdminStores();

        if (isMounted) {
          setStores(data.stores);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load stores");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStores();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="page-stack">
      <StoreActionBar onNavigate={onNavigate} />
      {isLoading ? <LoadingState title="Loading stores" message="Fetching store records from the API..." /> : null}
      {error ? <ErrorState title="Stores unavailable" message={error} /> : null}
      {!isLoading && !error && stores.length === 0 ? (
        <EmptyState title="No stores found" message="Create Store will be available in Task 6." />
      ) : null}
      {!isLoading && !error && stores.length > 0 ? (
        <StoreTable stores={stores} onNavigate={onNavigate} />
      ) : null}
    </div>
  );
}

function StoreActionBar({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="resource-toolbar">
      <div>
        <p className="eyebrow">Admin Store Management</p>
        <h2>Store directory</h2>
      </div>
      <button type="button" onClick={() => onNavigate("/stores/new")}>
        Create Store
      </button>
    </div>
  );
}

function StoreTable({ stores, onNavigate }: { stores: AdminStore[]; onNavigate: (path: string) => void }) {
  return (
    <section className="table-panel" aria-label="Stores">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Store Name</th>
            <th scope="col">Store Number</th>
            <th scope="col">Store Type</th>
            <th scope="col">Store Status</th>
            <th scope="col">Active State</th>
            <th scope="col">Details</th>
          </tr>
        </thead>
        <tbody>
          {stores.map((store) => (
            <tr key={store._id}>
              <td>
                <strong>{store.name}</strong>
              </td>
              <td>{store.storeNumber}</td>
              <td>{formatStoreType(store.storeType)}</td>
              <td>
                <StatusBadge value={store.status} />
              </td>
              <td>{store.isActive ? "Active" : "Not active"}</td>
              <td>
                <a
                  href={`/stores/${store._id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigate(`/stores/${store._id}`);
                  }}
                >
                  View details
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function StoreDetailPage({ storeId, onNavigate }: { storeId: string; onNavigate: (path: string) => void }) {
  const [detail, setDetail] = useState<AdminStoreDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [managerCredentials, setManagerCredentials] = useState<StoreManagerCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const storedMessage = window.sessionStorage.getItem(storeCreatedMessageKey);

    if (storedMessage) {
      setSuccessMessage(storedMessage);
      window.sessionStorage.removeItem(storeCreatedMessageKey);
    }

    const storedUpdateMessage = window.sessionStorage.getItem(storeUpdatedMessageKey);

    if (storedUpdateMessage) {
      setSuccessMessage(storedUpdateMessage);
      window.sessionStorage.removeItem(storeUpdatedMessageKey);
    }

    async function loadStore() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getAdminStore(storeId);

        if (isMounted) {
          setDetail(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load store details");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStore();

    return () => {
      isMounted = false;
    };
  }, [storeId]);

  return (
    <div className="page-stack">
      <div className="resource-toolbar">
        <div>
          <p className="eyebrow">Store Details</p>
          <h2>{detail?.store.name ?? "Store record"}</h2>
        </div>
        <div className="toolbar-actions">
          <button type="button" className="secondary-button" onClick={() => onNavigate("/stores")}>
            Back to Stores
          </button>
          <button type="button" onClick={() => onNavigate(`/stores/${storeId}/edit`)}>
            Edit Store
          </button>
        </div>
      </div>
      {isLoading ? <LoadingState title="Loading store details" message="Fetching this store from the API..." /> : null}
      {successMessage ? (
        <SuccessState credentials={managerCredentials} message={successMessage} title={successTitle(successMessage)} />
      ) : null}
      {error ? <ErrorState title="Store unavailable" message={error} /> : null}
      {!isLoading && !error && detail ? (
        <StoreDetailPanel
          detail={detail}
          onNavigate={onNavigate}
          onEmployeeCreated={(nextDetail, message) => {
            setDetail(nextDetail);
            setSuccessMessage(message);
            setManagerCredentials(null);
          }}
          onManagerAssigned={(nextDetail, message, credentials) => {
            setDetail(nextDetail);
            setSuccessMessage(message);
            setManagerCredentials(credentials);
          }}
        />
      ) : null}
    </div>
  );
}

function ManagerEmployeesPage({
  pathname,
  user,
  onNavigate,
}: {
  pathname: string;
  user: SessionUser;
  onNavigate: (path: string) => void;
}) {
  if (!user.storeId) {
    return <ErrorState title="Store assignment unavailable" message="Your manager account is not assigned to an active store." />;
  }

  const normalizedPath = pathname.replace(/\/$/, "") || "/store-manager/employees";
  const employeeDetailMatch = normalizedPath.match(/^\/store-manager\/employees\/([^/]+)$/);
  const employeeId = employeeDetailMatch?.[1];

  if (employeeId) {
    return (
      <EmployeeDetailPage
        employeeId={employeeId}
        loadEmployee={(requestedEmployeeId) => getManagerStoreEmployee(user.storeId!, requestedEmployeeId)}
        listPath="/store-manager/employees"
        onNavigate={onNavigate}
        requestKey={`${user.storeId}:${employeeId}`}
      />
    );
  }

  return (
    <EmployeeListPage
      detailPath={(employee) => `/store-manager/employees/${employee._id}`}
      loadEmployees={() => getManagerStoreEmployees(user.storeId!)}
      onNavigate={onNavigate}
      requestKey={user.storeId}
      titleEyebrow="Assigned Store Employees"
    />
  );
}

function EmployeeListPage({
  detailPath,
  loadEmployees,
  onNavigate,
  parentPath,
  parentText = "Back",
  requestKey,
  titleEyebrow,
}: {
  detailPath: (employee: AdminStorePerson) => string;
  loadEmployees: () => Promise<StoreEmployeeList>;
  onNavigate: (path: string) => void;
  parentPath?: string;
  parentText?: string;
  requestKey: string;
  titleEyebrow: string;
}) {
  const [data, setData] = useState<StoreEmployeeList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadEmployeeList() {
      setIsLoading(true);
      setError(null);

      try {
        const nextData = await loadEmployees();

        if (isMounted) {
          setData(nextData);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load employees");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadEmployeeList();

    return () => {
      isMounted = false;
    };
  }, [requestKey]);

  return (
    <div className="page-stack">
      <div className="resource-toolbar">
        <div>
          <p className="eyebrow">{titleEyebrow}</p>
          <h2>{data ? `${data.store.name} employees` : "Employees"}</h2>
        </div>
        {parentPath ? (
          <button type="button" className="secondary-button" onClick={() => onNavigate(parentPath)}>
            {parentText}
          </button>
        ) : null}
      </div>
      {isLoading ? <LoadingState title="Loading employees" message="Fetching employee records from the API..." /> : null}
      {error ? <ErrorState title="Employees unavailable" message={error} /> : null}
      {!isLoading && !error && data?.employees.length === 0 ? (
        <EmptyState title="No employees found" message="This store does not have saved employee records yet." />
      ) : null}
      {!isLoading && !error && data && data.employees.length > 0 ? (
        <EmployeeTable detailPath={detailPath} employees={data.employees} onNavigate={onNavigate} />
      ) : null}
    </div>
  );
}

function EmployeeTable({
  detailPath,
  employees,
  onNavigate,
}: {
  detailPath: (employee: AdminStorePerson) => string;
  employees: AdminStorePerson[];
  onNavigate: (path: string) => void;
}) {
  return (
    <section className="table-panel" aria-label="Employees">
      <table className="data-table employee-table">
        <thead>
          <tr>
            <th scope="col">Employee</th>
            <th scope="col">Position</th>
            <th scope="col">Store</th>
            <th scope="col">Status</th>
            <th scope="col">Contact</th>
            <th scope="col">Details</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => {
            const path = detailPath(employee);

            return (
              <tr key={employee._id}>
                <td>
                  <strong>{employee.user?.displayName ?? employee.displayName ?? "Unlinked employee"}</strong>
                  <span>{employee.employeeCode ?? "No employee code"}</span>
                </td>
                <td>{formatStoreEmployeePosition(employee)}</td>
                <td>{employee.store ? `${employee.store.name} (${employee.store.storeNumber})` : "Store not set"}</td>
                <td>
                  <StatusPill>{formatTitle(employee.status)}</StatusPill>
                </td>
                <td>{formatEmployeeContact(employee)}</td>
                <td>
                  <a
                    href={path}
                    onClick={(event) => {
                      event.preventDefault();
                      onNavigate(path);
                    }}
                  >
                    View details
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function EmployeeDetailPage({
  employeeId,
  listPath,
  loadEmployee,
  onNavigate,
  requestKey,
}: {
  employeeId: string;
  listPath: string;
  loadEmployee: (employeeId: string) => Promise<{ employee: AdminStorePerson }>;
  onNavigate: (path: string) => void;
  requestKey: string;
}) {
  const [employee, setEmployee] = useState<AdminStorePerson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadEmployeeDetail() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await loadEmployee(employeeId);

        if (isMounted) {
          setEmployee(data.employee);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load employee details");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadEmployeeDetail();

    return () => {
      isMounted = false;
    };
  }, [requestKey]);

  return (
    <div className="page-stack">
      <div className="resource-toolbar">
        <div>
          <p className="eyebrow">Employee Details</p>
          <h2>{employee ? employee.user?.displayName ?? employee.displayName ?? "Employee record" : "Employee record"}</h2>
        </div>
        <button type="button" className="secondary-button" onClick={() => onNavigate(listPath)}>
          Back to Employees
        </button>
      </div>
      {isLoading ? <LoadingState title="Loading employee details" message="Fetching this employee record from the API..." /> : null}
      {error ? <ErrorState title="Employee unavailable" message={error} /> : null}
      {!isLoading && !error && employee ? <EmployeeDetailPanel employee={employee} /> : null}
    </div>
  );
}

function EmployeeDetailPanel({ employee }: { employee: AdminStorePerson }) {
  const details = [
    ["Saved Name", employee.displayName ?? employee.user?.displayName ?? "Not set"],
    ["Account Name", employee.user?.displayName ?? "Not linked"],
    ["Email", employee.user?.email ?? employee.email ?? "Not set"],
    ["Contact Phone", employee.contactPhone ?? "Not set"],
    ["Employee Code", employee.employeeCode ?? "Not set"],
    ["Position", formatStoreEmployeePosition(employee)],
    ["Role", formatTitle(employee.role)],
    ["Employee Status", formatTitle(employee.status)],
    ["Account Status", employee.user?.status ? formatTitle(employee.user.status) : "Not linked"],
    ["Store", employee.store ? `${employee.store.name} (${employee.store.storeNumber})` : "Not set"],
    ["Hire Date", formatOptionalDate(employee.hiredAt)],
    ["Termination Date", formatOptionalDate(employee.terminatedAt)],
    ["Created", formatOptionalDate(employee.createdAt)],
    ["Updated", formatOptionalDate(employee.updatedAt)],
  ] as const;

  return (
    <section className="detail-panel" aria-label="Employee saved information">
      {details.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </section>
  );
}

function successTitle(message: string) {
  if (message.includes("manager")) {
    return "Manager assigned";
  }

  if (message.includes("employee")) {
    return "Employee created";
  }

  return message.includes("updated") ? "Store updated" : "Store created";
}

function SuccessState({
  credentials,
  message,
  title,
}: {
  credentials?: StoreManagerCredentials | null;
  message: string;
  title: string;
}) {
  return (
    <section className="state-panel state-panel-success" aria-label="Success">
      <div className="state-icon state-icon-success">OK</div>
      <div>
        <h2>{title}</h2>
        <p>{message}</p>
        {credentials ? (
          <div className="credential-result" aria-label="Manager temporary credentials">
            <span>Login email</span>
            <strong>{credentials.email}</strong>
            <span>Temporary password</span>
            <code>{credentials.temporaryPassword}</code>
            <p>{credentials.delivery}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function StoreDetailPanel({
  detail,
  onNavigate,
  onEmployeeCreated,
  onManagerAssigned,
}: {
  detail: AdminStoreDetail;
  onNavigate: (path: string) => void;
  onEmployeeCreated: (detail: AdminStoreDetail, message: string) => void;
  onManagerAssigned: (detail: AdminStoreDetail, message: string, credentials: StoreManagerCredentials) => void;
}) {
  const { employees, manager, stations, store } = detail;
  const address = [
    store.address?.line1,
    store.address?.line2,
    store.address?.city,
    store.address?.region,
    store.address?.postalCode,
    store.address?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const details = [
    ["Store Number", store.storeNumber],
    ["Store Type", formatStoreType(store.storeType)],
    ["Store Status", formatStoreStatus(store.status)],
    ["Active State", store.isActive ? "Active" : "Not active"],
    ["Timezone", store.timezone],
    ["Manager", store.manager ?? "Not set"],
    ["Phone", store.phone ?? "Not set"],
    ["Email", store.email ?? "Not set"],
    ["Expected Open Date", store.expectedOpenDate ? new Date(store.expectedOpenDate).toLocaleDateString() : "Not set"],
    ["Address", address || "Not set"],
    ["Cover Photo", store.coverPhoto?.originalName ?? "Not set"],
  ] as const;

  return (
    <div className="store-detail-stack">
      <section className="detail-panel" aria-label={`${store.name} details`}>
        {details.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>
      <RelatedSection title="Manager" emptyMessage="No store manager assignment found.">
        {manager ? <PersonRow person={manager} /> : null}
      </RelatedSection>
      {!manager ? <AssignManagerPanel storeId={store._id} storeName={store.name} onAssigned={onManagerAssigned} /> : null}
      <div className="section-action-row">
        <button type="button" className="secondary-button" onClick={() => onNavigate(`/stores/${store._id}/employees`)}>
          View Employee List
        </button>
      </div>
      <RelatedSection title="Employees" emptyMessage="No employees assigned to this store.">
        {employees.map((employee) => (
          <PersonRow key={employee._id} detailPath={`/stores/${store._id}/employees/${employee._id}`} onNavigate={onNavigate} person={employee} />
        ))}
      </RelatedSection>
      <CreateEmployeePanel storeId={store._id} storeName={store.name} onCreated={onEmployeeCreated} />
      <RelatedSection title="Stations" emptyMessage="No stations configured for this store.">
        {stations.map((station) => (
          <StationRow key={station._id} station={station} />
        ))}
      </RelatedSection>
    </div>
  );
}

function CreateEmployeePanel({
  onCreated,
  storeId,
  storeName,
}: {
  onCreated: (detail: AdminStoreDetail, message: string) => void;
  storeId: string;
  storeName: string;
}) {
  const [form, setForm] = useState<CreateStoreEmployeeInput>({
    displayName: "",
    email: "",
    contactPhone: "",
    role: "barista",
    positionTitle: "",
    status: "active",
    employeeCode: "",
    hiredAt: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  }

  function validateEmployeeForm() {
    const errors: Record<string, string> = {};

    if (!form.displayName.trim()) {
      errors.displayName = "Employee name is required.";
    }

    if (!form.role) {
      errors.role = "Role or position is required.";
    }

    if (form.role === "other" && !form.positionTitle?.trim()) {
      errors.positionTitle = "Position title is required for Other.";
    }

    if (!form.status) {
      errors.status = "Employee status is required.";
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Enter a valid email address.";
    }

    if (form.employeeCode && !/^[A-Za-z0-9_-]+$/.test(form.employeeCode)) {
      errors.employeeCode = "Use letters, numbers, underscores, or hyphens.";
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateEmployeeForm();
    setFieldErrors(errors);
    setSubmitError(null);

    if (Object.values(errors).some(Boolean)) {
      return;
    }

    const displayName = form.displayName.trim();
    setIsSubmitting(true);

    try {
      const detail = await createStoreEmployee(storeId, {
        ...form,
        displayName,
        email: form.email?.trim(),
        contactPhone: form.contactPhone?.trim(),
        employeeCode: form.employeeCode?.trim(),
        positionTitle: form.positionTitle?.trim(),
      });
      onCreated(detail, `${displayName} was created as an employee for ${storeName}.`);
      setForm({
        displayName: "",
        email: "",
        contactPhone: "",
        role: "barista",
        positionTitle: "",
        status: "active",
        employeeCode: "",
        hiredAt: "",
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create employee");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="employee-create-panel" onSubmit={handleSubmit} noValidate>
      <div>
        <h3>Create employee</h3>
      </div>
      {submitError ? <p className="inline-error">{submitError}</p> : null}
      <div className="form-grid">
        <Field label="Employee Name" error={fieldErrors.displayName} required>
          <input name="displayName" value={form.displayName} onChange={updateField} aria-invalid={Boolean(fieldErrors.displayName)} />
        </Field>
        <Field label="Role or Position" error={fieldErrors.role} required>
          <select name="role" value={form.role} onChange={updateField} aria-invalid={Boolean(fieldErrors.role)}>
            {storeEmployeeRoleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Position Title" error={fieldErrors.positionTitle} required={form.role === "other"}>
          <input name="positionTitle" value={form.positionTitle} onChange={updateField} aria-invalid={Boolean(fieldErrors.positionTitle)} />
        </Field>
        <Field label="Employee Status" error={fieldErrors.status} required>
          <select name="status" value={form.status} onChange={updateField} aria-invalid={Boolean(fieldErrors.status)}>
            {storeEmployeeStatusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Email" error={fieldErrors.email}>
          <input name="email" type="email" value={form.email} onChange={updateField} aria-invalid={Boolean(fieldErrors.email)} />
        </Field>
        <Field label="Contact Phone" error={fieldErrors.contactPhone}>
          <input name="contactPhone" value={form.contactPhone} onChange={updateField} />
        </Field>
        <Field label="Employee Code" error={fieldErrors.employeeCode}>
          <input name="employeeCode" value={form.employeeCode} onChange={updateField} aria-invalid={Boolean(fieldErrors.employeeCode)} />
        </Field>
        <Field label="Hire Date" error={fieldErrors.hiredAt}>
          <input name="hiredAt" type="date" value={form.hiredAt} onChange={updateField} />
        </Field>
      </div>
      <div className="form-actions manager-actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Employee"}
        </button>
      </div>
    </form>
  );
}

function AssignManagerPanel({
  onAssigned,
  storeId,
  storeName,
}: {
  onAssigned: (detail: AdminStoreDetail, message: string, credentials: StoreManagerCredentials) => void;
  storeId: string;
  storeName: string;
}) {
  const [form, setForm] = useState<AssignStoreManagerInput>({
    displayName: "",
    contactPhone: "",
    email: "",
    role: "manager",
    accountStatus: "active",
    employeeCode: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  }

  function validateManagerForm() {
    const errors: Record<string, string> = {};

    if (!form.displayName.trim()) {
      errors.displayName = "Manager name is required.";
    }

    if (!form.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Enter a valid email address.";
    }

    if (!form.role) {
      errors.role = "Role is required.";
    }

    if (!form.accountStatus) {
      errors.accountStatus = "Account status is required.";
    }

    if (form.employeeCode && !/^[A-Za-z0-9_-]+$/.test(form.employeeCode)) {
      errors.employeeCode = "Use letters, numbers, underscores, or hyphens.";
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateManagerForm();
    setFieldErrors(errors);
    setSubmitError(null);

    if (Object.values(errors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const detail = await assignStoreManager(storeId, {
        ...form,
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        contactPhone: form.contactPhone?.trim(),
        employeeCode: form.employeeCode?.trim(),
      });
      const message = `${form.displayName.trim()} was assigned as manager for ${storeName}. Share the temporary password securely.`;
      onAssigned(detail, message, detail.managerCredentials);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to assign manager");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="manager-assignment-panel" onSubmit={handleSubmit} noValidate>
      <div>
        <h3>Assign manager</h3>
      </div>
      {submitError ? <p className="inline-error">{submitError}</p> : null}
      <div className="form-grid">
        <Field label="Manager Name" error={fieldErrors.displayName} required>
          <input name="displayName" value={form.displayName} onChange={updateField} aria-invalid={Boolean(fieldErrors.displayName)} />
        </Field>
        <Field label="Contact Phone" error={fieldErrors.contactPhone}>
          <input name="contactPhone" value={form.contactPhone} onChange={updateField} />
        </Field>
        <Field label="Email" error={fieldErrors.email} required>
          <input name="email" type="email" value={form.email} onChange={updateField} aria-invalid={Boolean(fieldErrors.email)} />
        </Field>
        <Field label="Role" error={fieldErrors.role} required>
          <select name="role" value={form.role} onChange={updateField} aria-invalid={Boolean(fieldErrors.role)}>
            {managerRoleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Account Status" error={fieldErrors.accountStatus} required>
          <select
            name="accountStatus"
            value={form.accountStatus}
            onChange={updateField}
            aria-invalid={Boolean(fieldErrors.accountStatus)}
          >
            {accountStatusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Employee Code" error={fieldErrors.employeeCode}>
          <input name="employeeCode" value={form.employeeCode} onChange={updateField} aria-invalid={Boolean(fieldErrors.employeeCode)} />
        </Field>
      </div>
      <div className="form-actions manager-actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Assigning..." : "Assign Manager"}
        </button>
      </div>
    </form>
  );
}

function RelatedSection({
  children,
  emptyMessage,
  title,
}: {
  children: ReactNode;
  emptyMessage: string;
  title: string;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];

  return (
    <section className="related-panel" aria-label={title}>
      <h3>{title}</h3>
      {items.length > 0 ? <div className="related-list">{items}</div> : <p>{emptyMessage}</p>}
    </section>
  );
}

function PersonRow({
  detailPath,
  onNavigate,
  person,
}: {
  detailPath?: string;
  onNavigate?: (path: string) => void;
  person: AdminStorePerson;
}) {
  return (
    <article className="related-row">
      <div>
        <strong>{person.user?.displayName ?? person.displayName ?? "Unlinked employee"}</strong>
        <span>{formatPersonContact(person)}</span>
      </div>
      <div>
        <span>{formatStoreEmployeePosition(person)}</span>
        <StatusPill>{formatTitle(person.status)}</StatusPill>
        {person.user?.status ? <span>Account {formatTitle(person.user.status)}</span> : null}
        {detailPath && onNavigate ? (
          <a
            href={detailPath}
            onClick={(event) => {
              event.preventDefault();
              onNavigate(detailPath);
            }}
          >
            View details
          </a>
        ) : null}
      </div>
    </article>
  );
}

function formatPersonContact(person: AdminStorePerson) {
  const parts = [person.user?.email ?? person.email, person.contactPhone, person.employeeCode].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "No contact on file";
}

function formatEmployeeContact(person: AdminStorePerson) {
  const parts = [person.user?.email ?? person.email, person.contactPhone].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "No contact on file";
}

function formatOptionalDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Not set";
}

function StationRow({ station }: { station: AdminStoreStation }) {
  return (
    <article className="related-row">
      <div>
        <strong>{station.name}</strong>
        <span>{station.code}</span>
      </div>
      <div>
        <span>Sort {station.sortOrder}</span>
        <StatusPill>{formatTitle(station.status)}</StatusPill>
      </div>
    </article>
  );
}

function StatusPill({ children }: { children: ReactNode }) {
  return <strong className="status-pill">{children}</strong>;
}

function StatusBadge({ value }: { value: string }) {
  return <span className={`status-badge status-badge-${value}`}>{formatStatusLabel(value)}</span>;
}

function formatStoreStatus(value: string) {
  return storeStatusOptions.find((option) => option.value === value)?.label ?? value;
}

function formatStationStatus(value: string) {
  return stationStatusOptions.find((option) => option.value === value)?.label ?? value;
}

function formatStatusLabel(value: string) {
  return formatStoreStatus(value) === value ? formatStationStatus(value) : formatStoreStatus(value);
}

function formatStoreType(value: string) {
  return storeTypeOptions.find((option) => option.value === value)?.label ?? value;
}

function formatStoreEmployeePosition(person: AdminStorePerson) {
  if (person.role === "other" && person.positionTitle) {
    return person.positionTitle;
  }

  return storeEmployeeRoleOptions.find((option) => option.value === person.role)?.label ?? (person.role === "manager" ? "Manager" : formatTitle(person.role));
}

function formatTitle(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function AdminOverviewPanel({ overview }: { overview: AdminOverview }) {
  const items = [
    ["Stores", overview.counts.stores],
    ["Stations", overview.counts.stations],
    ["Inventory Items", overview.counts.inventoryItems],
    ["Recipes", overview.counts.recipes],
    ["Products", overview.counts.products],
    ["Inventory Requests", overview.counts.inventoryRequests],
  ] as const;

  return (
    <section className="metric-grid" aria-label="Admin overview">
      {items.map(([label, value]) => (
        <article className="metric-card" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </section>
  );
}

function StoreSummaryPanel({ summary }: { summary: StoreSummary }) {
  const items = [
    ["Stations", summary.counts.stations],
    ["Stock Items", summary.counts.stockItems],
    ["Open Requests", summary.counts.openInventoryRequests],
  ] as const;

  return (
    <section className="store-summary" aria-label="Store summary">
      <div>
        <p className="eyebrow">Assigned Store</p>
        <h2>{summary.store.name}</h2>
        <p>
          {summary.store.code} - {summary.store.timezone}
        </p>
      </div>
      <div className="metric-grid">
        {items.map(([label, value]) => (
          <article className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function ScreenLayoutPreview({ route, screenType }: { route: AppRoute; screenType: ScreenType }) {
  const labels: Record<ScreenType, string> = {
    list: "List",
    detail: "Detail",
    create: "Create",
    edit: "Edit",
  };

  const descriptions: Record<ScreenType, string> = {
    list: "Table, filters, search, and primary actions",
    detail: "Record summary, metadata, and related sections",
    create: "Guided form with validation and save actions",
    edit: "Editable form state with cancel and update actions",
  };

  return (
    <article className="screen-card">
      <div>
        <span>{labels[screenType]}</span>
        <h2>
          {route.title} {labels[screenType]}
        </h2>
      </div>
      <p>{descriptions[screenType]}</p>
    </article>
  );
}
