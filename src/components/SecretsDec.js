import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import secrets from "secrets.js-grempe";
import { ThemeToggle } from "../utils/uiHelpers";


const SecretsDec = ({ showMsg, theme, onToggleTheme }) => {
  const [shareCount, setShareCount] = useState(2);
  const [inputs, setInputs] = useState(["", ""]);
  const [reconstructed, setReconstructed] = useState("");

  useEffect(() => {
    const newInputs = Array(shareCount).fill("").map((_, i) => inputs[i] || "");
    setInputs(newInputs);
  }, [shareCount, inputs]);

  const updateInput = (value, index) => {
    const updated = [...inputs];
    updated[index] = value;
    setInputs(updated);
  };

  const combineShares = () => {
    const validShares = inputs.map(s => s.trim()).filter(Boolean);
    if (validShares.length < 2) return alert("Enter at least 2 shares.");

    try {
      const hex = secrets.combine(validShares);
      const original = secrets.hex2str(hex);
      setReconstructed(original);
    } catch (e) {
      showMsg("Error combining shares. Make sure they are valid.", true);
      setReconstructed("");
    }
  };

  return (
    <> 
      <main className="container">
        <nav>
          <div className="flex g1">
            <Link to="/">Home</Link>
            <Link to="/sss-enc">Encode</Link>
          </div>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </nav>
        <h2>Decode Secret</h2>
        <section>
          <label>How many shares?</label>
          <select value={shareCount} onChange={(e) => setShareCount(parseInt(e.target.value))}>
            {Array.from({ length: 19 }, (_, i) => i + 2).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          {inputs.map((value, idx) => (
            <div key={idx}>
              <label>Share {idx + 1}:</label>
              <input
                type="text"
                value={value}
                onChange={(e) => updateInput(e.target.value, idx)}
                placeholder="Paste share string"
              />
            </div>
          ))}

          <button onClick={combineShares}>Combine Shares</button>

          {reconstructed && (
            <p>
              ✅ Reconstructed Secret: <code>{reconstructed}</code>
            </p>
          )}
        </section>
      </main>
    </>
  );
}

export default SecretsDec;
