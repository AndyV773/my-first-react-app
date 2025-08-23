import React, {useState, useEffect, useRef, useCallback} from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../utils/uiHelpers';
import { textEncoder } from '../utils/cryptoUtils';
import { saveFileAsExt } from '../utils/fileUtils';


const KeyStretcher = ({ showMsg, theme, onToggleTheme, showLoader }) => {
    const [keyInput, setKeyInput] = useState("");
    const [keyOutput, setKeyOutput] = useState("");
    const [byteOutput, setByteOutput] = useState("");
    const [hash1Iterations, setHash1Iterations] = useState(1);
    const [hash2Iterations, setHash2Iterations] = useState(1);
    const [iterations, setIterations] = useState(1);
    const [hash1Output, setHash1Output] = useState("");
    const [hash2Output, setHash2Output] = useState("");
    const [length, setLength] = useState("");

    const [elapsedTime, setElapsedTime] = useState(null);
    const timerRef = useRef(0);


    // Refs
    const workerRef = useRef(null);

    const handleStretch = useCallback(() => {
        setByteOutput("");
        setKeyOutput("");
        if (!workerRef.current) return;
        if (!keyInput) {
            showMsg("Input key.", true);
            return;
        }
        if (!iterations) {
            showMsg("Input Iterations.", true);
            return;
        }
        if (!hash1Iterations) {
            showMsg("Input Hash 1 Iterations.", true);
            return;
        }
        if (!hash2Iterations) {
            showMsg("Input Hash 2 Iterations.", true);
            return;
        }

        setByteOutput(textEncoder(keyInput));

        showLoader({ show: true, mode: 'Stretching', type: "loader encode", emoji: '🛡️', bytes: 500000 });

        // Record start time
        timerRef.current = performance.now();

        workerRef.current.postMessage({
            type: "stretch",
            load: { keyInput },  
            hash1Iterations,  
            hash2Iterations,  
            iterations,  
        });
    }, [keyInput, showMsg, showLoader, hash1Iterations, hash2Iterations, iterations]);


    useEffect(() => {
        workerRef.current = new Worker(
            new URL('../workers/cryptoWorkerKey.worker.js', import.meta.url),
            { type: 'module'}
        );

        const onMessage = (e) => {
            const { type, result, hash1, hash2, error } = e.data;
            if (type === "stretch-done") {
                const { key } = result;

                const endTime = performance.now();
                const timeMs = endTime - timerRef.current; // elapsed time in milliseconds

                const seconds = Math.floor(timeMs / 1000);
                const milliseconds = Math.floor(timeMs % 1000);

                setElapsedTime({ seconds, milliseconds });
            
                // Set state and UI
                setKeyOutput(key);
                setHash1Output(hash1);
                setHash2Output(hash2);
                setLength(key.length);
                
                showMsg('Stretch Complete!', false);
                setTimeout(() => showLoader({ show: false }), 2000);
            } else if (type === 'error') {
                showMsg('Stretch failed: ' + error, true);
                showLoader({ show: false });
            }
        };

        workerRef.current.addEventListener('message', onMessage);
        return () => {
            workerRef.current.removeEventListener('message', onMessage);
            workerRef.current.terminate();
            workerRef.current = null;
        };
    }, [showMsg, showLoader]);

    const handleDownloadKey = () => {
        if (!keyOutput) return showMsg("Nothing to save.", true);

        const key = keyInput + "-" + hash1Iterations + "-" + hash2Iterations + "-" + iterations;

        saveFileAsExt(key, "txt", "key");
    }

    const handleDownloadOutput = () => {
        if (!keyOutput) return showMsg("Nothing to save.", true);

        saveFileAsExt(keyOutput, "txt", "key-output");
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
                <h2>Key Stretcher</h2>
                <Link to="/about#about-key-stretcher">Learn more</Link>
            </div>
            <section>
                <p>The higher the iterations the higher the computational effort. Increase the hash iterations to over 100000 for best results.</p>
                <input 
                    type="text" 
                    value={keyInput} 
                    onChange={(e) => setKeyInput(e.target.value)} 
                    placeholder="Enter key" 
                    autoComplete="off"
                />
                <p>Number of sha-512 iterations 0-inf</p>
                <input 
                    type="number" 
                    value={hash1Iterations || ""} 
                    onChange={(e) => setHash1Iterations(Number(e.target.value))} 
                    placeholder="Enter sha-512 iterations" 
                    autoComplete="off"
                />
                <p>Number of sha3-512 iterations 0-inf</p>
                <input 
                    type="number" 
                    value={hash2Iterations || ""} 
                    onChange={(e) => setHash2Iterations(Number(e.target.value))} 
                    placeholder="Enter sha3-515 iterations" 
                    autoComplete="off"
                />
                <p>Number of iterations 0-inf. Over 10 can cause it to crach - js is limit to around ~1 billion characters in V8.</p>
                <input 
                    type="number" 
                    value={iterations || ""} 
                    onChange={(e) => setIterations(Number(e.target.value))} 
                    placeholder="Enter key iterations" 
                    autoComplete="off"
                />
                <button className="encode" onClick={handleStretch}>Stretch key</button>
                <div className={`${keyOutput ? '' : 'hidden'}`}>
					<button onClick={() => handleDownloadKey()}>Download key</button>
				</div>
            </section>
            <section>
                <h3>Output</h3>
                {elapsedTime && (
                    <p>Time taken: {elapsedTime.seconds}s {elapsedTime.milliseconds}ms</p>
                )}
                <textarea
                    rows="2"
                    value={byteOutput}
                    placeholder="Bytes"
                    readOnly
                />
                <textarea
                    rows="2"
                    value={hash1Output}
                    placeholder="Sha2-512"
                    readOnly
                />
                <textarea
                    rows="2"
                    value={hash2Output}
                    placeholder="Sha3-512"
                    readOnly
                />

                <p>Key length: {`${length? length : "0"}`}</p>
                <textarea
                    rows="10"
                    value={keyOutput}
                    placeholder="Encrypted Data"
                    readOnly
                />
                <div className={`${keyOutput ? '' : 'hidden'}`}>
					<button onClick={() => handleDownloadOutput()}>Download key output</button>
				</div>
            </section>
        </main>
    );
};

export default KeyStretcher;