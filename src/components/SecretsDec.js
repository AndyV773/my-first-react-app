import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { uploadFile } from "../utils/fileUtils";
import { PreCopyOutputBlock, ThemeToggle } from "../utils/uiHelpers";

const SecretsDec = ({ showMsg, theme, onToggleTheme }) => {
	const [shareCount, setShareCount] = useState(2);
	const [inputs, setInputs] = useState(["", ""]);
	const [reconstructed, setReconstructed] = useState("");

	// Handle file upload
	const handleUpload = (e) => {
		const file = e.target.files[0];
		
		// reset
		setInputs(["", ""])
		setShareCount(2)
		e.target.value = "";
		if (!file) return;
	
		uploadFile(file, {
			onText: (text) => {
				// split by line, trim, and extract hash with regex
				const shares = text
					.split(/\r?\n/)
					.map(line => line.trim())
					.filter(line => line.length > 0)
					.map(line => line.replace(/^Share \d+:\s*/, "")); // remove "Share X: "

				setInputs(shares)
				setShareCount(shares.length)
			} 
		});
	};

	useEffect(() => {
		setInputs((prev) => {
			if (prev.length > shareCount) {
				// shrink array
				return prev.slice(0, shareCount);
			} else if (prev.length < shareCount) {
				// expand array
				return [...prev, ...Array(shareCount - prev.length).fill("")];
			}
			return prev; 
		});
	}, [shareCount]);

	const updateInput = (value, index) => {
		setInputs(prev => {
			const updated = [...prev];
			updated[index] = value;
			return updated;
		});
	};

	const combineShares = () => {
		const validShares = inputs.map(s => s.trim()).filter(Boolean);
		if (validShares.length < 2) return showMsg("Enter at least 2 shares.", true);

		try {
			const sec = window.secrets; // Use global secrets from CDN
			const hex = sec.combine(validShares);
			const original = sec.hex2str(hex);
			setReconstructed(original);
		} catch (e) {
			showMsg("Error combining shares. Make sure they are valid.", true);
			setReconstructed("");
		}
	};

	return (
		<main className="container">
			<nav>
				<div className="flex g1">
					<Link to="/">Home</Link>
					<Link to="/sss-enc">Encode</Link>
				</div>
				<ThemeToggle theme={theme} onToggle={onToggleTheme} />
			</nav>

			<div className="learn-more">
				<h2>Shamir's Secret Sharing</h2>
				<Link to="/about#about-sss">Learn more</Link>
			</div>

			<section id="decode-shares">
				<h2>Decode</h2>
				<p>Upload file or enter shares</p>
                <input type="file" onChange={handleUpload} />

				<label htmlFor="add-shares">Add shares:</label>
				<select id="add-shares" value={shareCount} onChange={(e) => setShareCount(parseInt(e.target.value))}>
					{Array.from({ length: 19 }, (_, i) => i + 2).map((n) => (
						<option key={n} value={n}>{n}</option>
					))}
				</select>

				{inputs.map((value, idx) => (
					<div key={idx}>
					<label>Share {idx + 1}:</label>
					<input
						type="text"
						value={value}
						onChange={(e) => updateInput(e.target.value, idx)}
						placeholder="Paste share here..."
					/>
					</div>
				))}

				<button onClick={combineShares} className="decode">Combine Shares</button>
				{reconstructed && (
					<div className="sss-pre">
						Reconstructed Secret:
						<PreCopyOutputBlock outputId={"secret"} text={reconstructed} />
					</div>
				)}
			</section>
		</main>
	);
};

export default SecretsDec;
