const STORAGE_VERSION = "v1";

export const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: `auth:${STORAGE_VERSION}:access-token`,
  REFRESH_TOKEN: `auth:${STORAGE_VERSION}:refresh-token`,
  USER_TYPE: `auth:${STORAGE_VERSION}:user-type`,
} as const;

export type LocalStorageKey =
  (typeof LOCAL_STORAGE_KEYS)[keyof typeof LOCAL_STORAGE_KEYS];

const readItem = (key: LocalStorageKey): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeItem = (key: LocalStorageKey, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The session still works in this tab, it just will not survive a reload.
  }
};

const removeItem = (key: LocalStorageKey): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing to do: the value is unreachable either way.
  }
};

export const storage = {
  getAccessToken: () => readItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN),

  getRefreshToken: () => readItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN),

  getUserType: () => readItem(LOCAL_STORAGE_KEYS.USER_TYPE),

  setItem: (key: LocalStorageKey, value: string) => writeItem(key, value),

  clearField: (key: LocalStorageKey) => removeItem(key),

  clearSession: () => {
    removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
    removeItem(LOCAL_STORAGE_KEYS.USER_TYPE);
  },
};
