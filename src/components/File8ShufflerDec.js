import React, { useState } from "react";
import { Link } from 'react-router-dom';
import { uploadFile, saveFileAsExt } from "../utils/fileUtils";
import { extractViewData } from "../utils/uiHelpers";
import { keyUnshuffle, aesCbcDecrypt } from "../utils/cryptoUtils";


const File8ShufflerDec = ({ showMsg }) => {
  const [fileInput, setFileInput] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [base64Preview, setBase64] = useState("");
  const [utf8Preview, setUtf8] = useState("");
  const [detectedExt, setDetectedExt] = useState("");
  const [useAES, setUseAES] = useState(false);
  const [aesKey, setAesKey] = useState("");

  const handleUpload = (e) => {
    const file = e.target.files[0];
    // Reject anything that isn't .8
    if (!file.name.toLowerCase().endsWith(".8")) {
      showMsg("Invalid file type. Please upload a .8 file.", true);
      e.target.value = "";
      return;
    }
    if (file) {
      uploadFile(file, {
        onText: setUtf8,
        onBase64: setBase64,
        onFileInfo: setFileInfo,
        onDetectedExt: setDetectedExt,
        onDataLoaded: setFileInput,
      });
    }
  };
  
  const handleShuffle = async () => {
    const key = document.getElementById("shuffle-key").value;

    const output = keyUnshuffle(fileInput, key);

    if (output.error) {
      showMsg(output.error, true);
      return;
    }

    const unshuffledBytes = output.result;
    setFileInput(unshuffledBytes); // update shared value for saving, etc.

    const { base64, utf8, ext } = await extractViewData(unshuffledBytes);

    setBase64(base64);
    setUtf8(utf8);
    setDetectedExt(ext);

    showMsg("Data Unshuffled!", false);
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
          <Link to="/">Home</Link>
          <Link to="/file-8-shuffler">Encode</Link>
        </nav>

        <h2>File 8 Shuffler Dec</h2>

        {/* Decode Section */}
        <section>
          <h2>Decode</h2>
          <label>Load a .8 file:</label>
          <input type="file" onChange={handleUpload} />
          {fileInfo && (
            <p className="file-info">
              File: {fileInfo.name}, Type: {fileInfo.type}, Size: {fileInfo.size}
            </p>
          )}

          <label>
            Use AES decryption
            <input
              type="checkbox" 
              id="add-aes" 
              checked={useAES}
              onChange={(e) => {
                const checked = e.target.checked;
                setUseAES(checked);
                if (!checked) setAesKey("");
              }} 
            />
          </label>
          {useAES && (
            <>
              <input
                type="text"
                id="aes-key"
                className={useAES ? "" : "hidden"}
                placeholder="Enter AES key"
                value={aesKey}
                onChange={(e) => setAesKey(e.target.value)}
                autoComplete="off"
              />
              <button 
                id="decrypt-btn" 
                className={`decode ${useAES ? "" : "hidden"}`} 
                onClick={handleDecrypt}>Decrypt</button>
            </>
          )}

          <input
            type="text"
            id="shuffle-key"
            placeholder="Enter key"
            autoComplete="off"
          />
          <button className="decode" onClick={handleShuffle}>Unshuffle</button>

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
            Detected file type: {detectedExt ? `.${detectedExt}` : "(none)"}
          </p>
          
          <button onClick={handleSaveFile}>Save</button>
        </section>
      </main>
    </>
  );
};

export default File8ShufflerDec;
