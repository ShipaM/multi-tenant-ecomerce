import { PrefetchLink } from "@/components/PrefetchLink";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft } from "lucide-react";
import { useState, type SubmitEvent } from "react";
import { useLocation, useNavigate } from "react-router";

const VerifyForgotOtpPage = () => {
  const location = useLocation();
  const email = (location.state as { email?: string })?.email;

  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);

    setIsSubmitting(true);
    setTimeout(() => {
      const resetToken: string | null = null;
      setIsSubmitting(false);
      setOtp("");

      navigate("/auth/reset-password", {
        state: {
          email: email,
          resetToken: resetToken,
        },
      });
    }, 2000);
  };

  return (
    <div className="w-full max-w-sm">
      <PrefetchLink
        prefetchModule="login"
        to={"/auth/login"}
        aria-label="Back to sign in"
        className="mb-4 inline-flex text-foreground items-center gap-2"
      >
        <ArrowLeft className="size-5" />
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
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={setOtp}
          disabled={isSubmitting}
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

        <Button type="submit" className="mt-6 h-11 w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner className="size-4" />
              Verifying..
            </>
          ) : (
            "Verify OTP"
          )}
        </Button>
      </form>
    </div>
  );
};

export default VerifyForgotOtpPage;
