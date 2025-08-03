import { randomizer, uint8ToBase64 } from '../utils/cryptoUtils';
/* eslint-env worker */
/* eslint-disable no-restricted-globals */

self.addEventListener("message", (e) => {
  const { type, payload } = e.data;
  if (type !== "shuffle") return;

  const { input, fileInput, allChar } = payload;

  let rawInput = "";

  if (fileInput) {
    // Input is Uint8Array (from file read)
    rawInput = uint8ToBase64(input); 
  } else {
    const text = input;  // plain text input
    if (!text) return self.postMessage({ type: "error", error: "No input provided."});
    rawInput = text;
  }

  try {
    const { shuffled, key } = quantShuffle(rawInput, allChar);
    self.postMessage({
      type: "done",
      result: { shuffled, key },
    });
  } catch (err) {
    self.postMessage({ type: "error", error: err?.message ?? String(err) });
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
