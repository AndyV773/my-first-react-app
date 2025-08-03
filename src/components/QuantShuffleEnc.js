import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { uploadFile, saveFileAsEc, downloadQrCode } from '../utils/fileUtils';
import { aesGcmEncrypt, compress } from '../utils/cryptoUtils';
import { useByteCounter, ThemeToggle, generateQrCode, getQrCorrectionInfo } from '../utils/uiHelpers';


const QuantShuffleEnc = ({ showMsg, theme, onToggleTheme, showLoader }) => {
  // Input/file state
  const [fileInput, setFileInput] = useState(false); 
  const [fileInfo, setFileInfo] = useState(null);
  const [utf8Preview, setUtf8] = useState(''); // content decoded from file
  const [dataInput, setDataInput] = useState('');

  // Encryption state
  const [skipAES, setSkipAES] = useState(false);

  // Byte counts
  const [inputBytes, setInputBytes] = useState(0);
  useByteCounter(dataInput, setInputBytes);

  const [shuffleVal, setShuffleVal] = useState('');
  const [shuffleBytes, setShuffledBytes] = useState(0);
  useByteCounter(shuffleVal, setShuffledBytes);

  const [keyVal, setKeyVal] = useState('');
  const [keyBytes, setKeyBytes] = useState(0);
  useByteCounter(keyVal, setKeyBytes);

  const [dataEncVal, setDataEncVal] = useState('');
  const [dataEncBytes, setDataEncBytes] = useState(0);
  useByteCounter(dataEncVal, setDataEncBytes);

  const [keyEncVal, setKeyEncVal] = useState('');
  const [keyEncBytes, setKeyEncBytes] = useState(0);
  useByteCounter(keyEncVal, setKeyEncBytes);

  const [dataOutput, setDataOutput] = useState('');
  const [dataOutputBytes, setDataOutputBytes] = useState(0);
  useByteCounter(dataOutput, setDataOutputBytes);

  const [keyOutput, setKeyOutput] = useState('');
  const [keyOutputBytes, setKeyOutputBytes] = useState(0);
  useByteCounter(keyOutput, setKeyOutputBytes);

  const [showDownloadData, setShowDownloadData] = useState(false);
  const [showDownloadKey, setShowDownloadKey] = useState(false);
  
  // Refs
  const workerRef = useRef(null);
  const allCharRef = useRef(null);
  const skipAESRef = useRef(skipAES);
  const pwDataRef = useRef(null);
  const pwKeyRef = useRef(null);
  const dataContainerRef = useRef(null);
  const keyContainerRef = useRef(null);

  const dataCorrection = getQrCorrectionInfo(dataOutputBytes);
  const keyCorrection = getQrCorrectionInfo(keyOutputBytes);
  
  useEffect(() => {
    skipAESRef.current = skipAES;
  }, [skipAES]);

  // Sync file content into dataInput once when file loads
  useEffect(() => {
    if (fileInput) {
        setDataInput(utf8Preview);
    } else {
        setDataInput("");
    }
  }, [fileInput, utf8Preview]);

  // Derive final output depending on skipAES
  useEffect(() => {
    if (skipAES) {
        setDataOutput(shuffleVal);
        setKeyOutput(keyVal);
    } else {
        setDataOutput(dataEncVal);
        setKeyOutput(keyEncVal);
    }
  }, [skipAES, shuffleVal, keyVal, dataEncVal, keyEncVal]);

  // Handle file upload
  const handleUpload = (e) => {
    const file = e.target.files[0];
    // reset
    setFileInfo(null);
    setFileInput(false);
    setUtf8('');
    setDataInput('');
    e.target.value = "";
    if (!file) return;

    uploadFile(file, {
      onFileInfo: setFileInfo,
      onText: setUtf8, // sets utf8Preview
      onDataLoaded: setDataInput,
    });
    setFileInput(true);
  };


  useEffect(() => {
    workerRef.current = new Worker(
        new URL('../workers/cryptoWorker.worker.js', import.meta.url),
        { type: 'module'}
    );

    const onMessage = (e) => {
        const { type, result, error } = e.data;
        if (type === "done") {
            const { shuffled, key } = result;
        
            // Set state and UI
            setShuffleVal(shuffled);
            setKeyVal(key);
            
            // if skipAES, reflect immediately
            if (skipAESRef.current) {
                setDataOutput(shuffled);
                setKeyOutput(key);
            }
            
            showMsg('Shuffle Complete!', false);
            setTimeout(() => {
                showLoader({ show: false });
            }, 2000);
        } else if (type === 'error') {
            showMsg('Shuffle failed: ' + error, true);
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


  const handleShuffle = useCallback(() => {
    if (!workerRef.current) return;
    if (!dataInput) {
        showMsg("No data.", true);
        return;
    }
    const allChar = allCharRef.current?.checked || false;
    showLoader({ show: true, mode: 'encode', emoji: '🛡️', bytes: inputBytes });

    workerRef.current.postMessage({
        type: "shuffle",
        payload: { 
            input: dataInput, 
            fileInput: fileInput, 
            allChar, 
        },
    });
  }, [dataInput, fileInput, showMsg, showLoader, inputBytes]);

  // Encryption handler
  const handleEncryption = useCallback( async (label) => {
      if (skipAES) {
        showMsg('Skip AES is checked; encryption bypassed.', true);
        return;
      }

      let input;
      let password;
      if (label === 'data') {
        input = shuffleVal;
        password = pwDataRef.current?.value || '';
      } else if (label === 'key') {
        input = keyVal;
        password = pwKeyRef.current?.value || '';
      } else {
        return;
      }

      if (!input) {
        showMsg(`No ${label} input to encrypt.`, true);
        return;
      }
      if (!password) {
        showMsg(`Password required to encrypt ${label}.`, true);
        return;
      }

      try {
        const compressed = compress(input);
        const encrypted = await aesGcmEncrypt(compressed, password);

        if (label === 'data') {
          setDataEncVal(encrypted);
        } else {
          setKeyEncVal(encrypted);
        }
        showMsg(`${label} Encryption Complete!`, false);
      } catch (err) {
        showMsg(`${label} encryption failed: ${err.message}`, true);
      }
    },
    [skipAES, shuffleVal, keyVal, showMsg]
  );

  
  const handleGenerate = useCallback(async (type, input, bytes) => {
        let container;
        if (type === "data") {
            if (!dataContainerRef.current) {
                return;
            } else {
                container = dataContainerRef.current;
            }
        } else if (type === "key") {
            if (!keyContainerRef.current) {
                return;
            } else {
                container = keyContainerRef.current;
            }
        }
  
        let level;
        if (bytes <= 1200) {
          level = "H";
        } else if (bytes <= 1600) {
          level = "Q";
        } else if (bytes <= 2300) {
          level = "M";
        } else if (bytes <= 2900) {
          level = "L";
        } else {
          return showMsg("Exceeds maximum capacity for QR code.", true);
        }
        
        try {
          await generateQrCode({
            input: input,
            errorCorrectionLevel: level,
            container: container,
          });
          if (type === "data") setShowDownloadData(true);
          if (type === "key") setShowDownloadKey(true);
        } catch (err) {
          showMsg("QR generation failed: " + (err?.message || "unknown error"), true);
        }
    }, [showMsg]);

    const handleQrDownload = (type) => {
        let container;
        if (type === "data") {
            container = dataContainerRef.current;
        } else if (type === "key") {
            container = keyContainerRef.current;
        }
        const canvas = container?.querySelector('canvas');
        if (canvas) {
            downloadQrCode(canvas, type);
        } else {
            showMsg("QR code not found.", true);
        }
    };

    const handleSaveFile = (type) => {
        if (type === "data") {
            if (!dataOutput) return showMsg("Nothing to save.", true);
            saveFileAsEc(dataOutput, type);
        } else if (type === "key") {
            if (!keyOutput) return showMsg("Nothing to save.", true);
            saveFileAsEc(keyOutput, type);
        }
    }

  return (
    <main className="container">
      <nav>
        <div className="flex g1">
          <Link to="/">Home</Link>
          <Link to="/quant-shuffle-dec">Decode</Link>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </nav>

      <h2>Quantum Shuffle</h2>

      <section>
        <h2>Encode</h2>
        <p>Upload File or Input Text</p>

        <input type="file" onChange={handleUpload} />
        {fileInfo && (
          <p className="file-info">
            File: {fileInfo.name}, Type: {fileInfo.type}, Size: {fileInfo.size}
          </p>
        )}

        <label>
          Include all characters
          <input type="checkbox" id="all-char" ref={allCharRef} />
        </label>

        <div>
          <textarea
            rows="5"
            value={dataInput}
            onChange={(e) => {
                setFileInput(false);
                setFileInfo(null);
                setUtf8('');
                setDataInput(e.target.value);
            }}
            placeholder="Enter text..."
          />
          <p>
            Byte size: <span>{inputBytes}</span> bytes
          </p>
        </div>

        <button className="encode" onClick={handleShuffle}>
          Shuffle
        </button>

        <div>
          <textarea
            rows="5"
            value={shuffleVal}
            placeholder="Shuffled data"
            readOnly
          />
          <p>
            Data Byte size: <span>{shuffleBytes}</span> bytes
          </p>
        </div>

        <div>
          <textarea
            rows="5"
            value={keyVal}
            placeholder="Rotation Key"
            readOnly
          />
          <p>
            Key Byte size: <span>{keyBytes}</span> bytes
          </p>
        </div>
      </section>

      <section>
        <h2>AES-GCM Encryption</h2>
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
            value={dataEncVal}
            placeholder="Encrypted Data"
            readOnly
          />
          <p>
            Data Byte size: <span>{dataEncBytes}</span> bytes
          </p>
          <button className="encode" onClick={() => handleEncryption('data')}>
            Encrypt Data
          </button>
        </div>

        <div>
          <input ref={pwKeyRef} placeholder="Password for Key" />
          <textarea
            rows="5"
            value={keyEncVal}
            placeholder="Encrypted Key"
            readOnly
          />
          <p>
            Key Byte size: <span>{keyEncBytes}</span> bytes
          </p>
          <button className="encode" onClick={() => handleEncryption('key')}>
            Encrypt Key
          </button>
        </div>
      </section>

      <section id="qr">
        <h2>Download</h2>
        <div className="qr-container">
          <div>
            <div className="padding">
              <h3>Data</h3>
              <textarea
                rows="5"
                value={dataOutput}
                placeholder="Data output"
                readOnly
              />
              <p>
                Data Byte size: <span>{dataOutputBytes}</span> bytes
              </p>
              <p>
                Error Correction Level: {dataCorrection}
              </p>
            </div>
            <div className={`padding ${dataOutputBytes === 0 ? 'hidden' : ''}`}>
              <div className="flex g1">
                <button onClick={() => handleSaveFile("data")}> Download .ec </button>
              </div>
              <button
                onClick={() => handleGenerate("data", dataOutput, dataOutputBytes)}
                className={`${dataOutputBytes === 0 || dataOutputBytes > 2900 ? 'hidden' : ''}`}
              >
                Generate QR
              </button>
            </div>
            <div id="qr-data" className='qr-code' ref={dataContainerRef}></div>
            <div className={`padding ${!showDownloadData ? 'hidden' : ''}`}>
              <button onClick={() => handleQrDownload("data")}>Download QR</button>
            </div>
          </div>
          <div>
            <div className="padding">
              <h3>Key</h3>
              <textarea
                rows="5"
                value={keyOutput}
                placeholder="Key output"
                readOnly
              />
              <p>
                Key Byte size: <span>{keyOutputBytes}</span> bytes
              </p>
              <p>
                Error Correction Level: {keyCorrection}
              </p>
            </div>
            <div className={`padding ${keyOutputBytes === 0 ? 'hidden' : ''}`}>
              <div className="flex g1">
                <button onClick={() => handleSaveFile("key")}> Download .ec </button>
              </div>
              <button
                onClick={() => handleGenerate("key", keyOutput, keyOutputBytes)}
                className={`${keyOutputBytes === 0 || keyOutputBytes > 2900 ? 'hidden' : ''}`}
              >
                Generate QR
              </button>
            </div>
            <div id="qr-key" className='qr-code' ref={keyContainerRef}></div>
            <div className={`padding ${!showDownloadKey ? 'hidden' : ''}`}>
              <button onClick={() => handleQrDownload("key")}>Download QR</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default QuantShuffleEnc;
