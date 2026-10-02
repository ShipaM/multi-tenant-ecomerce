const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email: string): string | undefined => {
  const value = email.trim();
  if (!value) return "Email is required";
  if (!EMAIL_PATTERN.test(value)) return "Enter a valid email address";
};

export const validatePassword = (password: string): string | undefined => {
  if (!password) return "Password is required";
};

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export const validateNewPassword = (password: string): string | undefined => {
  if (!password) return "Password is required";
  if (password.length < PASSWORD_MIN_LENGTH)
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  if (password.length > PASSWORD_MAX_LENGTH)
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;
};

export const validateConfirmPassword = (
  password: string,
  confirmPassword: string,
): string | undefined => {
  if (!confirmPassword) return "Confirm your password";
  if (password !== confirmPassword) return "Passwords don't match";
};
