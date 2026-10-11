export const NOW = new Date("2026-10-03T10:00:00.000Z");

export const adminUser = {
  id: "user-1",
  email: "admin@platform.test",
  fullName: "Admin Tester",
  userType: "PLATFORM_ADMIN",
  phone: "+380000000000",
  status: "ACTIVE",
  twoFactorEnabled: false,
  profileImage: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  passwordUpdatedAt: "2026-01-01T00:00:00.000Z",
  role: { id: "role-1", name: "Super admin" },
};

export const tokens = {
  accessToken: "e2e-access-token",
  refreshToken: "e2e-refresh-token",
  userType: "PLATFORM_ADMIN",
};

const session = (overrides: Record<string, unknown>) => ({
  deviceLabel: null,
  device: "Desktop",
  ipAddress: "127.0.0.1",
  createdAt: "2026-10-01T10:00:00.000Z",
  lastActiveAt: "2026-10-03T09:00:00.000Z",
  expiresAt: "2026-11-01T10:00:00.000Z",
  ...overrides,
});

export const currentSession = session({
  sessionId: "session-current",
  isCurrent: true,
  os: "macOS",
  browser: "Chrome",
});

export const otherSession = session({
  sessionId: "session-other",
  isCurrent: false,
  os: "Windows",
  browser: "Firefox",
});

export const sidebarItems: Array<[string, string]> = [
  ["Sellers", "/dashboard/sellers"],
  ["Commission & Payouts", "/dashboard/commission-payouts"],
  ["Global Catalog", "/dashboard/global-catalog"],
  ["Delivery Network", "/dashboard/delivery-network"],
  ["Customers", "/dashboard/customers"],
  ["Orders", "/dashboard/orders"],
  ["Supports", "/dashboard/support"],
  ["Marketing", "/dashboard/marketing"],
  ["Reports", "/dashboard/reports"],
  ["Users & Permissions", "/dashboard/users-permissions"],
  ["Settings", "/dashboard/settings"],
];
