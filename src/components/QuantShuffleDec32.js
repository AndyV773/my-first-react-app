import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { uploadEncFile32, saveFileAsExt } from '../utils/fileUtils';
import { textDecoder } from '../utils/cryptoUtils';
import { useByteCounter, ThemeToggle } from '../utils/uiHelpers';


const QuantShuffleDec32 = ({ showMsg, theme, onToggleTheme, showLoader }) => {
    // Input/file state
    const [fileInfoData, setFileInfoData] = useState(null);
    const [fileInfoKey, setFileInfoKey] = useState(null);
    const [dataInputVal, setDataInputVal] = useState('');
    const [dataInput, setDataInput] = useState('');
    const [keyInputVal, setKeyInputVal] = useState('');
    const [keyInput, setKeyInput] = useState('');
    
    const [detectedExt, setDetectedExt] = useState("");
    const [outputVal, setOutputVal] = useState('');
    const [outputData, setOutputData] = useState('');

    // Byte counts
    const [dataBytes, setDataBytes] = useState(0);
    const [keyBytes, setKeyBytes] = useState(0);
    const [outputBytes, setOutputBytes] = useState(0);
    
    useByteCounter(dataInputVal, setDataBytes);
    useByteCounter(keyInputVal, setKeyBytes);
    useByteCounter(outputVal, setOutputBytes);

    // Refs
    const workerRef = useRef(null);

    const handleUpload = async (type, e) => {
        const file = e.target.files?.[0];
        let setInfo, setData, setDataVal, setKey, setKeyVal;

        if (type === "data") {
            setFileInfoData(null);
            setInfo = setFileInfoData;
            setData = setDataInput;
            setDataVal = setDataInputVal;
        } else if (type === "key") {
            setFileInfoKey(null);
            setInfo = setFileInfoKey;
            setKey = setKeyInput;
            setKeyVal = setKeyInputVal;
        }

        e.target.value = ""; // Clear file input

        if (!file) return;

        const result = await uploadEncFile32(file, {
            onFileInfo: setInfo,
            onUint32: setData,
            onText: setDataVal,
            onInt32: setKey,
            onTextInt: setKeyVal,
        });
        
        if (result?.error) {
            showMsg(`${type} upload failed: ${result.error}`, true);
            setInfo(null);
            return;
        }
    };


    const handleUnshuffle = useCallback(() => {
        if (!workerRef.current) return;
        if (!dataInput || !keyInput) {
            showMsg("No data.", true);
            return;
        }

        showLoader({ show: true, mode: 'Decoding', type: "loader decode", emoji: '🧩', bytes: keyBytes });

        workerRef.current.postMessage({
            type: "unshuffle",
            load: { 
                shuffled: dataInput, 
                key: keyInput, 
            },
        });
    }, [dataInput, keyInput, showMsg, showLoader, keyBytes]);

    useEffect(() => {
        workerRef.current = new Worker(
            new URL('../workers/cryptoWorkerUnit32.worker.js', import.meta.url),
            { type: 'module'}
        );

        const onMessage = (e) => {
            const { type, result, error } = e.data;
            if (type === "done-unshuffle") {
                const { origin, ext } = result;

                // Set state and UI
                setDetectedExt(ext);
                setOutputVal(textDecoder(origin));
                setOutputData(origin);
                
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

    const handleSaveFile = () => {
        saveFileAsExt(outputData, detectedExt);
    }

  return (
    <main className="container">
        <nav>
            <div className="flex g1">
            <Link to="/">Home</Link>
            <Link to="/quant-shuffle-enc-32">Encode</Link>
            </div>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </nav>

        <div className="learn-more">
            <h2>Quantum Shuffle Uint32</h2>
            <Link to="/about#about-quant-shuffle-32">Learn more</Link>
        </div>

        <section>
            <h2>Decode</h2>
            <p>Upload .ec32 file</p>

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
            
            <textarea id="data-input" value={dataInputVal} rows="5" placeholder="Encrypted data" readOnly></textarea>
            <p>
                Data byte size: <span>{dataBytes}</span> bytes
            </p>
            <textarea id="key-input" value={keyInputVal} rows="5" placeholder="Encrypted Key" readOnly></textarea>
            <p>
                Key byte size: <span>{keyBytes}</span> bytes
            </p>
            <button className="decode" onClick={handleUnshuffle}>Unshuffle</button>
        </section>

        <section>
            <textarea
                rows="5"
                value={outputVal}
                placeholder="Shuffled data"
                readOnly
            />
            <p>
                Data Byte size: <span>{outputBytes}</span> bytes
            </p>
            <p>
                Detected file type: {detectedExt ? `${detectedExt}` : "(none)"}
            </p>
    
            <div className={`padding ${outputBytes === 0 ? 'hidden' : ''}`}>
                <button onClick={() => handleSaveFile("key")}> Save as {detectedExt}</button>
            </div>
        </section>
    </main>
  );
};

export default QuantShuffleDec32;
