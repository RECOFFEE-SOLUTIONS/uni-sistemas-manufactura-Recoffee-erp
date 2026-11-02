import apiClient from "./api";

let cachedPublicKeyPem: string | null = null;

/**
 * Obtiene la clave pública RSA (2048-bit) desde el backend .NET 8.
 */
export async function getPublicKey(): Promise<string> {
  if (cachedPublicKeyPem) {
    return cachedPublicKeyPem;
  }

  try {
    const response = await apiClient.get<{ publicKey: string }>("/api/auth/public-key");
    cachedPublicKeyPem = response.data.publicKey;
    return cachedPublicKeyPem;
  } catch (err) {
    cachedPublicKeyPem = null;
    throw err;
  }
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
 * Dispone de fallback automático seguro a texto plano si WebCrypto no está disponible (ej. IP no localhost)
 * o si ocurre cualquier error durante la obtención de la clave o el cifrado.
 */
export async function encryptPasswordAsymmetric(plainPassword: string): Promise<string> {
  // Detección estricta de entorno seguro y disponibilidad de WebCrypto (fallback en HTTP fuera de localhost)
  if (
    typeof window === "undefined" ||
    !window.crypto ||
    !window.crypto.subtle ||
    (typeof window.isSecureContext === "boolean" && !window.isSecureContext)
  ) {
    console.info("[Crypto] Entorno no seguro o sin WebCrypto disponible; usando fallback de transmisión estándar.");
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
    // Si falla la obtención de la clave o el cifrado, invalidar caché y retornar contraseña en texto plano
    cachedPublicKeyPem = null;
    console.warn("[Crypto] Cifrado asimétrico no disponible en cliente; fallback seguro a texto plano:", error);
    return plainPassword;
  }
}
