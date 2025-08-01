import React, { useState } from "react";
import { Link } from 'react-router-dom';
import { uploadFile, saveFileAs8 } from "../utils/fileUtils";
import { extractViewData } from "../utils/uiHelpers";
import { keyShuffle, aesCbcEncrypt } from "../utils/cryptoUtils";


const File8ShufflerEnc = ({ showMsg }) => {
  const [fileInput, setFileInput] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [base64Preview, setBase64] = useState("");
  const [utf8Preview, setUtf8] = useState("");
  const [detectedExt, setDetectedExt] = useState("");
  const [useAES, setUseAES] = useState(false);
  const [aesKey, setAesKey] = useState("");

  
  const handleUpload = (e) => {
    const file = e.target.files[0];
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

    const output = keyShuffle(fileInput, key);

    if (output.error) {
      showMsg(output.error, true);
      return;
    }

    const shuffledBytes = output.result;
    setFileInput(shuffledBytes); // update shared value for saving, etc.

    const { base64, utf8, ext } = await extractViewData(shuffledBytes);

    setBase64(base64);
    setUtf8(utf8);
    setDetectedExt(ext);

    showMsg("Data shuffled!", false);
  };

  const handleEncrypt = async () => {
    const output = aesCbcEncrypt(fileInput, aesKey); // fileInput in Uint8Array
    if (output.error) {
      showMsg(output.error, true);
    } else {
      setFileInput(output.result);
      const { base64, utf8, ext } = await extractViewData(output.result);

      setBase64(base64);
      setUtf8(utf8);
      setDetectedExt(ext); 

      showMsg("Encryption Complete!", false);
    }
  };


  const handleSaveFile = () => {
    if (!fileInput) return showMsg("Nothing to save.", true);

    saveFileAs8(fileInput);
  }


  return (
    <> 
     <main className="container">
        <nav>
          <Link to="/">Home</Link>
          <Link to="/file-8-shuffler-dec">Decode</Link>
        </nav>

        <h2>File 8 Shuffler Enc</h2>

        {/* Encode Section */}
        <section>
          <h2>Encode</h2>
          <input type="file" onChange={handleUpload} />
          {fileInfo && (
            <p className="file-info">
              File: {fileInfo.name}, Type: {fileInfo.type}, Size: {fileInfo.size}
            </p>
          )}
          <p>
            You can shuffle as many times as you like and enter different keys,
            but you will have to do the same in reverse or the data could be lost.
          </p>
          <input type="text" id="shuffle-key" placeholder="Enter key" autoComplete="off"/>
          <br />
          <button className="encode" onClick={handleShuffle}>Shuffle</button>
          <label>
            Use AES encryption
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
                id="encrypt-btn" 
                className={`encode ${useAES ? "" : "hidden"}`} 
                onClick={handleEncrypt}>Encrypt</button>
            </>
          )}

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

          <button onClick={handleSaveFile}>Save as .8</button>
        </section>
      </main>
    </>
  );
};

export default File8ShufflerEnc;
