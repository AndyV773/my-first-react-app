import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { uploadFile, saveFileAsEc } from "../utils/fileUtils";
import { extractViewData, ThemeToggle } from "../utils/uiHelpers";
import { aesGcmEncrypt, uint8ToBase64, textEncoder } from "../utils/cryptoUtils";


const AesGcmEnc = ({ showMsg, theme, onToggleTheme }) => {
	const [input, setInput] = useState(null);
	const [fileInfo, setFileInfo] = useState(null);
	
	const [dataInput, setDataInput] = useState('');
	const [base64Preview, setBase64] = useState("");
	const [utf8Preview, setUtf8] = useState("");
	const [detectedExt, setDetectedExt] = useState("");

	const [aesKey, setAesKey] = useState("");

	
	const handleUpload = (e) => {
		const file = e.target.files[0];
		// Reset all states on every new upload attempt or failure
		setUtf8("");
		setBase64("");
		setFileInfo(null);
		setInput(null);
		setDetectedExt(null);
		setDataInput("");
		e.target.value = "";  // Clear file input to allow re-upload of same file if needed

		if (!file) return;
		
		if (file) {
			uploadFile(file, {
				onText: setUtf8,
				onBase64: setBase64,
				onFileInfo: setFileInfo,
				onDataLoaded: setInput,
			});
		}
	};

	useEffect(() => {
		if (dataInput) {
			setInput(textEncoder(dataInput));
			setBase64(uint8ToBase64(textEncoder(dataInput)));
			setUtf8(dataInput);
		}
		}, [dataInput]
	)

	const handleEncrypt = async () => {
		try {
			const output = await aesGcmEncrypt(input, aesKey); 
			setInput(output);

			const { base64, utf8, ext } = await extractViewData(output);

			setBase64(base64);
			setUtf8(utf8);
			setDetectedExt(ext); 

			showMsg("Encryption Complete!", false);
		} catch (err) {
			showMsg("Error: Encryption failed. " + err.message, true);
		}
	};


	const handleSaveFile = () => {
		if (!input) return showMsg("Error: Nothing to save.", true);
		saveFileAsEc(input);
	}


	return (
		<main className="container">
			<nav>
				<div className="flex g1">
					<Link to="/">Home</Link>
					<Link to="/aes-gcm-dec">Decode</Link>
				</div>
				<ThemeToggle theme={theme} onToggle={onToggleTheme} />
			</nav>

			<div className="learn-more">
				<h2>AES-GCM</h2>
				<Link to="/about#about-aes-gcm">Learn more</Link>          
			</div>

			{/* Encode Section */}
			<section>
				<h2>Encode</h2>
				<input type="file" onChange={handleUpload} />
				{fileInfo && (
					<p className="file-info">
					File: {fileInfo.name}, Type: {fileInfo.type}, Size: {fileInfo.size}
					</p>
				)}
				<textarea
					rows="5"
					value={dataInput}
					onChange={(e) => {
						// setInput(false);
						setFileInfo(null);
						setBase64("");
						setUtf8("");
						setDataInput(e.target.value);
					}}
					placeholder="Enter text..."
				/>
			
				<input
					type="text"
					id="aes-key"
					placeholder="Enter AES key"
					value={aesKey}
					onChange={(e) => setAesKey(e.target.value)}
					autoComplete="off"
					/>
				<button 
					id="encrypt-btn" 
					className="encode" 
					onClick={handleEncrypt}>Encrypt</button>

				<textarea
					id="base64View"
					value={base64Preview}
					rows="5"
					placeholder="Base64 Preview"
					readOnly
				></textarea>
				<textarea
					id="utf8View"
					value={utf8Preview}
					rows="5"
					placeholder="UTF-8 Text Preview"
					readOnly
				></textarea>
				<p id="detected-in-ext">
					Detected file type: {detectedExt ? `.${detectedExt}` : "(none)"}
				</p>

				<button onClick={handleSaveFile}>Download .ec</button>
			</section>
		</main>
	);
};

export default AesGcmEnc;
