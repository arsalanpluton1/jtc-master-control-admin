import { type FormEvent, useState } from "react";

type LoginPageProps = {
  error?: string;
  isSubmitting: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
};

export function LoginPage({ error, isSubmitting, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onLogin(email, password);
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true">
            JTC
          </span>
          <div>
            <p>JTC</p>
            <strong>Master Control</strong>
          </div>
        </div>

        <div>
          <p className="eyebrow">Secure Access</p>
          <h1 id="login-title">Sign in</h1>
          <p className="page-description">Use an active Admin or Store Manager account.</p>
        </div>

        {error ? (
          <div className="login-error" role="alert">
            {error}
          </div>
        ) : null}

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              inputMode="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label>
            Password
            <input
              autoComplete="current-password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          <button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
