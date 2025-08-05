import { randomizer, uint8ToBase64, base64ToUint8 } from '../utils/cryptoUtils';
import { detectFileExtension } from '../utils/fileUtils';
/* eslint-env worker */
/* eslint-disable no-restricted-globals */

self.addEventListener("message", async (e) => {
  const { type, payload } = e.data;

  if (type === "shuffle") {
    const { input, fileInput, allChar } = payload;

    let rawInput = "";

    if (fileInput) {
      // Input is Uint8Array (from file read) → base64 for shuffling
      rawInput = uint8ToBase64(input);
    } else {
      const text = input; // plain text input
      if (!text) {
        return self.postMessage({ type: "error", error: "No input provided." });
      }
      rawInput = text;
    }

    try {
      const { shuffled, key } = quantShuffle(rawInput, allChar);
      self.postMessage({
        type: "done-shuffle",
        result: { shuffled, key },
      });
    } catch (err) {
      self.postMessage({ type: "error", error: err?.message ?? String(err) });
    }

  } else if (type === "unshuffle") {
    const { shuffled, key } = payload;

    try {
      const unshuffled = await quantUnshuffle(shuffled, key);
      let output, ext;

      try {
        const bytes = base64ToUint8(unshuffled);
        ext = await detectFileExtension(bytes);

        if (ext !== "bin") {
          output = base64ToUint8(unshuffled);
        } else {
          output = unshuffled;
        }

      } catch (err) {
        output = unshuffled;
        ext = "txt";
      }

      self.postMessage({
        type: "done-unshuffle",
        result: { output, ext},
      });
    } catch (err) {
      self.postMessage({ type: "error", error: err?.message ?? String(err) });
    }
  }
});

function quantShuffle(input, allChar = false) {
  const data = { shuffled: "", key: [] };

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const codePoint = char.codePointAt(0);
  
    let rotation, shuffledData;

    do {
      rotation = randomizer(allChar);
      shuffledData = codePoint + rotation;
    } while (
      shuffledData > 0x10ffff ||
      shuffledData < 0 ||
      (shuffledData >= 0xd800 && shuffledData <= 0xdfff)
    );

    data.shuffled += String.fromCodePoint(shuffledData);
    data.key.push(rotation);
  }

  data.key = data.key.join(",");

  return {
    shuffled: data.shuffled,
    key: data.key, // will be turned into Uint32Array by caller
  };
}


// takes data and key and returns undhuffled data
async function quantUnshuffle(inputData, inputKey) {
  const key = inputKey.split(",").map(Number);
  let decodedString = "";
  let i = 0;
  
  for (const char of inputData) {
    let shuffledData = char.codePointAt(0);
    let rotations = key[i++] ?? 0;
    let output = (shuffledData - rotations + 0x10ffff) % 0x10ffff;
    decodedString += String.fromCodePoint(output);
  }

  return decodedString;
}