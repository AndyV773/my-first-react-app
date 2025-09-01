import React, { useState } from "react";
import { Link } from 'react-router-dom';
import { uploadFile, uploadEncFile32, saveFileAsExt, detectFileExtension } from "../utils/fileUtils";
import { ThemeToggle, useByteCounter } from "../utils/uiHelpers";
import { textDecoder, uint32ToUint8, xorUint32, rotUint32 } from "../utils/cryptoUtils";


const Uint32Dec = ({ showMsg, theme, onToggleTheme }) => {
    const [dataInput, setDataInput] = useState("");
    const [keyInput, setKeyInput] = useState("");
    const [fileInfo, setFileInfo] = useState(null);
    const [utf8Preview, setUtf8] = useState(''); // content decoded from file
    const [output, setOutput] = useState("");
    const [outputVal, setOutputVal] = useState("");
    const [detectedExt, setDetectedExt] = useState("");
    const [inputBytes, setInputBytes] = useState(0);
    useByteCounter(utf8Preview, setInputBytes);
    const [useXor, setUseXor] = useState(false);
    

    const handleUploadEc = async (e) => {
        const file = e.target.files?.[0];
        
        setFileInfo("");
        setUtf8("");
        setDataInput("");

        e.target.value = ""; // Clear file input

        if (!file) return;

        const result = await uploadEncFile32(file, {
            onFileInfo: setFileInfo,
            onText: setUtf8,
            onUint32: setDataInput,
        });

        if (result?.error) {
            showMsg(`Upload failed: ${result.error}`, true);
            setFileInfo(null);
            setDataInput("");
            setUtf8("");
            return;
        }
    };

    // Handle file upload
    const handleUploadKey = (e) => {
        const file = e.target.files[0];
        // reset
        setKeyInput("");
        setFileInfo(null);
        e.target.value = "";
        if (!file) return;
    
        uploadFile(file, {
            onText: setKeyInput, 
        });
    };

    // Parse key string into array of integers, ignore invalid values
    const parseKey = (keyStr) =>
        keyStr
        .split(",")
        .map((s) => s.trim())
        .map(Number)
        .filter((n) => Number.isInteger(n));

    const handleDecode = async () => {
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
                let unrotated;
                if (useXor === true) {
                    unrotated = xorUint32(dataInput, keyArray);
                } else {
                    unrotated = rotUint32(dataInput, keyArray, false);
                }

                const uint8 = uint32ToUint8(unrotated)
                const ext = await detectFileExtension(uint8);

                setDetectedExt(ext);
                setOutputVal(textDecoder(uint8));
                setOutput(uint8);
            } catch (err) {
                showMsg("Error during decoding: " + err.message, true);
            }
        };

        const handleSaveFile = () => {
            if (!output) return showMsg("Nothing to save.", true);
            saveFileAsExt(output, detectedExt);
        };

    return (
        <main className="container">
            <nav>
                <div className="flex g1">
                    <Link to="/">Home</Link>
                    <Link to="/uint32-enc">Encode</Link>
                </div>
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </nav>

            <div className="learn-more">
                <h2>ROT/XOR Uint32</h2>
                <Link to="/about#about-uint32-enc">Learn more</Link>
            </div>

            <section>
                <h2>Decoder</h2>
                <p>Upload .ec32 file</p>
                <input type="file" onChange={handleUploadEc} />
                {fileInfo && (
                    <p className="file-info">
                        File: {fileInfo.name}, Type: {fileInfo.type}, Size: {fileInfo.size}
                    </p>
                )}
                <textarea
                    rows="5"
                    value={utf8Preview}
                    placeholder="Utf8 preview"
                    readOnly
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
                <p>Upload key file or enter key</p>
                <input type="file" onChange={handleUploadKey} />

                <label htmlFor="keyInput">Key (comma separated numbers):</label>
                <input
                    id="keyInput"
                    type="text"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="125,274,12,1,2789..."
                />
                <button onClick={handleDecode} className="decode">Decode</button>
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
                <p>
                    Detected file type: {detectedExt ? `${detectedExt}` : "(none)"}
                </p>
                <button onClick={handleSaveFile}>Download .{detectedExt}</button>
            </section>
        </main>
    );
}

export default Uint32Dec;