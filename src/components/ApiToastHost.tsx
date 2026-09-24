import { useEffect, useState } from "react";

export type ApiToastDetail = {
  type: "success" | "error";
  message: string;
};

export const apiToastEventName = "jtc:api-toast";

type Toast = ApiToastDetail & { id: number };

export function ApiToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    function handleToast(event: Event) {
      const detail = (event as CustomEvent<ApiToastDetail>).detail;

      if (!detail?.message || !detail.type) {
        return;
      }

      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { ...detail, id }]);

      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 4500);
    }

    window.addEventListener(apiToastEventName, handleToast);

    return () => window.removeEventListener(apiToastEventName, handleToast);
  }, []);

  function dismissToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  return (
    <div className="toast-region" aria-label="API notifications" aria-live="polite">
      {toasts.map((toast) => (
        <div className={`api-toast api-toast-${toast.type}`} key={toast.id} role={toast.type === "error" ? "alert" : "status"}>
          <span className="api-toast-icon" aria-hidden="true">
            {toast.type === "success" ? "✓" : "!"}
          </span>
          <p>{toast.message}</p>
          <button type="button" aria-label="Dismiss notification" onClick={() => dismissToast(toast.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
