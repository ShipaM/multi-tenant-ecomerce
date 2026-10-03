import { PrefetchLink, SubmitButton } from "@/components";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useRedirectState } from "@/hooks/use-redirect-state";
import { buildLoginUrl } from "@/lib/redirect";
import { ArrowLeft } from "lucide-react";
import {
  useForgotPasswordEmail,
  useForgotPasswordSubmit,
  useForgotPasswordValidation,
} from "./hooks";

const ForgotPasswordPage = () => {
  const redirectTo = useRedirectState();
  const { email, onEmailChange, resetEmail } = useForgotPasswordEmail();

  const { emailError, validate, clearEmailError } =
    useForgotPasswordValidation(email);

  const { handleSubmit, isLoading, error } = useForgotPasswordSubmit(
    email,
    validate,
    resetEmail,
    redirectTo,
  );

  return (
    <div className="w-full max-w-sm">
      <title>Forgot password | Platform Admin</title>
      <PrefetchLink
        to={buildLoginUrl(redirectTo)}
        prefetchModule="login"
        aria-label="Back to sign in"
        className="mb-4 inline-flex text-foreground items-center gap-2"
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
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
            required
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "email-error" : undefined}
            onChange={(e) => {
              onEmailChange(e);
              clearEmailError();
            }}
            disabled={isLoading}
          />
          <FieldError id="email-error">{emailError}</FieldError>
        </Field>

        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <SubmitButton
          className="mt-6 h-11 w-full"
          loading={isLoading}
          loadingText="Sending otp.."
        >
          Send OTP
        </SubmitButton>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
