import { PrefetchLink } from "@/components/PrefetchLink";
import { Button } from "@/components/ui/button";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useState, type SubmitEvent } from "react";

const LoginPage = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setPassword("");
      setEmail("");
    }, 2000);
  };

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-2xl font-bold">Sign In</h2>
      <p>Access the platform admin console</p>
      <form className="mt-7" onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Work Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="you@platform.com"
              autoComplete="username"
              className="h-11"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <PrefetchLink
                to="/auth/forgot-password"
                prefetchModule="forgotPassword"
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot Password?
              </PrefetchLink>
            </div>
            <Input
              id="password"
              type="password"
              className="h-11"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </Field>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <Button type="submit" className="mt-6 h-11 w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner className="size-4" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
};

export default LoginPage;
