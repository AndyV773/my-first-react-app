import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from "../utils/uiHelpers";
import { sha256, textEncoder } from "../utils/cryptoUtils";


const operators = [
    { symbol: '+', func: (a, b) => a + b },
    { symbol: '-', func: (a, b) => a - b },
    { symbol: '*', func: (a, b) => a * b },
];

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function generateChallenge() {
    const op = operators[getRandomInt(operators.length)];

    let a, b;
    if (op.symbol === '-') {
        // ensure a >= b for positive result
        b = getRandomInt(10);
        a = b + getRandomInt(10 - b); // a between b and 9
    } else {
        a = getRandomInt(10);
        b = getRandomInt(10);
    }

    return { a, b, op };
}

const TotpSim = ({ showMsg, theme, onToggleTheme }) => {
    const [code, setCode] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);
    const [inputCode, setInputCode] = useState('');
    const [status, setStatus] = useState('');
    const [hash, setHash] = useState("");

    const [challenge, setChallenge] = useState(() => generateChallenge());
    const [answer, setAnswer] = useState('');
    const [result, setResult] = useState('');
    const [honeypot, setHoneypot] = useState('');
    const startTime = useRef(Date.now());

    // Generate a new 6-digit code
    const generateRandomTotp = async () => {
        const random = Math.floor(100000 + Math.random() * 900000);
        const string = random.toString();

        const hash = await sha256(textEncoder(string));

        setHash(hash);

        return string;
    };

    useEffect(() => {
        // Generate initial values
        setCode(generateRandomTotp());
        setChallenge(generateChallenge());
        startTime.current = Date.now();

        const interval = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            const remaining = 30 - (now % 30);
            setTimeLeft(remaining);

            if (remaining === 30) {
                // New 30-second window started
                setCode(generateRandomTotp());
                setChallenge(generateChallenge());
                startTime.current = Date.now();

                // Reset inputs and results for both challenges
                setInputCode('');
                setStatus('');
                setAnswer('');
                setResult('');
                setHoneypot('');
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);


    const handleSubmit = async (e) => {
        e.preventDefault();
        const inputHash = await sha256(textEncoder(inputCode));

        if (inputHash === hash) {
            setStatus("Success.");
            showMsg("Success: Correct input!", false);
        } else {
            setStatus("Try again.");
            showMsg("Failed: Incorrect input!", true);
            setCode(generateRandomTotp());
            setInputCode('');
        }
    };


    const handleCaptcha = () => {
        if (honeypot !== '') {
            setResult("Try again.");
            showMsg("Bot detected (honeypot filled)", true);
            setChallenge(generateChallenge());
            setAnswer('');
            setHoneypot('');
            return;
        }

        const timeTaken = (Date.now() - startTime.current) / 1000;
        if (timeTaken < 2) {
            setResult("Try again.");
            showMsg("Too fast. Bots usually submit instantly.", true);
            setChallenge(generateChallenge());
            setAnswer('');
            setHoneypot('');
            startTime.current = Date.now();
            return;
        }

        const userAnswer = parseInt(answer.trim(), 10);
        const correctAnswer = challenge.op.func(challenge.a, challenge.b);

        if (userAnswer === correctAnswer) {
            setResult("Success!");
            showMsg("Success! You are human.", false);
        } else {
            setResult("Try again.");
            showMsg("Incorrect answer.", true);
            setChallenge(generateChallenge());
            setAnswer('');
            setHoneypot('');
        }
    };

  return (
    <main className="container">
        <nav>
            <Link to="/">Home</Link>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </nav>

        <div className="learn-more">
            <h2>TOTP & Captcha</h2>
            <Link to="/about#about-totp-sim">Learn more</Link>
        </div>

        <section>
            <h2>TOTP Simulator</h2>
        
            <p>Time left: {timeLeft}s</p>
            <p>Current Code: {code}</p>

            <form onSubmit={handleSubmit}>
                <label htmlFor="codeInput">Enter Code:</label>
                <input
                    id="codeInput"
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    maxLength={6}
                    autoComplete="off"
                />
                <button type="submit" className='encode'>Verify</button>
            </form>

            {status && <p>{status}</p>}
        </section>
        <section>
            <h2>Bot Captcha</h2>

            <div className='honey-pot'>
                <label htmlFor="honeypot">Blank label</label>
                <input
                    id="honeypot"
                    name="honeypot"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    autoComplete="off"
                />
            </div>

            <p>Time left: {timeLeft}s</p>
            <p>
                What is {challenge.a} {challenge.op.symbol} {challenge.b}?
            </p>
            <input
                type="text"
                placeholder="Your answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                maxLength={5}
                autoComplete="off"
            />
            <button onClick={handleCaptcha} className='encode'>Submit</button>

            <p>{result}</p>
        </section>
    </main>
  );
};

export default TotpSim;
