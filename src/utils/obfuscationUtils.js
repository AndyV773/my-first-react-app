import pako from 'pako';
import { textEncoder } from './cryptoUtils';

// Reverse
export function reverseString(text) {
  return text.split('').reverse().join('');
}

// Unicode UTF-8
export function utf8Escape(s) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(s);
  return [...bytes].map(b => '\\x' + b.toString(16).padStart(2, '0')).join('');
}

export function utf8Unescape(escaped) {
  // Match all \xXX hex byte sequences
  const bytes = [];
  const regex = /\\x([0-9a-fA-F]{2})/g;
  let match;
  while ((match = regex.exec(escaped)) !== null) {
    bytes.push(parseInt(match[1], 16));
  }

  // Decode bytes back to string using TextDecoder
  const decoder = new TextDecoder();
  return decoder.decode(new Uint8Array(bytes));
}

// Unicode UTF-16
export function utf16Escape(s) {
  return [...s]
    .map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))
    .join('');
}

export function utf16Unescape(s) {
  return s.replace(/\\u([\dA-Fa-f]{4})/g, (_, g) =>
    String.fromCharCode(parseInt(g, 16))
  );
}

// Code points
export function stringCodePoints(s) {
  return [...s]
    .map(char => char.codePointAt(0))  
    .join(' ');                
}

export function decimalCodePoints(s) {
  return s
    .split(/\s+/)
    .map(numStr => {
      const codePoint = parseInt(numStr, 10);
      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return '�'; // replacement character for invalid code points
      }
    })
    .join('');
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
    return 'Error: Invalid XOR encoded input.';
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
    return 'Error: Invalid hex input.';
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
    return 'Error: Invalid base64 input.';
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
    return 'Error: Invalid compressed text.';
  }
}

// Convert string to Uint8Array (UTF-8 encoding)
export function toUint8Array(str) {
  const encoder = new TextEncoder(); // UTF-8 encoder
  return encoder.encode(str);
}

export function fromUint8Array(str) {
  const arr = new Uint8Array(str.split(',').map(n => Number(n.trim())));
  const decoder = new TextDecoder(); // UTF-8 decoder
  return decoder.decode(arr);
}

// Convert string to Uint16Array (UTF-16 code units)
export function toUint16Array(str) {
  const buffer = new ArrayBuffer(str.length * 2); // 2 bytes per char
  const view = new Uint16Array(buffer);
  for (let i = 0; i < str.length; i++) {
    view[i] = str.charCodeAt(i); // UTF-16 code unit for each char
  }
  return view;
}

export function fromUint16Array(str) {
  // Convert comma-separated string to Uint16Array
  const arr = new Uint16Array(str.split(',').map(n => Number(n.trim())));
  // Convert each code unit back to a character
  return String.fromCharCode(...arr);
}


/**
 * Convert string → Uint32Array
 */
export function toUint32Array(str) {
    const bytes = textEncoder(str); // string → Uint8Array
    const paddedLength = Math.ceil(bytes.length / 4) * 4;
    const padded = new Uint8Array(paddedLength);
    padded.set(bytes);

    const uint32Array = new Uint32Array(paddedLength / 4);
    for (let i = 0; i < uint32Array.length; i++) {
        uint32Array[i] =
            (padded[i * 4] << 24) |
            (padded[i * 4 + 1] << 16) |
            (padded[i * 4 + 2] << 8) |
            (padded[i * 4 + 3]);
    }

    return uint32Array;
}

/**
 * Convert Uint32Array (or array/CSV string input) → Uint8Array
 */
export function fromUint32Array(input) {
    // normalize input to Uint32Array
    let uint32Array;
    if (input instanceof Uint32Array) {
        uint32Array = input;
    } else if (Array.isArray(input)) {
        uint32Array = new Uint32Array(input);
    } else if (typeof input === "string") {
        const parts = input.split(",").map(n => parseInt(n.trim(), 10));
        if (parts.some(isNaN)) return "Error: Invalid Uint32 input."; 
        uint32Array = new Uint32Array(parts);
    } else {
        return "Error: Invalid Uint32 input.";
    }

    const bytes = new Uint8Array(uint32Array.length * 4);
    for (let i = 0; i < uint32Array.length; i++) {
        const val = uint32Array[i];
        const offset = i * 4;
        bytes[offset]     = (val >>> 24) & 0xFF;
        bytes[offset + 1] = (val >>> 16) & 0xFF;
        bytes[offset + 2] = (val >>> 8)  & 0xFF;
        bytes[offset + 3] = val & 0xFF;
    }

    // remove trailing padding zeros
    // let end = bytes.length;
    // while (end > 0 && bytes[end - 1] === 0) end--;

    // return bytes.subarray(0, end);
    
    return bytes;
}


