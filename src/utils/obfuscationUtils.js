import pako from 'pako';

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


// Convert string to Uint32Array (Unicode code points)
export function toUint32Array(str) {
  const codePoints = Array.from(str, (c) => c.codePointAt(0));
  return new Uint32Array(codePoints);
}

// Convert comma-separated string of code points back to a string
export function fromUint32Array(str) {
  const arr = new Uint32Array(str.split(',').map(n => Number(n.trim())));
  return String.fromCodePoint(...arr);
}
