import { storage } from "@/lib/storage";
import { createSlice } from "@reduxjs/toolkit";
import type { AuthState } from "./auth.types";
import { buildAvatarName } from "./auth.helpers";
import {
  changePassword,
  fetchLogin,
  fetchForgotPassword,
  fetchLogout,
  fetchMe,
  fetchSessionsList,
  resetForgottenPassword,
  twoFactorGenerateOtp,
  updateUser,
  verify2FaLoginOtp,
  verifyEnableDisableTwoFactor,
} from "./thunks";

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
  isForgotPasswordLoading: false,
  isResetPasswordLoading: false,
};

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

    builder
      .addCase(fetchForgotPassword.pending, (state) => {
        state.isForgotPasswordLoading = true;
      })
      .addCase(fetchForgotPassword.fulfilled, (state) => {
        state.isForgotPasswordLoading = false;
      })
      .addCase(fetchForgotPassword.rejected, (state) => {
        state.isForgotPasswordLoading = false;
      });

    builder
      .addCase(resetForgottenPassword.pending, (state) => {
        state.isResetPasswordLoading = true;
      })
      .addCase(resetForgottenPassword.fulfilled, (state) => {
        state.isResetPasswordLoading = false;
      })
      .addCase(resetForgottenPassword.rejected, (state) => {
        state.isResetPasswordLoading = false;
      });
  },
});

export const { clearAuthError } = authSlice.actions;

export default authSlice.reducer;
