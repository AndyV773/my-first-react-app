import React, {useState, useEffect, useRef, useCallback} from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle, PreCopyOutputBlock } from '../utils/uiHelpers';
import { textEncoder, base62Encode } from '../utils/cryptoUtils';
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
    const [chunkSize, setChunkSize] = useState(3);
    const [reverse, setReverse] = useState(0);
    const [xor, setXor] = useState(0);
    const [hash1Output, setHash1Output] = useState("");
    const [hash2Output, setHash2Output] = useState("");
    const [keyJoined, setKeyJoined] = useState("");
    const [keyBase62, setKeyBase62] = useState("");

    const [counts, setCounts] = useState({});
    const [sortByFreq, setSortByFreq] = useState(false);

    const [numbers, setNumbers] = useState([]);
    const [showGrid, setShowGrid] = useState(false);

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
        if (!hash1Iterations || !hash2Iterations || !depth || !phase || !sizeIterations) {
            showMsg("Please enter valid inputs.", true);
            return;
        }

        setByteOutput(textEncoder(keyInput));

        // Record start time
        timerRef.current = performance.now();

        showLoader({ show: true, mode: `Stretching`, type: "loader encode", emoji: '🛡️', bytes: 500000 });

        setKeyJoined(`${keyInput},${hash1Iterations},${hash2Iterations},${depth},${phase},${sizeIterations},${chunkSize},${reverse},${xor}`);

        let endClass = `${chunkSize}${reverse}${xor}`;

        setKeyBase62(`${keyInput}-${base62Encode(hash1Iterations)}-${base62Encode(hash2Iterations)}-${base62Encode(depth)}-${base62Encode(phase)}-${base62Encode(sizeIterations)}-${base62Encode(endClass)}`);

        workerRef.current.postMessage({
            type: "stretch",
            load: { keyInput },
            hash1Iterations,  
            hash2Iterations,
            depth,
            phase,
            sizeIterations,  
            chunkSize,  
            reverse,
        });
    }, [keyInput, hash1Iterations, hash2Iterations, depth, phase, sizeIterations, chunkSize, reverse, xor, showMsg, showLoader]);


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
                
                showMsg('Stretch Complete!', false);
                setTimeout(() => showLoader({ show: false }), 2000);
            } else if (type === 'error') {
                showMsg('Stretch failed: ' + error, true);
                console.log('err:',error)
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
    
    const handleProcess = () => {
        if (!keyOutput) return showMsg("Nothing to check.", true);

        const tempCounts = {};

        keyOutput.forEach(num => {
            if (!tempCounts[num]) {
                tempCounts[num] = 0;
            }
            tempCounts[num]++;
        });

        setCounts(tempCounts);
    };
    
    const handleSortToggle = () => {
        setSortByFreq(!sortByFreq);
    };

    const handleClear = () => {
        setCounts({}); // clear the numbers
    };
    
    // Prepare table entries
    const tableEntries = Object.entries(counts);
    if (sortByFreq) {
        tableEntries.sort((a, b) => b[1] - a[1]); // sort by frequency
    } else {
        tableEntries.sort((a, b) => Number(a[0]) - Number(b[0])); // sort numerically
    }

    const totalNumbers = Object.values(counts).reduce((sum, c) => sum + c, 0);

    const handleGenerateGrid = () => {
        if (!keyOutput) return showMsg("Nothing to check.", true);

        const nums = keyOutput;
        setNumbers(nums);
        setShowGrid(true);
    };

    const handleClearGrid = () => {
        setNumbers([]); // clear the numbers
        setShowGrid(false); // hide the grid
    };

    const numberToColor = (num) => {
        const hue = (num * 137.5) % 360;      
        const saturation = 60 + (num * 37) % 40; 
        const lightness = 45 + (num * 29) % 35;  
        const alpha = 0.8 + ((num * 17) % 20) / 100; 
        return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    };

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
                <h2>Generate Key</h2>
                <p><strong>The process for deriving the key is the same as in <Link to="/chaotic-enc">Chaotic Encoder</Link>. Here, you can experiment with different possibilities. The more unique the input, the more unique the key should be. You can check number frequencies and spot patterns using the table and grid generator below. Use a larger chunk size for best results. Note: the longer a key takes to process, the more resilient it may be to brute-force attacks.</strong></p>
                <p>The key is for basic protection and uses the standerd ASCII character range.</p>
                <input 
                    type="text" 
                    value={keyInput} 
                    onChange={(e) => setKeyInput(e.target.value)} 
                    placeholder="Enter key" 
                    autoComplete="off"
                />
                <h3>Hash Algorithms</h3>
                <p>The higher the iterations the higher the computational effort. Increase the hash iterations to over 100000 for the best results.</p>
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
                <h3>Logistics Map</h3>
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
                <h3>Additional Parameters</h3>
                <p>Size iterations 0-inf. Too high can exceed call stack. Increase for larger data inputs.</p>
                <input 
                    type="number" 
                    value={sizeIterations || ""} 
                    onChange={(e) => setSizeIterations(Number(e.target.value))} 
                    placeholder="Enter size iterations" 
                    autoComplete="off"
                />
                <br/>
                <br/>
                <label htmlFor="digitOption">Select chunk size: </label>
                <select
                    id="digitOption"
                    value={chunkSize}
                    onChange={(e) => setChunkSize(Number(e.target.value))}
                >
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                    <option value={6}>6</option>
                    <option value={7}>7</option>
                    <option value={8}>8</option>
                    <option value={9}>9</option>
                    <option value={10}>10</option>
                    <option value={11}>11</option>
                    <option value={12}>12</option>
                </select>
                <br/>
                <br />
                <label>
                    Reverse key:
                    <input 
                        type="checkbox"
                        checked={reverse === 1} 
                        onChange={(e) => setReverse(e.target.checked ? 1 : 0)}
                    />
                </label>
                <label>
                    Use XOR:
                    <input 
                        type="checkbox"
                        checked={xor === 1} 
                        onChange={(e) => setXor(e.target.checked ? 1 : 0)}
                    />
                </label>
                <button className="encode" onClick={handleStretch}>Stretch key</button>
                <p>Key input before base62.</p>
                <PreCopyOutputBlock outputId={"key-joined"} text={keyJoined} />
                <p>Key is Base62 encoded, making it easier to copy or write it down.</p>
                <PreCopyOutputBlock outputId={"key-base62"} text={keyBase62} />
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
                <textarea
                    rows={10}
                    value={keyOutput}
                    placeholder="Key output"
                    readOnly
                />
                <div className={`${keyOutput ? '' : 'hidden'}`}>
					<button onClick={() => handleDownloadOutput()}>Download key output</button>
				</div>
            </section>
            <section>
                <h3>Number Frequency Counter (uint8 - uint32)</h3>
                <div className='flex g1'>
                    <button className='encode' onClick={handleProcess}>Generate Table</button>
                    <button className='decode' onClick={handleClear}>Clear Table</button>
                </div>
                <button onClick={handleSortToggle}>
                    {sortByFreq ? 'Sort by Number' : 'Sort by Frequency'}
                </button>
                {Object.keys(counts).length > 0 && (
                    <>
                        <p>Total number of chunks: {totalNumbers}</p>
                        <table className="tbl">
                            <thead>
                                <tr>
                                    <th>Number</th>
                                    <th>Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableEntries.map(([num, count]) => (
                                    <tr key={num}>
                                        <td>{num}</td>
                                        <td>{count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </section>
            <section>
                <h2>Visualization Grid</h2>
                <p>Use a coloured grid to identify patterns or groupings.</p>
                <div className='flex g1'>
                    <button className='encode' onClick={handleGenerateGrid}>Generate Grid</button>
                    <button className='decode' onClick={handleClearGrid}>Clear Grid</button>
                </div>
                {showGrid && numbers.length > 0 && (
                    <div className="num grid">
                        {numbers.map((num, idx) => (
                            <div 
                                key={idx} 
                                className='num cell' 
                                style={{ 
                                    backgroundColor: numberToColor(num),
                                    fontSize: chunkSize > 5 ? '11px' : '18px',
                                }}
                            >
                                {num}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
};

export default KeyStretcher;