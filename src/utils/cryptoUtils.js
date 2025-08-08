import CryptoJS from "crypto-js";
import pako from "pako";


export const sha256 = async (data) => {
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// Salt utilities
export function generateSaltBytes(length = 16) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return array;
}

export function bytesToHex(array) {
    return Array.from(array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Convert a hexadecimal string (e.g., from SHA-256) into a byte array
function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        // Parse each pair of hex digits into a byte
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}

// PRNG based on seed string
function mulberry32(seed) {
    return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Shuffle/unshuffle using deterministic PRNG
function seededShuffle(array, key, reverse = false) {
    const prng = mulberry32(
        [...key].reduce((a, c) => a + c.charCodeAt(0), 0)
    );
    const indices = Array.from(array.keys());
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const result = new Uint8Array(array.length);
    for (let i = 0; i < array.length; i++) {
        if (!reverse) result[i] = array[indices[i]];
        else result[indices[i]] = array[i];
    }
    return result;
}

/**
 * Performs a deterministic shuffle of input data using a key-derived seed.
 * A Mulberry32 PRNG is seeded with the key + salt combination to generate a reproducible permutation.
 * 
 * Note: This is not cryptographic encryption but reversible obfuscation.
 * 
 * @param {Uint8Array} array - The byte array to shuffle.
 * @param {string} key - The key used to seed the PRNG.
 * @param {boolean} reverse - If true, unshuffles the data.
 * @returns {Uint8Array} The shuffled (or unshuffled) result.
 */
export function mulberryShuffle(fileInput, key) {
    if (!fileInput) {
        return { error: "Upload a file." };
    }
    if (!key || key.trim() === "") {
        return { error: "Enter a key." };
    }

    const saltBytes = generateSaltBytes();
    const salt = bytesToHex(saltBytes);
    const newKey = key + salt;

    const shuffled = seededShuffle(fileInput, newKey);

    // Append salt bytes to end of shuffled data
    const combined = new Uint8Array(shuffled.length + saltBytes.length);
    combined.set(shuffled);
    combined.set(saltBytes, shuffled.length);

    return { result: combined };
}

export function mulberryUnshuffle(fileInput, key) {
  if (!fileInput) {
    return { error: "Upload a file." };
  }
  if (!key || key.trim() === "") {
    return { error: "Enter a key." };
  }

  const SALT_LENGTH = 16;
  if (fileInput.length <= SALT_LENGTH) {
    return { error: "Invalid file: too short." };
  }

  const dataLength = fileInput.length - SALT_LENGTH;
  const output = fileInput.slice(0, dataLength);
  const saltBytes = fileInput.slice(dataLength);
  const saltHex = bytesToHex(saltBytes);
  const newKey = key + saltHex;

  const unshuffled = seededShuffle(output, newKey, true);

  return { result: unshuffled };
}


/**
 * Encrypts a Uint8Array using AES-CBC with a password-derived key.
 *
 * @param {Uint8Array} inputBytes - The input data to encrypt.
 * @param {string} password - The password for encryption.
 * @returns {{ error?: string, result?: Uint8Array }} Result object.
 */
export function aesCbcEncrypt(inputBytes, password) {
  if (!inputBytes) return { error: "No file data provided." };
  if (!password) return { error: "Password is required for encryption." };

  try {
    const wordArray = CryptoJS.lib.WordArray.create(inputBytes);
    const salt = CryptoJS.lib.WordArray.random(16);
    const iv = CryptoJS.lib.WordArray.random(16);

    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 1000,
    });

    const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // Combine salt + IV + ciphertext
    const combined = CryptoJS.lib.WordArray.create(
      salt.words.concat(iv.words).concat(encrypted.ciphertext.words),
      salt.sigBytes + iv.sigBytes + encrypted.ciphertext.sigBytes
    );

    // Convert to Uint8Array
    const resultBytes = new Uint8Array(combined.sigBytes);
    for (let i = 0; i < combined.sigBytes; i++) {
      resultBytes[i] = (combined.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }

    return { result: resultBytes };
  } catch (err) {
    return { error: "Encryption failed: " + err.message };
  }
}

/**
 * Decrypts a Uint8Array encrypted using AES-CBC with a password-derived key.
 *
 * @param {Uint8Array} encryptedBytes - The encrypted input data.
 * @param {string} password - The password used for decryption.
 * @returns {{ error?: string, result?: Uint8Array }} Result object.
 */
export function aesCbcDecrypt(encryptedBytes, password) {
  if (!password) return { error: "Password is required for decryption." };
  if (!encryptedBytes || encryptedBytes.length < 32) {
    return { error: "Invalid or incomplete encrypted data." };
  }

  try {
    // Extract salt (16 bytes) and IV (16 bytes)
    const salt = CryptoJS.lib.WordArray.create(encryptedBytes.slice(0, 16));
    const iv = CryptoJS.lib.WordArray.create(encryptedBytes.slice(16, 32));
    const ciphertextBytes = encryptedBytes.slice(32);
    const ciphertextWords = CryptoJS.lib.WordArray.create(ciphertextBytes);

    // Derive key using PBKDF2
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 1000,
    });

    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: ciphertextWords },
      key,
      { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );

    // Convert decrypted WordArray to Uint8Array
    const resultBytes = new Uint8Array(decrypted.sigBytes);
    for (let i = 0; i < decrypted.sigBytes; i++) {
      resultBytes[i] = (decrypted.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }

    return { result: resultBytes };
  } catch (err) {
    return { error: "Decryption failed: " + err.message };
  }
}

export function randomizer(allChar) {
  const rand = Math.random() * Math.random(); // bias toward lower numbers
  return allChar
    ? Math.floor(rand * (0x10ffff + 1))
    : Math.floor(rand * 800) + 1;
}

export function uint8ToBase64(uint8) {
  let binary = "";
  const chunkSize = 0x8000; // Avoid call stack overflow
  for (let i = 0; i < uint8.length; i += chunkSize) {
    binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function base64ToUint8(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}


// text encoder helper
export function textEncoder(input) {
  return new TextEncoder().encode(input);
}

// text decoder helper
export function textDecoder(input) {
  return new TextDecoder().decode(input);
}

// pako compression helper
export function compress(input) {
  return pako.deflate(input);
}

// pako decompression help
export function decompress(input) {
  return pako.inflate(input);
}

// AES-GCM encrypt data with password, returns base64 string
export async function aesGcmEncrypt(data, password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const dataBuffer = typeof data === "string" ? enc.encode(data) : data;
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, dataBuffer);

  // Combine salt + iv + encrypted
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return combined;
}


// AES gcm Decryption
export async function aesGcmDecrypt(input, password) {
    const data = input;
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const ciphertext = data.slice(28);
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new Uint8Array(decrypted); // raw bytes
}


export const hashArgon2 = async (input, iterations = 3, hashToVerify = null, verify = false) => {

  const password = typeof input === "string" ? input : new TextDecoder().decode(input);
  
  if (verify && hashToVerify) {
    try {
        const result = await window.argon2.verify({
          pass: password,
          encoded: hashToVerify,
          type: window.argon2.ArgonType.Argon2id,
      });
      return result;
    } catch (err) {
      console.error("Argon2 verification error:", err);
      return false;
    }
  }

  const salt = generateSaltBytes(); 
  
  const result = await window.argon2.hash({
    pass: password,
    salt: salt,
    time: iterations,
    mem: 1024, // memory in KiB
    hashLen: 32,
    type: window.argon2.ArgonType.Argon2id,
  });

  return result.encoded;
};


// Encrypt text using XOR and a hash-based key (hex string)
// Result is a base64-encoded string safe for storage/display
export function xorEncoder(input, hashHex) {
    const textBytes = input;
    const keyBytes = hexToBytes(hashHex);

    const result = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
      // XOR each byte of text with corresponding byte from the hash (cycled)
      result[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    return result;
}

// Decrypt a base64-encoded string using the same hash-based key
export function xorDecoder(inputBytes, hashHex) {
    const keyBytes = hexToBytes(hashHex);
   
    const result = new Uint8Array(inputBytes.length);
    for (let i = 0; i < inputBytes.length; i++) {
      // XOR again to decrypt
      result[i] = inputBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    return result; 
}


export const rotateBytes = (bytes, keyArray) => {

    const result = new Uint8Array(bytes.length);
  
    for (let i = 0; i < bytes.length; i++) {
        result[i] = (bytes[i] + keyArray[i % keyArray.length]) & 0xff;
    }

    return result;
};

export const unrotateBytes = (bytes, keyArray) => {

    const result = new Uint8Array(bytes.length);

    for (let i = 0; i < bytes.length; i++) {
        result[i] = (bytes[i] - keyArray[i % keyArray.length] + 256) & 0xff;
    }

    return result;
};