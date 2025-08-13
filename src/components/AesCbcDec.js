import React, { useState } from "react";
import { Link } from 'react-router-dom';
import { uploadEncFile, saveFileAsExt } from "../utils/fileUtils";
import { extractViewData, ThemeToggle } from "../utils/uiHelpers";
import { aesCbcDecrypt } from "../utils/cryptoUtils";


const AesCbcDec = ({ showMsg, theme, onToggleTheme }) => {
  const [fileInput, setFileInput] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [base64Preview, setBase64] = useState("");
  const [utf8Preview, setUtf8] = useState("");
  const [detectedExt, setDetectedExt] = useState("");
  
  const [aesKey, setAesKey] = useState("");

  const handleUpload = async (e) => {
      const file = e.target.files?.[0];
      // Reset all states on every new upload attempt or failure
      setUtf8("");
      setBase64("");
      setFileInfo(null);
      setFileInput(null);
      setDetectedExt(null);
      e.target.value = "";  // Clear file input to allow re-upload of same file if needed

      if (!file) return;

      const result = await uploadEncFile(file, {
          onText: setUtf8,
          onBase64: setBase64,
          onFileInfo: setFileInfo,
          onDataLoaded: setFileInput,
      });

      if (result?.error) {
          showMsg(`Upload failed: ${result.error}`, true);
          setUtf8("");
          setBase64("");
          setFileInfo(null);
          setFileInput(null);
          setDetectedExt(null);
          return;
      }
  };
  

  const handleDecrypt = async () => {
    const output = aesCbcDecrypt(fileInput, aesKey); // fileInput in Uint8Array
    if (output.error) {
      showMsg(output.error, true);
    } else {
      setFileInput(output.result);
      const { base64, utf8, ext } = await extractViewData(output.result);

      setBase64(base64);
      setUtf8(utf8);
      setDetectedExt(ext); 

      showMsg("Decryption Complete!", false);
    }
  };


  const handleSaveFile = () => {
    if (!fileInput) return showMsg("Nothing to save.", true);

    saveFileAsExt(fileInput, detectedExt);
  }

  return (
    <>
      <main className="container">
        <nav>
            <div className="flex g1">
                <Link to="/">Home</Link>
                <Link to="/aes-cbc-enc">Encode</Link>
            </div>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </nav>

        <div className="learn-more">
          <h2>AES-CBC</h2>
          <Link to="/about#about-aes-cbc">Learn more</Link>
        </div>

        {/* Decode Section */}
        <section>
            <h2>Decode</h2>
            <label>Load a .ec file:</label>
            <input type="file" onChange={handleUpload} />
            {fileInfo && (
                <p className="file-info">
                File: {fileInfo.name}, Type: {fileInfo.type}, Size: {fileInfo.size}
                </p>
            )}

            <input
                type="text"
                id="aes-key"
                placeholder="Enter AES key"
                value={aesKey}
                onChange={(e) => setAesKey(e.target.value)}
                autoComplete="off"
            />
            <button className="decode" onClick={handleDecrypt}>Decrypt</button>

            <textarea
                id="base64View"
                value={base64Preview}
                rows="5"
                placeholder="Base64 Preview"
                readOnly
            ></textarea>
            <textarea
                id="utf8View"
                value={utf8Preview}
                rows="5"
                placeholder="UTF-8 Text Preview"
                readOnly
            ></textarea>
            <p id="detected-in-ext">
                Detected file type: {detectedExt ? `${detectedExt}` : "(none)"}
            </p>
            
            <button onClick={handleSaveFile}>Save as {detectedExt}</button>
        </section>
      </main>
    </>
  );
};

export default AesCbcDec;
