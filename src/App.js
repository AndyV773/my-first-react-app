import React, { useState, useCallback } from "react";
import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";
import LockScreen from "./components/LockedState.js";
import ObfuscationTools from "./components/ObfuscationTools.js";
import MulberryShuffleEnc from "./components/MulberryShuffleEnc.js";
import MulberryShuffleDec from "./components/MulberryShuffleDec.js";
import QuantShuffleEnc from "./components/QuantShuffleEnc.js";
import QuantShuffleDec from "./components/QuantShuffleDec.js";
import SecretsEnc from "./components/SecretsEnc.js";
import SecretsDec from "./components/SecretsDec.js";
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
  const [loaderState, setLoaderState] = useState({ show: false, mode: "encode", emoji: "", bytes: 0});

  const toggleTheme = () => {
    setTheme(prev => (prev === 'day' ? 'night' : 'day'));
  };

  const showMsg = useCallback((text, error = true) => {
    setMsg({ text, error });
  }, []);

  const showLoader = useCallback(
    ({ show = false, mode = 'encode', emoji = '', bytes = 0 }) =>
      setLoaderState({ show, mode, emoji, bytes }),
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
        emoji={loaderState.emoji}
        bytes={loaderState.bytes}
      />
      <h1>Encryption & Data Transformation Tool Kit</h1>

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
        <Route path="/obfuscation-tools" element={<ObfuscationTools showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/mulberry-shuffle-enc" element={<MulberryShuffleEnc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/mulberry-shuffle-dec" element={<MulberryShuffleDec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/quant-shuffle-enc" element={<QuantShuffleEnc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} showLoader={showLoader} />} />
        <Route path="/quant-shuffle-dec" element={<QuantShuffleDec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} showLoader={showLoader} />} />
        <Route path="/sss-enc" element={<SecretsEnc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} showLoader={showLoader} />} />
        <Route path="/sss-dec" element={<SecretsDec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} showLoader={showLoader} />} />
        <Route path="/qr-generator" element={<QrGenerator showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
        {/* Add more routes for other tools if needed */}
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
