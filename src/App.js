import React, { useState } from "react";
import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";
import LockScreen from "./components/LockedState";
import ObfuscationTools from "./components/ObfuscationTools";
import File8ShufflerEnc from "./components/File8ShufflerEnc";
import File8ShufflerDec from "./components/File8ShufflerDec";
import "./App.css";
import { motion } from "framer-motion";
import ToolBox from './components/ToolBox';
import { tools } from './data/tools.js';
import { containerVariants, itemVariants } from './animations/variants.js';
import { Msg, ColorController, ScrollToTop } from './utils/uiHelpers';


function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [msg, setMsg] = useState({ text: '', error: false });

  function showMsg(text, error = true) {
    setMsg({ text, error });
  }

  return (
    <div className="app-wrapper">
      <ScrollToTop />
      <ColorController />
      <Msg message={msg.text} error={msg.error} onClear={() => setMsg({ text: '', error: false })} />
      <h1>Encryption & Data Transformation Toolkit</h1>

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
        <Route path="/obfuscation-tools" element={<ObfuscationTools showMsg={showMsg} />} />
        <Route path="/file-8-shuffler" element={<File8ShufflerEnc showMsg={showMsg} />} />
        <Route path="/file-8-shuffler-dec" element={<File8ShufflerDec showMsg={showMsg} />} />
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
