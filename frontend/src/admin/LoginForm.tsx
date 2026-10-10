import { useState } from "react";
import { login } from "../api/auth";

type Props = { onSuccess: () => void };

export default function LoginForm({ onSuccess }: Props) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await login(password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-950">
          ONEHYPE <span className="text-[#e31d25]">ADMIN</span>
        </h1>

        <label
          htmlFor="password"
          className="mt-8 block text-xs font-semibold tracking-widest text-neutral-500"
        >
          PASSWORD
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="mt-2 w-full border border-neutral-300 px-4 py-3 text-neutral-950 outline-none focus:border-neutral-950"
        />

        {error && <p className="mt-3 text-sm text-[#e31d25]">{error}</p>}

        <button
          type="submit"
          disabled={submitting || password.length === 0}
          className="mt-6 w-full bg-neutral-950 px-4 py-3 text-sm font-semibold tracking-widest text-white disabled:opacity-50"
        >
          {submitting ? "LOGGING IN..." : "LOGIN"}
        </button>
      </form>
    </div>
  );
}