import { authApi } from "@/api/auth";
import { getAxiosErrorMessage } from "@/lib/api.error";
import { storage } from "@/lib/storage";
import { isAxiosError } from "axios";
import {
  isCompleteLoginResponse,
  isTwoFactorRequiredResponse,
  type LoginPayload,
  type LoginResponse,
  type SuccessResponse,
  type User,
  type Verify2FaLoginOtpPayload,
} from "@/types";
import { createAsyncThunk } from "@reduxjs/toolkit";

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
    const unauthorized = isAxiosError(error) && error.response?.status === 401;

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
