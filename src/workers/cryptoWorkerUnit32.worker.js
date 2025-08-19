import { randomizerUint32, expandUint8, uint8ToUint32, uint32ToUint8, reduceUint8 } from '../utils/cryptoUtils';
import { detectFileExtension } from '../utils/fileUtils';
/* eslint-env worker */
/* eslint-disable no-restricted-globals */

self.addEventListener("message", async (e) => {
  const { type, load } = e.data;

  if (type === "shuffle") {
    const { uint8, allChar } = load;
    
    if (!uint8) {
      return self.postMessage({ type: "error", error: "No input provided." });
    }

    try {
        const expanded = expandUint8(uint8);
        const uint32View = uint8ToUint32(expanded);
        const { shuffled, key } = quantShuffle32(uint32View, allChar);
      
        self.postMessage({
            type: "done-shuffle",
            result: { shuffled, key },
        });
    } catch (err) {
        self.postMessage({ type: "error", error: err?.message ?? String(err) });
    }

  } else if (type === "unshuffle") {
    let { shuffled, key } = load;

    try {
        const unshuffled = quantUnshuffle32(shuffled, key);
        const uint8 = uint32ToUint8(unshuffled);
        const origin = reduceUint8(uint8);

        const ext = await detectFileExtension(origin);

        self.postMessage({
            type: "done-unshuffle",
            result: { origin, ext},
        });
    } catch (err) {
        self.postMessage({ type: "error", error: err?.message ?? String(err) });
    }
  }
});



// Quantum shuffle function (Uint32Array)
export function quantShuffle32(input, allChar = false) {
    const shuffled = new Uint32Array(input.length);
    const key = new Int32Array(input.length);

    for (let i = 0; i < input.length; i++) {
        const rotation = randomizerUint32(allChar);
        key[i] = rotation;
        shuffled[i] = input[i] + rotation;
    }

    return { shuffled, key };
}

// Reverse shuffle
export function quantUnshuffle32(shuffled, key) {
    const original = new Uint32Array(shuffled.length);

    for (let i = 0; i < shuffled.length; i++) {
        original[i] = shuffled[i] - key[i];
    }

    return original;
}
