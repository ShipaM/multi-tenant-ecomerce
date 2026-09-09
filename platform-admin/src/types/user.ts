export const USER_TYPES = [
  "CUSTOMER",
  "SELLER",
  "PLATFORM_ADMIN",
  "DELIVERY_AGENT",
] as const;

export type USER_TYPE = (typeof USER_TYPES)[number];

// Values coming back from the API or from storage are untrusted strings until
// they have been matched against the list above.
export const isUserType = (value: unknown): value is USER_TYPE =>
  typeof value === "string" && USER_TYPES.includes(value as USER_TYPE);
