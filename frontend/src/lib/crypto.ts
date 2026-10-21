import apiClient from "./api";

let cachedPublicKeyPem: string | null = null;

/**
 * Obtiene la clave pública RSA (2048-bit) desde el backend .NET 8.
 */
export async function getPublicKey(): Promise<string> {
  if (cachedPublicKeyPem) {
    return cachedPublicKeyPem;
  }

  const response = await apiClient.get<{ publicKey: string }>("/api/auth/public-key");
  cachedPublicKeyPem = response.data.publicKey;
  return cachedPublicKeyPem;
}

/**
 * Convierte una clave PEM (SPKI) a ArrayBuffer para WebCrypto.
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [A-Z0-9 ]+-----/g, "")
    .replace(/-----END [A-Z0-9 ]+-----/g, "")
    .replace(/\s+/g, "");
  const binaryString = typeof window !== "undefined" ? window.atob(b64) : Buffer.from(b64, "base64").toString("binary");
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encripta asimétricamente un texto plano (contraseña) utilizando RSA-OAEP con SHA-256 vía WebCrypto API.
 */
export async function encryptPasswordAsymmetric(plainPassword: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    // Si no está en entorno de navegador con WebCrypto, retorna el valor plano
    return plainPassword;
  }

  try {
    const pem = await getPublicKey();
    const spkiBuffer = pemToArrayBuffer(pem);

    const publicKey = await window.crypto.subtle.importKey(
      "spki",
      spkiBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["encrypt"]
    );

    const encodedData = new TextEncoder().encode(plainPassword);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      encodedData
    );

    const encryptedBytes = new Uint8Array(encryptedBuffer);
    let binary = "";
    for (let i = 0; i < encryptedBytes.byteLength; i++) {
      binary += String.fromCharCode(encryptedBytes[i]);
    }
    return window.btoa(binary);
  } catch (error) {
    console.warn("No se pudo cifrar asimétricamente la contraseña, enviando formato estándar:", error);
    return plainPassword;
  }
}
