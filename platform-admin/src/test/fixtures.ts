import type { Session, User } from "@/types";

export const makeUser = (overrides: Partial<User> = {}): User => ({
  id: "u1",
  email: "jane@example.com",
  fullName: "Jane Doe",
  userType: "PLATFORM_ADMIN",
  phone: "555-0100",
  status: "ACTIVE",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  avatarName: "JD",
  ...overrides,
});

export const makeSession = (overrides: Partial<Session> = {}): Session => ({
  deviceLabel: null,
  ipAddress: "127.0.0.1",
  lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  sessionId: "s1",
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  isCurrent: false,
  os: "Windows",
  device: null,
  browser: "Chrome",
  ...overrides,
});
