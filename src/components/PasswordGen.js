import React, { useState, useEffect, useCallback } from "react";
import { Link } from 'react-router-dom';
import { PreCopyOutputBlock, ThemeToggle } from "../utils/uiHelpers";


const generatePassword = (length = 16, chunkSize = 4, useSpecialChars = true) => {
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const specials = "!@#$%^&*()_+[]{}<>?|";
  const characters = useSpecialChars ? letters + specials : letters;

  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters[randomIndex];
  }

  // Chunk the password
  let chunked = "";
  if (chunkSize !== 0) {
    for (let i = 0; i < password.length; i += chunkSize) {
      chunked += password.substring(i, i + chunkSize);
      if (i + chunkSize < password.length) {
        chunked += "-";
      }
    }
  } else {
    chunked += password
  }

  return chunked;
};

const PasswordGen = ({ showMsg, theme, onToggleTheme }) => {
  const [length, setLength] = useState(16);
  const [chunkSize, setChunkSize] = useState(4);
  const [useSpecialChars, setUseSpecialChars] = useState(true);
  const [passwords, setPasswords] = useState([]);

  const generatePasswords = () => {
    const newPasswords = Array.from({ length: 6 }, () =>
      generatePassword(length, chunkSize, useSpecialChars)
    );
    setPasswords(newPasswords);
  };

  useEffect(() => {
    generatePasswords();
  }, [length, chunkSize, useSpecialChars]);

  return (
    <main className="container">
      <nav>
        <Link to="/">Home</Link>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </nav>
      <h2>Password Generator</h2>

      <section>
        <div>
          <label >Password Length</label>
          <input
            type="number"
            value={length || ""}
            onChange={(e) => setLength(parseInt(e.target.value))}
          />
        </div>

        <div>
          <label>Chunk Size</label>
          <input
            type="number"
            value={chunkSize || ""}
            onChange={(e) => setChunkSize(parseInt(e.target.value))}
          />
        </div>

        <div>
          <label>Include Special Characters</label>
          <input
            type="checkbox"
            checked={useSpecialChars}
            onChange={() => setUseSpecialChars((prev) => !prev)}
          />
        </div>

        <button onClick={generatePasswords} className="encode">Generate Passwords</button>

        <div>
          <h3>Generated Passwords:</h3>
          <div id="pw" className="grid">
            {passwords.map((pw, idx) => (
              <div key={idx}>
                <PreCopyOutputBlock outputId={`pw-${idx}`} text={pw} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default PasswordGen;
