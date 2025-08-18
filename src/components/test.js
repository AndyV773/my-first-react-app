import React from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../utils/uiHelpers';


const Test = ({ showMsg, theme, onToggleTheme, handleTest, test }) => {

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
        </main>
    );
};

export default Test;