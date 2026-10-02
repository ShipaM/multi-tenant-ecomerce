import { authApi } from "@/api/auth";
import { getAxiosErrorMessage } from "@/lib/api.error";
import {
  type GenerateOtpResponse,
  type VerifyEnableDisableTwoFactorPayload,
  type VerifyOtpResponse,
} from "@/types";
import { createAsyncThunk } from "@reduxjs/toolkit";

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
