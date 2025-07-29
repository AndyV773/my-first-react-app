import CryptoJS from "crypto-js";

// Salt utilities
function generateSaltBytes(length = 16) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
}

function bytesToHex(array) {
    return Array.from(array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

console.log(generateSaltBytes())
console.log(bytesToHex(generateSaltBytes()))

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

// Key shuffle function
export function keyShuffle(fileInput, key) {
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

export function keyUnshuffle(fileInput, key) {
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
