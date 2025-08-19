import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { uploadEncFile, uploadFile, saveFileAsExt } from "../utils/fileUtils";
import { ThemeToggle, extractViewData } from "../utils/uiHelpers";
import { xorUint8, base64ToUint8 } from "../utils/cryptoUtils";


const XorBasedEnc = ({ showMsg, theme, onToggleTheme }) => {
    const [input, setInput] = useState(null);
    const [fileInfo, setFileInfo] = useState(null);
    const [dataInput, setDataInput] = useState('');
    const [utf8Preview, setUtf8] = useState("");
    const [detectedExt, setDetectedExt] = useState("");
    const [output, setOutput] = useState("");
    const [hashKeys, setHashKeys] = useState([]);
    const [iterations, setIterations] = useState(1);


    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        // Reset all states on every new upload attempt or failure
        setUtf8("");
        setFileInfo(null);
        setInput("");
        setDetectedExt(null);
        e.target.value = "";  // Clear file input to allow re-upload of same file if needed
  
        if (!file) return;
  
        const result = await uploadEncFile(file, {
            onText: (text) => {
                setUtf8(text);
                setDataInput(text);
            },
            onFileInfo: setFileInfo,
        });
  
        if (result?.error) {
            showMsg(`Upload failed: ${result.error}`, true);
            setUtf8("");
            setFileInfo(null);
            setInput("");
            setDetectedExt(null);
            return;
        }
    };

    useEffect(() => {
        if (dataInput) {
            setInput(dataInput);
            setUtf8(dataInput);
        }
        }, [dataInput]
    )

    // Handle file upload
    const handleUploadHashFile = (e) => {
        const file = e.target.files[0];
        
        // reset
        setIterations(1);
        setFileInfo(null);
        e.target.value = "";
        if (!file) return;
    
        uploadFile(file, {
            onText: (text) => {
                // split by line, trim, and extract hash with regex
                const hashes = text
                    .split(/\r?\n/)
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .map(line => line.replace(/^Key \d+:\s*/, "")); // remove "Key X: "

                // set the array of hashes
                setHashKeys(hashes);
                // update iteration count
                setIterations(hashes.length);
            } 
        });
    };

    useEffect(() => {
        setHashKeys((prev) => {
            let updated = [...prev];
            while (updated.length < iterations) updated.push("");
            if (updated.length > iterations) updated.length = iterations;

            return updated;
        });
    }, [iterations]);

    const updateInput = (value, index) => {
        const updated = [...hashKeys];
        updated[index] = value;
        setHashKeys(updated);
    };

    const handleXorDecoder = async () => {
        if (!input || !hashKeys) return showMsg("Data missing!.", true);

        if (hashKeys.some((key) => !key.trim())) {
            return showMsg("Please fill in all key inputs!", true);
        }

        const reversedKeys = [...hashKeys].reverse();

        let inputData = base64ToUint8(input);
        let dataOutput;

        for (let i = 0; i < iterations; i ++) {

            const decoded = xorUint8(inputData, reversedKeys[i]);
            const SALT_LENGTH = i === iterations - 1 ? 64 : 16;

            if (decoded.length <= SALT_LENGTH) {
                setOutput("");
                setDetectedExt(""); 
                setUtf8("");
                return showMsg("Error: Invalid Keys.", true);
            }

            dataOutput = decoded.slice(SALT_LENGTH);
            inputData = dataOutput;
        }

        const { utf8, ext } = await extractViewData(dataOutput);
        
        setOutput(dataOutput);
        setDetectedExt(ext); 
        setUtf8(utf8);
    }

    const handleSaveFile = () => {
        if (!output) return showMsg("Nothing to save.", true);
        saveFileAsExt(output, detectedExt);
    }

    return (
        <main className="container">
            <nav>
                <div className="flex g1">
                    <Link to="/">Home</Link>
                    <Link to="/xor-based-enc">Encode</Link>
                </div>
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </nav>

            <div className="learn-more">
                <h2>XOR-Based Hash Encoder</h2>
                <Link to="/about#about-xor-based">Learn more</Link>
            </div>

            <section>
                <h2>Decode</h2>

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
                        setDataInput(e.target.value);
                    }}
                    placeholder="Enter text..."
                />

                <div>
                    <p>Upload file or enter hash key(s)</p>
                    <input type="file" onChange={handleUploadHashFile} />
                    <label>Algorithm SHA-256:</label>
                    <input
                        type="number"
                        min="1"
                        value={iterations || ""}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val > 0) {
                                setIterations(val);
                            } else if (e.target.value === "") {
                                setIterations(""); 
                            }
                        }}
                        placeholder="SHA-256 Iterations"
                    />
                </div>

                {hashKeys.map((value, idx) =>(
                    <div key={idx}>
                    <label>Key {idx + 1}:</label>
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => updateInput(e.target.value, idx)}
                        placeholder={`Enter key ${idx + 1} here...`}
                    />
                    </div>
                ))}

                <button onClick={handleXorDecoder} className="decode">Decode</button>
            </section>
            <section className={`padding ${detectedExt === "" ? 'hidden' : ''}`}>
                <textarea
                    id="utf8View"
                    value={utf8Preview}
                    rows="5"
                    placeholder="UTF-8 Text Preview"
                    readOnly
                ></textarea>
                <p>
                    Detected file type: {detectedExt ? `${detectedExt}` : "(none)"}
                </p>
                <button onClick={handleSaveFile}>Save as {detectedExt}</button>
            </section>
        </main>
    );
};

export default XorBasedEnc;
