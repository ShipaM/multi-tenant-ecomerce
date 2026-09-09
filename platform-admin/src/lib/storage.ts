export const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: "ACCESS_TOKEN",
  REFRESH_TOKEN: "REFRESH_TOKEN",
} as const;

export type LocalStorageKeys = keyof typeof LOCAL_STORAGE_KEYS;

export const storage = {
  getAccessToken: () => localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN),

  getRefreshToken: () => localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN),

  setToken: (key: LocalStorageKeys, token: string) =>
    localStorage.setItem(key, token),

  clearField: (key: LocalStorageKeys) => localStorage.removeItem(key),
  clearStorage: () => {
    localStorage.clear();
  },
};
