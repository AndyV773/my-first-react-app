import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { uploadFile, saveFileAsExt, saveFileAsEc, detectFileExtension } from "../utils/fileUtils";
import { ThemeToggle, useByteCounter } from "../utils/uiHelpers";
import { rotateBytes, textDecoder, textEncoder } from "../utils/cryptoUtils";



const Encoder = ({ showMsg, theme, onToggleTheme }) => {
    const [dataInput, setDataInput] = useState("");
    const [textInputVal, setTextInputVal] = useState('');
    const [fileInput, setFileInput] = useState(""); 
    const [fileInfo, setFileInfo] = useState(null);
    const [utf8Preview, setUtf8] = useState(''); // content decoded from file
    const [keyInput, setKeyInput] = useState("");
    const [keyLength, setKeyLength] = useState('');
    const [output, setOutput] = useState("");
    const [outputVal, setOutputVal] = useState("");
    const [detectedExt, setDetectedExt] = useState("");

    const [inputBytes, setInputBytes] = useState(0);
    useByteCounter(textInputVal, setInputBytes);


    const generateRandomKeys = () => {
        const count = parseInt(keyLength, 10);
        if (isNaN(count) || count <= 0) {
            showMsg("Please enter a valid number greater than 0.", true);
            return;
        }

        const keys = Array.from({ length: count }, () =>
            Math.floor(Math.random() * 999) + 1);

        setKeyInput(keys.join(','));
    };


    // Parse key string into array of integers
    const parseKey = (keyStr) =>
        keyStr
        .split(",")
        .map((s) => s.trim())
        .map(Number)
        .filter((n) => Number.isInteger(n));


    // Handle file upload
    const handleUpload = (e) => {
        const file = e.target.files[0];
        // reset
        setFileInput("");
        setFileInfo(null);
        setDataInput('');
        setTextInputVal('');
        e.target.value = "";
        if (!file) return;
    
        uploadFile(file, {
            onFileInfo: setFileInfo,
            onText: setUtf8, // sets utf8Preview
            onDataLoaded: setFileInput,
        });
    };

    const handleTextInputChange = (e) => {
        const value = e.target.value;

        setFileInput("");
        setFileInfo(null);
        setDataInput("");
        setDataInput(textEncoder(value));
        setTextInputVal(value);
    };


    // Sync file content into dataInput once when file loads
      useEffect(() => {
        if (fileInput) {
            setTextInputVal(utf8Preview);
            setDataInput(fileInput);
        } else {
            setTextInputVal("");
        }
      }, [fileInput, utf8Preview]);
    

    const handleEncode = async () => {
        if (!dataInput) {
            showMsg("Please input text or upload a file.", true);
        return;
        }

        const keyArray = parseKey(keyInput);

        if (keyArray.length === 0) {
            showMsg("Please enter a valid rotation key (comma separated numbers).", true);
        return;
        }
        try {
            const rotated = rotateBytes(dataInput, keyArray);
            const ext = await detectFileExtension(rotated);

            setDetectedExt(ext);
            setOutputVal(textDecoder(rotated));

            setOutput(rotated);
        } catch (err) {
            showMsg("Error during encoding: " + err.message, true);
        }
    };

    const handleSaveKey = () => {
        if (!keyInput) return showMsg("Nothing to save.", true);
        
        saveFileAsExt(keyInput, "txt", "key");
    };

    const handleSaveEcFile = () => {
        if (!output) return showMsg("Nothing to save.", true);
        
        saveFileAsEc(output);
    };

    return (
        <main className="container">
            <nav>
                <div className="flex g1">
                    <Link to="/">Home</Link>
                    <Link to="/rot-decoder">Decode</Link>
                </div>
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </nav>

            <div className="learn-more">
                <h2>Rotation Encoder</h2>
                <Link to="/about#about-rot-encoder">Learn more</Link>
            </div>
            
            <section>
                <h2>Encoder</h2>

                <input type="file" onChange={handleUpload} />
                {fileInfo && (
                    <p className="file-info">
                        File: {fileInfo.name}, Type: {fileInfo.type}, Size: {fileInfo.size}
                    </p>
                )}

                <div>
                    <textarea
                        rows="5"
                        value={textInputVal}
                        onChange={handleTextInputChange}
                        placeholder="Enter text..."
                    />
                    <p>
                        Byte size: <span>{inputBytes}</span> bytes
                    </p>
                </div>

                <div>
                    <label htmlFor="keyLength"></label>
                    <input
                        id="keyLength"
                        type="number"
                        value={keyLength}
                        onChange={(e) => setKeyLength(e.target.value)}
                        placeholder="Enter Rotation amount..."
                    />
                    <button onClick={generateRandomKeys}>Generate Random Rotation</button>

                    <label htmlFor="keyInput">Rotation Key (comma separated numbers):</label>
                    <input
                        id="keyInput"
                        type="text"
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        placeholder="Or enter key e.g. 125,274,2789..."
                    />
                    <button onClick={handleSaveKey}>Save key</button>
                </div>

                <button onClick={handleEncode} className="encode">Encode</button>
                <div className={outputVal ? "" : "hidden"}>
                    <label htmlFor="outputArea">Output:</label>
                    <textarea
                        id="outputArea"
                        rows={5}
                        readOnly
                        value={outputVal}
                        placeholder="Output"
                    />
                    <p>
                        Detected file type: {detectedExt ? `${detectedExt}` : "(none)"}
                    </p>
                    <button onClick={handleSaveEcFile}>Save as ec</button>
                </div>
            </section>
        </main>
    );
}

export default Encoder;