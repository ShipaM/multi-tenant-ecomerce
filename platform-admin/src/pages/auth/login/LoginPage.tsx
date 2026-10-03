import { PasswordInput, PrefetchLink, SubmitButton } from "@/components";
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  useLoginCredentials,
  useLoginSubmit,
  useLoginValidation,
  useRedirectTarget,
} from "./hooks";

const LoginPage = () => {
  const redirectTo = useRedirectTarget();

  const { credentials, onEmailChange, onPasswordChange } =
    useLoginCredentials();

  const { fieldErrors, validate, clearFieldError } =
    useLoginValidation(credentials);

  const {
    handleSubmit,
    isLoading: isLoginLoading,
    error,
  } = useLoginSubmit(credentials, redirectTo, validate);

  return (
    <div className="w-full max-w-sm">
      <title>Sign in | Platform Admin</title>
      <h1 className="text-2xl font-bold">Sign In</h1>
      <p>Access the platform admin console</p>
      <form className="mt-7" noValidate onSubmit={handleSubmit}>
        <FieldGroup>
          <Field data-invalid={!!fieldErrors.email}>
            <FieldLabel htmlFor="email">Work Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="you@platform.com"
              autoComplete="username"
              className="h-11"
              required
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              value={credentials.email}
              onChange={(e) => {
                onEmailChange(e);
                clearFieldError("email");
              }}
              disabled={isLoginLoading}
            />
            <FieldError id="email-error">{fieldErrors.email}</FieldError>
          </Field>

          <Field data-invalid={!!fieldErrors.password}>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <PrefetchLink
                to="/auth/forgot-password"
                state={{ redirectTo }}
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
              aria-invalid={!!fieldErrors.password}
              aria-describedby={
                fieldErrors.password ? "password-error" : undefined
              }
              value={credentials.password}
              onChange={(e) => {
                onPasswordChange(e);
                clearFieldError("password");
              }}
              disabled={isLoginLoading}
            />
            <FieldError id="password-error">{fieldErrors.password}</FieldError>
          </Field>

          {error && (
            <p role="alert" className="mt-1 text-sm text-destructive">
              {error}
            </p>
          )}

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
