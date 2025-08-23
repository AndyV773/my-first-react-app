import React, {useState, useEffect, useRef, useCallback} from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle, PreCopyOutputBlock } from '../utils/uiHelpers';
import { textEncoder } from '../utils/cryptoUtils';
import { saveFileAsExt } from '../utils/fileUtils';


const KeyStretcher = ({ showMsg, theme, onToggleTheme, showLoader }) => {
    const [keyInput, setKeyInput] = useState("");
    const [keyOutput, setKeyOutput] = useState("");
    const [byteOutput, setByteOutput] = useState("");
    const [hash1Iterations, setHash1Iterations] = useState(1);
    const [hash2Iterations, setHash2Iterations] = useState(1);
    const [depth, setDepth] = useState(1);
    const [phase, setPhase] = useState(1);
    const [sizeIterations, setSizeIterations] = useState(1);
    const [hash1Output, setHash1Output] = useState("");
    const [hash2Output, setHash2Output] = useState("");
    const [chunks, setChunks] = useState("");
    const [keyJoined, setKeyJoined] = useState("");

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
        if (!hash1Iterations || !hash2Iterations || !depth|| !phase || !sizeIterations) {
            showMsg("Please enter valid inputs.", true);
            return;
        }

        setByteOutput(textEncoder(keyInput));

        showLoader({ show: true, mode: 'Stretching', type: "loader encode", emoji: '🛡️', bytes: 500000 });

        // Record start time
        timerRef.current = performance.now();

        setKeyJoined(`${keyInput}$#=${hash1Iterations}$#=${hash2Iterations}$d=${depth}$p=${phase}$l=${sizeIterations}`)

        workerRef.current.postMessage({
            type: "stretch",
            load: { keyInput },  
            hash1Iterations,  
            hash2Iterations,
            depth,
            phase,
            sizeIterations,  
        });
    }, [keyInput, hash1Iterations, hash2Iterations, depth, phase, sizeIterations, showMsg, showLoader]);


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

                const minutes = Math.floor(timeMs / 60000);
                const seconds = Math.floor((timeMs % 60000) / 1000);
                const milliseconds = Math.floor(timeMs % 1000);

                setElapsedTime({ minutes, seconds, milliseconds });
            
                // Set state and UI
                setKeyOutput(key);
                setHash1Output(hash1);
                setHash2Output(hash2);

                const keyChunks = key.split(",");
                setChunks(keyChunks.length);
                
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
                <h2>Chaotic Key Stretcher</h2>
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
                <p>Adjust the chaotic logistic map to icrease computation without increasing the size, while still varying the values.</p>
                <p>Depth 0-inf. Set between 500-1000 for good depth.</p>
                <input 
                    type="number" 
                    value={depth || ""} 
                    onChange={(e) => setDepth(Number(e.target.value))} 
                    placeholder="Enter depth" 
                    autoComplete="off"
                />
                <p>Phase 0-inf. I find around 100000 works well.</p>
                <input 
                    type="number" 
                    value={phase || ""} 
                    onChange={(e) => setPhase(Number(e.target.value))} 
                    placeholder="Enter phase" 
                    autoComplete="off"
                />
                <p>Size iterations 0-inf. Over 10 can cause it to crach - js is limit to around ~1 billion characters in V8. Increase the size based on data to encode.</p>
                <input 
                    type="number" 
                    value={sizeIterations || ""} 
                    onChange={(e) => setSizeIterations(Number(e.target.value))} 
                    placeholder="Enter size iterations" 
                    autoComplete="off"
                />
                <button className="encode" onClick={handleStretch}>Stretch key</button>
                <div className={`${keyJoined ? '' : 'hidden'}`}>
					<PreCopyOutputBlock outputId={"key-joined"} text={keyJoined} />
				</div>
            </section>
            <section>
                <h3>Output</h3>
                {elapsedTime && (
                    <p>Time taken: {elapsedTime.minutes}m {elapsedTime.seconds}s {elapsedTime.milliseconds}ms</p>
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

                <p>Key chunks: {`${chunks? chunks : "0"}`}</p>
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