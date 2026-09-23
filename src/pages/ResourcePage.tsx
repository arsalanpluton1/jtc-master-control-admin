import { useEffect, useState } from "react";
import { getAdminOverview, type AdminOverview } from "../api/admin";
import type { SessionUser } from "../api/auth";
import { getStoreSummary, type StoreSummary } from "../api/manager";
import { EmptyState, ErrorState, LoadingState } from "../components/PageStates";
import type { AppRoute } from "../routes";

type ScreenType = "list" | "detail" | "create" | "edit";

const screenTypes: ScreenType[] = ["list", "detail", "create", "edit"];

export function ResourcePage({ route, user }: { route: AppRoute; user: SessionUser }) {
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
