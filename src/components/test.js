import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../utils/uiHelpers';

const Test = ({ theme, onToggleTheme }) => {
    const [inputText, setInputText] = useState('');
    const [numbers, setNumbers] = useState([]);
    const [showGrid, setShowGrid] = useState(false);

    const handleGenerateGrid = () => {
        const nums = inputText
        .split(/[\s,]+/)
        .map(n => n.trim())
        .filter(n => n.length > 0)
        .map(Number)
        .filter(n => !isNaN(n) && n >= 0);

        setNumbers(nums);
        setShowGrid(true);
    };

    const numberToColor = (num) => {
        const hue = (num * 137.5) % 360;
        const saturation = 30 + (num * 7) % 60;
        const lightness = 30 + (num * 13) % 40; 
        const alpha = 0.7 + ((num * 17) % 30) / 100;
        return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    };


    return (
        <main className="container p-4">
            <nav className="flex justify-between items-center mb-4">
                <Link to="/">Home</Link>
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </nav>

            <h2>Responsive Number Grid</h2>

            <textarea
                rows={10}
                placeholder="Enter numbers separated by commas or spaces..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
            />

            
            <button onClick={handleGenerateGrid}>Generate Grid</button>

            {showGrid && numbers.length > 0 && (
                <div>
                    <h3>Grid Visualization</h3>
                    <div className="num grid">
                        {numbers.map((num, idx) => (
                            <div key={idx} className='num cell' style={{ backgroundColor: numberToColor(num) }}>
                                {num}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </main>
    );
};

export default Test;
