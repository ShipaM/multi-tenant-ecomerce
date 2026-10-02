import { useEffect, useState } from "react";
import moment from "moment";

const OTP_EXPIRY_MINUTES = 5;

type UseOtpCountdownReturn = {
  remainingSeconds: number;
  formattedTime: string;
  isExpired: boolean;
};

const calculateRemainingSeconds = (
  createdAt: string | Date | null | undefined,
  expiryMinutes: number,
) => {
  if (!createdAt) return 0;

  const expiryAt = moment(createdAt).add(expiryMinutes, "minutes");

  return Math.max(0, expiryAt.diff(moment(), "seconds"));
};

export const useOtpCountdown = (
  createdAt?: string | Date | null,
  expiryMinutes: number = OTP_EXPIRY_MINUTES,
): UseOtpCountdownReturn => {
  const [trackedCreatedAt, setTrackedCreatedAt] = useState(createdAt);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    calculateRemainingSeconds(createdAt, expiryMinutes),
  );

  if (createdAt !== trackedCreatedAt) {
    setTrackedCreatedAt(createdAt);
    setRemainingSeconds(calculateRemainingSeconds(createdAt, expiryMinutes));
  }

  useEffect(() => {
    if (!createdAt) return;

    const interval = setInterval(() => {
      setRemainingSeconds(calculateRemainingSeconds(createdAt, expiryMinutes));
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, expiryMinutes]);

  const formattedTime = moment.utc(remainingSeconds * 1000).format("mm:ss");

  return {
    remainingSeconds,
    formattedTime,
    isExpired: remainingSeconds === 0,
  };
};
