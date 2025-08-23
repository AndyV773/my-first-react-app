import CryptoJS from "crypto-js";
/* eslint-env worker */
/* eslint-disable no-restricted-globals */

self.addEventListener("message", async (e) => {
    const { type, load, hash1Iterations, hash2Iterations, depth, phase, sizeIterations } = e.data;

    if (type === "stretch") {
        const { keyInput } = load;

        let hash1, hash2;
        let current = keyInput;
        let key;

        try {

            for (let i = 0; i < hash1Iterations; i++) {
                const wordArray = CryptoJS.enc.Utf8.parse(current);
                current = CryptoJS.SHA512(wordArray).toString(CryptoJS.enc.Hex);
            }

            hash1 = current

            const str1 = await powerHex(hash1, depth, phase, sizeIterations);

            for (let i = 0; i < hash2Iterations; i++) {
                const wordArray = CryptoJS.enc.Utf8.parse(current);
                current = CryptoJS.SHA3(wordArray, { outputLength: 512 });
            }

            hash2 = current
       
            const str2  = await powerHex(hash2, depth, phase, sizeIterations);

            const shuffled = seededShuffle(str1, str2, keyInput);

            key = shuffled.join(',');

            self.postMessage({
                type: "stretch-done",
                result: { key },
                hash1: hash1,
                hash2: hash2.toString(CryptoJS.enc.Hex),
            });
        } catch (err) {
            self.postMessage({ type: "error", error: err?.message ?? String(err) });
        }
    } 
});

let n = 1;

function densifyNumber(num) {
    const numStr = num.toString();

    // Count trailing zeros
    const match = numStr.match(/0+$/);
    if (!match) return numStr; // no trailing zeros, return as-is

    n++
    if (n > 9) n = 1;
    // Generate replacement digits
    const replacement = (7 ** n).toString();

    // Replace trailing zeros with replacement digits
    return numStr.replace(/0+$/, replacement);
}


// Split a string into chunks of a given size
function chunkString(str, size) {
    const chunks = [];
    for (let i = 0; i < str.length; i += size) {
        chunks.push(str.slice(i, i + size));
    }
    return chunks;
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

function floatToFixedDigits(x, digits = 16) {
    return Math.floor(x * Math.pow(10, digits)).toString().padStart(digits, '0');
}


async function powerHex(hex, depth, phase, sizeIterations) {
    const length = hex.length / 2;
    let combined = '';
    let chunks;

    const rMin = 3.53;
    const rMax = 3.99;
    const rStep = 0.01;   // step size

    // number of steps in one full cycle
    const stepCount = Math.floor((rMax - rMin) / rStep) + 1;

    for (let i = 0; i < length; i++) {
        
        chunks = parseInt(hex.substr(i * 2, 2), 16) ** 4;

        console.log('chunk',chunks)

        let dense = densifyNumber(chunks);

        console.log('dense 1',dense)

        // pick step based on i (wrap with modulo)
        const stepIndex = i % stepCount;
        const r = rMin + stepIndex * rStep;

        // Split into 2-digit chunks
        const str = chunkString(dense, 2);

        console.log('str',str)
        for (const c of str) {
            let x = normalizeToFloat(parseInt(c, 10));
            console.log('x',x)
            let chaotic = chaoticLogisticMap(x, r, depth, phase);
            console.log('chaotic',chaotic)
            dense += floatToFixedDigits(chaotic);
        }

        console.log('dense 2',dense)
        console.log('--------------------')


        for (let j = 0; j < sizeIterations; j++) {
            // Split into 2-digit chunks
            const chunks = chunkString(dense, 2);

            // Raise each chunk to power of 3 and densify
            dense = chunks
                .map(c => densifyNumber((parseInt(c, 10) ** 3)))
                .join('');
        }

        combined += dense;
    }

    // Split combined string into 3-digit chunks
    const result = chunkString(combined, 3);

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

// Shuffle using deterministic PRNG
function seededShuffle(str1, str2, key) {
    // Combine strings
    let combined = str1 + ',' + str2;

    // Convert to array of numbers
    let arr = combined.split(',').map(Number);

    // Create seeded PRNG
    const seed = [...key].reduce((a, c) => a + c.charCodeAt(0), 0);
    const prng = mulberry32(seed);

    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
}

