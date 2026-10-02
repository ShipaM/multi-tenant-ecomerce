import { authApi } from "@/api/auth";
import { getAxiosErrorMessage } from "@/lib/api.error";
import {
  type SessionPayload,
  type SessionsResponse,
  type SuccessResponse,
} from "@/types";
import { createAsyncThunk } from "@reduxjs/toolkit";

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
