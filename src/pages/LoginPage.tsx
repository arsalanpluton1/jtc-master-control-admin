import { type FormEvent, useState } from "react";

type LoginPageProps = {
  error?: string;
  isSubmitting: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
};

export function LoginPage({ error, isSubmitting, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
            {/* <p>JTC</p> */}
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

          <label className="password-field">
            <span>Password</span>
            <span className="password-input-wrapper">
              <input
                autoComplete="current-password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="password-toggle"
                disabled={isSubmitting}
                onClick={() => setShowPassword((visible) => !visible)}
                type="button"
              >
                {showPassword ? (
                  <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                    <path d="M3 3l18 18M10.58 10.58a2 2 0 002.84 2.84M9.88 4.24A10.94 10.94 0 0112 4c5.23 0 9.27 3.64 10.5 8a11.8 11.8 0 01-4.04 5.63M6.23 6.23C4.6 7.4 3.33 9.14 1.5 12c1.23 4.36 5.27 8 10.5 8 1.45 0 2.8-.27 4.02-.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                    <path d="M1.5 12S5.5 4 12 4s10.5 8 10.5 8-4 8-10.5 8S1.5 12 1.5 12z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
                    <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                )}
              </button>
            </span>
          </label>

          <button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
