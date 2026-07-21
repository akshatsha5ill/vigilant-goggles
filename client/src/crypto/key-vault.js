/**
 * Client-side Key Vault using Web Crypto API.
 * Encrypts user API keys using AES-GCM with a key derived via PBKDF2 from a user-provided password.
 */

const getDerivedKey = async (password, salt) => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

export const encryptKey = async (apiKey, password) => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getDerivedKey(password, salt);

  const enc = new TextEncoder();
  const encryptedContent = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(apiKey)
  );

  // Return base64 encoded strings for easy storage in Zustand/IndexedDB
  const encryptedBytes = new Uint8Array(encryptedContent);
  return {
    ciphertext: btoa(String.fromCharCode(...encryptedBytes)),
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv))
  };
};

export const decryptKey = async (encryptedObj, password) => {
  try {
    const salt = new Uint8Array(atob(encryptedObj.salt).split('').map(c => c.charCodeAt(0)));
    const iv = new Uint8Array(atob(encryptedObj.iv).split('').map(c => c.charCodeAt(0)));
    const ciphertext = new Uint8Array(atob(encryptedObj.ciphertext).split('').map(c => c.charCodeAt(0)));

    const key = await getDerivedKey(password, salt);

    const decryptedContent = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedContent);
  } catch (error) {
    console.error("Failed to decrypt key. Incorrect password or corrupted data.", error);
    return null;
  }
};
