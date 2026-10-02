import { PrefetchLink } from "@/components";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft } from "lucide-react";
import {
  useForgotPasswordEmail,
  useForgotPasswordSubmit,
  useForgotPasswordValidation,
} from "./hooks";

const ForgotPasswordPage = () => {
  const { email, onEmailChange, resetEmail } = useForgotPasswordEmail();

  const { emailError, validate, clearEmailError } =
    useForgotPasswordValidation(email);

  const { handleSubmit, isLoading, error } = useForgotPasswordSubmit(
    email,
    validate,
    resetEmail,
  );

  return (
    <div className="w-full max-w-sm">
      <PrefetchLink
        to="/auth/login"
        prefetchModule="login"
        aria-label="Back to sign in"
        className="mb-4 inline-flex text-foreground items-center gap-2"
      >
        <ArrowLeft className="size-5" />
        Back
      </PrefetchLink>

      <h1 className="text-2xl font-bold">Forgot Password</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        We'll email a 6 digit code to your email address.
      </p>

      <form className="mt-6" noValidate onSubmit={handleSubmit}>
        <Field data-invalid={!!emailError}>
          <FieldLabel htmlFor="email">Email Address</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="you@platform.com"
            autoComplete="username"
            className="h-11"
            value={email}
            aria-invalid={!!emailError}
            onChange={(e) => {
              onEmailChange(e);
              clearEmailError();
            }}
            disabled={isLoading}
          />
          <FieldError>{emailError}</FieldError>
        </Field>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <Button type="submit" className="mt-6 h-11 w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner className="size-4" />
              Sending otp..
            </>
          ) : (
            "Send OTP"
          )}
        </Button>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
