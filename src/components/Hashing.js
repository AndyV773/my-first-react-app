import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { uploadFile } from "../utils/fileUtils";
import { ThemeToggle, PreCopyOutputBlock } from "../utils/uiHelpers";
import { hashArgon2 } from "../utils/cryptoUtils";
import CryptoJS from "crypto-js";


const Hashing = ({ showMsg, theme, onToggleTheme }) => {
    const [input, setInput] = useState("");
	const [fileInput, setFileInput] = useState(""); 
    const [fileInfo, setFileInfo] = useState(null);
    const [utf8Preview, setUtf8] = useState("");
	const [dataInputVal, setDataInputVal] = useState("");
    const [hashKey, setHashKey] = useState("");
    const [algorithm, setAlgorithm] = useState("sha-256");
    const [iterations, setIterations] = useState(1);


    const handleUpload = (e) => {
		const file = e.target.files[0];
		// Reset all states on every new upload attempt or failure
		setUtf8("");
		setFileInput("");
		setFileInfo(null);
		setDataInputVal("");
		setInput("");
		setHashKey("");
		e.target.value = "";  // Clear file input to allow re-upload of same file if needed

		if (!file) return;
		
		if (file) {
			uploadFile(file, {
				onText: setUtf8,
				onFileInfo: setFileInfo,
				onDataLoaded: setFileInput,
			});
		}
    };

	const handleInputChange = (e) => {
		const value = e.target.value;

		setFileInput("");
		setFileInfo(null);
        setUtf8("");
		setHashKey("");
		setInput(value);
		setDataInputVal(value);
	};
	
	// Sync file content into dataInput once when file loads
	useEffect(() => {
		if (fileInput) {
			setDataInputVal(utf8Preview);
			setInput(fileInput);
		} else {
			setDataInputVal("");
		}
	}, [fileInput, utf8Preview]);

    
    const handleHash = async () => {
		if (!input) return showMsg("Error: Nothing to hash.", true);

		try {
			let hashResult = "";
			const sha3OutputMap = {
				"sha3-256": 256,
				"sha3-384": 384,
				"sha3-512": 512
			};

			let current = input;

			for (let i = 0; i < iterations; i++) {
				const wordArray = CryptoJS.enc.Utf8.parse(current);

				if (algorithm === "sha-256") {
					current = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
				} else if (algorithm === "sha-384") {
					current = CryptoJS.SHA384(wordArray).toString(CryptoJS.enc.Hex);
				} else if (algorithm === "sha-512") {
					current = CryptoJS.SHA512(wordArray).toString(CryptoJS.enc.Hex);
				} else if (algorithm === "sha3-256" || algorithm === "sha3-384" || algorithm === "sha3-512") {
					current = CryptoJS.SHA3(wordArray, { outputLength: sha3OutputMap[algorithm] })
						.toString(CryptoJS.enc.Hex);
				} else if (algorithm === "argon2") {
					current = await hashArgon2(current, 1); // iterations handled separately
				} else {
					return showMsg("Error: Unsupported algorithm", true);
				}
			}

			hashResult = current;
			setHashKey(hashResult);

		} catch (err) {
			showMsg("Error: Hashing failed." + err.message, true);
		}
	};

    
    const renderIterationControl = () => {
		if (algorithm !== "argon2") {
			return (
				<input
					type="number"
					min="1"
					value={iterations}
					onChange={(e) => setIterations(parseInt(e.target.value))}
				/>
			);
		} else if (algorithm === "argon2") {
			return (
				<select value={iterations} onChange={(e) => setIterations(parseInt(e.target.value))} className="ml-1">
					{[...Array(12)].map((_, i) => (
						<option key={i + 1} value={i + 1}>
							Iterations: {i + 1}
						</option>
					))}
				</select>
			);
		}
    };


    return (
		<main className="container">
			<nav>
				<div className="flex g1">
				<Link to="/">Home</Link>
				</div>
				<ThemeToggle theme={theme} onToggle={onToggleTheme} />
			</nav>

			<div className="learn-more">
				<h2>SHA & Argon2 Hashing</h2>
				<Link to="/about#about-hashing">Learn more</Link>
			</div>

			<section>
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

				<div>
					<label>Algorithm:</label>
					<select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)} className="ml-1">
						<option value="sha-256">SHA-256</option>
						<option value="sha-384">SHA-384</option>
						<option value="sha-512">SHA-512</option>
						<option value="sha3-256">SHA3-256</option>
						<option value="sha3-384">SHA3-384</option>
						<option value="sha3-512">SHA3-512</option>
						<option value="argon2">Argon2</option>
					</select>

					{renderIterationControl()}
				</div>

				<PreCopyOutputBlock outputId={`hash`} text={hashKey} />

				<button onClick={handleHash} className="encode">Generate Hash</button>
			</section>
        </main>
    );
};

export default Hashing;
