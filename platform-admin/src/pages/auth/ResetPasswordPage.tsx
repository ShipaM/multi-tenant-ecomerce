import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2 } from "lucide-react";
import { useState, type SubmitEvent, type ChangeEvent } from "react";
import { Link, useLocation } from "react-router";

const ResetPassword = () => {
  const location = useLocation();
  const state = location.state as {
    email?: string;
    resetToken?: string;
  } | null;

  const email = state?.email;

  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const misMatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (misMatch) return;

    setError(null);

    setIsSubmitting(true);
    setTimeout(() => {
      setPassword("");
      setConfirmPassword("");
      setIsDone(true);
      setIsSubmitting(false);
    }, 2000);
  };

  if (isDone) {
    return (
      <div className="w-full max-w-sm flex flex-col justify-center items-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-accent">
          <CheckCircle2 className="size-6 text-primary" />
        </div>
        <h2 className="mt-4 text-2xl font-bold">Password Updated</h2>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          Your passowrd has been reset. You can now sign in with your new
          passoword.
        </p>
        <Button asChild className="mt-10 h-11 w-full">
          <Link to={"/auth/login"}>Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-2xl font-bold">Set a new Password</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {email ? (
          <>
            New password for{" "}
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

            {misMatch && <FieldError>Passowrds don't match</FieldError>}
          </Field>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <Button type="submit" className="mt-6 h-11 w-full" disabled={isSubmitting}>
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
    </div>
  );
};

export default ResetPassword;
