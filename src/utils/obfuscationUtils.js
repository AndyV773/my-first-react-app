import pako from 'pako';
import { textDecoder, textEncoder } from './cryptoUtils';

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




export function toUint32Array(uint8) {
    // Convert input to Uint8Array if it's a string
    uint8 = typeof uint8 === "string" ? textEncoder(uint8) : uint8;

    // Compute padded length (multiple of 4)
    const paddedLength = Math.ceil(uint8.length / 4) * 4;

    // Create a new Uint8Array with padding (default 0)
    const combined = new Uint8Array(paddedLength);
    combined.set(uint8); // copy original data

    // Return as Uint32Array
    return new Uint32Array(combined.buffer);
}

export function fromUint32Array(uint32Array) {
    const bytes = [];

    for (let i = 0; i < uint32Array.length; i++) {
        const val = uint32Array[i];
        bytes.push((val >>> 24) & 0xFF);
        bytes.push((val >>> 16) & 0xFF);
        bytes.push((val >>> 8) & 0xFF);
        bytes.push(val & 0xFF);
    }

    // Remove trailing zeros from the last integer
    while (bytes[bytes.length - 1] === 0) {
        bytes.pop();
    }

    return textDecoder(new Uint8Array(bytes));
}





export function toUit32Array(uint8) {
    uint8 = textEncoder(uint8); // if input is string
    const fullWords = Math.floor(uint8.length / 4); // full 4-byte chunks
    const leftover = uint8.length % 4;

    // Create Uint32Array just big enough for full 4-byte words
    const uint32Array = new Uint32Array(fullWords + (leftover ? 1 : 0));

    // Pack 4 bytes into each 32-bit integer
    for (let i = 0; i < fullWords; i++) {
        uint32Array[i] =
            (uint8[i * 4] << 24) |
            (uint8[i * 4 + 1] << 16) |
            (uint8[i * 4 + 2] << 8) |
            uint8[i * 4 + 3];
    }

    // Handle leftover bytes (if any)
    if (leftover) {
        let last = 0;
        for (let i = 0; i < leftover; i++) {
            last |= uint8[fullWords * 4 + i] << ((3 - i) * 8);
        }
        uint32Array[fullWords] = last;
    }

    return uint32Array;
}


export function fromUint32Arr(uint32Array, originalLength = 5) {
    const uint8 = new Uint8Array(uint32Array.length * 4);

    for (let i = 0; i < uint32Array.length; i++) {
        const val = uint32Array[i];
        uint8[i * 4]     = (val >>> 24) & 0xFF;
        uint8[i * 4 + 1] = (val >>> 16) & 0xFF;
        uint8[i * 4 + 2] = (val >>> 8) & 0xFF;
        uint8[i * 4 + 3] = val & 0xFF;
    }

    // Trim extra padding bytes if original length is provided
    return originalLength !== undefined ? uint8.subarray(0, originalLength) : uint8;
}



