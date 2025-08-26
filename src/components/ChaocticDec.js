import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { uploadEncFile, saveFileAsExt, detectFileExtension } from '../utils/fileUtils';
import { useByteCounter, ThemeToggle } from '../utils/uiHelpers';
import { textDecoder, base64ToUint8 } from '../utils/cryptoUtils';


const ChaoticDec = ({ showMsg, theme, onToggleTheme, showLoader }) => {
    // Input/file state
    const [fileInfo, setFileInfo] = useState(null);
    const [fileInput, setFileInput] = useState(null);
    const [dataInput, setDataInput] = useState('');
    const [utf8Preview, setUtf8] = useState(''); // content decoded from file
    const [dataInputVal, setDataInputVal] = useState('');
    const [detectedExt, setDetectedExt] = useState("");

    const [decodeBase64, setDecodeBase64] = useState("");
    const [outputData, setOutputData] = useState('');
    const [outputVal, setOutputVal] = useState('');

    const [hash1Iterations, setHash1Iterations] = useState(1);
    const [hash2Iterations, setHash2Iterations] = useState(1);
    const [depth, setDepth] = useState(1);
    const [phase, setPhase] = useState(1);
    const [sizeIterations, setSizeIterations] = useState(1);
    const [xor, setXor] = useState(false);
    const [reverse, setReverse] = useState(false);
    const [chunkSize, setChunkSize] = useState(3);
    
    // Byte counts
    const [inputBytes, setInputBytes] = useState('');
    const [outputBytes, setOutputBytes] = useState(0);
    
    useByteCounter(dataInput, setInputBytes);
    useByteCounter(outputVal, setOutputBytes);

    // Refs
    const workerRef = useRef(null);
    const keyRef = useRef(null);

    const handleInput = (input) => {
        input = input.trim();

        if (input.includes("#1=")) {
            const parts = input.split(",");
            keyRef.current = parts[0]; // first part is key
            parts.slice(1).forEach((part) => {
                const [k, v] = part.split("=");
                const value = v === "true" ? true : v === "false" ? false : Number(v);
                switch (k) {
                    case "#1":
                        setHash1Iterations(value);
                        break;
                    case "#2":
                        setHash2Iterations(value);
                        break;
                    case "d":
                        setDepth(value);
                        break;
                    case "p":
                        setPhase(value);
                        break;
                    case "l":
                        setSizeIterations(value);
                        break;
                    case "x":
                        setXor(value);
                        break;
                    case "r":
                        setReverse(value);
                        break;
                    case "c":
                        setChunkSize(value);
                        break;
                    default:
                        break;
                }
            });
        } else {
            const parts = input.split(",");
            keyRef.current = parts[0];
            setHash1Iterations(Number(parts[1]));
            setHash2Iterations(Number(parts[2]));
            setDepth(Number(parts[3]));
            setPhase(Number(parts[4]));
            setSizeIterations(Number(parts[5]));
            setXor(parts[6] === "true");
            setReverse(parts[7] === "true");
            setChunkSize(Number(parts[8]));
        }
    };
    
    const handleUpload = async (type, e) => {
        const file = e.target.files?.[0];
        // reset
        setFileInput("");
        setFileInfo(null);
        setDataInput("");
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
            setUtf8("");
            return;
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;

        setDecodeBase64(false);
        setFileInput("");
        setFileInfo(null);
        setDataInput("");
        setDataInput(value);
        setDataInputVal(value);
    };
    
    // Sync file content into dataInput once when file loads
    useEffect(() => {
        if (fileInput) {
            setDataInputVal(utf8Preview)
            setDataInput(fileInput);
        } else {
            setDataInputVal("");
        }
    }, [fileInput, utf8Preview]);

    useEffect(() => {
        if (!dataInput) return;

        if (decodeBase64) {
            try {
                const decoded = base64ToUint8(utf8Preview);
                setDataInputVal(textDecoder(decoded));
                setDataInput(decoded);
            } catch (err) {
                showMsg("Error: Invalid Base64 input", true);
            }
        }
    }, [decodeBase64, dataInput, utf8Preview, showMsg]);

    const handleDecryption = useCallback(() => {
        if (!workerRef.current) return;
        if (!dataInput || !keyRef.current) {
            showMsg("No data.", true);
            return;
        }  
        setOutputData("");
        setDetectedExt(null);

        showLoader({ show: true, mode: 'Decoding', type: "radar decode", emoji: '🧩', bytes: 500000 });

        const keyInput = keyRef.current.value;

        workerRef.current.postMessage({
            type: "decode",
            load: { dataInput, keyInput},
            hash1Iterations,  
            hash2Iterations,
            depth,
            phase,
            sizeIterations,
            
            chunkSize,  
        });
    }, [dataInput, hash1Iterations, hash2Iterations, depth, phase, sizeIterations, chunkSize, showMsg, showLoader]);


    useEffect(() => {
        workerRef.current = new Worker(
            new URL('../workers/chaoticWorker.worker.js', import.meta.url),
            { type: 'module'}
        );

        const onMessage = async (e) => {
            const { type, result, error } = e.data;
            if (type === "done-decode") {
                const { dataOutput } = result;

                if (dataOutput.length === 0) return showMsg("Error decoding", true);

                const ext = await detectFileExtension(dataOutput);
                
                // Set state and UI
                setDetectedExt(ext);
                setOutputVal(textDecoder(dataOutput));
                setOutputData(dataOutput);
                
                showMsg('Decryption Complete!', false);
                setTimeout(() => showLoader({ show: false }), 2000);
            } else if (type === 'error') {
                showMsg('Decryption failed: ' + error, true);
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
                <p>Upload .ec file or input text</p>

                <label htmlFor="data-upload">Upload data:</label>
                <input type="file" id="data-upload" onChange={(e) => handleUpload("data", e)} />
                {fileInfo && (
                    <p className="file-info">
                        File: {fileInfo.name}, Type: {fileInfo.type}, Size: {fileInfo.size}
                    </p>
                )}
                <label>
                    Decode Base64
                    <input
                        type="checkbox"
                        checked={decodeBase64}
                        onChange={(e) => setDecodeBase64(e.target.checked)}
                    />
                </label>
                <textarea
                    rows="5"
                    value={dataInputVal}
                    onChange={handleInputChange}
                    placeholder="Enter text..."
                />
                <p>
                    Byte size: <span>{inputBytes}</span> bytes
                </p>
            
                <textarea
                    rows={4}
                    placeholder='hello,#1=1,#2=1,d=1,p=1,l=1,x=false,r=false,c=3'
                    onBlur={(e) => handleInput(e.target.value)}
                />

                <div className='key grid'>
                    <label>
                        Key:
                        <input 
                            ref={keyRef} 
                            placeholder="Enter key"
                            autoComplete='off'
                        />
                    </label>
                    <label>
                        Hash #1=:
                        <input 
                            type="number" 
                            value={hash1Iterations || ""} 
                            onChange={(e) => setHash1Iterations(Number(e.target.value))} 
                            placeholder="Enter hash 1" 
                            autoComplete="off"
                        />
                    </label>
                    <label>
                        Hash #2=:
                        <input 
                            type="number" 
                            value={hash2Iterations || ""} 
                            onChange={(e) => setHash2Iterations(Number(e.target.value))} 
                            placeholder="Enter hash 2" 
                            autoComplete="off"
                        />
                    </label>
                    <label>
                        Depth d=:
                        <input 
                            type="number" 
                            value={depth || ""} 
                            onChange={(e) => setDepth(Number(e.target.value))} 
                            placeholder="Enter depth" 
                            autoComplete="off"
                        />
                    </label>
                    <label>
                        Phase p=:
                        <input 
                            type="number" 
                            value={phase || ""} 
                            onChange={(e) => setPhase(Number(e.target.value))} 
                            placeholder="Enter phase" 
                            autoComplete="off"
                        />
                    </label>
                    <label>
                        Length l=:
                        <input 
                            type="number" 
                            value={sizeIterations || ""} 
                            onChange={(e) => setSizeIterations(Number(e.target.value))} 
                            placeholder="Enter size iterations" 
                            autoComplete="off"
                        />
                    </label>
                </div>
                <label>
                    Use XOR:
                    <input
                        type="checkbox"
                        checked={xor}
                        onChange={(e) => setXor(e.target.checked)}
                    />
                </label>
                <label>
                    Reverse key:
                    <input
                        type="checkbox"
                        checked={reverse}
                        onChange={(e) => setReverse(e.target.checked)}
                    />
                </label>
                <br/>
                <br/>
                <label htmlFor="digitOption">Chunk size: </label>
                <select
                    id="digitOption"
                    value={chunkSize}
                    onChange={(e) => setChunkSize(Number(e.target.value))}
                >
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                    <option value={6}>6</option>
                    <option value={7}>7</option>
                    <option value={8}>8</option>
                    <option value={9}>9</option>
                    <option value={10}>10</option>
                    <option value={11}>11</option>
                </select>
                <button className="decode" onClick={() => handleDecryption()}>
                    Decrypt
                </button>
            </section>
                {/* className={`${outputBytes === 0 ? 'hidden' : ''}`} */}
            <section > 
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
