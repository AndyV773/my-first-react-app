import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { uploadEncFile, saveFileAsExt } from '../utils/fileUtils';
import { aesGcmDecrypt, base64ToUint8, decompress, textDecoder } from '../utils/cryptoUtils';
import { useByteCounter, ThemeToggle } from '../utils/uiHelpers';


const QuantShuffleDec = ({ showMsg, theme, onToggleTheme, showLoader }) => {
  // Input/file state
  const [fileInfoData, setFileInfoData] = useState(null);
  const [fileInfoKey, setFileInfoKey] = useState(null);
  
  const [dataInputText, setDataInputText] = useState('');
  const [dataInputVal, setDataInputVal] = useState('');
  const [dataInput, setDataInput] = useState('');
  const [dataDecBase64, setDataDecBase64] = useState('');
 
  const [keyInputText, setKeyInputText] = useState('');
  const [keyInputVal, setKeyInputVal] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [keyDecBase64, setKeyDecBase64] = useState('');

  const [detectedExt, setDetectedExt] = useState("");
  const [dataDec, setDataDec] = useState('');
  const [keyDec, setKeyDec] = useState('');


  // Decryption state
  const [decodeBase64, setDecodeBase64] = useState(false)
  const [skipAES, setSkipAES] = useState(false);

  // Byte counts
  const [dataBytes, setDataBytes] = useState(0);
  const [keyBytes, setKeyBytes] = useState(0);

  const [dataDecVal, setDataDecVal] = useState('');
  const [dataDecBytes, setDataDecBytes] = useState(0);

  const [keyDecVal, setKeyDecVal] = useState('');
  const [keyDecBytes, setKeyDecBytes] = useState(0);

  const [outputVal, setOutputVal] = useState('');
  const [outputData, setOutputData] = useState('');
  const [outputBytes, setOutputBytes] = useState(0);
  
  useByteCounter(dataInputText, setDataBytes);
  useByteCounter(keyInputText, setKeyBytes);
  useByteCounter(outputVal, setOutputBytes);

  useByteCounter(dataDecVal, setDataDecBytes);
  useByteCounter(keyDecVal, setKeyDecBytes);

  // Refs
  const workerRef = useRef(null);
  const pwDataRef = useRef(null);
  const pwKeyRef = useRef(null);


    const handleUpload = async (type, e) => {
        const file = e.target.files?.[0];
        let setInfo;
        let setDataText;
        let setData;

        if (type === "data") {
            setFileInfoData(null);
            setInfo = setFileInfoData;
            setDataText = setDataInputText;
            setData = setDataInput;
        } else if (type === "key") {
            setFileInfoKey(null);
            setInfo = setFileInfoKey;
            setDataText = setKeyInputText;
            setData = setKeyInput;
        }

        e.target.value = ""; // Clear file input

        if (!file) return;

        const result = await uploadEncFile(file, {
            onFileInfo: setInfo,
            onText: setDataText,
            onDataLoaded: setData,
        });

        if (result?.error) {
            showMsg(`${type} upload failed: ${result.error}`, true);
            setInfo(null);
            setData("");
            return;
        }
    };


    useEffect(() => {
        if (!decodeBase64) {
            setDataInputVal(dataInputText);
            setKeyInputVal(keyInputText);
            return;
        }
       
        try {
            if (dataInputText) {
                const decoded = base64ToUint8(dataInputText);
                setDataInputVal(textDecoder(decoded));
                setDataInput(decoded);
                setDataDecBase64(decoded);
            } 
            
            if (keyInputText) {
                const decoded = base64ToUint8(keyInputText);
                setKeyInputVal(textDecoder(decoded));
                setKeyInput(decoded);
                setKeyDecBase64(decoded);
            }
        } catch (err) {
            // If decoding fails:
            showMsg("Error decoding base64" + err.message, true);

            // Fallback to original input values
            setDataInputVal(dataInputText);
            setKeyInputVal(keyInputText);

            // Auto-uncheck the decodeBase64 toggle
            setDecodeBase64(false);
        }
    }, [decodeBase64, dataInputText, keyInputText, showMsg]);


    // Derive final output depending on skipAES
    useEffect(() => {
        if (!skipAES) {
            setDataDecVal(dataDec);
            setKeyDecVal(keyDec);
            return;
        }

        if (decodeBase64) {
            setDataDecVal(textDecoder(dataDecBase64));
            setKeyDecVal(textDecoder(keyDecBase64));
        } else {
            setDataDecVal(dataInputVal);
            setKeyDecVal(keyInputVal);
        }
        
    }, [skipAES, decodeBase64, dataInputVal, keyInputVal, dataDec, keyDec, dataDecBase64, keyDecBase64]);



  // Decryption handler
  const handleDecryption = useCallback( async (label) => {
      if (skipAES) {
        showMsg('Skip AES is checked; encryption bypassed.', true);
        return;
      }

      let input;
      let password;
      if (label === 'data') {
        input = dataInput;
        password = pwDataRef.current?.value || '';
      } else if (label === 'key') {
        input = keyInput;
        password = pwKeyRef.current?.value || '';
      } else {
        return;
      }

      if (!input) {
        showMsg(`No ${label} input to decrypt.`, true);
        return;
      }
      if (!password) {
        showMsg(`Password required to decrypt ${label}.`, true);
        return;
      }

      try {
          const dencrypted = await aesGcmDecrypt(input, password);
          const decompressed = decompress(dencrypted);
          const decoded = textDecoder(decompressed);

        if (label === 'data') {
          setDataDec(decoded);
        } else {
          setKeyDec(decoded);
        }
        showMsg(`${label} Decryption Complete!`, false);
      } catch (err) {
        showMsg(`${label} decryption failed: ${err.message}`, true);
      }
    },
    [skipAES, dataInput, keyInput, showMsg]
  );


    useEffect(() => {
        workerRef.current = new Worker(
            new URL('../workers/cryptoWorker.worker.js', import.meta.url),
            { type: 'module'}
        );

        const onMessage = (e) => {
            const { type, result, error } = e.data;
            if (type === "done-unshuffle") {
                const { output, ext } = result;
            
                // Set state and UI
                setDetectedExt(ext);
                if (ext !== "txt" && ext !== "bin") {
                    setOutputVal(textDecoder(output));
                } else {
                    setOutputVal(output);
                }
                setOutputData(output);
                
                showMsg('Unshuffle Complete!', false);
                setTimeout(() => showLoader({ show: false }), 2000);
            } else if (type === 'error') {
                showMsg('Unshuffle failed: ' + error, true);
                showLoader({ show: false });
            }
        };

        workerRef.current.addEventListener('message', onMessage);
        return () => {
            workerRef.current.removeEventListener('message', onMessage);
            workerRef.current.terminate();
            workerRef.current = null;
        };
    }, [showMsg, showLoader]);


    const handleUnshuffle = useCallback(() => {
        if (!workerRef.current) return;
        if (!dataDecVal || !keyDecVal) {
            showMsg("No data.", true);
            return;
        }
        setOutputVal("");
        setOutputData("");
        setDetectedExt(null);

        showLoader({ show: true, mode: 'Decoding', typre: "loader decode", emoji: '🧩', bytes: keyBytes });

        workerRef.current.postMessage({
            type: "unshuffle",
            load: { 
                shuffled: dataDecVal, 
                key: keyDecVal, 
            },
        });
    }, [dataDecVal, keyDecVal, showMsg, showLoader, keyBytes]);


    const handleSaveFile = () => {
        saveFileAsExt(outputData, detectedExt);
    }

  return (
    <main className="container">
      <nav>
        <div className="flex g1">
          <Link to="/">Home</Link>
          <Link to="/quant-shuffle-enc">Encode</Link>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </nav>

      <div className="learn-more">
        <h2>Quantum Shuffle</h2>
        <Link to="/about#about-quant-shuffle">Learn more</Link>
      </div>

      <section>
        <h2>Decode</h2>
        <p>Upload QR Images or .ec file</p>

        <label htmlFor="data-upload">Upload data:</label>
        <input type="file" id="data-upload" onChange={(e) => handleUpload("data", e)} />
        {fileInfoData && (
          <p className="file-info">
            File: {fileInfoData.name}, Type: {fileInfoData.type}, Size: {fileInfoData.size}
          </p>
        )}

        <label htmlFor="key-upload">Upload Key:</label>
        <input type="file" id="key-upload" onChange={(e) => handleUpload("key", e)} />
        {fileInfoKey && (
          <p className="file-info">
            File: {fileInfoKey.name}, Type: {fileInfoKey.type}, Size: {fileInfoKey.size}
          </p>
        )}

        <label>
          Decode base64
          <input
            type="checkbox"
            checked={decodeBase64}
            onChange={(e) => setDecodeBase64(e.target.checked)}
          />
        </label>
        
        <textarea id="data-input" value={dataInputVal} rows="5" placeholder="Encrypted data" readOnly></textarea>
        <p>
            Data byte size: <span>{dataBytes}</span> bytes
        </p>
        <textarea id="key-input" value={keyInputVal} rows="5" placeholder="Encrypted Key" readOnly></textarea>
        <p>
            Key byte size: <span>{keyBytes}</span> bytes
        </p>
        </section>

        <section>
        <h2>AES-GCM Decryption</h2>
        <label>
          Skip AES
          <input
            type="checkbox"
            checked={skipAES}
            onChange={(e) => setSkipAES(e.target.checked)}
          />
        </label>

        <div>
          <input ref={pwDataRef} placeholder="Password for Data" />
          <textarea
            rows="5"
            value={dataDecVal}
            placeholder="Encrypted Data"
            readOnly
          />
          <p>
            Data Byte size: <span>{dataDecBytes}</span> bytes
          </p>
          <button className="decode" onClick={() => handleDecryption('data')}>
            Decrypt Data
          </button>
        </div>

        <div>
          <input ref={pwKeyRef} placeholder="Password for Key" />
          <textarea
            rows="5"
            value={keyDecVal}
            placeholder="Encrypted Key"
            readOnly
          />
          <p>
            Key Byte size: <span>{keyDecBytes}</span> bytes
          </p>
          <button className="decode" onClick={() => handleDecryption('key')}>
            Decrypt Key
          </button>
        </div>
      </section>


        <section>
        <button className="decode" onClick={handleUnshuffle}>
          Unshuffle
        </button>
        <div>
          <textarea
            rows="5"
            value={outputVal}
            placeholder="Shuffled data"
            readOnly
          />
          <p>
            Data Byte size: <span>{outputBytes}</span> bytes
          </p>
          <p id="detected-in-ext">
            Detected file type: {detectedExt ? `${detectedExt}` : "(none)"}
          </p>
        </div>
        <div className={`padding ${outputBytes === 0 ? 'hidden' : ''}`}>
            <button onClick={() => handleSaveFile("key")}> Save as {detectedExt}</button>
        </div>
      </section>
    </main>
  );
};

export default QuantShuffleDec;
