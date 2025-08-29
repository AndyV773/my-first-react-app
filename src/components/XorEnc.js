import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { uploadFile, saveFileAsExt, saveFileAsEc32 } from "../utils/fileUtils";
import { ThemeToggle, useByteCounter } from "../utils/uiHelpers";
import { textDecoder, textEncoder, uint8ToUint32, xorUint32, rotUint32 } from "../utils/cryptoUtils";


const XorEnc = ({ showMsg, theme, onToggleTheme }) => {
    const [dataInput, setDataInput] = useState("");
    const [textInputVal, setTextInputVal] = useState('');
    const [fileInput, setFileInput] = useState(""); 
    const [fileInfo, setFileInfo] = useState(null);
    const [utf8Preview, setUtf8] = useState(''); // content decoded from file
    const [keyInput, setKeyInput] = useState("");
    const [keyLength, setKeyLength] = useState('');
    const [output, setOutput] = useState("");
    const [outputVal, setOutputVal] = useState("");
    const [useXor, setUseXor] = useState(false);

    const [inputBytes, setInputBytes] = useState(0);
    useByteCounter(textInputVal, setInputBytes);

    const [index, setIndex] = useState(0);
    const RANGE_VALUES = [1000000, 1000000000, 5000000000, 10000000000];
    const displayValue = RANGE_VALUES[index].toLocaleString();

    const handleSlider = (e) => {
        setIndex(parseInt(e.target.value));
    };

    const generateRandomKeys = () => {
        const count = parseInt(keyLength, 10);
        if (isNaN(count) || count <= 0) {
            showMsg("Please enter a valid number greater than 0.", true);
            return;
        }

        // Create a Uint32Array (or Uint16/Uint8 depending on range)
        const randomArray = new Uint32Array(count);
        crypto.getRandomValues(randomArray);

        // Map values into desired range
        const keys = Array.from(randomArray, v => (v % RANGE_VALUES[index]) + 1);

        setKeyInput(keys.join(','));
    };

    // Parse key string into array of integers
    const parseKey = (keyStr) =>
        keyStr
            .split(",")
            .map(s => Number(s.trim()))
            .filter(n => Number.isInteger(n))
            .map(n => n >>> 0);

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
            let output;
            const uint32View = uint8ToUint32(dataInput);
          
            if (useXor === true) {
                output = xorUint32(uint32View, keyArray);
            } else {
                output = rotUint32(uint32View, keyArray);
            }

            setOutputVal(textDecoder(output));
            setOutput(output);
        } catch (err) {
            showMsg("Error during encoding: " + err.message, true);
        }
    };

    const handleSaveKey = () => {
        if (!keyInput) return showMsg("Nothing to save.", true);
        saveFileAsExt(keyInput, "txt", "key");
    };

    const handleSaveEc32File = () => {
        if (!output) return showMsg("Nothing to save.", true);
        saveFileAsEc32(output);
    };

    return (
        <main className="container">
            <nav>
                <div className="flex g1">
                    <Link to="/">Home</Link>
                    <Link to="/xor-dec">Decode</Link>
                </div>
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </nav>

            <div className="learn-more">
                <h2>ROT/XOR Uint32</h2>
                <Link to="/about#about-xor-enc">Learn more</Link>
            </div>
            
            <section>
                <h2>Encoder</h2>

                <input type="file" onChange={handleUpload} />
                {fileInfo && (
                    <p className="file-info">
                        File: {fileInfo.name}, Type: {fileInfo.type}, Size: {fileInfo.size}
                    </p>
                )}
                <textarea
                    rows="5"
                    value={textInputVal}
                    onChange={handleTextInputChange}
                    placeholder="Enter text..."
                />
                <p>
                    Byte size: <span>{inputBytes}</span> bytes
                </p>
                <label>
                    Use XOR:
                    <input
                        type="checkbox"
                        checked={useXor}
                        onChange={(e) => setUseXor(e.target.checked)}
                    />
                </label>
                <br/>
                <br/>
                <div>
                    <label htmlFor="custom-slider">
                        <strong>Selected Range: </strong>
                        {displayValue}
                    </label>
                    <input
                        id="custom-slider"
                        type="range"
                        min="0"
                        max={RANGE_VALUES.length - 1}
                        value={index}
                        onChange={handleSlider}
                    />
                    <label htmlFor="keyLength"></label>
                    <input
                        id="keyLength"
                        type="number"
                        value={keyLength}
                        onChange={(e) => setKeyLength(e.target.value)}
                        placeholder="Enter amount of key numbers..."
                    />
                    <button onClick={generateRandomKeys}>Generate Key</button>

                    <label htmlFor="keyInput">Key (comma separated numbers):</label>
                    <input
                        id="keyInput"
                        type="text"
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        placeholder="Or enter key..."
                        autoComplete="off"
                    />
                    <button onClick={handleSaveKey}>Download key</button>
                </div>

                <button onClick={handleEncode} className="encode">Encode</button>
            </section>
            <section className={outputVal ? "" : "hidden"}>
                <h3>Output</h3>
                <textarea
                    id="outputArea"
                    rows={5}
                    readOnly
                    value={outputVal}
                    placeholder="Output"
                />
                <button onClick={handleSaveEc32File}>Download .ec32</button>
            </section>
        </main>
    );
}

export default XorEnc;