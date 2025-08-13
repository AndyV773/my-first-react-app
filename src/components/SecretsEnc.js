import React, { useState } from "react";
import { Link } from 'react-router-dom';
import { PreCopyOutputBlock, ThemeToggle } from "../utils/uiHelpers";

const SecretsEnc = ({ showMsg, theme, onToggleTheme }) => {
  const [secret, setSecret] = useState("");
  const [numShares, setNumShares] = useState("5");
  const [threshold, setThreshold] = useState("2");
  const [shares, setShares] = useState([]);

  const splitSecret = () => {
    const n = parseInt(numShares);
    const k = parseInt(threshold);
    if (isNaN(n) || isNaN(k)) return showMsg("Please enter valid numbers.", true);

    if (!secret) return showMsg("Please enter a secret.", true);
    if (k > n) return showMsg("Threshold cannot exceed number of shares.", true);

    try {
      const sec = window.secrets; // Using global secrets object from CDN
      const hexSecret = sec.str2hex(secret);
      const split = sec.share(hexSecret, n, k);
      setShares(split);
    } catch (error) {
      showMsg("Encryption failed.", true);
    }
  };

    const downloadShares = () => {
        if (shares.length === 0) {
            showMsg("No shares to download.", true);
            return;
        }

        const content = shares.map((s, i) => `Share ${i + 1}: ${s}`).join('\n\n');
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "secret-shares.txt";
        a.click();

        URL.revokeObjectURL(url);
    };


  return (
    <>
      <main className="container">
        <nav>
          <div className="flex g1">
            <Link to="/">Home</Link>
            <Link to="/sss-dec">Decode</Link>
          </div>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </nav>

        <div className="learn-more">
          <h2>Secret Sharing</h2>
          <Link to="/about#about-sss">Learn more</Link>
        </div>

        <section>
            <h2>Encode</h2>
            <input
                type="text"
                placeholder="Enter secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
            />
            <label htmlFor="shares">Shares (2-20):</label>
            <input
                id="shares"
                type="number"
                min="2"
                max="20"
                value={numShares || ""}
                onChange={(e) => setNumShares(parseInt(e.target.value))}
                required
            />
            <label htmlFor="threshold">Threshold (2-20):</label>
            <input
                id="threshold"
                type="number"
                min="2"
                max="20"
                value={threshold || ""}
                onChange={(e) => setThreshold(parseInt(e.target.value))}
                required
            />
            <button onClick={splitSecret} className="encode">Split Secret</button>

            {shares.length > 0 && (
                <div>
                    <h3>Generated Shares:</h3>
                    {shares.map((s, i) => (
                        <div className="sss-pre" key={i}>
                        Share {i + 1}: 
                            <PreCopyOutputBlock outputId={`share-${i}`} text={s} />
                        </div>
                    ))}
                    <button onClick={downloadShares}>Download All</button>
                </div>
            )}
        </section>
      </main>
    </>
  );
};

export default SecretsEnc;
