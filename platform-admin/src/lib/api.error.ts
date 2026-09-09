import { isAxiosError } from "axios";

type ApiErrorData = {
  message?: string | string[];
};

export const getAxiosErrorMessage = (
  error: unknown,
  defaultMessage: string,
): string => {
  if (isAxiosError<ApiErrorData>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) {
      return message[0] ?? defaultMessage;
    }
    if (typeof message === "string") {
      return message;
    }
  }
  return defaultMessage;
};
