import { createSlice } from "@reduxjs/toolkit";

interface User {
  email: string;
  fullName: string;
}

export type AsyncStatus = "idle" | "pending" | "succeeded" | "failed";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AsyncStatus;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  status: "idle",
  error: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
});

export default authSlice.reducer;
