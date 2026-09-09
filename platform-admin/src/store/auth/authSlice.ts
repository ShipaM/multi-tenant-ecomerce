import {
  authApi,
  isCompleteLoginResponse,
  type LoginPayload,
  type LoginResponse,
} from "@/api/auth";
import { getAxiosErrorMessage } from "@/lib/api.error";
import { LOCAL_STORAGE_KEYS, storage } from "@/lib/storage";
import { isUserType, type USER_TYPE } from "@/types/user";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface User {
  email: string;
  fullName: string;
}

export type AsyncStatus =
  "idle" | "pending" | "succeeded" | "failed" | "loading";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  // Null until a session exists: defaulting to a role would make a signed-out
  // visitor look like a platform admin to any future role check.
  userType: USER_TYPE | null;
  status: AsyncStatus;
  error: string | null;
}

// Read once per app load rather than from an effect, so a reload restores the
// session before the first render instead of flashing a signed-out state.
const storedUserType = storage.getUserType();

const initialState: AuthState = {
  user: null,
  accessToken: storage.getAccessToken(),
  refreshToken: storage.getRefreshToken(),
  userType: isUserType(storedUserType) ? storedUserType : null,
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

    // A partial body leaves the session half built, so it is rejected before
    // anything is persisted.
    if (!isCompleteLoginResponse(tokens)) {
      return rejectWithValue("Could not Sign in: incomplete response");
    }

    storage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    storage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    storage.setItem(LOCAL_STORAGE_KEYS.USER_TYPE, tokens.userType);
    return tokens;
  } catch (error) {
    return rejectWithValue(getAxiosErrorMessage(error, "Could not Sign in"));
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
  },
});

export default authSlice.reducer;
