const ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const generateId = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(20)), (value) =>
    ID_ALPHABET.charAt(value % ID_ALPHABET.length)
  ).join("");
