import { PrefetchLink, SubmitButton } from "@/components";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { buildLoginUrl } from "@/lib/redirect";
import { ArrowLeft } from "lucide-react";
import {
  useVerifyForgotOtpCode,
  useVerifyForgotOtpResend,
  useVerifyForgotOtpSession,
  useVerifyForgotOtpSubmit,
} from "./hooks";

const VerifyForgotOtpPage = () => {
  const { email, createdAt, redirectTo } = useVerifyForgotOtpSession();
  const { otp, onOtpChange, resetOtp } = useVerifyForgotOtpCode();

  const {
    handleSubmit,
    isSubmitting,
    error: submitError,
  } = useVerifyForgotOtpSubmit({
    email,
    otp,
    redirectTo,
    onSuccess: resetOtp,
  });

  const {
    formattedTime,
    isExpired,
    handleResend,
    isResending,
    error: resendError,
  } = useVerifyForgotOtpResend(email, createdAt);

  const error = submitError ?? resendError;

  return (
    <div className="w-full max-w-sm">
      <title>Verify code | Platform Admin</title>
      <PrefetchLink
        prefetchModule="login"
        to={buildLoginUrl(redirectTo)}
        aria-label="Back to sign in"
        className="mb-4 inline-flex text-foreground items-center gap-2"
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
        Back
      </PrefetchLink>

      <h1 className="text-2xl font-bold">Enter Verification otp</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {email ? (
          <>
            We sent a 6 digit otp to{" "}
            <span className="font-medium text-foreground">{email}</span>.
          </>
        ) : (
          "We sent a 6 digit otp to your email address."
        )}
      </p>

      <form className="mt-6" onSubmit={handleSubmit}>
        <Label htmlFor="verify-forgot-otp" className="sr-only">
          One-time passcode
        </Label>
        <InputOTP
          id="verify-forgot-otp"
          maxLength={6}
          value={otp}
          onChange={onOtpChange}
          disabled={isSubmitting || isResending}
          required
          aria-invalid={!!error}
          aria-describedby={error ? "verify-forgot-otp-error" : undefined}
          className="w-full"
        >
          <InputOTPGroup className="w-full">
            <InputOTPSlot index={0} className="w-full h-14 text-lg" />
            <InputOTPSlot index={1} className="w-full h-14 text-lg" />
            <InputOTPSlot index={2} className="w-full h-14 text-lg" />
            <InputOTPSlot index={3} className="w-full h-14 text-lg" />
            <InputOTPSlot index={4} className="w-full h-14 text-lg" />
            <InputOTPSlot index={5} className="w-full h-14 text-lg" />
          </InputOTPGroup>
        </InputOTP>
        {isExpired ? (
          <SubmitButton
            className="mt-3 cursor-pointer"
            variant="link"
            type="button"
            onClick={handleResend}
            loading={isResending}
            loadingText="Sending.."
          >
            Resend Otp
          </SubmitButton>
        ) : (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              OTP will expire in {formattedTime}
            </p>
          </>
        )}

        {error && (
          <p
            id="verify-forgot-otp-error"
            role="alert"
            className="mt-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <SubmitButton
          className="mt-6 h-11 w-full"
          loading={isSubmitting}
          loadingText="Verifying.."
          disabled={isResending}
        >
          Verify OTP
        </SubmitButton>
      </form>
    </div>
  );
};

export default VerifyForgotOtpPage;
