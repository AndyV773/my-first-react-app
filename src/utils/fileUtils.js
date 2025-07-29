import JSZip from "jszip";


// handles file upload
export function uploadFile(file, options = {}) {
  const {
    onDataLoaded,     // function(Uint8Array): void
    onBase64,         // function(base64Str): void
    onFileInfo,       // function({ name, type, size }): void
    onText,           // function(utf8String): void
    onDetectedExt,
  } = options;

  const reader = new FileReader();

  reader.onload = function (e) {
    (async () => {
      const bytes = new Uint8Array(e.target.result);

      // Call optional hooks
      if (onDataLoaded) onDataLoaded(bytes);

      if (onBase64) {
        const base64 = btoa(String.fromCharCode(...bytes));
        onBase64(base64);
      }

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
          type: file.type || "unknown",
          size: formatBytes(file.size),
      });
      }

      if (onDetectedExt) {
          const ext = await detectFileExtension(bytes);
          onDetectedExt(ext);
      }
    })();
  };

  reader.readAsArrayBuffer(file);
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

console.log(fileId)

// saves as .8 file
export function saveFileAs8(fileInput) {
    const blob = new Blob([fileInput], { type: "application/octet-stream" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${fileId}.8`;
    a.click();
}

// save file as ext
export async function saveFileAsExt(fileInput, ext, name) {
    if (!name) name = "";
    const blob = new Blob([fileInput], { type: "application/octet-stream" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}${fileId}.${ext}`;
    a.click();
}
