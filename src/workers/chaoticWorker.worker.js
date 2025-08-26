import CryptoJS from "crypto-js";
/* eslint-env worker */
/* eslint-disable no-restricted-globals */


self.addEventListener("message", async (e) => {
    const { type, load, hash1Iterations, hash2Iterations, depth, phase, sizeIterations, useXor, reverse, chunkSize } = e.data;

    if (type === "encode") {
        const { dataInput, keyInput } = load;

        try {
            const { key, hash1, hash2 } = await deriveKey(keyInput, hash1Iterations, hash2Iterations, depth, phase, sizeIterations, chunkSize, reverse);
            const salt = generateSaltBytes();
            const newInput = new Uint8Array(dataInput.length + salt.length);
            newInput.set(salt, 0);                 
            newInput.set(dataInput, salt.length); 
 
            const expandedData = expandUint8(newInput);
            const xor = xorUint8(expandedData, hash1)
            const shuffled = seededShuffleRev(xor, hash2);
            const dataOutput = useXor ? xorUint8(shuffled, key) : rotateBytes(shuffled, key);

            self.postMessage({
                type: "done-encode",
                result: { dataOutput, key },
            });
        } catch (err) {
            self.postMessage({ type: "error", error: err?.message ?? String(err) });
        }
    } else if (type === "decode") {
        const { dataInput, keyInput } = load;

        try {
            
            const { key, hash1, hash2 } = await deriveKey(keyInput, hash1Iterations, hash2Iterations, depth, phase, sizeIterations, chunkSize, reverse);
            const output = useXor ? xorUint8(dataInput, key) : unrotateBytes(dataInput, key);
            const unshuffle = seededShuffleRev(output, hash2, true)

            const xor = xorUint8(unshuffle, hash1)
            const reduced = reduceUint8(xor);
            const dataOutput = reduced.slice(16);
            
            self.postMessage({
                type: "done-decode",
                result: { dataOutput },
            });
        } catch (err) {
            self.postMessage({ type: "error", error: err?.message ?? String(err) });
        }
    }
});


async function deriveKey(keyInput, hash1Iterations, hash2Iterations, depth, phase, sizeIterations, chunkSize, reverse) {
    let current = keyInput;
    
    // SHA-512 loop
    for (let i = 0; i < hash1Iterations; i++) {
        const wordArray = CryptoJS.enc.Utf8.parse(current);
        current = CryptoJS.SHA512(wordArray).toString(CryptoJS.enc.Hex);
    }
    const hash1 = current;
    const arr1 = powerHex(hash1, depth, phase, sizeIterations, chunkSize);

    // SHA3 loop
    for (let i = 0; i < hash2Iterations; i++) {
        current = CryptoJS.SHA3(current, { outputLength: 512 }).toString(CryptoJS.enc.Hex);
    }
    const hash2 = current;
    const arr2 = powerHex(hash2, depth, phase, sizeIterations, chunkSize);

    const combined = reverse ? [...arr2, ...arr1] : [...arr1, ...arr2];

    const key = seededShuffle(combined, keyInput);

    return { key, hash1, hash2 };
}

function generateSaltBytes(length = 16) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
}

// Convert number -> array of digits
function digitsFromNumber(num) {
    if (num === 0) return [0];
    const digits = [];
    while (num > 0) {
        digits.unshift(num % 10);
        num = Math.floor(num / 10);
    }
    return digits;
}

// Convert array of digits -> number
function numberFromDigits(digits) {
    return digits.reduce((acc, d) => acc * 10 + d, 0);
}

// Split digit array into chunks of given size
function chunkArray(digits, size) {
    const chunks = [];
    for (let i = 0; i < digits.length; i += size) {
        chunks.push(digits.slice(i, i + size));
    }
    return chunks;
}

// number to float 0.002XXXXX
function normalizeToFloat(num, max = 1e6) {
    return (num % max) / max;
}

// logistic map
function logisticMap(x, r, p) {
    for (let i = 0; i < p; i++) {
        x = r * x * (1 - x);
    }
    return x;
}

// logistics map loop
function chaoticLogisticMap(x, r, depth, phase) {
    for (let i = 0; i < depth; i++) {
        x = logisticMap(x, r, phase + i * 37);
    }
    return x;
}

let n;
let k;
let p = 1;
let j = 2;

function densifyNumber(num) {
    p++;
    k = (k << 1) ^ p; // shift

    if (num === 0) return n ^ k;
    if (num % 10 !== 0) return num;
    while (num % 10 === 0) {
        num = num >>> 1; // right shift instead of /10
    }

    n++;
    j++;
    const replacement = (j << n) ^ (n << j); // shift-based pseudo-mix

    return (num ^ replacement) >>> 0; // XOR in replacement
}


// Float → fixed digits (returns digit array)
function floatToFixedDigits(x, digits = 16) {
    const scaled = Math.floor(x * 10 ** digits);
    const result = new Array(digits).fill(0);
    let n = scaled;
    for (let i = digits - 1; i >= 0; i--) {
        result[i] = n % 10;
        n = Math.floor(n / 10);
    }
    return result;
}


function powerHex(hex, depth, phase, sizeIterations, chunkSize) {
    const length = hex.length / 2;
    let combined = []; 

    // set values for logistics map
    const rMin = 3.77;
    const rMax = 3.99;
    const rStep = 0.01;
    const stepCount = Math.floor((rMax - rMin) / rStep) + 1;

    let dense;

    for (let i = 0; i < length; i++) {
        let num = parseInt(hex.substr(i * 2, 2), 16) ** 4;

        n = (num % 1000); // get last 3 digits
        k = Math.floor(num / 1000) % 1000; // get next 3 digits

        dense = densifyNumber(num);
        const digits = digitsFromNumber(dense);

        const stepIndex = i % stepCount;
        const r = rMin + stepIndex * rStep;

        // Split into 2-digit chunks
        const chunks = chunkArray(digits, 3);

        let block1 = [];

        for (const c of chunks) {
            const num = numberFromDigits(c);
            let x = normalizeToFloat(num);
            let chaotic = chaoticLogisticMap(x, r, depth, phase);
            block1.push(...floatToFixedDigits(chaotic));
        }

        let block2 = [];

        // loop for increasing the length using power to 3
        for (let j = 0; j < sizeIterations; j++) {
            const chunks = chunkArray(block1, 2)
                .map(c => numberFromDigits(c) ** 3);
            for (const c of chunks) {
                block2.push(...digitsFromNumber(densifyNumber(c)));
            }
        }

        combined.push(...block2);
        combined = seededShuffle(combined, hex);
    }

    // Split into chunks
    const result = chunkArray(combined, chunkSize).map(numberFromDigits);
    return result;
}


// Mulberry32 PRNG
function mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}


function seededShuffle(arr, key) {
    const prng = mulberry32([...key].reduce((a, c) => a + c.charCodeAt(0), 0));

    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
}

// Shuffle/unshuffle using deterministic PRNG
function seededShuffleRev(arr, key, reverse = false) {
    const prng = mulberry32([...key].reduce((a, c) => a + c.charCodeAt(0), 0));

    const indices = Array.from(arr.keys());
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const result = new Uint8Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
        if (!reverse) result[i] = arr[indices[i]];
        else result[indices[i]] = arr[i];
    }
    return result;
}

// Add random padding and length markers
function expandUint8(uint8) {
	const frontLen = Math.floor(Math.random() * 9999);
	const backLen = Math.floor(Math.random() * 9999);

	// generate random paddings
	const frontPad = new Uint8Array(frontLen);
	const backPad = new Uint8Array(backLen);
	crypto.getRandomValues(frontPad);  // cryptographically strong
	crypto.getRandomValues(backPad);

	const combined = new Uint8Array(frontLen + uint8.length + backLen + 4);
	combined.set(frontPad, 0);
	combined.set(uint8, frontLen);
	combined.set(backPad, frontLen + uint8.length);

	// store lengths as 16-bit values
    combined[combined.length - 4] = (frontLen >> 8) & 0xff;
    combined[combined.length - 3] = frontLen & 0xff;
    combined[combined.length - 2] = (backLen >> 8) & 0xff;
    combined[combined.length - 1] = backLen & 0xff;

	return combined;
}

// Reverse the process and extract the original data
function reduceUint8(uint8) {
	if (uint8.length < 2) throw new Error("Invalid data");

	const frontLen = (uint8[uint8.length - 4] << 8) | uint8[uint8.length - 3];
    const backLen = (uint8[uint8.length - 2] << 8) | uint8[uint8.length - 1];

	// slice out the original data
	const original = uint8.slice(frontLen, uint8.length - backLen - 4);

	return original;
}

function xorUint8(bytes, key) {
    const result = new Uint8Array(bytes.length);

    for (let i = 0; i < bytes.length; i++) {
      // XOR again to decrypt
      result[i] = bytes[i] ^ key[i % key.length];
    }

    return result; 
}

function rotateBytes(bytes, keyArray) {
    const result = new Uint8Array(bytes.length);

    for (let i = 0; i < bytes.length; i++) {
        result[i] = (bytes[i] + keyArray[i % keyArray.length]) & 0xff;
    }

    return result;
};

function unrotateBytes(bytes, keyArray) {
    const result = new Uint8Array(bytes.length);

    for (let i = 0; i < bytes.length; i++) {
        result[i] = (bytes[i] - keyArray[i % keyArray.length] + 256) & 0xff;
    }

    return result;
};

