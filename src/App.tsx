import { useEffect, useMemo, useState } from "react";
import { getCurrentUser, login, logout, type SessionUser } from "./api/auth";
import { getDashboardHealth, type DashboardStatus } from "./api/dashboard";
import { ErrorState, LoadingState } from "./components/PageStates";
import { DashboardShell } from "./layout/DashboardShell";
import { LoginPage } from "./pages/LoginPage";
import { ResourcePage } from "./pages/ResourcePage";
import { appRoutes, defaultRoute, findRoute } from "./routes";

export function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [apiStatus, setApiStatus] = useState<DashboardStatus>({ status: "loading" });
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authStatus, setAuthStatus] = useState<"checking" | "signed-out" | "signed-in">("checking");
  const [loginError, setLoginError] = useState<string | undefined>();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const availableRoutes = useMemo(
    () =>
      appRoutes.filter((route) => {
        if (!user) {
          return false;
        }

        return user.role === "admin" ? route.area === "Admin" : route.area === "Store Manager";
      }),
    [user],
  );
  const activeRoute = useMemo(() => {
    if (pathname === "/" && availableRoutes[0]) {
      return availableRoutes[0];
    }

    return findRoute(pathname);
  }, [availableRoutes, pathname]);

  useEffect(() => {
    let isMounted = true;

    getDashboardHealth()
      .then((data) => {
        if (isMounted) {
          setApiStatus({ status: "ready", data });
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          const message = error instanceof Error ? error.message : "Unable to reach the API";
          setApiStatus({ status: "error", message });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    getCurrentUser()
      .then(({ user: sessionUser }) => {
        if (isMounted) {
          setUser(sessionUser);
          setAuthStatus("signed-in");
        }
      })
      .catch(() => {
        if (isMounted) {
          logout();
          setAuthStatus("signed-out");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  function handleNavigate(path: string) {
    if (path === window.location.pathname) {
      return;
    }

    window.history.pushState(null, "", path);
    setPathname(path);
  }

  async function handleLogin(email: string, password: string) {
    setIsLoggingIn(true);
    setLoginError(undefined);

    try {
      const session = await login(email, password);
      setUser(session.user);
      setAuthStatus("signed-in");
      const firstRoute =
        session.user.role === "admin"
          ? appRoutes.find((route) => route.area === "Admin") ?? defaultRoute
          : appRoutes.find((route) => route.area === "Store Manager") ?? defaultRoute;
      handleNavigate(firstRoute.path);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleLogout() {
    logout();
    setUser(null);
    setAuthStatus("signed-out");
  }

  const apiNotice =
    apiStatus.status === "loading" ? (
      <LoadingState title="Checking API" message="Confirming backend availability..." />
    ) : apiStatus.status === "error" ? (
      <ErrorState title="API unavailable" message={apiStatus.message} />
    ) : null;

  if (authStatus === "checking") {
    return (
      <main className="boot-page">
        <LoadingState title="Restoring session" message="Checking your dashboard access..." />
      </main>
    );
  }

  if (!user) {
    return <LoginPage error={loginError} isSubmitting={isLoggingIn} onLogin={handleLogin} />;
  }

  const isRouteAllowed = availableRoutes.some((route) => route.key === activeRoute.key);

  return (
    <DashboardShell
      activeRoute={activeRoute}
      apiStatus={apiStatus}
      routes={availableRoutes}
      user={user}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
    >
      {apiNotice}
      {isRouteAllowed ? (
        <ResourcePage route={activeRoute} user={user} />
      ) : (
        <ErrorState title="Unauthorized" message="You do not have access to this dashboard area." />
      )}
    </DashboardShell>
  );
}
