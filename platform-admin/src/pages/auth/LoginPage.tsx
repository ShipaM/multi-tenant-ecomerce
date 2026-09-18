import { PasswordInput, PrefetchLink, SubmitButton } from "@/components";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState, type SubmitEvent } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/use-store";
import { fetchLogin } from "@/store/auth/authSlice";
import { isCompleteLoginResponse, isTwoFactorRequiredResponse } from "@/types";
import { isSafeRedirectPath } from "@/lib/redirect";
import { useNavigate, useSearchParams } from "react-router";

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const isLoginLoading = useAppSelector((state) => state.auth.isLoginLoading);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect_uri");
  const redirectTo =
    redirectParam && isSafeRedirectPath(redirectParam)
      ? redirectParam
      : "/dashboard";

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);

    try {
      const response = await dispatch(
        fetchLogin({ email, password }),
      ).unwrap();

      if (isCompleteLoginResponse(response)) {
        navigate(redirectTo, { replace: true });
      } else if (isTwoFactorRequiredResponse(response)) {
        navigate("/auth/2fa", {
          state: {
            twoFactorToken: response.twoFactorToken,
            email: email,
            redirectTo,
          },
        });
      }
    } catch (error) {
      setError(typeof error === "string" ? error : "Failed to login");
    }
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
              disabled={isLoginLoading}
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
            <PasswordInput
              id="password"
              className="h-11"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoginLoading}
            />
          </Field>

          {error && <p className="mt-1 text-sm text-destructive">{error}</p>}

          <SubmitButton
            className="mt-2 h-11 w-full"
            loading={isLoginLoading}
            loadingText="Signing in..."
          >
            Sign in
          </SubmitButton>
        </FieldGroup>
      </form>
    </div>
  );
};

export default LoginPage;
