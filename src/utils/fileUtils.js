import { base64ToUint8, uint8ToBase64 } from './cryptoUtils';
import JSZip from "jszip";
import jsQR from 'jsqr';


/**
 * @param {File} file
 * @param {Object} options
 * @param {function(Uint8Array): void} [options.onDataLoaded]
 * @param {function(string): void} [options.onBase64]
 * @param {function({name, type, size}): void} [options.onFileInfo]
 * @param {function(string): void} [options.onText]
 */
export function uploadFile(file, options = {}) {
  const {
    onDataLoaded,     // function(Uint8Array): void
    onBase64,         // function(base64Str): void
    onFileInfo,       // function({ name, type, size }): void
    onText,           // function(utf8String): void
  } = options;

  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      let bytes = new Uint8Array(e.target.result);

      // Call optional hooks
      if (onDataLoaded) onDataLoaded(bytes);
      if (onBase64) onBase64(uint8ToBase64(bytes));

      if (onText) {
        try {
            const text = new TextDecoder().decode(bytes);
            onText(text);
        } catch {
            onText("[Unreadable binary data]");
        }
      }

      if (onFileInfo) {
        onFileInfo({
            name: file.name,
            type: file.type || 'unknown',
            size: formatBytes(file.size),
        });
      }
    } catch (err) {
      return { error: "Failed to process file." + err.message };
    }
  };

  reader.onerror = () => {
    return { error: "Failed to read file." };
  };

  reader.readAsArrayBuffer(file);
}

/**
 * @param {File} file
 * @param {Object} options
 * @param {function(Uint8Array): void} [options.onDataLoaded]
 * @param {function(string): void} [options.onBase64]
 * @param {function({name, type, size, ext?: string}): void} [options.onFileInfo]
 * @param {function(string): void} [options.onText]
 * @param {function(Error): void} [options.onError]
 */
export async function uploadEncFile(file, options = {}) {
  const { onDataLoaded, onBase64, onFileInfo, onText } = options;

  const isImage = file.type.startsWith("image/");
  const reader = new FileReader();

  // Helper to read ArrayBuffer or DataURL
  const fileData = await new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    if (isImage) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });

  try {
    let bytes;

    if (isImage) {
      // QR decode: await the async image load/processing
      const dataUrl = fileData;
      bytes = await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const info = jsQR(imageData.data, canvas.width, canvas.height);
            if (!info?.data) {
              reject(new Error("Invalid or missing QR code"));
              return;
            }
            resolve(info.data);
          } catch (err) {
            reject(new Error("Failed to process QR image: " + err.message));
          }
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = dataUrl;
      });

      if (onText) onText(bytes);
      if (onDataLoaded) onDataLoaded(base64ToUint8(bytes));
      if (onFileInfo) {
        onFileInfo({
          name: file.name,
          type: file.type,
          size: formatBytes(file.size),
        });
      }
      return { success: true };
    } else {
      // Non-image (.ec) branch
      bytes = new Uint8Array(fileData);

      if (bytes.length < 2 || bytes[0] !== 0xEC || bytes[1] !== 0x01) {
        throw new Error("Invalid .ec file");
      }

      const data = bytes.slice(2); // strip magic

      if (onDataLoaded) onDataLoaded(data);
      if (onBase64) onBase64(uint8ToBase64(data));
      if (onText) {
        let text;
        try {
          text = new TextDecoder().decode(data);
        } catch {
          text = "[Unreadable binary data]";
        }
        onText(text);
      }
      if (onFileInfo) {
        onFileInfo({
          name: file.name,
          type: file.type || "application/x-ec",
          size: formatBytes(file.size),
        });
      }
      return { success: true };
    }
  } catch (err) {
    return { error: "Failed to process file: " + (err?.message || "unknown") };
  }
}



// returns file size
function formatBytes(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
}

// Detects file type if no result returns txt
export async function detectFileExtension(bytes) {
  // Check for .ec magic number 0xEC01 (first two bytes)
  if (bytes.length >= 2 && bytes[0] === 0xEC && bytes[1] === 0x01) {
    return "ec";
  }

  const hex = [...bytes.slice(0, 8)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

  if (hex.startsWith("504B0304")) {
    try {
      const zip = await JSZip.loadAsync(bytes);
      const fileNames = Object.keys(zip.files);

      if (fileNames.some(name => name.startsWith("word/"))) return "docx";
      if (fileNames.some(name => name.startsWith("xl/"))) return "xlsx";
      if (fileNames.some(name => name.startsWith("ppt/"))) return "pptx";
      
      return "zip";
    } catch (e) {
      return "zip";
    }
  }

  // Known binary file signatures
  if (hex.startsWith("89504E47")) return "png";
  if (hex.startsWith("FFD8FF")) return "jpg";
  if (hex.startsWith("25504446")) return "pdf";
  if (hex.startsWith("47494638")) return "gif";
  if (hex.includes("66747970")) return "mp4";
  if (hex.startsWith("52494646")) return "wav";
  if (hex.startsWith("000001BA")) return "mpg";
  
  // Check for binary (non-printable control characters)
  const isBinary = bytes.slice(0, 512).some(
    (b) =>
      b < 0x09 || (b > 0x0D && b < 0x20) || b > 0x7E
  );

  if (isBinary) return "bin";

  // Otherwise, decode as normal text and guess
  const text = new TextDecoder().decode(bytes.slice(0, 1024)).trim();

  if (text.startsWith("{") || text.startsWith("[")) return "json";
  if (text.includes(",") && text.match(/\n|;/)) return "csv";

  return "txt";
}

// random number for files
function randomNumber(max = 9999) {
    const date = Date.now().toString().slice(0, 6);
    const rand = Math.floor(Math.random() * max);
    return date + rand;
}

const fileId = randomNumber();


// saves as .ec file
export function saveFileAsEc(input, name) {
    if (!name) name = "";
    // Magic number (2 bytes): 0xEC01
    const MAGIC_BYTES = new Uint8Array([0xEC, 0x01]);

    const blob = new Blob([MAGIC_BYTES, input], { type: "application/octet-stream" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}${fileId}.ec`;
    a.click();
}


// save file as ext
export async function saveFileAsExt(input, ext, name) {
    if (!name) name = "";
    const blob = new Blob([input], { type: "application/octet-stream" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}${fileId}.${ext}`;
    a.click();
}


export function downloadQrCode(canvas, name) {
    if (!name) name = "";
    if (!(canvas instanceof HTMLCanvasElement)) return { error: "Invalid canvas element." };

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${name}${fileId}.png`;
    link.click();    
}