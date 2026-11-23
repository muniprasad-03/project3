export const MIN_PASSWORD_LENGTH = 4;

export function isValidPassword(password) {
  return typeof password === "string" && password.length >= MIN_PASSWORD_LENGTH;
}
