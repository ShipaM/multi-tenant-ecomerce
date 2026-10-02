import { PrefetchLink, SubmitButton } from "@/components";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useAppDispatch, useAppSelector } from "@/hooks/use-store";
import { isSafeRedirectPath } from "@/lib/redirect";
import { verify2FaLoginOtp } from "@/store/auth/authSlice";
import {
  isCompleteLoginResponse,
  isTwoFactorRequiredResponse,
  type AuthNavigationState,
} from "@/types";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState, type SubmitEvent } from "react";
import { useLocation, useNavigate } from "react-router";

const Verify2FaOtpPage = () => {
  const location = useLocation();
  const navState = location.state as AuthNavigationState | null;
  const email = navState?.email;
  const twoFactorToken = navState?.twoFactorToken;
  const redirectTo =
    navState?.redirectTo && isSafeRedirectPath(navState.redirectTo)
      ? navState.redirectTo
      : "/dashboard";

  const dispatch = useAppDispatch();
  const [otp, setOtp] = useState("");
  const isVerifying = useAppSelector(
    (state) => state.auth.isVerify2FaLoginOtpLoading,
  );
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!twoFactorToken) navigate("/auth/login");
  }, [twoFactorToken, navigate]);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);
    try {
      const response = await dispatch(
        verify2FaLoginOtp({
          twoFactorToken: twoFactorToken ?? "",
          otp,
        }),
      ).unwrap();

      if (isCompleteLoginResponse(response)) {
        navigate(redirectTo, { replace: true });
      } else if (isTwoFactorRequiredResponse(response)) {
        navigate("/auth/2fa", {
          state: {
            twoFactorToken: response.twoFactorToken,
            email: email,
            redirectTo,
          },
        });
      }
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to verify otp");
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
          onChange={setOtp}
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
