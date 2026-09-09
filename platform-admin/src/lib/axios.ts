import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { LOCAL_STORAGE_KEYS, storage } from "./storage";

const baseURL = import.meta.env.VITE_APP_API_BASE_URL || "http://localhost:4000";

export const Axios = axios.create({
  baseURL,
});

const refreshClient = axios.create({
  baseURL,
});

Axios.interceptors.request.use((config) => {
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

  storage.setToken(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, response.data.accessToken);
  storage.setToken(
    LOCAL_STORAGE_KEYS.REFRESH_TOKEN,
    response.data.refreshToken,
  );

  return response.data.accessToken;
}

// An expired access token usually fails every request on the page at once. The
// API rotates the refresh token on every call, so a second concurrent exchange
// would present an already-invalidated one and sign the user out; instead every
// caller waits on the same exchange.
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
      storage.clearField(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
      storage.clearField(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
      window.location.href = "/auth/login";
      return Promise.reject(refreshError);
    }

    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

    // Outside the catch on purpose: a 500 from the replayed request is the
    // endpoint failing, not the session, and must not sign the user out.
    return Axios(originalRequest);
  },
);

export default Axios;
