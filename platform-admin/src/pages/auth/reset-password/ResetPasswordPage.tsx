import { PasswordInput, PrefetchLink } from "@/components";
import { Button } from "@/components/ui/button";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2 } from "lucide-react";
import {
  useResetPasswordForm,
  useResetPasswordSession,
  useResetPasswordSubmit,
  useResetPasswordValidation,
} from "./hooks";

const ResetPassword = () => {
  const { email, resetToken } = useResetPasswordSession();

  const {
    password,
    confirmPassword,
    isMismatch,
    onPasswordChange,
    onConfirmPasswordChange,
    resetForm,
  } = useResetPasswordForm();

  const { fieldErrors, validate, clearFieldError } =
    useResetPasswordValidation(password, confirmPassword);

  const confirmError =
    fieldErrors.confirmPassword ??
    (isMismatch ? "Passwords don't match" : undefined);

  const { handleSubmit, isLoading, isDone, error } = useResetPasswordSubmit({
    password,
    resetToken,
    validate,
    onSuccess: resetForm,
  });

  if (isDone) {
    return (
      <div className="w-full max-w-sm flex flex-col justify-center items-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-accent">
          <CheckCircle2 className="size-6 text-primary" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Password Updated</h1>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          Your password has been reset. You can now sign in with your new
          password.
        </p>
        <Button asChild className="mt-10 h-11 w-full">
          <PrefetchLink prefetchModule="login" to={"/auth/login"}>
            Back to sign in
          </PrefetchLink>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold">Set a new Password</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {email ? (
          <>
            New password for
            <span className="font-medium text-foreground">{email}</span>
          </>
        ) : (
          "Choose a new password for your account."
        )}
      </p>

      <form className="mt-7" noValidate onSubmit={handleSubmit}>
        <FieldGroup>
          <Field data-invalid={!!fieldErrors.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <PasswordInput
              id="password"
              className="h-11"
              placeholder="••••••••"
              autoComplete="new-password"
              maxLength={72}
              value={password}
              aria-invalid={!!fieldErrors.password}
              onChange={(e) => {
                onPasswordChange(e);
                clearFieldError("password");
              }}
              disabled={isLoading}
            />
            <FieldError>{fieldErrors.password}</FieldError>
          </Field>

          <Field data-invalid={!!confirmError}>
            <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
            <PasswordInput
              id="confirm-password"
              className="h-11"
              placeholder="••••••••"
              autoComplete="new-password"
              maxLength={72}
              value={confirmPassword}
              aria-invalid={!!confirmError}
              onChange={(e) => {
                onConfirmPasswordChange(e);
                clearFieldError("confirmPassword");
              }}
              disabled={isLoading}
            />
            <FieldError>{confirmError}</FieldError>
          </Field>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            className="mt-6 h-11 w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner className="size-4" />
                Updating...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </FieldGroup>
      </form>
      <p className="mt-2 text-sm text-muted-foreground">
        Already had an account:{" "}
        <PrefetchLink
          to="/auth/login"
          prefetchModule="login"
          aria-label="Back to sign in"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </PrefetchLink>
      </p>
    </div>
  );
};

export default ResetPassword;
