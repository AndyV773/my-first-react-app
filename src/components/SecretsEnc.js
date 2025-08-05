import React, { useState } from "react";
import { Link } from 'react-router-dom';
import secrets from "secrets.js-grempe";
import { ThemeToggle } from "../utils/uiHelpers";


const SecretsEnc = ({ showMsg, theme, onToggleTheme }) => {
  const [secret, setSecret] = useState("");
  const [numShares, setNumShares] = useState(5);
  const [threshold, setThreshold] = useState(3);
  const [shares, setShares] = useState([]);

  const splitSecret = () => {
    if (!secret) return alert("Please enter a secret.");
    if (threshold > numShares) return alert("Threshold cannot exceed number of shares.");

    const hexSecret = secrets.str2hex(secret);
    const split = secrets.share(hexSecret, numShares, threshold);
    setShares(split);
  };

  return (
    <> 
        <main className="conatiner">
            <nav>
            <div className="flex g1">
                <Link to="/">Home</Link>
                <Link to="/sss-dec">Decode</Link>
            </div>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </nav>
            <h2>Encode Secret</h2>
                <section>
                    <input
                        type="text"
                        placeholder="Enter secret"
                        value={secret}
                        onChange={(e) => setSecret(e.target.value)}
                    />
                    <br />
                    <input
                        type="number"
                        min="2"
                        max="20"
                        value={numShares}
                        onChange={(e) => setNumShares(parseInt(e.target.value))}
                        placeholder="Number of shares (n)"
                    />
                    <br />
                    <input
                        type="number"
                        min="2"
                        max="20"
                        value={threshold}
                        onChange={(e) => setThreshold(parseInt(e.target.value))}
                        placeholder="Threshold (k)"
                    />
                    <br />
                    <button onClick={splitSecret}>Split Secret</button>

                    {shares.length > 0 && (
                        <div>
                        <h3>Generated Shares:</h3>
                        {shares.map((s, i) => (
                            <p key={i}>
                            Share {i + 1}: <code>{s}</code>
                            </p>
                        ))}
                        </div>
                    )}
                </section>
            </main>
        </>
    );
};

export default SecretsEnc;
