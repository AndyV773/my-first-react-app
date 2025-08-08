import React, { useState, useCallback } from "react";
import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";
import LockScreen from "./components/LockedState.js";
import AesCbcEnc from "./components/AesCbcEnc.js";
import AesCbcDec from "./components/AesCbcDec.js";
import AesGcmEnc from "./components/AesGcmEnc.js";
import AesGcmDec from "./components/AesGcmDec.js";
import ObfuscationTools from "./components/ObfuscationTools.js";
import MulberryShuffleEnc from "./components/MulberryShuffleEnc.js";
import MulberryShuffleDec from "./components/MulberryShuffleDec.js";
import QuantShuffleEnc from "./components/QuantShuffleEnc.js";
import QuantShuffleDec from "./components/QuantShuffleDec.js";
import OptQuantEnc from "./components/OptQuantEnc.js";
import OptQuantDec from "./components/OptQuantDec.js";
import SecretsEnc from "./components/secretsEnc.js";
import SecretsDec from "./components/secretsDec.js";
import RotEncoder from "./components/Encoder.js";
import RotDecoder from "./components/RotDecoder.js";
import FileIntegrity from "./components/FileIntegrity.js";
import PasswordGen from "./components/PasswordGen.js";
import TotpSim from "./components/TotpSim.js";
import XorBasedEnc from "./components/XorBasedEnc.js";
import XorBasedDec from "./components/XorBasedDec.js";
import Hashing from "./components/Hashing.js";
import QrEnc from "./components/QrEnc.js";
import QrDec from "./components/QrDec.js";
import QrGenerator from "./components/QrGenerator.js";
import "./App.css";
import { motion } from "framer-motion";
import ToolBox from './components/ToolBox.js';
import { tools } from './data/tools.js';
import { containerVariants, itemVariants } from './animations/variants.js';
import { Msg, ColorController, ScrollToTop, Loader } from './utils/uiHelpers.js';


function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [theme, setTheme] = useState('day');
  const [msg, setMsg] = useState({ text: '', error: false });
  const [loaderState, setLoaderState] = useState({ show: false, mode: "encode", type: "loader", emoji: "", bytes: 0});

  const toggleTheme = () => {
    setTheme(prev => (prev === 'day' ? 'night' : 'day'));
  };

  const showMsg = useCallback((text, error = true) => {
    setMsg({ text, error });
  }, []);

  const showLoader = useCallback(
    ({ show = false, mode = 'encode', type = "loader", emoji = '', bytes = 0 }) =>
      setLoaderState({ show, mode, type, emoji, bytes }),
    []
  );
  
  return (
    <div className="app-wrapper">
      <ScrollToTop />
      <ColorController theme={theme} />
      <Msg message={msg.text} error={msg.error} onClear={() => setMsg({ text: '', error: false })} />
      <Loader
        show={loaderState.show}
        mode={loaderState.mode}
        type={loaderState.type}
        emoji={loaderState.emoji}
        bytes={loaderState.bytes}
      />
      <h1>Encryption & Data Transformation ToolKit</h1>

      <Routes>
        <Route
          path="/"
          element={
            !unlocked ? (
              <LockScreen onUnlock={() => setUnlocked(true)} showMsg={showMsg} />
            ) : (
              <>
                <main id="home-page">
                  <motion.div
                    className="grid"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {tools.map(({ id, title, description }) => (
                      <motion.div key={id} variants={itemVariants}>
                        <Link to={`/${id}`} className="toolbox-link">
                          <ToolBox key={id} id={id} title={title} description={description} />
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                </main>
              </>
            )}
          />
        <Route path="/aes-cbc-enc" element={<AesCbcEnc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/aes-cbc-dec" element={<AesCbcDec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/aes-gcm-enc" element={<AesGcmEnc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/aes-gcm-dec" element={<AesGcmDec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/obfuscation-tools" element={<ObfuscationTools showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/mulberry-shuffle-enc" element={<MulberryShuffleEnc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/mulberry-shuffle-dec" element={<MulberryShuffleDec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/quant-shuffle-enc" element={<QuantShuffleEnc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} showLoader={showLoader} />} />
        <Route path="/quant-shuffle-dec" element={<QuantShuffleDec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} showLoader={showLoader} />} />
        <Route path="/opt-quant-enc" element={<OptQuantEnc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} showLoader={showLoader} />} />
        <Route path="/opt-quant-dec" element={<OptQuantDec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} showLoader={showLoader} />} />
        <Route path="/sss-enc" element={<SecretsEnc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/sss-dec" element={<SecretsDec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/rot-encoder" element={<RotEncoder showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/rot-decoder" element={<RotDecoder showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/file-integrity" element={<FileIntegrity showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/password-gen" element={<PasswordGen showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/totp-sim" element={<TotpSim showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/xor-based-enc" element={<XorBasedEnc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/xor-based-dec" element={<XorBasedDec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/hashing" element={<Hashing showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/qr-enc" element={<QrEnc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/qr-dec" element={<QrDec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/qr-generator" element={<QrGenerator showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
      </Routes>
      <footer className="footer">
        <p>
          © {new Date().getFullYear()}{" "}
          <a
            href="https://andyv.uk"
            target="_blank"
            rel="noopener noreferrer"
          >
            andyv.uk
          </a> — All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default function WrappedApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}
