import { authApi } from "@/api/auth";
import { getAxiosErrorMessage } from "@/lib/api.error";
import {
  type ChangePasswordPayload,
  type UpdateProfilePayload,
  type UpdateProfileResponse,
} from "@/types";
import { createAsyncThunk } from "@reduxjs/toolkit";

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
