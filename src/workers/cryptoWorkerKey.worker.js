import CryptoJS from "crypto-js";
/* eslint-env worker */
/* eslint-disable no-restricted-globals */

self.addEventListener("message", async (e) => {
    const { type, load, reverse, hash1Iterations, hash2Iterations, depth, phase, sizeIterations, chunkSize } = e.data;

    if (type === "stretch") {
        const { keyInput } = load;

        let hash1, hash2;
        let current = keyInput;
        let arr = [];

        try {

            for (let i = 0; i < hash1Iterations; i++) {
                const wordArray = CryptoJS.enc.Utf8.parse(current);
                current = CryptoJS.SHA512(wordArray).toString(CryptoJS.enc.Hex);
            }

            hash1 = current

            const arr1 = powerHex(hash1, depth, phase, sizeIterations, chunkSize);

            for (let i = 0; i < hash2Iterations; i++) {
                current = CryptoJS.SHA3(current, { outputLength: 512 }).toString(CryptoJS.enc.Hex);
            }

            hash2 = current
       
            const arr2  = powerHex(hash2, depth, phase, sizeIterations, chunkSize);

            arr = reverse ? [...arr2, ...arr1] : [...arr1, ...arr2];

            const key = seededShuffle(arr, keyInput);

            self.postMessage({
                type: "stretch-done",
                result: { key },
                hash1: hash1,
                hash2: hash2,
            });
        } catch (err) {
            self.postMessage({ type: "error", error: err?.message ?? String(err) });
        }
    } 
});

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

let n;
let k;
let m;
let p = 1;
let j = 2;

function densifyNumberx(num) {
    p++
    m = m * p

    if (m.toString().length > 10) {
        m = parseInt(m.toString().slice(0, 3), 10); // first 3 digits
    }

    if (num === 0) return n * m;

    // If no trailing zero, just return digits
    if (num % 10 !== 0) return num;

    // strip trailing zeros
    while (num % 10 === 0) {
        num = Math.floor(num / 10);
    }

    // Generate replacement sequence
    n++;
    j++
    if (n > 14) n = 2;
    if (j > 9) j = 2;
    const replacement = j ** n;

    return num + replacement;
}

function densifyNumber(num) {

    p++;
    k = (k << 1) ^ p; // shift

    if (num === 0) return n ^ k;

    if (num % 10 !== 0) return num;

    while (num % 10 === 0) {
        num = num >>> 1; // right shift
    }

    n++;
    j++;
    
    const replacement = (j << n) ^ (n << j); // shift-based pseudo-mix

    return (num ^ replacement) >>> 0; // XOR in replacement
}


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

function chaoticLogisticMap(x, r, depth, phase) {
    for (let i = 0; i < depth; i++) {
        x = logisticMap(x, r, phase + i * 37);
    }
    return x;
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
    let combined = []; // keep as array of digits

    const rMin = 3.77;
    const rMax = 3.99;
    const rStep = 0.01;
    const stepCount = Math.floor((rMax - rMin) / rStep) + 1;

    let dense;

    for (let i = 0; i < length; i++) {
        let num = parseInt(hex.substr(i * 2, 2), 16) ** 4;

        console.log('num',num)

        n = (num % 1000); // get last 3 digits
        m = (num % 1000); // get last 3 digits
        k = Math.floor(num / 1000) % 1000; // get next 3 digits

        dense = densifyNumber(num);
        console.log('dence',dense)

        const digits = digitsFromNumber(dense);

        console.log('digits',digits)

        const stepIndex = i % stepCount;
        const r = rMin + stepIndex * rStep;

        // Split into 2-digit chunks
        const chunks = chunkArray(digits, 3);

        console.log('chunks',chunks)

        let block1 = [];

        for (const c of chunks) {
            const num = numberFromDigits(c);
            console.log('val',num)

            let x = normalizeToFloat(num);
            console.log('x',x)

            let chaotic = chaoticLogisticMap(x, r, depth, phase);
            console.log('chaotic',chaotic)

            block1.push(...floatToFixedDigits(chaotic));
            console.log('block1',block1)
        }

        let block2 = [];

        // loop for increasing the length using power to 3
        for (let j = 0; j < sizeIterations; j++) {
            const chunks = chunkArray(block1, 2)
                .map(c => numberFromDigits(c) ** 3);

            console.log('chunks2',chunks)

            for (const c of chunks) {
                console.log('c',c)

                block2.push(...digitsFromNumber(densifyNumber(c)));
                console.log('block2',block2)
            }
        }

        combined.push(...block2);

        combined = seededShuffle(combined, hex);

        console.log('combined',combined)
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

    const seed = [...key].reduce((a, c) => a + c.charCodeAt(0), 0);
    const prng = mulberry32(seed);

    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
}