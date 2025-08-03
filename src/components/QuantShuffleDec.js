import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { uploadFile, saveFileAsEc } from "../utils/fileUtils";
import { quantShuffle } from "../utils/cryptoUtils";
import { extractViewData, useByteCounter, byteLength, ThemeToggle } from "../utils/uiHelpers";

const QuantShuffleDec = ({ showMsg, theme, onToggleTheme }) => {
    return (
        <main className="container">
            <nav>
                <div className="flex g1">
                    <Link to="/">Home</Link>
                    <Link to="/quant-shuffle-enc">Encode</Link>
                </div>
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </nav>
    
            <h2>Quant Shuffle</h2>
          
            <section>
                <h2>Encode</h2>
            </section>
        </main>
    )
}

export default QuantShuffleDec;

