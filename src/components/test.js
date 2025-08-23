import React, {useState} from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../utils/uiHelpers';
import CryptoJS from "crypto-js";

function randomInRange() {
    // return Math.floor(Math.random() * (1000000 - 100000 + 1)) + 100000;
    return Math.floor(Math.random() * (1000 - 100 + 1)) + 100;
}

function densifyNumber(num, keyLength) {
    const numStr = num.toString();

    const match = numStr.match(/0+$/);
    if (!match) return numStr; 

    // Generate replacement digits
    const replacement = (3 ** keyLength).toString();

    // Replace trailing zeros with replacement digits
    return numStr.replace(/0+$/, replacement);
}

/**
 * Split a string into chunks of a given size
 */
function chunkString(str, size) {
    const chunks = [];
    for (let i = 0; i < str.length; i += size) {
        chunks.push(str.slice(i, i + size));
    }
    return chunks;
}

function hexToBytesPow4(hex, keyLength = 32, iterations) {
    const length = hex.length / 2;
    let combined = '';

    for (let i = 0; i < length; i++) {
        let chunk = parseInt(hex.substr(i * 2, 2), 16) ** 4;
        let dense = densifyNumber(chunk, keyLength);

        for (let j = 0; j < iterations; j++) {
            // Split into 2-digit chunks
            const chunks = chunkString(dense.toString(), 2);

            // Raise each chunk to power of 3 and densify
            dense = chunks
                .map(c => densifyNumber((parseInt(c, 10) ** 3), keyLength))
                .join('');
        }

        combined += dense;
    }

    // Split combined string into 3-digit chunks for final output
    const result = chunkString(combined, 3);
    console.log('len', result.length);
    return result;
}


const Test = ({ showMsg, theme, onToggleTheme, handleTest, test }) => {
    const [keyInput, setKeyInput] = useState("");
    const [keyOutput, setKeyOutput] = useState("");
    const [byteOutput, setByteOutput] = useState("");
    const [num1, setNum1] = useState("");
    const [num2, setNum2] = useState("");
    const [hash1, setHash1] = useState("");
    const [hash2, setHash2] = useState("");
    const [length, setLength] = useState("");
    const [iterations, setIterations] = useState("");

    const handleStretch = () => {
        const num1 = randomInRange(); 
        const num2 = randomInRange(); 
        let hash1, hash2;
        let current = keyInput

        setNum1(num1);
        setNum2(num2);

        for (let i = 0; i < num1; i++) {
            const wordArray = CryptoJS.enc.Utf8.parse(current);
            current = CryptoJS.SHA512(wordArray).toString(CryptoJS.enc.Hex);
        }

        hash1 = current
        setHash1(hash1)
        const hex1 = hexToBytesPow4(hash1, 32, iterations);

        for (let i = 0; i < num2; i++) {
            const wordArray = CryptoJS.enc.Utf8.parse(current);
            current = CryptoJS.SHA512(wordArray).toString(CryptoJS.enc.Hex);
        }

        hash2 = current
        setHash2(hash2)

        const hex2 = hexToBytesPow4(hash2, 32, iterations);

        const bytes = new TextEncoder().encode(keyInput);
        setByteOutput(bytes)

        const string = `${hex1},${hex2}-${num1}-${num2}`

        setLength(string.length);

        setKeyOutput(string);

    }

    return (
        <main className="container">
            <nav>
                <div className="flex g1">
                    <Link to="/">Home</Link>
                </div>
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </nav>
        
            <div className="learn-more">
                <h2>Testing</h2>
                <Link to="/about">Learn more</Link>
            </div>
       
            <section>
                <div>
                    <p>{test}</p>
                </div>
                <button onClick={handleTest} className='encode'>Test</button>
            </section>

            <input 
                type="text" 
                value={keyInput} 
                onChange={(e) => setKeyInput(e.target.value)} 
                placeholder="Enter key" 
                autoComplete="off"
            />

            <input 
                type="number" 
                value={iterations} 
                onChange={(e) => setIterations(Number(e.target.value))} 
                placeholder="Enter iterations" 
                autoComplete="off"
            />

            <button className="encode" onClick={handleStretch}>Stretch key</button>

            <p>bytes</p>
            <textarea
                rows="2"
                value={byteOutput}
                placeholder="Encrypted Data"
                readOnly
			/>

            <p>Random number 1</p>
            <textarea
                rows="1"
                value={num1}
                placeholder="Number 1"
                readOnly
			/>

            <p>Hash sha-512 1</p>
            <textarea
                rows="2"
                value={hash1}
                placeholder="Hash"
                readOnly
			/>

            <p>Random number 2</p>
            <textarea
                rows="1"
                value={num2}
                placeholder="Number 2"
                readOnly
			/>

            <p>Hash sha-512 1</p>
            <textarea
                rows="2"
                value={hash2}
                placeholder="Hash"
                readOnly
			/>

            <p>Key {length}</p>
            <textarea
                rows="10"
                value={keyOutput}
                placeholder="Encrypted Data"
                readOnly
			/>
        </main>
    );
};

export default Test;