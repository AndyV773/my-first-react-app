import React, { useState } from 'react';
import { isCorrectDateInput, getTodayDate } from '../utils/uiHelpers'; 


function LockScreen({ onUnlock, showMsg }) {
    const [input, setInput] = useState('');
    const [error, setError] = useState('');

    const date = getTodayDate();

    async function handleSubmit(e) {
        e.preventDefault();

        if (await isCorrectDateInput(input)) {
            showMsg("Unlocked successfully!", false);
            setError('');
            onUnlock();
        } else {
            showMsg("Unlock failed!", true);
            setError("Incorrect date. Please enter today's date as DD/MM/YYYY");
        }
    }

    
    return (
        <main className="lock-screen">
            <h2>Enter today's date (DD/MM/YYYY)</h2>
            {error && <p>{error}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    value={input}
                    onChange={(e) => setInput(date)}  // e.target.value
                    placeholder="DD/MM/YYYY"
                    required
                    autoFocus
                />
                <button id='unlock' type="submit">Unlock</button>
            </form>
        </main>
    );
}

export default LockScreen;
