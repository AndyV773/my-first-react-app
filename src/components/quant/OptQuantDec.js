import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { uploadEncFile, saveFileAsExt } from 'utils/fileUtils';
import { useByteCounter, ThemeToggle } from 'utils/uiHelpers';
import { textDecoder } from 'utils/cryptoUtils';


const OptQuantDec = ({ showMsg, theme, onToggleTheme, showLoader }) => {
  // Input/file state
  const [fileInfoData, setFileInfoData] = useState(null);
  const [fileInfoKey, setFileInfoKey] = useState(null);
  const [dataInput, setDataInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [detectedExt, setDetectedExt] = useState("");
  

  // Byte counts
  const [keyBytes, setKeyBytes] = useState(0);

  const [outputVal, setOutputVal] = useState('');
  const [outputData, setOutputData] = useState('');
  const [outputBytes, setOutputBytes] = useState(0);
  
  useByteCounter(keyInput, setKeyBytes);
  useByteCounter(outputData, setOutputBytes);


  // Refs
  const workerRef = useRef(null);
  const pwDataRef = useRef(null);
  const pwKeyRef = useRef(null);


    const handleUpload = async (type, e) => {
        const file = e.target.files?.[0];
        let setInfo;
        let setData;

        if (type === "data") {
            setFileInfoData(null);
            setInfo = setFileInfoData;
            setData = setDataInput;
        } else if (type === "key") {
            setFileInfoKey(null);
            setInfo = setFileInfoKey;
            setData = setKeyInput;            
        }

        e.target.value = ""; // Clear file input

        if (!file) return;

        const result = await uploadEncFile(file, {
            onFileInfo: setInfo,
            onDataLoaded: setData,
        });

        if (result?.error) {
            showMsg(`Error: ${type} upload failed. ${result.error}`, true);
            setInfo(null);
            setData("");
            return;
        }
    };


    useEffect(() => {
        workerRef.current = new Worker(
            new URL('../../workers/cryptoWorker.worker.js', import.meta.url),
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
                
                showMsg('Decryption Complete!', false);
                setTimeout(() => showLoader({ show: false }), 2000);
            } else if (type === 'error') {
                showMsg('Error: Decryption failed. ' + error, true);
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


    const handleDecryption = useCallback(() => {
        if (!workerRef.current) return;
        if (!dataInput || !keyInput) {
            showMsg("Error: No data.", true);
            return;
        }

        if (!pwDataRef.current.value || !pwKeyRef.current.value) {
            showMsg("Error: Enter decryption Keys.", true);
            return;
        }
        
        setOutputData("");
        setDetectedExt(null);

        showLoader({ show: true, mode: 'Decoding', type: "radar decode", emoji: '🧪', bytes: keyBytes });

        workerRef.current.postMessage({
            type: "unshuffle",
            load: { 
                shuffled: dataInput, 
                key: keyInput, 
            },
            dataPw: pwDataRef.current.value,
            keyPw: pwKeyRef.current.value,
        });
    }, [dataInput, keyInput, showMsg, showLoader, keyBytes]);


    const handleSaveFile = () => {
        saveFileAsExt(outputData, detectedExt);
    }

    return (
        <main className="container">
            <nav>
                <div className="flex g1">
                    <Link to="/">Home</Link>
                    <Link to="/opt-quant-enc">Encode</Link>
                </div>
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </nav>

            <div className="learn-more">
                <h2>Optimised Quantum Shuffle</h2>
                <Link to="/about#about-opt-quant">Learn more</Link>
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
                
                <input ref={pwDataRef} placeholder="Password for Data" />
                <input ref={pwKeyRef} placeholder="Password for Key" />
                <button className="decode" onClick={() => handleDecryption()}>
                    Decrypt
                </button>
            </section>

            <section className={`${outputBytes === 0 ? 'hidden' : ''}`}>
                <textarea
                    rows="5"
                    value={outputVal}
                    placeholder="Data output"
                    readOnly
                />
                <p>
                    Data Byte size: <span>{outputBytes}</span> bytes
                </p>
                <p>
                    Detected file type: {detectedExt ? `${detectedExt}` : "(none)"}
                </p>
            
                <button onClick={() => handleSaveFile()}>Download .{detectedExt}</button>
            </section>
        </main>
    );
};

export default OptQuantDec;
