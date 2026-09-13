"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Mail, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BrandLink } from "@/components/brand-link";
import { ErrorAlert } from "@/components/error-alert";
import { PasswordInput } from "@/components/password-input";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ApiRequestError, apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type FieldErrors = {
  email?: string;
  username?: string;
  password?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!email.trim()) {
      next.email = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (!password) {
      next.password = "Choose a password.";
    } else if (password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    }
    return next;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validate();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const result = await apiFetch<{ data: { accessToken: string } }>("/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          username: username.trim() || undefined,
          password,
        }),
      });
      const { setAccessToken } = await import("@/lib/api");
      setAccessToken(result.data.accessToken);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFormError(err.message);
      } else {
        setFormError(err instanceof Error ? err.message : "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const emailInvalid = Boolean(fieldErrors.email);
  const passwordInvalid = Boolean(fieldErrors.password);

  return (
    <AppShell width="sm" centered>
      <div className="flex justify-center">
        <BrandLink />
      </div>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-2xl">Create account</CardTitle>
          <CardDescription>Start your German path in minutes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="register-form" className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            <FieldGroup>
              <Field data-invalid={emailInvalid || undefined}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Mail className="size-4 text-muted-foreground" aria-hidden />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    aria-invalid={emailInvalid || undefined}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: undefined }));
                      }
                    }}
                  />
                </InputGroup>
                {fieldErrors.email ? <FieldError>{fieldErrors.email}</FieldError> : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <UserRound className="size-4 text-muted-foreground" aria-hidden />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="username"
                    name="username"
                    autoComplete="username"
                    placeholder="Optional"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </InputGroup>
                <FieldDescription>Optional — you can sign in with email instead.</FieldDescription>
              </Field>

              <Field data-invalid={passwordInvalid || undefined}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  invalid={passwordInvalid}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                />
                {fieldErrors.password ? <FieldError>{fieldErrors.password}</FieldError> : null}
              </Field>
            </FieldGroup>
            {formError ? <ErrorAlert title="Registration failed" message={formError} /> : null}
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-4">
          <Button
            type="submit"
            form="register-form"
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Creating…" : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already learning?{" "}
            <Link href="/login" className={cn(buttonVariants({ variant: "link" }), "h-auto px-0")}>
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AppShell>
  );
}
