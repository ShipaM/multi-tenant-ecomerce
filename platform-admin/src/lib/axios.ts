import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { LOCAL_STORAGE_KEYS, storage } from "./storage";

const baseURL =
  import.meta.env.VITE_APP_API_BASE_URL || "http://localhost:4000";

export const Axios = axios.create({
  baseURL,
});

const refreshClient = axios.create({
  baseURL,
});

const PUBLIC_AUTH_PATHS = ["/auth/login", "/auth/refresh"];

const isPublicAuthPath = (url: string | undefined): boolean =>
  Boolean(url && PUBLIC_AUTH_PATHS.some((path) => url.startsWith(path)));

Axios.interceptors.request.use((config) => {
  if (isPublicAuthPath(config.url)) {
    return config;
  }

  const accessToken = storage.getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

async function requestTokenPair(): Promise<string> {
  const refreshToken = storage.getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token available");

  const response = await refreshClient.post<{
    accessToken: string;
    refreshToken: string;
  }>("/auth/refresh", {
    refreshToken,
  });

  storage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, response.data.accessToken);
  storage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);

  return response.data.accessToken;
}

let pendingRefresh: Promise<string> | null = null;

function fetchRefreshToken(): Promise<string> {
  pendingRefresh ??= requestTokenPair().finally(() => {
    pendingRefresh = null;
  });

  return pendingRefresh;
}

Axios.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;

    const hadAuthHeader = Boolean(originalRequest?.headers?.Authorization);

    if (
      error?.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      !hadAuthHeader
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    let newAccessToken: string;

    try {
      newAccessToken = await fetchRefreshToken();
    } catch (refreshError) {
      storage.clearSession();
      window.location.href = "/auth/login";
      return Promise.reject(refreshError);
    }

    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

    return Axios(originalRequest);
  },
);

export default Axios;
