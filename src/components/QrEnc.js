import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { generateQrCode, ThemeToggle, getQrCorrectionInfo } from '../utils/uiHelpers';
import { downloadQrCode } from '../utils/fileUtils';
import { aesGcmEncrypt, uint8ToBase64, textEncoder } from "../utils/cryptoUtils";

const QrEnc = ({ showMsg, theme, onToggleTheme }) => {
  const [text, setText] = useState('');
  const [encryptedText, setEncryptedText] = useState('');

  const qrContainerRef = useRef(null);
  const pwRef = useRef(null);

  const handleGenerate = async () => {
    if (!text.trim()) {
      showMsg("Please enter text to encrypt and generate QR.", true);
      return;
    }

    if (!pwRef.current.value) return showMsg("Please enter a password.", true)

    try {
      // Encrypt text with AES-GCM
      const encoded = textEncoder(text.trim());
      const encryptedData = await aesGcmEncrypt(encoded, pwRef);

      const base64load = uint8ToBase64(encryptedData);
      setEncryptedText(base64load);

      const { level: dataLevel } = getQrCorrectionInfo(base64load);

      await generateQrCode({
        input: base64load,
        errorCorrectionLevel: dataLevel,
        container: qrContainerRef.current,
      });
    } catch (err) {
      showMsg("Encryption or QR generation failed: " + (err?.message || "unknown error"), true);
    }
  };

  const handleDownload = () => {
    const canvas = qrContainerRef.current?.querySelector('canvas');
    if (canvas) {
      downloadQrCode(canvas, 'qr');
    } else {
      showMsg("QR code not found.", true);
    }
  };

  return (
    <main className="container">
      <nav>
            <div className="flex g1">
                <Link to="/">Home</Link>
                <Link to="/qr-dec">Decode</Link>
            </div>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </nav>

      <div className="learn-more">
        <h2>Encrypted QR Code</h2>
        <Link to="/about#about-qr-enc">Learn more</Link>
      </div>

      <section>
        <h2>Encode</h2>
        <label htmlFor="input">Enter text, URL, image or file link to encrypt:</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows="5"
          placeholder="Enter here..."
        />
        
        <input ref={pwRef} placeholder="Password" />

        <button onClick={handleGenerate}>Generate Encrypted QR</button>

        <div className="qr-code" ref={qrContainerRef} />

        {encryptedText && (
          <>
            <textarea value={encryptedText} readOnly rows="5" />
            <button onClick={handleDownload}>Download QR Code</button>
          </>
        )}
      </section>
    </main>
  );
};

export default QrEnc;
