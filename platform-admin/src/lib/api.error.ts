import { isAxiosError } from "axios";

import type { ApiErrorResponse } from "@/types";

export const getAxiosErrorMessage = (
  error: unknown,
  defaultMessage: string,
): string => {
  if (isAxiosError<ApiErrorResponse>(error)) {
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
