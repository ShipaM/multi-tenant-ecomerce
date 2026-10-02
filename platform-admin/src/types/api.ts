import type { InternalAxiosRequestConfig } from "axios";

export type ApiErrorResponse = {
  message?: string | string[];
};

// Marks a request that has already gone through one 401 -> refresh -> retry
// cycle, so the axios response interceptor doesn't retry it a second time.
export type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};
