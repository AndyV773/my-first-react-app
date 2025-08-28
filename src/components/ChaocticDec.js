import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { uploadEncFile, saveFileAsExt, detectFileExtension } from '../utils/fileUtils';
import { useByteCounter, ThemeToggle } from '../utils/uiHelpers';
import { textDecoder, base64ToUint8 } from '../utils/cryptoUtils';


const ChaoticDec = ({ showMsg, theme, onToggleTheme, showLoader }) => {
    // Input/file state
    const [fileInfo, setFileInfo] = useState(null);
    const [fileInput, setFileInput] = useState(null);
    const [textInput, setTextInput] = useState('');
    const [dataInput, setDataInput] = useState('');
    const [utf8Preview, setUtf8] = useState(''); // content decoded from file
    const [dataInputVal, setDataInputVal] = useState('');
    const [detectedExt, setDetectedExt] = useState("");

    const [outputData, setOutputData] = useState('');
    const [outputVal, setOutputVal] = useState('');
    
    // Byte counts
    const [inputBytes, setInputBytes] = useState('');
    const [outputBytes, setOutputBytes] = useState(0);
    
    useByteCounter(dataInput, setInputBytes);
    useByteCounter(outputVal, setOutputBytes);

    // Refs
    const workerRef = useRef(null);
    const keyRef = useRef(null);

    const handleKey = useCallback(() => {
        let input = keyRef.current.value.trim();
        const str = input.split(",");

        // Check length
        if (str.length < 9) {
            showMsg(`Error: Key length ${str.length}, is too short`, true);
            return;
        } else if (str.length > 9) {
            showMsg(`Error: Key length ${str.length}, is too long`, true);
            return;
        } 

        // Validate first 5 (must be > 0)
        for (let i = 1; i <= 5; i++) {
            const num = Number(str[i]);
            if (isNaN(num) || num <= 0) {
                showMsg(`Error: Value ${i} must be a number > 0`, true);
                return;
            }
        }

        // Validate next 2 (must be 0 or 1)
        for (let i = 6; i <= 7; i++) {
            const num = Number(str[i]);
            if (num !== 0 && num !== 1) {
                showMsg(`Error: Value ${i} must be 0 or 1`, true);
                return;
            }
        }

        // Validate chunks (must be 3–12)
        const chunks = Number(str[8]);
        if (isNaN(chunks) || chunks < 3 || chunks > 12) {
            showMsg("Error: Last value must be between 3 and 12", true);
            return;
        }

        const keyData = {
            keyInput: str[0],
            hash1Iterations: Number(str[1]),
            hash2Iterations: Number(str[2]),
            depth: Number(str[3]),
            phase: Number(str[4]),
            sizeIterations: Number(str[5]),
            xor: Number(str[6]),
            reverse: Number(str[7]),
            chunkSize: Number(str[8]),
        };

        return keyData;
    }, [showMsg] );

    
    const handleUpload = async (type, e) => {
        const file = e.target.files?.[0];
        // reset
        setFileInput("");
        setFileInfo(null);
        setTextInput("");
        setDataInput("");
        setDataInputVal("");
        setUtf8("");
        e.target.value = ""; // Clear file input

        if (!file) return;

        const result = await uploadEncFile(file, {
            onFileInfo: setFileInfo,
            onText: setUtf8,
            onDataLoaded: setFileInput,
        });

        if (result?.error) {
            showMsg(`${type} upload failed: ${result.error}`, true);
            // reset
            setFileInput("");
            setFileInfo(null);
            setDataInput("");
            setDataInputVal("");
            setUtf8("");
            return;
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setTextInput(value);
    };
    
    useEffect(() => {
        // If a file is loaded
        if (fileInput) {
            setDataInput(fileInput);
            setDataInputVal(utf8Preview);
        } else if (textInput) {
            setDataInput(textInput);
            setDataInputVal(textInput);
        }
    }, [fileInput, textInput, utf8Preview, showMsg]);


    function isBase64(str) {
        if (typeof str !== "string") return false;
        // Base64 regex pattern
        const base64Regex = /^(?:[A-Za-z0-9+/]{4})*?(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
        return base64Regex.test(str);
    }

    const handleDecryption = useCallback(() => {
        let input;
        const keyData = handleKey();
        if (!keyData) return;
        if (!workerRef.current) return;
        if (!dataInput) {
            showMsg("Error: No data.", true);
            return;
        }

        setOutputData("");
        setOutputVal("");
        setDetectedExt(null);
    
        if (!textInput) {
            input = dataInput;
            if (isBase64(utf8Preview)) {
                try {
                    input = base64ToUint8(utf8Preview);
                } catch (err) {
                    showMsg("Error Base64 input invalid: " + err, true);
                    return;
                }
            }
        } else {
            try {
                input = base64ToUint8(textInput);
            } catch (err) {
                showMsg("Error Base64 input invalid: " + err, true);
                return;
            }
        }

        showLoader({ show: true, mode: 'Decoding', type: "radar decode", emoji: '🧩', bytes: 500000 });

        workerRef.current.postMessage({
            type: "decode",
            load: { dataInput: input, keyInput: keyData.keyInput},
            ...keyData,
        });
    }, [dataInput, textInput, utf8Preview, handleKey, showMsg, showLoader]);


    useEffect(() => {
        workerRef.current = new Worker(
            new URL('../workers/chaoticWorker.worker.js', import.meta.url),
            { type: 'module'}
        );

        const onMessage = async (e) => {
            const { type, result, error } = e.data;
            if (type === "done-decode") {
                const { dataOutput } = result;

                if (dataOutput.length === 0) {
                    showLoader({ show: false });
                    showMsg("Error: Decoding failed", true);
                    return
                }

                const ext = await detectFileExtension(dataOutput);
                
                // Set state and UI
                setDetectedExt(ext);
                setOutputVal(textDecoder(dataOutput));
                setOutputData(dataOutput);
                
                showMsg('Decryption Complete!', false);
                setTimeout(() => showLoader({ show: false }), 2000);
            } else if (type === 'error') {
                showMsg('Error decryption failed: ' + error, true);
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
                    <Link to="/chaotic-enc">Encode</Link>
                </div>
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </nav>

            <div className="learn-more">
                <h2>Chaotic Encoder</h2>
                <Link to="/about#about-chaotic-enc">Learn more</Link>
            </div>

            <section>
                <h2>Decode</h2>
                <p>Upload .ec file or input Base64</p>

                <label htmlFor="data-upload">Upload data:</label>
                <input type="file" id="data-upload" onChange={(e) => handleUpload("data", e)} />
                {fileInfo && (
                    <p className="file-info">
                        File: {fileInfo.name}, Type: {fileInfo.type}, Size: {fileInfo.size}
                    </p>
                )}
                <textarea
                    rows="5"
                    value={dataInputVal}
                    onChange={handleInputChange}
                    placeholder="Enter Base64..."
                />
                <p>
                    Byte size: <span>{inputBytes}</span> bytes
                </p>
                <label>
                    Enter 9 comma seperated values:
                    <input
                        ref={keyRef}
                        placeholder='key,1,1,1,1,1,0,0,3'
                        required
                    />
                </label>
                <button className="decode" onClick={() => handleDecryption()}>Decrypt</button>
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

export default ChaoticDec;
