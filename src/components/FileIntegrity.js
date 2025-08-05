import React, { useState } from "react";
import { Link } from 'react-router-dom';
import CryptoJS from "crypto-js";
import { ThemeToggle } from "../utils/uiHelpers";

const FileIntegrity = ({ showMsg, theme, onToggleTheme }) => {
  const [fileInfo, setFileInfo] = useState(null);
  const [hashes, setHashes] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileInfo({
      name: file.name,
      size: file.size,
      type: file.type || "Unknown",
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);

      const md5 = CryptoJS.MD5(wordArray).toString(CryptoJS.enc.Hex);
      const sha1 = CryptoJS.SHA1(wordArray).toString(CryptoJS.enc.Hex);
      const sha256 = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);

      setHashes({ md5, sha1, sha256 });
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <main className="container">
        <nav>
          <div className="flex g1">
            <Link to="/">Home</Link>
          </div>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </nav>

        <h2>File Integrity Check</h2>
        <section>
            <input type="file" onChange={handleFileChange} className="mb-4" />

            {fileInfo && (
                <div>
                <p className="font-semibold">File Information:</p>
                <ul className="mb-4">
                    <li>Name: {fileInfo.name}</li>
                    <li>Size: {fileInfo.size} bytes</li>
                    <li>Type: {fileInfo.type}</li>
                </ul>
                </div>
            )}

            {hashes && (
                <div>
                <p className="font-semibold">Hashes:</p>
                <ul>
                    <li>MD5: {hashes.md5}</li>
                    <li>SHA-1: {hashes.sha1}</li>
                    <li>SHA-256: {hashes.sha256}</li>
                </ul>
                </div>
            )}
        </section>
    </main>
  );
};

export default FileIntegrity;
