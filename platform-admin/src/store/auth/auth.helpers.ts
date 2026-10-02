export const buildAvatarName = (
  fullName?: string | null,
  email?: string,
): string => {
  const words = (fullName ?? "").trim().split(/\s+/).filter(Boolean);

  if (words.length > 0) {
    const first = words[0]?.[0] ?? "";
    const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
    return `${first}${last}`.toUpperCase();
  }

  return email?.trim()?.[0]?.toUpperCase() ?? "?";
};
