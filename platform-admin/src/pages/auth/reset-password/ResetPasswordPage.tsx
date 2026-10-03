import { PasswordInput, PrefetchLink, SubmitButton } from "@/components";
import { Button } from "@/components/ui/button";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { focusOnMount } from "@/lib/focus";
import { buildLoginUrl } from "@/lib/redirect";
import { CheckCircle2 } from "lucide-react";
import {
  useResetPasswordForm,
  useResetPasswordSession,
  useResetPasswordSubmit,
  useResetPasswordValidation,
} from "./hooks";

const ResetPassword = () => {
  const { email, resetToken, redirectTo } = useResetPasswordSession();

  const {
    password,
    confirmPassword,
    isMismatch,
    onPasswordChange,
    onConfirmPasswordChange,
    resetForm,
  } = useResetPasswordForm();

  const { fieldErrors, validate, clearFieldError } = useResetPasswordValidation(
    password,
    confirmPassword,
  );

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
          <CheckCircle2 aria-hidden="true" className="size-6 text-primary" />
        </div>
        <title>Password updated | Platform Admin</title>
        <h1
          ref={focusOnMount}
          tabIndex={-1}
          className="mt-4 text-2xl font-bold outline-none"
        >
          Password Updated
        </h1>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          Your password has been reset. You can now sign in with your new
          password.
        </p>
        <Button asChild className="mt-10 h-11 w-full">
          <PrefetchLink prefetchModule="login" to={buildLoginUrl(redirectTo)}>
            Back to sign in
          </PrefetchLink>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <title>Set a new password | Platform Admin</title>
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
              required
              aria-invalid={!!fieldErrors.password}
              aria-describedby={
                fieldErrors.password ? "password-error" : undefined
              }
              onChange={(e) => {
                onPasswordChange(e);
                clearFieldError("password");
              }}
              disabled={isLoading}
            />
            <FieldError id="password-error">{fieldErrors.password}</FieldError>
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
              required
              aria-invalid={!!confirmError}
              aria-describedby={
                confirmError ? "confirm-password-error" : undefined
              }
              onChange={(e) => {
                onConfirmPasswordChange(e);
                clearFieldError("confirmPassword");
              }}
              disabled={isLoading}
            />
            <FieldError id="confirm-password-error">{confirmError}</FieldError>
          </Field>

          {error && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <SubmitButton
            className="mt-6 h-11 w-full"
            loading={isLoading}
            loadingText="Updating..."
          >
            Reset Password
          </SubmitButton>
        </FieldGroup>
      </form>
      <p className="mt-2 text-sm text-muted-foreground">
        Already had an account:{" "}
        <PrefetchLink
          to={buildLoginUrl(redirectTo)}
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
