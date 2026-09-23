import type { ReactNode } from "react";
import type { SessionUser } from "../api/auth";
import type { DashboardStatus } from "../api/dashboard";
import type { AppRoute } from "../routes";

type DashboardShellProps = {
  activeRoute: AppRoute;
  apiStatus: DashboardStatus;
  children: ReactNode;
  routes: AppRoute[];
  user: SessionUser;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export function DashboardShell({
  activeRoute,
  apiStatus,
  children,
  routes,
  user,
  onNavigate,
  onLogout,
}: DashboardShellProps) {
  const adminRoutes = routes.filter((route) => route.area === "Admin");
  const managerRoutes = routes.filter((route) => route.area === "Store Manager");

  return (
    <div className="dashboard-shell">
      <aside className="sidebar" aria-label="Dashboard navigation">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true">
            JTC
          </span>
          <div>
            <p>JTC</p>
            <strong>Master Control</strong>
          </div>
        </div>

        <nav className="side-nav">
          <NavGroup
            label="Admin"
            routes={adminRoutes}
            activeRoute={activeRoute}
            onNavigate={onNavigate}
          />
          <NavGroup
            label="Store Manager"
            routes={managerRoutes}
            activeRoute={activeRoute}
            onNavigate={onNavigate}
          />
        </nav>

        <div className="session-card">
          <div>
            <span>{user.role === "admin" ? "Admin" : "Store Manager"}</span>
            <strong>{user.displayName}</strong>
            <p>{user.email}</p>
          </div>
          <button type="button" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div>
            <p className="eyebrow">{activeRoute.eyebrow}</p>
            <h1>{activeRoute.title}</h1>
            <p className="page-description">{activeRoute.description}</p>
          </div>
          <ApiStatusBadge apiStatus={apiStatus} />
        </header>

        <main className="content-area" aria-label={`${activeRoute.title} content`}>
          {children}
        </main>
      </div>
    </div>
  );
}

type NavGroupProps = {
  label: string;
  routes: AppRoute[];
  activeRoute: AppRoute;
  onNavigate: (path: string) => void;
};

function NavGroup({ label, routes, activeRoute, onNavigate }: NavGroupProps) {
  return (
    <section className="nav-group">
      <h2>{label}</h2>
      <div>
        {routes.map((route) => (
          <a
            aria-current={route.key === activeRoute.key ? "page" : undefined}
            className="nav-link"
            href={route.path}
            key={route.key}
            onClick={(event) => {
              event.preventDefault();
              onNavigate(route.path);
            }}
          >
            {route.label}
          </a>
        ))}
      </div>
    </section>
  );
}

function ApiStatusBadge({ apiStatus }: { apiStatus: DashboardStatus }) {
  if (apiStatus.status === "loading") {
    return (
      <div className="api-status api-status-loading">
        <span aria-hidden="true" />
        Checking API
      </div>
    );
  }

  if (apiStatus.status === "error") {
    return (
      <div className="api-status api-status-error" title={apiStatus.message}>
        <span aria-hidden="true" />
        API unavailable
      </div>
    );
  }

  const databaseStatus = apiStatus.data.database.connected ? "Database connected" : "Database offline";

  return (
    <div className="api-status" title={`${apiStatus.data.service} - ${databaseStatus}`}>
      <span aria-hidden="true" />
      API online
    </div>
  );
}
