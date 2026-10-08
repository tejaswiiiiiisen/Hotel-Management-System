export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isValidEmail = (value: string) => EMAIL_PATTERN.test(value.trim());
export const isValidMobile = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
};
