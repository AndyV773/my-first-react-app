import pako from 'pako';

// Reverse
export function reverseString(text) {
  return text.split('').reverse().join('');
}

// Unicode
export function unicodeEscape(s) {
  return [...s]
    .map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))
    .join('');
}

export function unicodeUnescape(s) {
  return s.replace(/\\u([\dA-Fa-f]{4})/g, (_, g) =>
    String.fromCharCode(parseInt(g, 16))
  );
}

// ROT
export function rot13(text) {
  return text.replace(/[a-zA-Z]/g, c =>
    String.fromCharCode(
      (c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26
    )
  );
}

export function rot18(text) {
  return text
    .split('')
    .map(c => {
      if (/[a-z]/.test(c))
        return String.fromCharCode((c.charCodeAt(0) - 97 + 18) % 26 + 97);
      if (/[A-Z]/.test(c))
        return String.fromCharCode((c.charCodeAt(0) - 65 + 18) % 26 + 65);
      return c;
    })
    .join('');
}

export function rotN(text, n = 10) {
  return text
    .split('')
    .map(c => {
      if (/[a-z]/.test(c))
        return String.fromCharCode((c.charCodeAt(0) - 97 + n) % 26 + 97);
      if (/[A-Z]/.test(c))
        return String.fromCharCode((c.charCodeAt(0) - 65 + n) % 26 + 65);
      return c;
    })
    .join('');
}

// XOR
export function xorShuffle(text, key = 42) {
  return [...text]
    .map(c => String.fromCharCode(c.charCodeAt(0) ^ key))
    .join('');
}

export function xorBase64Encode(text, key = 42) {
  const xorBytes = new Uint8Array(
    [...text].map(c => c.charCodeAt(0) ^ key)
  );
  return btoa(String.fromCharCode(...xorBytes));
}

export function xorBase64Decode(encoded, key = 42) {
  try {
    const decoded = atob(encoded);
    return [...decoded]
      .map(c => String.fromCharCode(c.charCodeAt(0) ^ key))
      .join('');
  } catch {
    return 'Invalid XOR encoded input.';
  }
}

// Hex
export function hexEncode(text) {
  return [...text]
    .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
}

export function hexDecode(hex) {
  try {
    return hex
      .match(/.{1,2}/g)
      .map(b => String.fromCharCode(parseInt(b, 16)))
      .join('');
  } catch {
    return 'Invalid hex input.';
  }
}

// Base64
export function base64Encode(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

export function base64Decode(encoded) {
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch {
    return 'Invalid base64 input.';
  }
}

// Compression
export function compressText(text) {
  const compressed = pako.deflate(text);
  return btoa(String.fromCharCode(...compressed));
}

export function decompressText(text) {
  try {
    const binary = atob(text).split('').map(c => c.charCodeAt(0));
    return pako.inflate(new Uint8Array(binary), { to: 'string' });
  } catch {
    return 'Invalid compressed text.';
  }
}
