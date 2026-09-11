import { authApi } from "@/api/auth";
import { getAxiosErrorMessage } from "@/lib/api.error";
import { storage } from "@/lib/storage";
import {
  isCompleteLoginResponse,
  type AuthState,
  type LoginPayload,
  type LoginResponse,
  type LogoutResponse,
  type User,
} from "@/types";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const buildAvatarName = (fullName?: string | null, email?: string): string => {
  const words = (fullName ?? "").trim().split(/\s+/).filter(Boolean);

  if (words.length > 0) {
    const first = words[0]?.[0] ?? "";
    const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
    return `${first}${last}`.toUpperCase();
  }

  return email?.trim()?.[0]?.toUpperCase() ?? "?";
};

const initialState: AuthState = {
  user: null,
  accessToken: storage.getAccessToken(),
  refreshToken: storage.getRefreshToken(),
  userType: "PLATFORM_ADMIN",
  status: "idle",
  error: null,
};

export const fetchLogin = createAsyncThunk<
  LoginResponse,
  LoginPayload,
  { rejectValue: string }
>("auth/fetchLogin", async (payload: LoginPayload, { rejectWithValue }) => {
  try {
    const tokens = await authApi.login(payload);

    if (!isCompleteLoginResponse(tokens)) {
      return rejectWithValue("Could not Sign in: incomplete response");
    }

    storage.setTokens(tokens.accessToken, tokens.refreshToken);
    return tokens;
  } catch (error) {
    storage.clearStoradge();
    return rejectWithValue(getAxiosErrorMessage(error, "Could not Sign in"));
  }
});

export const fetchMe = createAsyncThunk<User, void, { rejectValue: string }>(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const data = await authApi.me();

      return data;
    } catch (error) {
      storage.clearStoradge();
      return rejectWithValue(
        getAxiosErrorMessage(error, "Could not load the current user"),
      );
    }
  },
);

export const fetchLogout = createAsyncThunk<
  LogoutResponse,
  void,
  { rejectValue: string }
>("auth/fetchLogout", async (_, { rejectWithValue }) => {
  try {
    const data = await authApi.logout();

    return data;
  } catch (error) {
    return rejectWithValue(getAxiosErrorMessage(error, "Could not Sign out"));
  }
});

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchLogin.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchLogin.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.userType = action.payload.userType;
      })
      .addCase(fetchLogin.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Could not Sign in";
        state.accessToken = null;
        state.refreshToken = null;
        state.userType = null;
      });

    builder
      .addCase(fetchMe.pending, (state) => {
        state.status = "loading";
        state.user = null;
        state.error = null;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = {
          ...action.payload,
          avatarName: buildAvatarName(
            action.payload?.fullName,
            action.payload?.email,
          ),
        };
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Could not load the current user";
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.userType = null;
      });

    builder
      .addCase(fetchLogout.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchLogout.fulfilled, (state) => {
        state.status = "idle";
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.userType = null;
        state.error = null;
        storage.clearStoradge();
      })
      .addCase(fetchLogout.rejected, (state, action) => {
        state.status = "idle";
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.userType = null;
        state.error = action.payload ?? "Could not Sign out";
        storage.clearStoradge();
      });
  },
});

export const { clearAuthError } = authSlice.actions;

export default authSlice.reducer;
