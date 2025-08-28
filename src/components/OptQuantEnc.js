import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { uploadFile, saveFileAsEc, downloadQrCode } from '../utils/fileUtils';
import { uint8ToBase64 } from '../utils/cryptoUtils';
import { useByteCounter, ThemeToggle, generateQrCode, getQrCorrectionInfo } from '../utils/uiHelpers';


const OptQuantEnc = ({ showMsg, theme, onToggleTheme, showLoader }) => {
  // Input/file state
  const [input, setInput] = useState(""); 
  const [fileInput, setFileInput] = useState(""); 
  const [fileInfo, setFileInfo] = useState(null);
  const [dataInput, setDataInput] = useState('');

  // Encryption state
  const [dataOutput, setDataOutput] = useState('');
  const [keyOutput, setKeyOutput] = useState('');

  // Byte counts
  const [inputBytes, setInputBytes] = useState(0);
  const [dataOutputBytes, setDataOutputBytes] = useState(0);
  const [keyOutputBytes, setKeyOutputBytes] = useState(0);
  
  useByteCounter(input, setInputBytes);
  useByteCounter(dataOutput, setDataOutputBytes);
  useByteCounter(keyOutput, setKeyOutputBytes);
  
  // Refs
  const workerRef = useRef(null);
  const allCharRef = useRef(null);
  const pwDataRef = useRef(null);
  const pwKeyRef = useRef(null);
  const dataContainerRef = useRef(null);
  const keyContainerRef = useRef(null);

  // ui helpers
  const { level: dataLevel, label: dataCorrection } = getQrCorrectionInfo(dataOutputBytes);
  const { level: keyLevel, label: keyCorrection } = getQrCorrectionInfo(keyOutputBytes);
  const [showDownloadData, setShowDownloadData] = useState(false);
  const [showDownloadKey, setShowDownloadKey] = useState(false);
  

   // Handle file upload
    const handleUpload = (e) => {
        const file = e.target.files[0];
        // reset
        setFileInput("");
        setFileInfo(null);
        setDataInput("");
        setInput("");
        e.target.value = "";
        if (!file) return;

        uploadFile(file, {
            onFileInfo: setFileInfo,
            onBase64: setFileInput,
        });
    };


  // Sync file content into dataInput once when file loads
  useEffect(() => {
    if (fileInput) {
        setInput(fileInput);
    } else {
        setInput(dataInput);
    }
  }, [fileInput, dataInput]);
  

  useEffect(() => {
    workerRef.current = new Worker(
        new URL('../workers/cryptoWorker.worker.js', import.meta.url),
        { type: 'module'}
    );

    const onMessage = (e) => {
        const { type, encryptedData, encryptedKey, error } = e.data;
        if (type === "done-shuffle") {
            
            setDataOutput(encryptedData);
            setKeyOutput(encryptedKey);
            
            
            showMsg('Encryption Complete!', false);
            setTimeout(() => showLoader({ show: false }), 2000);
        } else if (type === 'error') {
            showMsg('Encryption failed: ' + error, true);
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


  const handleEncryption = useCallback(() => {
    if (!workerRef.current) return;
    console.log('input', input)
    if (!input) {
        showMsg("No data.", true);
        return;
    }

    if (!pwDataRef.current.value || !pwKeyRef.current.value) {
        showMsg("Enter encryption Keys.", true);
        return;
    }

    const allChar = allCharRef.current?.checked || false;
    showLoader({ show: true, mode: 'Encoding', type: "radar encode", emoji: '🛡️', bytes: inputBytes });

    workerRef.current.postMessage({
        type: "shuffle",
        load: { 
            input,  
            allChar, 
        },
        dataPw: pwDataRef.current.value,
        keyPw: pwKeyRef.current.value,
    });
  }, [input, showMsg, showLoader, inputBytes]);

  
  const handleGenerate = useCallback(async (type, input) => {
        let container;
        let level
        if (type === "data") {    
            container = dataContainerRef.current;
            level = dataLevel;
        } else if (type === "key") {   
            container = keyContainerRef.current;
            level = keyLevel;
        }
        const base64 = uint8ToBase64(input);
        try {
          await generateQrCode({
            input: base64,
            errorCorrectionLevel: level,
            container: container,
          });
          if (type === "data") setShowDownloadData(true);
          if (type === "key") setShowDownloadKey(true);
        } catch (err) {
          showMsg("QR generation failed: " + (err?.message || "unknown error"), true);
        }
    }, [dataLevel, keyLevel, showMsg]);


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
                <Link to="/opt-quant-dec">Decode</Link>
            </div>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </nav>

        <div className="learn-more">
            <h2>Optimised Quantum Shuffle</h2>
            <Link to="/about#about-opt-quant">Learn more</Link>
        </div>

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

            <textarea
                rows="5"
                value={dataInput}
                onChange={(e) => {
                    setInput("");
                    setFileInput("");
                    setFileInfo(null);
                    setDataInput(e.target.value);
                }}
                placeholder="Enter text..."
            />
            <p>
                Byte size: <span>{inputBytes}</span> bytes
            </p>

            <input ref={pwDataRef} placeholder="Password for Data" />
            <input ref={pwKeyRef} placeholder="Password for Key" />
            
            <button className="encode" onClick={() => handleEncryption()}>Encrypt</button>
        </section>

        <section className={`${dataOutputBytes === 0 ? 'hidden' : ''}`}>
            <h2>Download</h2>

            <h3>Data</h3>
            <p>
                Data Byte size: <span>{dataOutputBytes}</span> bytes
            </p>
            <p>
                Error Correction Level: {dataCorrection}
            </p>

            <button onClick={() => handleSaveFile("data")}>Download .ec</button>
            <button
                onClick={() => handleGenerate("data", dataOutput)}
                className={`${dataOutputBytes === 0 || dataOutputBytes > 2900 ? 'hidden' : ''}`}>
                Generate QR
            </button>

            <div id="qr-data" className='qr-code' ref={dataContainerRef}></div>

            <button 
                onClick={() => handleQrDownload("data")} 
                className={`${!showDownloadData ? 'hidden' : ''}`}>
                Download QR
            </button>

            <h3>Key</h3>
            <p>
                Key Byte size: <span>{keyOutputBytes}</span> bytes
            </p>
            <p>
                Error Correction Level: {keyCorrection}
            </p>

            <button onClick={() => handleSaveFile("key")}>Download .ec</button>
            <button
                onClick={() => handleGenerate("key", keyOutput)}
                className={`${keyOutputBytes === 0 || keyOutputBytes > 2900 ? 'hidden' : ''}`}>
                Generate QR
            </button>

            <div id="qr-key" className='qr-code' ref={keyContainerRef}></div>

            <button 
                onClick={() => handleQrDownload("key")} 
                className={`${!showDownloadKey ? 'hidden' : ''}`}>
                Download QR
            </button>
        </section>
    </main>
  );
};

export default OptQuantEnc;
