export const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: "ACCESS_TOKEN",
  REFRESH_TOKEN: "REFRESH_TOKEN",
} as const;

export type LocalStorageKey =
  (typeof LOCAL_STORAGE_KEYS)[keyof typeof LOCAL_STORAGE_KEYS];

export const storage = {
  getAccessToken(): string | null {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
  },

  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  },

  clearField(field: string) {
    localStorage.removeItem(field);
  },

  clearStoradge() {
    localStorage.clear();
  },
};
