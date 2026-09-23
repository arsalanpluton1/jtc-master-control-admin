type LoadingStateProps = {
  title?: string;
  message?: string;
};

export function LoadingState({
  title = "Loading",
  message = "Preparing dashboard data...",
}: LoadingStateProps) {
  return (
    <section className="state-panel" role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
    </section>
  );
}

type ErrorStateProps = {
  title?: string;
  message: string;
};

export function ErrorState({ title = "Something needs attention", message }: ErrorStateProps) {
  return (
    <section className="state-panel state-panel-error" role="alert">
      <span className="state-icon" aria-hidden="true">
        !
      </span>
      <div>
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
    </section>
  );
}

type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <section className="empty-panel">
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  );
}
