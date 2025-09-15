import React, { useState, useEffect, useCallback } from "react";
import { Link } from 'react-router-dom';
import { PreCopyOutputBlock, ThemeToggle } from "utils/uiHelpers";


const generatePassword = (length = 16, chunkSize = 4, useSpecialChars = true) => {
	const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	const specials = "!@#$%^&*()_+[]{}<>?|";
	const characters = useSpecialChars ? letters + specials : letters;
	const passwordArray = new Uint8Array(length);
  	crypto.getRandomValues(passwordArray);

	let password = "";
	for (let i = 0; i < length; i++) {
		// Map each random byte to a character in our character set
		const randomIndex = passwordArray[i] % characters.length;
		password += characters[randomIndex];
	}

	// Chunk the password
	let chunked = "";
	if (chunkSize !== 0) {
		for (let i = 0; i < password.length; i += chunkSize) {
		chunked += password.substring(i, i + chunkSize);
		if (i + chunkSize < password.length) {
			chunked += "-";
		}
		}
	} else {
		chunked += password
	}

	return chunked;
	};

	const PasswordGen = ({ showMsg, theme, onToggleTheme }) => {
	const [length, setLength] = useState(16);
	const [chunkSize, setChunkSize] = useState(4);
	const [useSpecialChars, setUseSpecialChars] = useState(true);
	const [passwords, setPasswords] = useState([]);

	const generatePasswords = useCallback(() => {
		const newPasswords = Array.from({ length: 6 }, () =>
		generatePassword(length, chunkSize, useSpecialChars)
		);
		setPasswords(newPasswords);
	}, [length, chunkSize, useSpecialChars]);

	useEffect(() => {
		generatePasswords();
	}, [generatePasswords]);

	return (
		<main className="container">
			<nav>
				<Link to="/">Home</Link>
				<ThemeToggle theme={theme} onToggle={onToggleTheme} />
			</nav>

			<div className="learn-more">
				<h2>Password Generator</h2>
				<Link to="/about#about-password-gen">Learn more</Link>
			</div>

			<section>
				<label >Password Length</label>
				<input
					type="number"
					value={length || ""}
					onChange={(e) => setLength(parseInt(e.target.value))}
				/>
				
				<label>Chunk Size</label>
				<input
					type="number"
					value={chunkSize || ""}
					onChange={(e) => setChunkSize(parseInt(e.target.value))}
				/>
				
				<label>Include Special Characters</label>
				<input
					type="checkbox"
					checked={useSpecialChars}
					onChange={() => setUseSpecialChars((prev) => !prev)}
				/>

				<button onClick={generatePasswords} className="encode">Generate Passwords</button>
			</section>
			<section>
				<h3>Generated Passwords:</h3>
				<div id="pw" className="grid">
					{passwords.map((pw, idx) => (
						<div key={idx}>
							<PreCopyOutputBlock outputId={`pw-${idx}`} text={pw} />
						</div>
					))}
				</div>
			</section>
		</main>
	);
};

export default PasswordGen;
