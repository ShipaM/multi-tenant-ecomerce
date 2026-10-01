import { PrefetchLink, useOtpCountdown } from "@/components";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Spinner } from "@/components/ui/spinner";
import type { AuthNavigationState } from "@/types";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState, type SubmitEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAppDispatch } from "@/hooks/use-store";
import {
  fetchForgotPassword,
  fetchForgotPasswordOtpVerify,
} from "@/store/auth/authSlice";
import { toast } from "sonner";

const VerifyForgotOtpPage = () => {
  const location = useLocation();
  const email = (location.state as AuthNavigationState | null)?.email as string;
  const otpCreatedAtLocation = (
    location.state as { createdAt: string | null | Date }
  )?.createdAt;

  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  const navigate = useNavigate();
  const [otpCreatedAt, setOtpCreatedAt] = useState<
    string | Date | null | undefined
  >(otpCreatedAtLocation);

  const { formattedTime, isExpired } = useOtpCountdown(
    otpCreatedAt,
    5,
  );

  useEffect(() => {
    if (!email) navigate("/auth/forgot-password");
  }, [email, navigate]);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);

    setIsSubmitting(true);

    try {
      setIsSubmitting(true);
      const response = await dispatch(
        fetchForgotPasswordOtpVerify({ email, otp }),
      ).unwrap();
      if (response.success) {
        setIsSubmitting(false);
        navigate("/auth/reset-password", {
          state: {
            email: email,
            resetToken: response.data.resetToken,
          },
          replace: true,
        });
        setOtp("");
        toast.success(response.message);
        return;
      }
    } catch (err) {
      const message = typeof err === "string" ? err : "Failed to send otp";
      setError(message);
      setIsSubmitting(false);
      toast.error(message);
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await dispatch(fetchForgotPassword({ email })).unwrap();
      if (response.success) {
        setOtpCreatedAt(response.data.createdAt);
        toast.success(response.message);
        setIsSubmitting(false);
      }
    } catch (err) {
      const message = typeof err === "string" ? err : "Failed to send otp";
      setError(message);
      toast.error(message);
    }
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
        {isExpired ? (
          <Button
            className="mt-3 cursor-pointer"
            variant="link"
            onClick={handleResendOtp}
            type="button"
          >
            Resend Otp
          </Button>
        ) : (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              OTP will expire in {formattedTime}
            </p>
          </>
        )}

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          className="mt-6 h-11 w-full"
          disabled={isSubmitting}
        >
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
