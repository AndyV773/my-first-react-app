import CryptoJS from "crypto-js";
/* eslint-env worker */
/* eslint-disable no-restricted-globals */

self.addEventListener("message", async (e) => {
    const { type, load, hash1Iterations, hash2Iterations, iterations } = e.data;

    if (type === "stretch") {
        const { keyInput } = load;

        let hash1, hash2;
        let current = keyInput;
        let keyLength = keyInput.length;
        let key;

        try {

            for (let i = 0; i < hash1Iterations; i++) {
                const wordArray = CryptoJS.enc.Utf8.parse(current);
                current = CryptoJS.SHA512(wordArray).toString(CryptoJS.enc.Hex);
            }

            hash1 = current

            const arr1 = await hexToBytesPow(hash1, keyLength, iterations);

            for (let i = 0; i < hash2Iterations; i++) {
                const wordArray = CryptoJS.enc.Utf8.parse(current);
                current = CryptoJS.SHA3(wordArray, { outputLength: 512 });
            }

            hash2 = current
       
            const arr2  = await hexToBytesPow(hash2, keyLength, iterations);

            key = arr1 + "," + arr2;

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


function densifyNumber(num, keyLength) {
    const numStr = num.toString();

    // Count trailing zeros
    const match = numStr.match(/0+$/);
    if (!match) return numStr; // no trailing zeros, return as-is

    // Generate replacement digits
    const replacement = (3 ** keyLength).toString();

    // Replace trailing zeros with replacement digits
    return numStr.replace(/0+$/, replacement);
}

/**
 * Split a string into chunks of a given size
 */
function chunkString(str, size) {
    const chunks = [];
    for (let i = 0; i < str.length; i += size) {
        chunks.push(str.slice(i, i + size));
    }
    return chunks;
}

async function hexToBytesPow(hex, keyLength, iterations) {
    const length = hex.length / 2;
    let combined = '';

    for (let i = 0; i < length; i++) {
        let chunk = parseInt(hex.substr(i * 2, 2), 16) ** 4;
        let dense = densifyNumber(chunk, keyLength);

        for (let j = 0; j < iterations; j++) {
            // Split into 2-digit chunks
            const chunks = chunkString(dense.toString(), 2);

            // Raise each chunk to power of 3 and densify
            dense = chunks
                .map(c => densifyNumber((parseInt(c, 10) ** 3), keyLength))
                .join('');
        }

        combined += dense;
    }

    // Split combined string into 3-digit chunks
    const result = chunkString(combined, 3);

    return result;
}
