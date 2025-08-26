import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { uploadFile, saveFileAsEc } from '../utils/fileUtils';
import { textEncoder, textDecoder, uint8ToBase64 } from '../utils/cryptoUtils';
import { useByteCounter, ThemeToggle, PreCopyOutputBlock } from '../utils/uiHelpers';


const ChaoticEnc = ({ showMsg, theme, onToggleTheme, showLoader }) => {
    // Input/file state
    const [fileInput, setFileInput] = useState(""); 
    const [fileInfo, setFileInfo] = useState(null);
    const [dataInput, setDataInput] = useState('');
    const [utf8Preview, setUtf8] = useState(''); // content decoded from file
    const [dataInputVal, setDataInputVal] = useState('');

    const [keyInput, setKeyInput] = useState("");
    const [dataOutputVal, setDataOutputVal] = useState("");
    const [hash1Iterations, setHash1Iterations] = useState(1);
    const [hash2Iterations, setHash2Iterations] = useState(1);
    const [depth, setDepth] = useState(1);
    const [phase, setPhase] = useState(1);
    const [sizeIterations, setSizeIterations] = useState(1);
    const [chunkSize, setChunkSize] = useState(3);

    const [keyJoined, setKeyJoined] = useState("");
    const [chunks, setChunks] = useState("");
    const [elapsedTime, setElapsedTime] = useState(null);
    const timerRef = useRef(0);

    // Encryption state
    const [dataOutput, setDataOutput] = useState('');
    const [keyOutput, setKeyOutput] = useState("");
    const [storeBase64, setStoreBase64] = useState(false);
    
    // Byte counts
    const [inputBytes, setInputBytes] = useState(0);
    const [outputBytes, setOutputBytes] = useState("");
    
    useByteCounter(dataInputVal, setInputBytes);
    useByteCounter(dataOutput, setOutputBytes);
    
    // Refs
    const workerRef = useRef(null);
    const useXorRef = useRef(null);
    const reverseKeyRef = useRef(null);

    // Handle file upload
    const handleUpload = (e) => {
        const file = e.target.files[0];
        // reset
        setFileInput("");
        setFileInfo(null);
        setDataInput("");
        setUtf8("");
        e.target.value = "";
        if (!file) return;

        uploadFile(file, {
            onFileInfo: setFileInfo,
            onText: setUtf8,
            onDataLoaded: setFileInput,
        });
    };

    const handleInputChange = (e) => {
		const value = e.target.value;

		setFileInput("");
		setFileInfo(null);
		setDataInput("");
		setDataInput(textEncoder(value));
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


    const handleEncryption = useCallback(() => {
        if (!workerRef.current) return;
            console.log('input', dataInput)
        if (!dataInput || !keyInput) {
            showMsg("No input.", true);
            return;
        }
        if (!hash1Iterations || !hash2Iterations || !depth || !phase || !sizeIterations) {
            showMsg("Please correct values.", true);
            return;
        }

        // Record start time
        timerRef.current = performance.now();
        const useXor = useXorRef.current?.checked || false;
        const reverse = reverseKeyRef.current?.checked || false;

        showLoader({ show: true, mode: 'Encoding', type: "radar encode", emoji: '🛡️', bytes: 500000 });

        setKeyJoined(`${keyInput},#1=${hash1Iterations},#2=${hash2Iterations},d=${depth},p=${phase},l=${sizeIterations},x=${useXor},r=${reverse},c=${chunkSize}`)

        workerRef.current.postMessage({
            type: "encode",
            load: { dataInput, keyInput },
            hash1Iterations,  
            hash2Iterations,
            depth,
            phase,
            sizeIterations,
            useXor,
            reverse,
            chunkSize,  
        });
    }, [showMsg, showLoader, dataInput, keyInput, hash1Iterations, hash2Iterations, depth, phase, sizeIterations, chunkSize]);
    

    useEffect(() => {
        workerRef.current = new Worker(
            new URL('../workers/chaoticWorker.worker.js', import.meta.url),
            { type: 'module'}
        );

        const onMessage = (e) => {
            const { type, result, error } = e.data;
            if (type === "done-encode") {
                const { dataOutput, key } = result;

                const endTime = performance.now();
                const timeMs = endTime - timerRef.current; // elapsed time in milliseconds
                const minutes = Math.floor(timeMs / 60000);
                const seconds = Math.floor((timeMs % 60000) / 1000);
                const milliseconds = Math.floor(timeMs % 1000);

                setElapsedTime({ minutes, seconds, milliseconds });

                console.log('key out',key)

                setKeyOutput(key);

                // const keyChunks = key.split(",");
                const keyChunks = key;
                setChunks(keyChunks.length);
                
                setDataOutput(dataOutput);
                setDataOutputVal(textDecoder(dataOutput));
                
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

    
    useEffect(() => {
        if (storeBase64) {
            const base64Data =
                typeof dataOutput === "string" ? dataOutput : uint8ToBase64(dataOutput);

            setDataOutputVal(base64Data);
            setDataOutput(base64Data);
        } else {
            if (dataOutput !== '' && typeof dataOutput === "string") {
                showMsg("Error: Data converted to Base64", true);
                setStoreBase64(true); 
            }
        }
    }, [storeBase64, dataOutput, showMsg]);


    const handleSaveFile = () => {
        if (!dataOutput) return showMsg("Nothing to save.", true);
        saveFileAsEc(dataOutput);
    }

    return (
        <main className="container">
            <nav>
                <div className="flex g1">
                    <Link to="/">Home</Link>
                    <Link to="/chaotic-dec">Decode</Link>
                </div>
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </nav>

            <div className="learn-more">
                <h2>Chaotic Encoder</h2>
                <Link to="/about#about-chaotic-enc">Learn more</Link>
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

                <textarea
					rows="5"
					value={dataInputVal}
					onChange={handleInputChange}
					placeholder="Enter text..."
				/>

                <p>
                    Byte size: <span>{inputBytes}</span> bytes
                </p>

                <input 
                    type="text" 
                    value={keyInput} 
                    onChange={(e) => setKeyInput(e.target.value)} 
                    placeholder="Enter key" 
                    autoComplete="off"
                />
        
                <p>Sha-512 iterations 0-inf:</p>
                <input 
                    type="number" 
                    value={hash1Iterations || ""} 
                    onChange={(e) => setHash1Iterations(Number(e.target.value))} 
                    placeholder="Enter sha-512 iterations" 
                    autoComplete="off"
                />
                <p>Sha3-512 iterations 0-inf:</p>
                <input 
                    type="number" 
                    value={hash2Iterations || ""} 
                    onChange={(e) => setHash2Iterations(Number(e.target.value))} 
                    placeholder="Enter sha3-515 iterations" 
                    autoComplete="off"
                />
                <h3>Chaotic Logistic Map</h3>
                <p>Depth 0-inf:</p>
                <input 
                    type="number" 
                    value={depth || ""} 
                    onChange={(e) => setDepth(Number(e.target.value))} 
                    placeholder="Enter depth" 
                    autoComplete="off"
                />
                <p>Phase 0-inf:</p>
                <input 
                    type="number" 
                    value={phase || ""} 
                    onChange={(e) => setPhase(Number(e.target.value))} 
                    placeholder="Enter phase" 
                    autoComplete="off"
                />
                <p>Size 0-inf:</p>
                <input 
                    type="number" 
                    value={sizeIterations || ""} 
                    onChange={(e) => setSizeIterations(Number(e.target.value))} 
                    placeholder="Enter size iterations" 
                    autoComplete="off"
                />
                <label>
                    Use XOR:
                    <input type="checkbox" id="xor" ref={useXorRef} />
                </label>
                <label>
                    Reverse key:
                    <input type="checkbox" id="reverse-key" ref={reverseKeyRef} />
                </label>
                <br/>
                <br/>
                <label htmlFor="digitOption">Select chunk size: </label>
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
                <p>Chunk size: {chunkSize}</p>
                <button className="encode" onClick={handleEncryption}>Generate key & encode</button>
                <div className={`${keyJoined ? '' : 'hidden'}`}>
                    <PreCopyOutputBlock outputId={"key-joined"} text={keyJoined} />
                </div>
            </section>

            <section className={`${outputBytes === 0 ? 'hidden' : ''}`}>
                <h2>Output</h2>
                {elapsedTime && (
                    <p>Time taken: {elapsedTime.minutes}m {elapsedTime.seconds}s {elapsedTime.milliseconds}ms</p>
                )}
                <p>Key chunks: {`${chunks? chunks : "0"}`}</p>
                <textarea
                    rows="10"
                    value={keyOutput}
                    placeholder="Encrypted Data"
                    readOnly
                />

                <h3>Data</h3>

                <label>
                    Convert to Base64
                    <input
                        type="checkbox"
                        checked={storeBase64}
                        onChange={(e) => setStoreBase64(e.target.checked)}
                    />
				</label>

                <textarea
					rows="5"
					value={dataOutputVal}
					placeholder="Data output"
					readOnly
				/>
                <p>
                    Data Byte size: <span>{outputBytes}</span> bytes
                </p>

                <button onClick={() => handleSaveFile()}>Download .ec</button>
            </section>
        </main>
    );
};

export default ChaoticEnc;
