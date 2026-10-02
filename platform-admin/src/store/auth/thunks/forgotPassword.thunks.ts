import { authApi } from "@/api/auth";
import { getAxiosErrorMessage } from "@/lib/api.error";
import {
  type ForgotPasswordOtpVerifyResponse,
  type ForgotPasswordPayload,
  type ForgotPasswordResponse,
  type ResetPasswordPayload,
  type UpdateProfileResponse,
} from "@/types";
import { createAsyncThunk } from "@reduxjs/toolkit";

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
