const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email: string): string | undefined => {
  const value = email.trim();
  if (!value) return "Email is required";
  if (!EMAIL_PATTERN.test(value)) return "Enter a valid email address";
};

export const validatePassword = (password: string): string | undefined => {
  if (!password) return "Password is required";
};
