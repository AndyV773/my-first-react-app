import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { saveFileAsEc32, formatBytes } from '../utils/fileUtils';
import { textEncoder, textDecoder } from '../utils/cryptoUtils';
import { useByteCounter, ThemeToggle } from '../utils/uiHelpers';


const QuantShuffleEnc32 = ({ showMsg, theme, onToggleTheme, showLoader }) => {
    // Input/file state
    const [fileInput, setFileInput] = useState(""); 
    const [fileInfo, setFileInfo] = useState(null);
    const [utf8Preview, setUtf8] = useState(''); // content decoded from file
    const [dataInputVal, setDataInputVal] = useState('');
    const [dataInput, setDataInput] = useState('');
    
    const [dataOutput, setDataOutput] = useState('');
    const [keyOutput, setKeyOutput] = useState('');

    // Byte counts
    const [inputBytes, setInputBytes] = useState(0);

    const [dataOutputVal, setDataOutputVal] = useState('');
    const [dataOutputBytes, setDataOutputBytes] = useState(0);

    const [keyOutputVal, setKeyOutputVal] = useState('');
    const [keyOutputBytes, setKeyOutputBytes] = useState(0);
    
    useByteCounter(dataInputVal, setInputBytes);
    useByteCounter(dataOutputVal, setDataOutputBytes);
    useByteCounter(keyOutputVal, setKeyOutputBytes);
    
    // Refs
    const workerRef = useRef(null);
    const allCharRef = useRef(null);
    
    
    // Handle file upload
    const handleUpload = async e => {
        const file = e.target.files[0];
        // reset
        setFileInput("");
        setFileInfo(null);
        setDataInput('');
        setDataInputVal('');
        setDataOutputVal("");
        setKeyOutputVal("");
        e.target.value = "";
        if (!file) return;

        const arrayBuffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer)
        const text = textDecoder(arrayBuffer);

        setUtf8(text);
        setFileInput(uint8);

        setFileInfo({
            name: file.name,
            type: file.type || 'unknown',
            size: formatBytes(file.size),
        });
        
    };
  

    const handleTextInputChange = (e) => {
        const value = e.target.value;

        setFileInput("");
        setFileInfo(null);
        setDataInput("");

        const uint8 = textEncoder(value);

        setDataInput(uint8);
        setDataInputVal(value);
    };
  

    // Sync file content into dataInput once when file loads
    useEffect(() => {
        if (fileInput) {
            setDataInputVal(utf8Preview);
            setDataInput(fileInput);
        } else {
            setDataInputVal("");
        }
    }, [fileInput, utf8Preview]);

    const handleShuffle = useCallback(() => {
        if (!workerRef.current) return;
        if (!dataInput) {
            showMsg("No data.", true);
            return;
        }

        const allChar = allCharRef.current?.checked || false;
        showLoader({ show: true, mode: 'Encoding', type: "loader encode", emoji: '🛡️', bytes: inputBytes });

        workerRef.current.postMessage({
            type: "shuffle",
            load: { 
                uint8: dataInput,  
                allChar, 
            },
        });
    }, [dataInput, showMsg, showLoader, inputBytes]);


    useEffect(() => {
        workerRef.current = new Worker(
            new URL('../workers/cryptoWorkerUnit32.worker.js', import.meta.url),
            { type: 'module'}
        );

        const onMessage = (e) => {
            const { type, result, error } = e.data;
            if (type === "done-shuffle") {
                const { shuffled, key,  } = result;
            
                // Set state and UI
                setDataOutputVal(textDecoder(shuffled));
                setKeyOutputVal(key);

                setDataOutput(shuffled);
                setKeyOutput(key);
                
                showMsg('Shuffle Complete!', false);
                setTimeout(() => showLoader({ show: false }), 2000);
            } else if (type === 'error') {
                showMsg('Error: Shuffle failed. ' + error, true);
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


    const handleSaveFile = (type) => {
        if (type === "data") {
            if (!dataOutput) return showMsg("Error: Nothing to save.", true);
            saveFileAsEc32(dataOutput, type);
        } else if (type === "key") {
            if (!keyOutput) return showMsg("Error: Nothing to save.", true);
            saveFileAsEc32(keyOutput, type);
        }
    }

  	return (
		<main className="container">
			<nav>
				<div className="flex g1">
					<Link to="/">Home</Link>
					<Link to="/quant-shuffle-dec-32">Decode</Link>
				</div>
					<ThemeToggle theme={theme} onToggle={onToggleTheme} />
			</nav>

			<div className="learn-more">
				<h2>Quantum Shuffle Uint32</h2>
				<Link to="/about#about-quant-shuffle-32">Learn more</Link>
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

				<div>
					<textarea
						rows="5"
						value={dataInputVal}
						onChange={handleTextInputChange}
						placeholder="Enter text..."
					/>
					<p>
						Byte size: <span>{inputBytes}</span> bytes
					</p>
				</div>

				<button className="encode" onClick={handleShuffle}>Shuffle</button>
			</section>
			<section className={dataOutputBytes === 0 ? "hidden" : ""}>
				<h3>Data</h3>
				<textarea
					rows="5"
					value={dataOutputVal}
					placeholder="Data output"
					readOnly
				/>
				<p>
					Data Byte size: <span>{dataOutputBytes}</span> bytes
				</p>
				<button onClick={() => handleSaveFile("data")}>Download .ec32</button>
				<h3>Key</h3>
				<textarea
					rows="5"
					value={keyOutputVal}
					placeholder="Key output"
					readOnly
				/>
				<p>
					Key Byte size: <span>{keyOutputBytes}</span> bytes
				</p>
				<button onClick={() => handleSaveFile("key")}>Download .ec32</button>
			</section>
		</main>
	);
};

export default QuantShuffleEnc32;
