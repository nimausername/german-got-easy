"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Mail, UserRound } from "lucide-react";
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
  acceptTerms?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
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
    if (!acceptTerms) {
      next.acceptTerms = "Accept the Terms of Use and Privacy Policy to continue.";
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
      await apiFetch("/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          username: username.trim() || undefined,
          password,
        }),
      });
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
    <AuthShell>
      <Card size="sm" className="w-full sm:[--card-spacing:--spacing(4)]">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Create account</CardTitle>
          <CardDescription>Start your German path in minutes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="register-form" className="space-y-3 sm:space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            <FieldGroup className="gap-3 sm:gap-5">
              <Field data-invalid={emailInvalid || undefined}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <InputGroup className="h-11 min-h-11">
                  <InputGroupAddon align="inline-start">
                    <Mail className="size-4 text-muted-foreground" aria-hidden />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="h-full text-base"
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
                <InputGroup className="h-11 min-h-11">
                  <InputGroupAddon align="inline-start">
                    <UserRound className="size-4 text-muted-foreground" aria-hidden />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="username"
                    name="username"
                    autoComplete="username"
                    placeholder="Optional"
                    className="h-full text-base"
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
                  groupClassName="h-11 min-h-11"
                  className="h-full text-base"
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

              <Field data-invalid={Boolean(fieldErrors.acceptTerms) || undefined}>
                <div className="flex items-start gap-3">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    checked={acceptTerms}
                    aria-invalid={Boolean(fieldErrors.acceptTerms) || undefined}
                    aria-describedby={
                      fieldErrors.acceptTerms ? "acceptTerms-error" : "acceptTerms-description"
                    }
                    className="mt-1 size-4 shrink-0 rounded border border-input accent-primary"
                    onChange={(e) => {
                      setAcceptTerms(e.target.checked);
                      if (fieldErrors.acceptTerms) {
                        setFieldErrors((prev) => ({ ...prev, acceptTerms: undefined }));
                      }
                    }}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <label
                      htmlFor="acceptTerms"
                      className="block w-full text-sm leading-snug font-normal text-pretty select-none"
                    >
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="font-medium whitespace-nowrap text-foreground underline underline-offset-4"
                      >
                        Terms of Use
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="font-medium whitespace-nowrap text-foreground underline underline-offset-4"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </label>
                    <FieldDescription id="acceptTerms-description" className="text-pretty break-words">
                      Required to create an account on this hosted service.
                    </FieldDescription>
                    {fieldErrors.acceptTerms ? (
                      <FieldError id="acceptTerms-error">{fieldErrors.acceptTerms}</FieldError>
                    ) : null}
                  </div>
                </div>
              </Field>
            </FieldGroup>
            {formError ? <ErrorAlert title="Registration failed" message={formError} /> : null}
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3 sm:gap-4">
          <Button
            type="submit"
            form="register-form"
            disabled={loading || !acceptTerms}
            aria-disabled={loading || !acceptTerms}
            className="min-h-12 w-full touch-manipulation"
            size="lg"
          >
            {loading ? "Creating…" : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already learning?{" "}
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "link" }), "h-auto px-0")}
            >
              Log in
            </Link>
          </p>
          <LegalFooterLinks />
        </CardFooter>
      </Card>
    </AuthShell>
  );
}
