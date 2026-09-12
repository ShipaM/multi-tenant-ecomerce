import { PrefetchLink } from "@/components/PrefetchLink";
import { Button } from "@/components/ui/button";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useState, type SubmitEvent } from "react";
import { useAppDispatch } from "@/hooks/use-store";
import { fetchLogin } from "@/store/auth/authSlice";
import { isSafeRedirectPath } from "@/lib/redirect";
import { useNavigate, useSearchParams } from "react-router";

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect_uri");
  const redirectTo =
    redirectParam && isSafeRedirectPath(redirectParam)
      ? redirectParam
      : "/dashboard";

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try {
      await dispatch(fetchLogin({ email, password })).unwrap();
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setError(typeof error === "string" ? error : "Failed to login");
    } finally {
      setIsSubmitting(false);
    }

    // setError(null);
    // setIsSubmitting(true);
    // setTimeout(() => {
    //   setIsSubmitting(false);
    //   setPassword("");
    //   setEmail("");
    // }, 2000);
  };

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold">Sign In</h1>
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

          {error && <p className="mt-1 text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            className="mt-2 h-11 w-full"
            disabled={isSubmitting}
          >
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
