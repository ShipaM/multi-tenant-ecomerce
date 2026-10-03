import { useState } from "react";

type UseVerifyForgotOtpCodeResult = {
  otp: string;
  onOtpChange: (value: string) => void;
  resetOtp: () => void;
};

export const useVerifyForgotOtpCode = (): UseVerifyForgotOtpCodeResult => {
  const [otp, setOtp] = useState<string>("");

  return { otp, onOtpChange: setOtp, resetOtp: () => setOtp("") };
};
