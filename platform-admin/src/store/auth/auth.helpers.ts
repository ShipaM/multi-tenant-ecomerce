export const buildAvatarName = (
  fullName?: string | null,
  email?: string,
): string => {
  const words = (fullName ?? "").trim().split(/\s+/).filter(Boolean);

  if (words.length > 0) {
    const initialWords = [
      ...words.slice(0, 1),
      ...(words.length > 1 ? words.slice(-1) : []),
    ];
    return initialWords
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  }

  return email?.trim()?.[0]?.toUpperCase() ?? "?";
};
