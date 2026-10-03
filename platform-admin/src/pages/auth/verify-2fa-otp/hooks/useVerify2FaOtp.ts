import { useState } from "react";

type UseVerify2FaOtpResult = {
  otp: string;
  onOtpChange: (value: string) => void;
};

export const useVerify2FaOtp = (): UseVerify2FaOtpResult => {
  const [otp, setOtp] = useState<string>("");

  return { otp, onOtpChange: setOtp };
};
