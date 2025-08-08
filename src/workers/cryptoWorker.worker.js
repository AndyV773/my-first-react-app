import { randomizer, base64ToUint8, compress, decompress, aesGcmEncrypt, aesGcmDecrypt, textDecoder } from '../utils/cryptoUtils';
import { detectFileExtension } from '../utils/fileUtils';
/* eslint-env worker */
/* eslint-disable no-restricted-globals */

self.addEventListener("message", async (e) => {
  const { type, load, dataPw, keyPw } = e.data;

  if (type === "shuffle") {
    const { input, allChar } = load;

    let rawInput = input;
    
    if (!rawInput) {
      return self.postMessage({ type: "error", error: "No input provided." });
    }

    try {
      const { shuffled, key } = quantShuffle(rawInput, allChar);
      let encryptedData = "";
      let encryptedKey = "";

      if (dataPw && keyPw) {
        try {
          const compressedData = compress(shuffled);
          const compressedKey = compress(key);

          encryptedData = await aesGcmEncrypt(compressedData, dataPw);
          encryptedKey = await aesGcmEncrypt(compressedKey, keyPw);
        
        } catch (err) {
          self.postMessage({ type: "error", error: err?.message ?? String(err) });
        }
      }

      self.postMessage({
        type: "done-shuffle",
        result: { shuffled, key },
        encryptedData,
        encryptedKey,
      });
    } catch (err) {
      self.postMessage({ type: "error", error: err?.message ?? String(err) });
    }

  } else if (type === "unshuffle") {
    let { shuffled, key } = load;

    try {
      if (dataPw && keyPw) {
        try {
          const decryptedData = await aesGcmDecrypt(shuffled, dataPw);
          const decryptedKey = await aesGcmDecrypt(key, keyPw);

          const decompressedData = decompress(decryptedData);
          const decompressedKey = decompress(decryptedKey);

          shuffled = textDecoder(decompressedData);
          key = textDecoder(decompressedKey);
  
        } catch (err) {
          self.postMessage({ type: "error", error: err?.message ?? String(err) });
        }
      }
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
    key: data.key, 
  };
}


// takes data and key and returns unshuffled data
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