"use client";

import { FormEvent, useState } from "react";
import { login, register } from "../services/authService";
import { errorMessage } from "../utils";

export default function AuthForm({ onDone }: { onDone: () => Promise<void> }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      await (isRegistering ? register(values) : login(values));
      await onDone();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <form className="card auth-card" onSubmit={submit}>
        <h1>Nexus Mail</h1>
        <p>{isRegistering ? "Create your workspace" : "Sign in to your workspace"}</p>
        {isRegistering && (
          <>
            <input name="name" placeholder="Your name" required />
            <input name="company_name" placeholder="Company name" required />
          </>
        )}
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" minLength={8} required />
        {error && <p className="error">{error}</p>}
        <button disabled={busy}>{busy ? "Please wait…" : isRegistering ? "Create account" : "Sign in"}</button>
        <button className="link" type="button" disabled={busy} onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? "Already have an account?" : "Need an account?"}
        </button>
      </form>
    </main>
  );
}
