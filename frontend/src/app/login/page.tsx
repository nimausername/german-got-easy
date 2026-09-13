"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await apiFetch<{ data: { accessToken: string } }>("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({
          usernameOrEmail: usernameOrEmail.trim(),
          password,
        }),
      });
      const { setAccessToken } = await import("@/lib/api");
      setAccessToken(result.data.accessToken);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="font-display text-2xl text-brand-ink">
        German Got Easy
      </Link>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight">Log in</h1>
      <p className="mt-2 text-stone-600">Continue learning where you left off.</p>
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium" htmlFor="usernameOrEmail">
          Username or email
          <input
            id="usernameOrEmail"
            name="usernameOrEmail"
            autoComplete="username"
            required
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 outline-none ring-brand focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium" htmlFor="password">
          Password
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 outline-none ring-brand focus:ring-2"
          />
        </label>
        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-ink disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-sm text-stone-600">
        No account yet?{" "}
        <Link href="/register" className="font-semibold text-brand underline-offset-2 hover:underline">
          Register
        </Link>
      </p>
    </main>
  );
}
