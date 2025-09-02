import pako from 'pako';
import { textEncoder } from './cryptoUtils';


// Reverse
export function reverseString(text) {
	return text.split('').reverse().join('');
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

export function utf16Escape(s) {
    return [...s].map(c => {
        const code = c.codePointAt(0);
        if (code > 0xFFFF) { // surrogate pair
            const high = Math.floor((code - 0x10000) / 0x400) + 0xD800;
            const low = ((code - 0x10000) % 0x400) + 0xDC00;
            return `\\u${high.toString(16).padStart(4,'0')}\\u${low.toString(16).padStart(4,'0')}`;
        } else {
            return `\\u${code.toString(16).padStart(4,'0')}`;
        }
    }).join('');
}

export function utf16Unescape(s) {
    // JSON.parse works with \uXXXX escapes including surrogate pairs
    return JSON.parse('"' + s.replace(/\\/g, '\\\\') + '"');
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
export function xorShuffle(text, key) {
	return [...text]
		.map(c => String.fromCharCode(c.charCodeAt(0) ^ key))
		.join('');
}

export function xorBase64Encode(text, key) {
	const xorBytes = new Uint8Array(
		[...text].map(c => c.charCodeAt(0) ^ key)
	);
	return btoa(String.fromCharCode(...xorBytes));
}

export function xorBase64Decode(encoded, key) {
	try {
		const decoded = atob(encoded);
		return [...decoded]
		.map(c => String.fromCharCode(c.charCodeAt(0) ^ key))
		.join('');
	} catch {
		return 'Error: Invalid XOR encoded input.';
	}
}


export function base62Encode(num) {
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    while (num > 0) {
        result = alphabet[num % 62] + result;
        num = Math.floor(num / 62);
    }
    return result || '0'; // Handle case where num is 0
}

export function base62Decode(encodedString) {
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let decodedValue = 0;
    for (let i = 0; i < encodedString.length; i++) {
        decodedValue = decodedValue * 62 + alphabet.indexOf(encodedString[i]);
    }
    return decodedValue; // This example decodes to a number
}

// Base64
export function base64Encode(text) {
  	return btoa(text);
}

export function base64Decode(encoded) {
	try {
		return atob(encoded);
	} catch {
		return 'Error: Invalid base64 input.';
	}
}

export function base85Encode(str) {
    const bytes = new TextEncoder().encode(str); // UTF-8 bytes
    let output = '';
    
    for (let i = 0; i < bytes.length; i += 4) {
        // Pack up to 4 bytes into 32-bit integer
        let value = 0;
        const chunk = bytes.slice(i, i + 4);
        for (let j = 0; j < 4; j++) {
            value <<= 8;
            if (j < chunk.length) value |= chunk[j];
        }

        // Convert 32-bit integer → 5 Base85 chars
        const chars = [];
        for (let k = 0; k < 5; k++) {
            chars.unshift(String.fromCharCode((value % 85) + 33));
            value = Math.floor(value / 85);
        }
        output += chars.join('');
    }
    
    return output;
}

export function base85Decode(encoded) {
    const bytes = [];

    for (let i = 0; i < encoded.length; i += 5) {
        let value = 0;
        const chunk = encoded.slice(i, i + 5);
        for (let j = 0; j < 5; j++) {
            value = value * 85 + (chunk.charCodeAt(j) - 33);
        }

        // Unpack 32-bit integer → 4 bytes
        for (let k = 3; k >= 0; k--) {
            bytes.push((value >> (8 * k)) & 0xFF);
        }
    }

    return new TextDecoder().decode(new Uint8Array(bytes));
}

// base91.js - pure JS implementation
const BASE91_TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"';

export function base91Encode(input) {
    let b = 0, n = 0, out = '';
    for (let i = 0; i < input.length; i++) {
        b |= input.charCodeAt(i) << n;
        n += 8;
        if (n > 13) {
            let v = b & 8191;
            if (v > 88) {
				b >>= 13;
				n -= 13;
			} else {
				v = b & 16383; 
				b >>= 14;
				n -= 14;
			}
            out += BASE91_TABLE[v % 91] + BASE91_TABLE[Math.floor(v / 91)];
        }
    }
    if (n) out += BASE91_TABLE[b % 91] + BASE91_TABLE[Math.floor(b / 91)];
    return out;
}

export function base91Decode(input) {
    let b = 0, n = 0, v = -1, out = '';
    for (let i = 0; i < input.length; i++) {
        let c = BASE91_TABLE.indexOf(input[i]);
        if (v < 0) v = c;
        else {
            v += c * 91;
            b |= v << n;
            n += (v & 8191) > 88 ? 13 : 14;
            while (n >= 8) { out += String.fromCharCode(b & 255); b >>= 8; n -= 8; }
            v = -1;
        }
    }
    if (v >= 0) out += String.fromCharCode((b | (v << n)) & 255);
    return out;
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
 * Convert Uint32Array → Uint8Array
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
    
    return bytes;
}
