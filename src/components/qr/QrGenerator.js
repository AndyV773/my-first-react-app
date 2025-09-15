import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { generateQrCode, ThemeToggle } from 'utils/uiHelpers';
import { downloadQrCode } from 'utils/fileUtils';

const QrGenerator = ({ showMsg, theme, onToggleTheme }) => {
	const fallbackText = 'https://github.com/AndyV773/qr-code/raw/main/assets/images/sharky.jpg';
	const [text, setText] = useState(fallbackText);
	const [fgColor, setFgColor] = useState('#000000');
	const [bgColor, setBgColor] = useState('#ffffff');
	
	const qrContainerRef = useRef(null);
	const debounceRef = useRef(null);
	
	const handleGenerate = useCallback(async (inputText, fg, bg) => {
		if (!qrContainerRef.current) return;

		const encoder = new TextEncoder();
		const byteLength = encoder.encode(inputText).length;

		let level;
		if (byteLength <= 1200) {
			level = "H";
		} else if (byteLength <= 1600) {
			level = "Q";
		} else if (byteLength <= 2300) {
			level = "M";
		} else if (byteLength <= 2900) {
			level = "L";
		} else {
			return showMsg("Error: Exceeds maximum capacity for QR code.", true);
		}
		
		try {
			await generateQrCode({
				input: inputText,
				errorCorrectionLevel: level,
				fgColor: fg,
				bgColor: bg,
				container: qrContainerRef.current,
			});
		} catch (err) {
			showMsg("Error: QR generation failed. " + (err?.message || "unknown error"), true);
		}
	}, [showMsg]);


	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			handleGenerate(text.trim() || fallbackText, fgColor, bgColor);
		}, 250); // delay to generate

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [text, fgColor, bgColor, handleGenerate, fallbackText]);


	const handleDownload = () => {
		const canvas = qrContainerRef.current?.querySelector('canvas');
			if (canvas) {
				downloadQrCode(canvas, 'QR');
			} else {
				showMsg("Error: QR code not found.", true)
			}
		};

	return (
		<main className="container">
			<nav>
				<Link to="/">Home</Link>
				<ThemeToggle theme={theme} onToggle={onToggleTheme} />
			</nav>

			<div className="learn-more">
				<h2>QR Code Generator</h2>
				<Link to="/about#about-qr-gen">Learn more</Link>
			</div>

			<section>
				<label htmlFor="input">Enter text, URL, image or file link:</label>
				<textarea onChange={e => setText(e.target.value)} rows="5" placeholder="Enter here..."></textarea>

				<div className="options">
					<label>
						QR Colour:
						<input onChange={(e) => setFgColor(e.target.value)} type="color" value={fgColor} />
					</label>
					<label>
						Background:
						<input onChange={(e) => setBgColor(e.target.value)} type="color" value={bgColor} />
					</label>
				</div>
				<div className='qr-code' ref={qrContainerRef}></div>

				<button onClick={handleDownload}>Download QR Code</button>
			</section>
		</main>
	);
}

export default QrGenerator;