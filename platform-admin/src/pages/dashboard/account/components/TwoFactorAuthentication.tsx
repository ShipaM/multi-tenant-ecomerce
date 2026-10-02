import { PageTitle, SubmitButton } from "@/components";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useAppDispatch, useAppSelector } from "@/hooks/use-store";
import {
  twoFactorGenerateOtp,
  verifyEnableDisableTwoFactor,
} from "@/store/auth/thunks";
import type { User } from "@/types";
import { type FC, useState, type SubmitEvent } from "react";
import { toast } from "sonner";

type TwoFactorAuthenticationProps = {
  user: User;
};

export const TwoFactorAuthentication: FC<TwoFactorAuthenticationProps> = ({
  user,
}) => {
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [otp, setOtp] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isOtpSend, setIsOtpSend] = useState<boolean>(false);
  const isTwoFactorGenerateOtpLoading = useAppSelector(
    (state) => state.auth.isTwoFactorGenerateOtpLoading,
  );

  const isVerifyOtpLoading = useAppSelector(
    (state) => state.auth.isTwoFactorVerifyOtpLoading,
  );

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await dispatch(twoFactorGenerateOtp()).unwrap();
      toast.success(response.message);
      setIsOtpSend(true);
    } catch (error) {
      const message = typeof error === "string" ? error : "Failed to send otp";
      setError(message);
      toast.error(message);
    }
  };

  const handleVerifyOtp = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);

    try {
      const response = await dispatch(
        verifyEnableDisableTwoFactor({ otp }),
      ).unwrap();
      toast.success(response.message);
      setIsOpen(false);
      setOtp("");
      setIsOtpSend(false);
    } catch (error) {
      const message = typeof error === "string" ? error : "Failed to send otp";
      setError(message);
      toast.error(message);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        setIsOpen(nextOpen);
        if (nextOpen) {
          setError(null);
          setIsOtpSend(false);
          setOtp("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="cursor-pointer">
          {user.twoFactorEnabled ? "Disable" : "Enable"}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full lg:max-w-2xl min-h-28 p-4 lg:p-6">
        {isOtpSend ? (
          <>
            <PageTitle
              title="OTP 2FA"
              description="Enter your 2fa authentication otp..."
              classNameTitle="font-semibold"
            />
            <form
              className="grid gap-4 lg:gap-6 w-fit mx-auto min-w-sm"
              onSubmit={handleVerifyOtp}
            >
              <div className="grid gap-1 w-full sm:max-w-xs lg:max-w-sm  mt-4">
                <Label htmlFor="two-factor-otp">OTP</Label>
                <InputOTP
                  id="two-factor-otp"
                  maxLength={6}
                  className="w-full"
                  value={otp}
                  onChange={setOtp}
                  disabled={isVerifyOtpLoading}
                >
                  <InputOTPGroup className="w-full">
                    <InputOTPSlot index={0} className="w-full h-12 text-lg" />
                    <InputOTPSlot index={1} className="w-full h-12 text-lg" />
                    <InputOTPSlot
                      index={2}
                      className="
                      w-full
                      h-12
                      text-lg"
                    />
                    <InputOTPSlot index={3} className="w-full h-12 text-lg" />
                    <InputOTPSlot
                      index={4}
                      className="
                      w-full
                      h-12
                      text-lg"
                    />
                    <InputOTPSlot index={5} className="w-full h-12 text-lg" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <div className="mt-4 flex justify-center">
                <SubmitButton
                  loading={isVerifyOtpLoading}
                  loadingText="Verifying otp..."
                >
                  Verify OTP
                </SubmitButton>
              </div>
            </form>
          </>
        ) : (
          <>
            <PageTitle
              title="Two Factor Authentication"
              description="Enable two factor authentication..."
              classNameTitle="font-semibold"
            />
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-4 lg:gap-6 mt-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={user.email}
                  readOnly
                  disabled
                  placeholder="Enter your email"
                  className="h-10"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="mt-4 flex justify-center">
                <SubmitButton
                  loading={isTwoFactorGenerateOtpLoading}
                  loadingText="Sending otp..."
                >
                  Send OTP
                </SubmitButton>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
