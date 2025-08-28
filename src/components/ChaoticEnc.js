import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { uploadFile, saveFileAsEc } from '../utils/fileUtils';
import { textEncoder, textDecoder, uint8ToBase64 } from '../utils/cryptoUtils';
import { useByteCounter, ThemeToggle } from '../utils/uiHelpers';


const ChaoticEnc = ({ showMsg, theme, onToggleTheme, showLoader }) => {
    // Input/file state
    const [fileInput, setFileInput] = useState(""); 
    const [fileInfo, setFileInfo] = useState(null);
    const [utf8Preview, setUtf8] = useState(''); // content decoded from file
    const [dataInput, setDataInput] = useState('');
    const [dataInputVal, setDataInputVal] = useState('');

    const [elapsedTime, setElapsedTime] = useState(null);
    const timerRef = useRef(0);
    
    // Encryption state
    const [dataOutput, setDataOutput] = useState('');
    const [dataOutputVal, setDataOutputVal] = useState("");
    const [base64, setBase64] = useState("");
    const [storeBase64, setStoreBase64] = useState(false);
    
    // Byte counts
    const [inputBytes, setInputBytes] = useState(0);
    const [outputBytes, setOutputBytes] = useState("");
    useByteCounter(dataInputVal, setInputBytes);
    useByteCounter(dataOutput, setOutputBytes);
    
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
        const keyData = handleKey();
        if (!keyData) return;
        if (!workerRef.current) return;
        if (!dataInput) {
            showMsg("Error: No data.", true);
            return;
        }

        // Record start time
        timerRef.current = performance.now();

        showLoader({ show: true, mode: 'Encoding', type: "radar encode", emoji: '🛡️', bytes: 500000 });

        workerRef.current.postMessage({
            type: "encode",
            load: { dataInput, keyInput: keyData.keyInput },
            ...keyData,
        });
    }, [dataInput, handleKey, showMsg, showLoader]);
    

    useEffect(() => {
        workerRef.current = new Worker(
            new URL('../workers/chaoticWorker.worker.js', import.meta.url),
            { type: 'module'}
        );

        const onMessage = (e) => {
            const { type, result, error } = e.data;
            if (type === "done-encode") {
                const { dataOutput } = result;

                const endTime = performance.now();
                const timeMs = endTime - timerRef.current; // elapsed time in milliseconds
                const minutes = Math.floor(timeMs / 60000);
                const seconds = Math.floor((timeMs % 60000) / 1000);
                const milliseconds = Math.floor(timeMs % 1000);

                setElapsedTime({ minutes, seconds, milliseconds });
                
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
            const base64Data = uint8ToBase64(dataOutput)
            setBase64(base64Data);
            setDataOutputVal(base64Data);
        } else if (dataOutput !== "") {
            setStoreBase64(false); 
            setDataOutputVal(textDecoder(dataOutput));
        }
    }, [storeBase64, dataOutput, showMsg]);


    const handleSaveFile = () => {
        if (!dataOutput) return showMsg("Nothing to save.", true);
        if (storeBase64) {
            saveFileAsEc(base64);
        } else {
            saveFileAsEc(dataOutput);
        };
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
                <p>For more information on the key input and how it works head over to <Link to="/key-stretcher">Chaotic Key Stretcher</Link>.</p>
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
                <label>
                    Enter key params - 9 comma seperated values:
                    <input
                        ref={keyRef}
                        placeholder='key,1,1,1,1,1,0,0,3'
                        required
                    />
                </label>
                <button className="encode" onClick={() => handleEncryption()}>Encrypt</button>
            </section>

            <section className={`${outputBytes === 0 ? 'hidden' : ''}`}>
                <h2>Output</h2>
                {elapsedTime && (
                    <p>Time taken: {elapsedTime.minutes}m {elapsedTime.seconds}s {elapsedTime.milliseconds}ms</p>
                )}

                <p><strong>The data is only safe to copy if it is in Base64 format. Convert it to Base64 before copying or save it as a file.</strong></p>

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
