import { PasswordInput, PrefetchLink } from "@/components";
import { Button } from "@/components/ui/button";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useAppDispatch } from "@/hooks/use-store";
import { resetForgottenPassword } from "@/store/auth/authSlice";
import type { AuthNavigationState, ResetPasswordPayload } from "@/types";
import { CheckCircle2 } from "lucide-react";
import { useState, type SubmitEvent, type ChangeEvent, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

const ResetPassword = () => {
  const location = useLocation();
  const navState = location.state as AuthNavigationState | null;
  const dispatch = useAppDispatch();

  const email = navState?.email;
  const resetToken = navState?.resetToken;

  const navigate = useNavigate();

  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const misMatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (misMatch) {
      setError("Password and confirm password must be the same");
      return;
    }

    if (!resetToken) {
      setError("Session will be expired. Please try again.");
      return;
    }

    setError(null);

    setIsSubmitting(true);

    const payload: ResetPasswordPayload = {
      password,
      resetToken,
    };

    try {
      const response = await dispatch(
        resetForgottenPassword(payload),
      ).unwrap();

      if (response.success) {
        setIsDone(true);
        setPassword("");
        setConfirmPassword("");
        setIsSubmitting(false);
        toast.success(response.message || "Password reset successfully");
      }
    } catch (err) {
      const message =
        typeof err === "string" ? err : "Failed to reset password";
      setError(message);
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!email || !resetToken) navigate("/auth/forgot-password");
  }, [email, resetToken, navigate]);

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

      <form className="mt-7" onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <PasswordInput
              id="password"
              className="h-11"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement, HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
            <PasswordInput
              id="confirm-password"
              className="h-11"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e: ChangeEvent<HTMLInputElement, HTMLInputElement>) =>
                setConfirmPassword(e.target.value)
              }
              disabled={isSubmitting}
            />

            {misMatch && <FieldError>Passwords don't match</FieldError>}
          </Field>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            className="mt-6 h-11 w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
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
