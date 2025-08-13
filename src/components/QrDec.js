import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle, QrScanner } from '../utils/uiHelpers';
import { aesGcmDecrypt, base64ToUint8, textDecoder } from "../utils/cryptoUtils";
import { uploadEncFile } from "../utils/fileUtils";



const QrDec = ({ showMsg, theme, onToggleTheme }) => {
    const [showScanner, setShowScanner] = useState(false);
    const [decryptedText, setDecryptedText] = useState('');
    const [fileInfo, setFileInfo] = useState(null);
    const [input, setInput] = useState('');
    const pwRef = useRef(null);

    const handleScan = (decodedText) => {
        setInput(decodedText);
        setShowScanner(false);
    };

    const handleScannerOpen = async () => {
        setShowScanner(true);
    };

    const handleScannerClose = () => {
        setShowScanner(false);
    };

    const handleError = (errorObj) => {
        if (errorObj?.error) {
            showMsg(errorObj.error, true);
        }
        setShowScanner(false);
    };

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        // Reset all states on every new upload attempt or failure
        setFileInfo(null);
        setInput("");
        e.target.value = "";  // Clear file input to allow re-upload of same file if needed
    
        if (!file) return;
    
        const result = await uploadEncFile(file, {
            onText: setInput,
            onFileInfo: setFileInfo,
        });
    
        if (result?.error) {
            showMsg(`Upload failed: ${result.error}`, true);
            setFileInfo(null);
            setInput("");
            return;
        }
    };

    const handleDecrypt = async () => {
        if (!input) {
            showMsg("Please paste a QR code's encrypted base64 data.", true);
            return;
        }

        if (!pwRef.current.value) {
            showMsg("Please enter the decryption password.", true);
            return;
        }

        try {
            const unit8 = base64ToUint8(input);

            const decrypted = await aesGcmDecrypt(unit8, pwRef);
            const decoded = textDecoder(decrypted);

            setDecryptedText(decoded);
        } catch (err) {
            showMsg("Decryption failed: " + (err?.message || "unknown error"), true);
        }
    };

    return (
        <main className="container">
            <nav>
                <div className="flex g1">
                    <Link to="/">Home</Link>
                    <Link to="/qr-enc">Encode</Link>
                </div>
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </nav>

            <div className="learn-more">
                <h2>Encrypted QR Code</h2>
                <Link to="/about#about-qr-enc">Learn more</Link>
            </div>

            <section>
                <h2>Decode</h2>
                <div>
                    <button onClick={handleScannerOpen}>Open QR Scanner</button>

                    {showScanner && (
                        <QrScanner
                            onScan={handleScan}
                            onClose={handleScannerClose}
                            onError={handleError}
                        />
                    )}
                </div>

                <p>Upload QR code image</p>
                <input type="file" onChange={handleUpload} />
                {fileInfo && (
                    <p className="file-info">
                        File: {fileInfo.name}, Type: {fileInfo.type}, Size: {fileInfo.size}
                    </p>
                )}
                <textarea
                    value={input}
                    rows="5"
                    placeholder="Input"
                    readOnly
                />

                <input ref={pwRef} placeholder="Password" type="password" />

                <button onClick={handleDecrypt}>Decrypt</button>

                {decryptedText && (
                <>
                    <h3>Decrypted Output</h3>
                    <textarea value={decryptedText} readOnly rows="5" />
                </>
                )}
            </section>
        </main>
    );
};

export default QrDec;
