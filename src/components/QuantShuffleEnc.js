import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { uploadFile, saveFileAsEc, downloadQrCode } from '../utils/fileUtils';
import { aesGcmEncrypt, compress, uint8ToBase64, textEncoder } from '../utils/cryptoUtils';
import { useByteCounter, ThemeToggle, generateQrCode, getQrCorrectionInfo } from '../utils/uiHelpers';


const QuantShuffleEnc = ({ showMsg, theme, onToggleTheme, showLoader }) => {
	// Input/file state
	const [fileInput, setFileInput] = useState(""); 
	const [fileInfo, setFileInfo] = useState(null);
	const [utf8Preview, setUtf8] = useState(''); // content decoded from file
	const [dataInputVal, setDataInputVal] = useState('');
	const [dataInput, setDataInput] = useState('');

	// Encryption state
	const [skipAES, setSkipAES] = useState(false);
	const [storeBase64, setStoreBase64] = useState(false);

	const [dataEnc, setDataEnc] = useState('');
	const [keyEnc, setKeyEnc] = useState('');

	const [dataOutput, setDataOutput] = useState('');
	const [keyOutput, setKeyOutput] = useState('');

	// Byte counts
	const [inputBytes, setInputBytes] = useState(0);

	const [shuffleVal, setShuffleVal] = useState('');
	const [shuffleBytes, setShuffledBytes] = useState(0);

	const [keyVal, setKeyVal] = useState('');
	const [keyBytes, setKeyBytes] = useState(0);

	const [dataEncVal, setDataEncVal] = useState('');
	const [dataEncBytes, setDataEncBytes] = useState(0);

	const [keyEncVal, setKeyEncVal] = useState('');
	const [keyEncBytes, setKeyEncBytes] = useState(0);

	const [dataOutputVal, setDataOutputVal] = useState('');
	const [dataOutputBytes, setDataOutputBytes] = useState(0);

	const [keyOutputVal, setKeyOutputVal] = useState('');
	const [keyOutputBytes, setKeyOutputBytes] = useState(0);
	
	useByteCounter(dataInputVal, setInputBytes);
	useByteCounter(shuffleVal, setShuffledBytes);
	useByteCounter(keyVal, setKeyBytes);
	useByteCounter(dataEncVal, setDataEncBytes);
	useByteCounter(keyEncVal, setKeyEncBytes);
	useByteCounter(dataOutputVal, setDataOutputBytes);
	useByteCounter(keyOutputVal, setKeyOutputBytes);
	
	// Refs
	const workerRef = useRef(null);
	const allCharRef = useRef(null);
	const skipAESRef = useRef(skipAES);
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
		setDataInput('');
		setDataInputVal('');
		setShuffleVal("");
		setKeyVal("");
		e.target.value = "";
		if (!file) return;

		uploadFile(file, {
			onFileInfo: setFileInfo,
			onText: setUtf8, // sets utf8Preview
			onBase64: setFileInput,
		});
	};


	const handleTextInputChange = (e) => {
		const value = e.target.value;

		setFileInput("");
		setFileInfo(null);
		setDataInput("");
		setDataInput(value);
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


	useEffect(() => {
		skipAESRef.current = skipAES;
	}, [skipAES]);


	// Derive final output depending on skipAES or storeBase64
	useEffect(() => {
		if (skipAES) {
			if (storeBase64) {
				setDataOutputVal(uint8ToBase64(textEncoder(shuffleVal)));
				setDataOutput(uint8ToBase64(textEncoder(shuffleVal)));
				setKeyOutputVal(uint8ToBase64(textEncoder(keyVal)));
				setKeyOutput(uint8ToBase64(textEncoder(keyVal)));
			} else {
				setDataOutputVal(shuffleVal);
				setDataOutput(shuffleVal);
				setKeyOutputVal(keyVal);
				setKeyOutput(keyVal);
			}
		} else {
			if (storeBase64) {
				setDataOutputVal(uint8ToBase64(dataEnc));
				setDataOutput(uint8ToBase64(dataEnc));
				setKeyOutputVal(uint8ToBase64(keyEnc));
				setKeyOutput(uint8ToBase64(keyEnc));
			} else {
				setDataOutputVal(dataEncVal);
				setDataOutput(dataEnc);
				setKeyOutputVal(keyEncVal);
				setKeyOutput(keyEnc);
			}
		}
	}, [skipAES, storeBase64, shuffleVal, keyVal, dataEncVal, keyEncVal, dataEnc, keyEnc]);


	useEffect(() => {
		workerRef.current = new Worker(
			new URL('../workers/cryptoWorker.worker.js', import.meta.url),
			{ type: 'module'}
		);

		const onMessage = (e) => {
			const { type, result, error } = e.data;
			if (type === "done-shuffle") {
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


	const handleShuffle = useCallback(() => {
		if (!workerRef.current) return;
		if (!dataInput) {
			showMsg("Error: No data.", true);
			return;
		}

		const allChar = allCharRef.current?.checked || false;
		showLoader({ show: true, mode: 'Encoding', type: "loader encode", emoji: '🛡️', bytes: inputBytes });

		workerRef.current.postMessage({
			type: "shuffle",
			load: { 
				input: dataInput,  
				allChar, 
			},
		});
	}, [dataInput, showMsg, showLoader, inputBytes]);


	// Encryption handler
	const handleEncryption = useCallback( async (label) => {
		if (skipAES) {
			showMsg('Error: Skip AES is checked; encryption bypassed.', true);
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
			showMsg(`Error: No ${label} input to encrypt.`, true);
			return;
		}
		if (!password) {
			showMsg(`Error: Password required to encrypt ${label}.`, true);
			return;
		}

		try {
			const compressed = compress(input);
			const encrypted = await aesGcmEncrypt(compressed, password);
			const utf8 = new TextDecoder();

			if (label === 'data') {
			setDataEncVal(utf8.decode(encrypted));
			setDataEnc(encrypted);
			} else {
			setKeyEncVal(utf8.decode(encrypted));
			setKeyEnc(encrypted);
			}
			showMsg(`${label} Encryption Complete!`, false);
		} catch (err) {
			showMsg(`Error: ${label} encryption failed. ${err.message}`, true);
		}
	},[skipAES, shuffleVal, keyVal, showMsg]);

  
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
		
		try {
			await generateQrCode({
				input: input,
				errorCorrectionLevel: level,
				container: container,
			});
			if (type === "data") setShowDownloadData(true);
			if (type === "key") setShowDownloadKey(true);
		} catch (err) {
			showMsg("Error: QR generation failed. " + (err?.message || "unknown error"), true);
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
            showMsg("Error: QR code not found.", true);
        }
    };


    const handleSaveFile = (type) => {
        if (type === "data") {
            if (!dataOutput) return showMsg("Error: Nothing to save.", true);
            saveFileAsEc(dataOutput, type);
        } else if (type === "key") {
            if (!keyOutput) return showMsg("Error: Nothing to save.", true);
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

			<div className="learn-more">
				<h2>Quantum Shuffle</h2>
				<Link to="/about#about-quant-shuffle">Learn more</Link>
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
					value={dataInputVal}
					onChange={handleTextInputChange}
					placeholder="Enter text..."
				/>
				<p>
					Byte size: <span>{inputBytes}</span> bytes
				</p>

				<button className="encode" onClick={handleShuffle}>
				Shuffle
				</button>

				<textarea
					rows="5"
					value={shuffleVal}
					placeholder="Shuffled data"
					readOnly
				/>
				<p>
					Data Byte size: <span>{shuffleBytes}</span> bytes
				</p>

				<textarea
					rows="5"
					value={keyVal}
					placeholder="Rotation Key"
					readOnly
				/>
				<p>
					Key Byte size: <span>{keyBytes}</span> bytes
				</p>
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
			</section>

			<section id="qr">
				<h2>Download</h2>
				<label>
				Store as base64
				<input
					type="checkbox"
					checked={storeBase64}
					onChange={(e) => setStoreBase64(e.target.checked)}
				/>
				</label>

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
				<p>
					Error Correction Level: {dataCorrection}
				</p>
					
				<div className={`padding ${dataOutputBytes === 0 ? 'hidden' : ''}`}>
					<button onClick={() => handleSaveFile("data")}> Download .ec </button>
				</div>

				<button
					onClick={() => handleGenerate("data", dataOutput, dataOutputBytes)}
					className={`${dataOutputBytes === 0 || dataOutputBytes > 2900 ? 'hidden' : ''}`}
				>Generate QR</button>

				<div id="qr-data" className='qr-code' ref={dataContainerRef}></div>

				<div className={`padding ${!showDownloadData ? 'hidden' : ''}`}>
					<button onClick={() => handleQrDownload("data")}>Download QR</button>
				</div>

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
				<p>
					Error Correction Level: {keyCorrection}
				</p>

				<div className={`padding ${keyOutputBytes === 0 ? 'hidden' : ''}`}>
					<button onClick={() => handleSaveFile("key")}>Download .ec</button>
				</div>

				<button
					onClick={() => handleGenerate("key", keyOutput, keyOutputBytes)}
					className={`${keyOutputBytes === 0 || keyOutputBytes > 2900 ? 'hidden' : ''}`}
				>Generate QR</button>

				<div id="qr-key" className='qr-code' ref={keyContainerRef}></div>

				<div className={`padding ${!showDownloadKey ? 'hidden' : ''}`}>
					<button onClick={() => handleQrDownload("key")}>Download QR</button>
				</div>
			</section>
		</main>
	);
};

export default QuantShuffleEnc;
