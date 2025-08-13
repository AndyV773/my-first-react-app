import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { uploadFile } from "../utils/fileUtils";
import { ThemeToggle } from "../utils/uiHelpers";
import { textEncoder, sha256, hashArgon2 } from "../utils/cryptoUtils";


const Hashing = ({ showMsg, theme, onToggleTheme }) => {
  const [input, setInput] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);

  const [inputHash, setInputHash] = useState("");
  const [verificationResult, setVerificationResult] = useState("");

  const [dataInput, setDataInput] = useState('');
  const [utf8Preview, setUtf8] = useState("");

  const [hashKey, setHashKey] = useState("");
  const [algorithm, setAlgorithm] = useState("sha-256");
  const [iterations, setIterations] = useState(1);


  
  const handleUpload = (e) => {
    const file = e.target.files[0];
    // Reset all states on every new upload attempt or failure
    setUtf8("");
    setFileInfo(null);
    setInput(null);
    setDataInput("");
    setHashKey("");
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
    }, [dataInput]
  )



  const handleHash = async () => {
    if (!input) return showMsg("Nothing to hash.", true);

    try {
      let hashResult = "";

      if (algorithm === "sha-256") {
        let current = input;
        for (let i = 0; i < iterations; i++) {
            // Convert to bytes if it's not the first iteration
            if (typeof current === "string") {
                current = textEncoder(current);
            }
          current = await sha256(current);
        }
        hashResult = current;
      } else if (algorithm === "argon2") {
        hashResult = await hashArgon2(input, iterations);
      }

      setHashKey(hashResult);
    } catch (err) {
      console.error(err);
      showMsg("Hashing failed.", true);
    }
  };
  
  const renderIterationControl = () => {
    if (algorithm === "sha-256") {
      return (
        <input
          type="number"
          min="1"
          value={iterations}
          onChange={(e) => setIterations(parseInt(e.target.value))}
          placeholder="SHA-256 Iterations"
        />
      );
    } else if (algorithm === "argon2") {
      return (
        <select value={iterations} onChange={(e) => setIterations(parseInt(e.target.value))}>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              Argon2 Iterations: {i + 1}
            </option>
          ))}
        </select>
      );
    }
  };

  const handleHashVerification = async () => {
    if (!input || !inputHash.trim()) {
        return showMsg("Provide both input and hash to verify.", true);
    }

        try {
            if (algorithm === "sha-256") {
                // Perform hashing
                let current = input;
                for (let i = 0; i < iterations; i++) {
                    if (typeof current === "string") current = textEncoder(current);
                    current = await sha256(current);
                }

                // Compare result
                if (current.trim() === inputHash.trim()) {
                    setVerificationResult("SHA-256 hash matches.");
                } else {
                    setVerificationResult("Error: SHA-256 hash does NOT match.");
                }

                } else if (algorithm === "argon2") {
                    // Use built-in Argon2 verify
                    const result = await hashArgon2(input, iterations, inputHash, true);

                    if (result === true) {
                        setVerificationResult("Argon2 hash matches.");
                    } else {
                        setVerificationResult("Error: Argon2 hash does NOT match.");
                    }
                }

        } catch (err) {
            console.error(err);
            showMsg("Verification failed.", true);
        }
    };



  return (
    <> 
     <main className="container">
        <nav>
          <div className="flex g1">
            <Link to="/">Home</Link>
          </div>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </nav>

        <div className="learn-more">
          <h2>Hashing</h2>
          <Link to="/about#about-hashing">Learn more</Link>
        </div>

        {/* Encode Section */}
        <section>
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
                    setInput(false);
                    setFileInfo(null);
                    setUtf8("");
                    setHashKey("");
                    setDataInput(e.target.value);
                }}
                placeholder="Enter text..."
            />

            {/* Algorithm Selection */}
            <div>
            <label>Algorithm:</label>
            <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
                <option value="sha-256">SHA-256</option>
                <option value="argon2">Argon2</option>
            </select>
            </div>

            {/* Iteration Selection */}
            {renderIterationControl()}

            <textarea
                id="utf8View"
                value={utf8Preview}
                rows="5"
                placeholder="UTF-8 Text Preview"
                readOnly
            ></textarea>

            <textarea
                value={hashKey}
                placeholder="Hash output"
                readOnly
            ></textarea>

            <button onClick={handleHash}>Generate Hash</button>

            <textarea
                value={inputHash}
                onChange={(e) => setInputHash(e.target.value)}
                placeholder="Enter hash to verify"
            ></textarea>

            <button onClick={handleHashVerification}>Check Hash</button>

            {verificationResult && (
                <p style={{ color: verificationResult.startsWith("Error:") ? "red" : "green" }}>
                    {verificationResult}
                </p>
            )}

        </section>
      </main>
    </>
  );
};

export default Hashing;
