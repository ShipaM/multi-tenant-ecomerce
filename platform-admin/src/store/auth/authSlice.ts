import { authApi } from "@/api/auth";
import { getAxiosErrorMessage } from "@/lib/api.error";
import { storage } from "@/lib/storage";
import { isAxiosError } from "axios";
import {
  isCompleteLoginResponse,
  isTwoFactorRequiredResponse,
  type ChangePasswordPayload,
  type ForgotPasswordOtpVerifyResponse,
  type ForgotPasswordPayload,
  type ForgotPasswordResponse,
  type GenerateOtpResponse,
  type LoginPayload,
  type LoginResponse,
  type ResetPasswordPayload,
  type SessionPayload,
  type SessionsResponse,
  type SuccessResponse,
  type UpdateProfilePayload,
  type UpdateProfileResponse,
  type User,
  type Verify2FaLoginOtpPayload,
  type VerifyEnableDisableTwoFactorPayload,
  type VerifyOtpResponse,
} from "@/types";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { AuthState } from "./auth.types";

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
  error: null,
  isLoginLoading: false,
  isMeLoading: false,
  isLogoutLoading: false,
  isUpdateUserLoading: false,
  isChangePasswordLoading: false,
  isTwoFactorGenerateOtpLoading: false,
  isTwoFactorVerifyOtpLoading: false,

  twoFactorToken: null,
  twoFactorRequired: false,
  isVerify2FaLoginOtpLoading: false,

  sessions: [],
  isSessionsLoading: false,
};

export const fetchLogin = createAsyncThunk<
  LoginResponse,
  LoginPayload,
  { rejectValue: string }
>("auth/fetchLogin", async (payload: LoginPayload, { rejectWithValue }) => {
  try {
    const tokens = await authApi.login(payload);

    if (isCompleteLoginResponse(tokens)) {
      storage.setTokens(tokens.accessToken, tokens.refreshToken);
      storage.setUserType(tokens.userType);
      return tokens;
    }

    if (isTwoFactorRequiredResponse(tokens)) {
      return tokens;
    }

    return rejectWithValue("Could not Sign in: incomplete response");
  } catch (error) {
    storage.clearStorage();
    return rejectWithValue(getAxiosErrorMessage(error, "Could not Sign in"));
  }
});

export const fetchMe = createAsyncThunk<
  User,
  void,
  { rejectValue: { message: string; unauthorized: boolean } }
>("auth/fetchMe", async (_, { rejectWithValue }) => {
  try {
    const data = await authApi.me();

    return data;
  } catch (error) {
    // Only a genuine 401 means the session itself is invalid. A network
    // blip or a 5xx shouldn't wipe the user's tokens and force a logout.
    const unauthorized =
      isAxiosError(error) && error.response?.status === 401;

    if (unauthorized) {
      storage.clearStorage();
    }

    return rejectWithValue({
      message: getAxiosErrorMessage(error, "Could not load the current user"),
      unauthorized,
    });
  }
});

export const fetchLogout = createAsyncThunk<
  SuccessResponse,
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

export const updateUser = createAsyncThunk<
  UpdateProfileResponse,
  UpdateProfilePayload,
  { rejectValue: string }
>(
  "auth/updateUser",
  async (payload: UpdateProfilePayload, { rejectWithValue }) => {
    try {
      const data = await authApi.updateUser(payload);

      return data;
    } catch (error) {
      return rejectWithValue(
        getAxiosErrorMessage(error, "Failed to update the current user"),
      );
    }
  },
);

export const changePassword = createAsyncThunk<
  UpdateProfileResponse,
  ChangePasswordPayload,
  { rejectValue: string }
>(
  "auth/changePassword",
  async (payload: ChangePasswordPayload, { rejectWithValue }) => {
    try {
      const data = await authApi.changePassword(payload);

      return data;
    } catch (error) {
      return rejectWithValue(
        getAxiosErrorMessage(error, "Failed to update the current user"),
      );
    }
  },
);

export const twoFactorGenerateOtp = createAsyncThunk<
  GenerateOtpResponse,
  void,
  { rejectValue: string }
>("auth/twoFactorGenerateOtp", async (_, { rejectWithValue }) => {
  try {
    const data = await authApi.twoFactorGenerateOtp();
    return data;
  } catch (error) {
    return rejectWithValue(
      getAxiosErrorMessage(error, "Failed to generate otp"),
    );
  }
});

export const verifyEnableDisableTwoFactor = createAsyncThunk<
  VerifyOtpResponse,
  VerifyEnableDisableTwoFactorPayload,
  { rejectValue: string }
>(
  "auth/verifyEnableDisableTwoFactor",
  async (payload: VerifyEnableDisableTwoFactorPayload, { rejectWithValue }) => {
    try {
      const data = await authApi.verifyEnableDisableTwoFactor(payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        getAxiosErrorMessage(error, "Failed to verify otp"),
      );
    }
  },
);

export const verify2FaLoginOtp = createAsyncThunk<
  LoginResponse,
  Verify2FaLoginOtpPayload,
  { rejectValue: string }
>(
  "auth/verify2FaLoginOtp",
  async (payload: Verify2FaLoginOtpPayload, { rejectWithValue }) => {
    try {
      const tokens = await authApi.verify2FaLoginOtp(payload);

      if (isCompleteLoginResponse(tokens)) {
        storage.setTokens(tokens.accessToken, tokens.refreshToken);
        storage.setUserType(tokens.userType);
        return tokens;
      }

      if (isTwoFactorRequiredResponse(tokens)) {
        return tokens;
      }

      return rejectWithValue("Could not Sign in: incomplete response");
    } catch (error) {
      storage.clearStorage();
      return rejectWithValue(getAxiosErrorMessage(error, "Could not Sign in"));
    }
  },
);

export const fetchSessionsList = createAsyncThunk<
  SessionsResponse,
  void,
  { rejectValue: string }
>("auth/fetchSessionsList", async (_, { rejectWithValue }) => {
  try {
    const data = await authApi.sessions();
    return data;
  } catch (error) {
    return rejectWithValue(
      getAxiosErrorMessage(error, "Failed to fetch sessions"),
    );
  }
});

export const revokeSession = createAsyncThunk<
  SuccessResponse,
  SessionPayload,
  { rejectValue: string }
>(
  "auth/revokeSession",
  async (payload: SessionPayload, { rejectWithValue }) => {
    try {
      const data = await authApi.sessionRevoke(payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        getAxiosErrorMessage(error, "Failed to revoke the session"),
      );
    }
  },
);

export const revokeOtherSessions = createAsyncThunk<
  SuccessResponse,
  void,
  { rejectValue: string }
>("auth/revokeOtherSessions", async (_, { rejectWithValue }) => {
  try {
    const data = await authApi.sessionRevokeOthers();
    return data;
  } catch (error) {
    return rejectWithValue(
      getAxiosErrorMessage(error, "Failed to sign out other sessions"),
    );
  }
});

export const fetchForgotPassword = createAsyncThunk<
  ForgotPasswordResponse,
  ForgotPasswordPayload,
  { rejectValue: string }
>(
  "auth/fetchForgotPassword",
  async (payload: ForgotPasswordPayload, { rejectWithValue }) => {
    try {
      const data = await authApi.forgotPassword(payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        getAxiosErrorMessage(error, "Failed to send forgot password email"),
      );
    }
  },
);

export const fetchForgotPasswordOtpVerify = createAsyncThunk<
  ForgotPasswordOtpVerifyResponse,
  ForgotPasswordPayload,
  { rejectValue: string }
>(
  "auth/fetchForgotPasswordOtpVerify",
  async (payload: ForgotPasswordPayload, { rejectWithValue }) => {
    try {
      const data = await authApi.forgotPasswordOtpVerify(payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        getAxiosErrorMessage(error, "Failed to verify forgot password otp"),
      );
    }
  },
);

export const resetForgottenPassword = createAsyncThunk<
  UpdateProfileResponse,
  ResetPasswordPayload,
  { rejectValue: string }
>(
  "auth/resetForgottenPassword",
  async (payload: ResetPasswordPayload, { rejectWithValue }) => {
    try {
      const data = await authApi.resetForgottenPassword(payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        getAxiosErrorMessage(error, "Failed to reset password"),
      );
    }
  },
);

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
        state.isLoginLoading = true;
        state.error = null;
      })
      .addCase(fetchLogin.fulfilled, (state, action) => {
        state.isLoginLoading = false;
        state.accessToken = action.payload.accessToken ?? null;
        state.refreshToken = action.payload.refreshToken ?? null;
        state.userType = "PLATFORM_ADMIN";

        state.twoFactorRequired = action.payload.twoFactorRequired ?? false;
        state.twoFactorToken = action.payload.twoFactorToken ?? null;
      })
      .addCase(fetchLogin.rejected, (state, action) => {
        state.isLoginLoading = false;
        state.error = action.payload ?? "Could not Sign in";
        state.accessToken = null;
        state.refreshToken = null;
        state.userType = "PLATFORM_ADMIN";
      });

    builder
      .addCase(fetchMe.pending, (state) => {
        state.isMeLoading = true;
        state.user = null;
        state.error = null;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.isMeLoading = false;
        state.user = {
          ...action.payload,
          avatarName: buildAvatarName(
            action.payload?.fullName,
            action.payload?.email,
          ),
        };
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.isMeLoading = false;
        state.error =
          action.payload?.message ?? "Could not load the current user";
        state.user = null;

        if (action.payload?.unauthorized) {
          state.accessToken = null;
          state.refreshToken = null;
          state.userType = "PLATFORM_ADMIN";
        }
      });

    builder
      .addCase(fetchLogout.pending, (state) => {
        state.isLogoutLoading = true;
        state.error = null;
      })
      .addCase(fetchLogout.fulfilled, (state) => {
        state.isLogoutLoading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.userType = "PLATFORM_ADMIN";
        state.error = null;
        storage.clearStorage();
      })
      .addCase(fetchLogout.rejected, (state, action) => {
        state.isLogoutLoading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.userType = "PLATFORM_ADMIN";
        state.error = action.payload ?? "Could not Sign out";
        storage.clearStorage();
      });

    builder
      .addCase(updateUser.pending, (state) => {
        state.isUpdateUserLoading = true;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isUpdateUserLoading = false;
        const { user } = action.payload;
        state.user = {
          ...user,
          avatarName: buildAvatarName(user?.fullName, user?.email),
        };
      })
      .addCase(updateUser.rejected, (state) => {
        state.isUpdateUserLoading = false;
      });

    builder
      .addCase(changePassword.pending, (state) => {
        state.isChangePasswordLoading = true;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.isChangePasswordLoading = false;
        const { user } = action.payload;
        state.user = {
          ...user,
          avatarName: buildAvatarName(user?.fullName, user?.email),
        };
      })
      .addCase(changePassword.rejected, (state) => {
        state.isChangePasswordLoading = false;
      });

    builder
      .addCase(twoFactorGenerateOtp.pending, (state) => {
        state.isTwoFactorGenerateOtpLoading = true;
      })
      .addCase(twoFactorGenerateOtp.fulfilled, (state) => {
        state.isTwoFactorGenerateOtpLoading = false;
      })
      .addCase(twoFactorGenerateOtp.rejected, (state) => {
        state.isTwoFactorGenerateOtpLoading = false;
      });

    builder
      .addCase(verifyEnableDisableTwoFactor.pending, (state) => {
        state.isTwoFactorVerifyOtpLoading = true;
      })
      .addCase(verifyEnableDisableTwoFactor.fulfilled, (state, action) => {
        state.isTwoFactorVerifyOtpLoading = false;
        if (state.user) {
          state.user.twoFactorEnabled = action.payload.data.twoFactorEnabled;
        }
      })
      .addCase(verifyEnableDisableTwoFactor.rejected, (state) => {
        state.isTwoFactorVerifyOtpLoading = false;
      });

    builder
      .addCase(verify2FaLoginOtp.pending, (state) => {
        state.isVerify2FaLoginOtpLoading = true;
        state.error = null;
      })
      .addCase(verify2FaLoginOtp.fulfilled, (state, action) => {
        state.isVerify2FaLoginOtpLoading = false;
        state.accessToken = action.payload.accessToken ?? null;
        state.refreshToken = action.payload.refreshToken ?? null;
        state.userType = "PLATFORM_ADMIN";

        state.twoFactorRequired = action.payload.twoFactorRequired ?? false;
        state.twoFactorToken = action.payload.twoFactorToken ?? null;
      })
      .addCase(verify2FaLoginOtp.rejected, (state, action) => {
        state.isVerify2FaLoginOtpLoading = false;
        state.error = action.payload ?? "Could not Sign in";
        state.accessToken = null;
        state.refreshToken = null;
        state.userType = "PLATFORM_ADMIN";
      });

    builder
      .addCase(fetchSessionsList.pending, (state) => {
        state.isSessionsLoading = true;
      })
      .addCase(fetchSessionsList.fulfilled, (state, action) => {
        state.isSessionsLoading = false;
        state.sessions = action.payload;
      })
      .addCase(fetchSessionsList.rejected, (state) => {
        state.isSessionsLoading = false;
        state.sessions = [];
      });
  },
});

export const { clearAuthError } = authSlice.actions;

export default authSlice.reducer;
