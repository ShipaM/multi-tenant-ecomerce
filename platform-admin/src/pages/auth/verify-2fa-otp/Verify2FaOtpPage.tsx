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
  useVerify2FaOtp,
  useVerify2FaSession,
  useVerify2FaSubmit,
} from "./hooks";

const Verify2FaOtpPage = () => {
  const { email, twoFactorToken, redirectTo } = useVerify2FaSession();
  const { otp, onOtpChange } = useVerify2FaOtp();
  const { handleSubmit, isVerifying, error } = useVerify2FaSubmit({
    otp,
    email,
    twoFactorToken,
    redirectTo,
  });

  return (
    <div className="w-full max-w-sm">
      <PrefetchLink
        prefetchModule="login"
        to={buildLoginUrl(redirectTo)}
        aria-label="Back to sign in"
        className="mb-4 inline-flex text-foreground items-center gap-2"
      >
        <ArrowLeft className="size-5" />
        Back
      </PrefetchLink>

      <h1 className="text-2xl font-bold">Enter 2FA otp</h1>
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
        <Label htmlFor="verify-2fa-otp" className="sr-only">
          One-time passcode
        </Label>
        <InputOTP
          id="verify-2fa-otp"
          maxLength={6}
          value={otp}
          onChange={onOtpChange}
          disabled={isVerifying}
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

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <SubmitButton
          className="mt-6 h-11 w-full"
          loading={isVerifying}
          loadingText="Verifying.."
        >
          Verify 2FA OTP
        </SubmitButton>
      </form>
    </div>
  );
};

export default Verify2FaOtpPage;
