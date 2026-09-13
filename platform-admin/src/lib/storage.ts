import { isUserType, type USER_TYPE } from "@/types/user";

export const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: "ACCESS_TOKEN",
  REFRESH_TOKEN: "REFRESH_TOKEN",
  USER_TYPE: "USER_TYPE",
} as const;

export type LocalStorageKey =
  (typeof LOCAL_STORAGE_KEYS)[keyof typeof LOCAL_STORAGE_KEYS];

// Some browsers (private mode, disabled site data) throw on access instead of
// just being unavailable, so every call is guarded rather than trusted.
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage is unavailable; the session simply won't persist across reloads.
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing to do if storage can't be touched.
  }
}

function safeClear(): void {
  try {
    localStorage.clear();
  } catch {
    // Nothing to do if storage can't be touched.
  }
}

export const storage = {
  getAccessToken(): string | null {
    return safeGetItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken(): string | null {
    return safeGetItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
  },

  getUserType(): USER_TYPE | null {
    const value = safeGetItem(LOCAL_STORAGE_KEYS.USER_TYPE);
    return isUserType(value) ? value : null;
  },

  setTokens(accessToken: string, refreshToken: string) {
    safeSetItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    safeSetItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  },

  setUserType(userType: USER_TYPE) {
    safeSetItem(LOCAL_STORAGE_KEYS.USER_TYPE, userType);
  },

  clearField(field: string) {
    safeRemoveItem(field);
  },

  clearStoradge() {
    safeClear();
  },
};
