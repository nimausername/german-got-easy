"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { UserRound } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { ErrorAlert } from "@/components/error-alert";
import { LegalFooterLinks } from "@/components/legal-footer-links";
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { ApiRequestError, apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type FieldErrors = {
  usernameOrEmail?: string;
  password?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!usernameOrEmail.trim()) {
      next.usernameOrEmail = "Enter your username or email.";
    }
    if (!password) {
      next.password = "Enter your password.";
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
      await apiFetch("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({
          usernameOrEmail: usernameOrEmail.trim(),
          password,
        }),
      });
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFormError(err.message);
      } else {
        setFormError(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const usernameInvalid = Boolean(fieldErrors.usernameOrEmail) || Boolean(formError);
  const passwordInvalid = Boolean(fieldErrors.password) || Boolean(formError);

  return (
    <AuthShell>
      <Card size="sm" className="w-full sm:[--card-spacing:--spacing(4)]">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Log in</CardTitle>
          <CardDescription>Continue learning where you left off.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="login-form" className="space-y-3 sm:space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            <FieldGroup className="gap-3 sm:gap-5">
              <Field data-invalid={usernameInvalid || undefined}>
                <FieldLabel htmlFor="usernameOrEmail">Username or email</FieldLabel>
                <InputGroup className="h-11 min-h-11">
                  <InputGroupAddon align="inline-start">
                    <UserRound className="size-4 text-muted-foreground" aria-hidden />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="usernameOrEmail"
                    name="usernameOrEmail"
                    type="text"
                    inputMode="email"
                    autoComplete="username"
                    placeholder="you@example.com"
                    className="h-full text-base"
                    required
                    aria-invalid={usernameInvalid || undefined}
                    value={usernameOrEmail}
                    onChange={(e) => {
                      setUsernameOrEmail(e.target.value);
                      if (fieldErrors.usernameOrEmail || formError) {
                        setFormError(null);
                        setFieldErrors((prev) => ({ ...prev, usernameOrEmail: undefined }));
                      }
                    }}
                  />
                </InputGroup>
                {fieldErrors.usernameOrEmail ? (
                  <FieldError>{fieldErrors.usernameOrEmail}</FieldError>
                ) : null}
              </Field>

              <Field data-invalid={passwordInvalid || undefined}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="Enter password"
                  required
                  invalid={passwordInvalid}
                  groupClassName="h-11 min-h-11"
                  className="h-full text-base"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password || formError) {
                      setFormError(null);
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                />
                {fieldErrors.password ? <FieldError>{fieldErrors.password}</FieldError> : null}
              </Field>
            </FieldGroup>
            {formError ? <ErrorAlert title="Login failed" message={formError} /> : null}
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3 sm:gap-4">
          <Button
            type="submit"
            form="login-form"
            disabled={loading}
            className="min-h-12 w-full touch-manipulation"
            size="lg"
          >
            {loading ? (
              <>
                <Spinner data-icon="inline-start" />
                Signing in…
              </>
            ) : (
              "Log in"
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            No account yet?{" "}
            <Link
              href="/register"
              className={cn(buttonVariants({ variant: "link" }), "h-auto px-0")}
            >
              Register
            </Link>
          </p>
          <LegalFooterLinks />
        </CardFooter>
      </Card>
    </AuthShell>
  );
}
