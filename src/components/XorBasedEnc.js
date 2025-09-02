import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { uploadFile, saveFileAsExt, saveFileAsEc } from "../utils/fileUtils";
import { ThemeToggle, extractViewData, PreCopyOutputBlock } from "../utils/uiHelpers";
import { textEncoder, sha256, xorUint8, generateSaltBytes, uint8ToBase64 } from "../utils/cryptoUtils";


const XorBasedEnc = ({ showMsg, theme, onToggleTheme }) => {
    const [input, setInput] = useState(null);
    const [fileInfo, setFileInfo] = useState(null);
    const [dataInput, setDataInput] = useState('');
    const [utf8Preview, setUtf8] = useState("");
    const [detectedExt, setDetectedExt] = useState("");
    const [output, setOutput] = useState("");
    const [hashKeys, setHashKeys] = useState([]);
    const [iterations, setIterations] = useState(1);

  
    const handleUpload = (e) => {
        const file = e.target.files[0];
        // Reset all states on every new upload attempt or failure
        setUtf8("");
        setFileInfo(null);
        setInput(null);
        setDataInput("");
        setHashKeys([]);
        e.target.value = "";  // Clear file input to allow re-upload of same file if needed

        if (!file) return;
        
        if (file) {
            uploadFile(file, {
                onText: setUtf8,
                onFileInfo: setFileInfo,
                onDataLoaded: setInput,
            });
        }
    };

    useEffect(() => {
        if (dataInput) {
            setInput(textEncoder(dataInput));
            setUtf8(dataInput);
        }
    }, [dataInput])

    const handleXorEncoder = async () => {
        let totalHash = [];
        let inputData = input;
        let encrypted;

        for (let i = 0; i < iterations; i ++ ) {
            let salt;

            if (i === 0){
                salt = generateSaltBytes(64);
            } else {
                salt = generateSaltBytes();
            }
            // Append salt bytes to end of shuffled data
            const combined = new Uint8Array(salt.length + inputData.length);
            combined.set(salt);
            combined.set(inputData, salt.length);

            const hash = await sha256(combined);
            totalHash.push(hash);
            encrypted = xorUint8(combined, hash);

            inputData = encrypted;
        }

        const { ext } = await extractViewData(encrypted);
        const outputData = uint8ToBase64(encrypted)
                
        setOutput(outputData);
        setDetectedExt(ext); 

        setHashKeys(totalHash);
        setUtf8(outputData);
    }

    const handleSaveFileTxT = () => {
        if (!hashKeys) return showMsg("Error: Nothing to save.", true);
        if (hashKeys.length === 0) {
            showMsg("Error: No shares to download.", true);
            return;
        }

        const content = hashKeys.map((s, i) => `Key ${i + 1}: ${s}`).join('\n\n');
        saveFileAsExt(content, "txt", "key");
    }

    const handleSaveFile = () => {
        if (!output) return showMsg("Error: Nothing to save.", true);
        saveFileAsEc(output, "data");
    }


    return (
		<main className="container">
			<nav>
				<div className="flex g1">
					<Link to="/">Home</Link>
					<Link to="/xor-based-dec">Decode</Link>
				</div>
				<ThemeToggle theme={theme} onToggle={onToggleTheme} />
			</nav>

			<div className="learn-more">
				<h2>XOR-Based Hash Encoder</h2>
				<Link to="/about#about-xor-based">Learn more</Link>
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
						setFileInfo(null);
						setUtf8("");
						setHashKeys([]);
						setDataInput(e.target.value);
					}}
					placeholder="Enter text..."
				/>

				<div>
					<label>Algorithm SHA-256:</label>
					<input
						type="number"
						min="1"
						value={iterations || ""}
						onChange={(e) => setIterations(parseInt(e.target.value))}
						placeholder="SHA-256 Iterations"
					/>
				</div>
				<button onClick={handleXorEncoder} className="encode">Generate Hash & Encrypt</button>
            </section>
            <section className={`padding ${detectedExt === "" ? 'hidden' : ''}`}>
				{hashKeys.length > 0 && (
					<div>
						<h3>Generated Keys:</h3>
                            {hashKeys.map((s, i) => (
                                <div className="sss-pre" key={i}>
                                Key {i + 1}: 
                                    <PreCopyOutputBlock outputId={`hash-key-${i}`} text={s} />
                                </div>
                            ))}
						<button onClick={handleSaveFileTxT}>Download all</button>
					</div>
				)}

                <textarea
                    id="utf8View"
                    value={utf8Preview}
                    rows="5"
                    placeholder="UTF-8 Text Preview"
                    readOnly
                ></textarea>

                <p id="detected-in-ext">
                    Detected file type: {detectedExt ? `${detectedExt}` : "(none)"}
                </p>

                <button onClick={handleSaveFile}>Download .ec</button>
			</section>
        </main>
    );
};

export default XorBasedEnc;
