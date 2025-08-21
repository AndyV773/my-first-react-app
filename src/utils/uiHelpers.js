import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from "react-router-dom";
import { sha256 } from "./cryptoUtils";
import { detectFileExtension } from "./fileUtils";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClone } from '@fortawesome/free-regular-svg-icons';
import { faCircleHalfStroke } from '@fortawesome/free-solid-svg-icons';
import QRCode from 'qrcode';


// Returns today's date in DD/MM/YYYY format
export function getTodayDate() {
	const today = new Date();
	const dd = String(today.getDate()).padStart(2, '0');
	const mm = String(today.getMonth() + 1).padStart(2, '0');
	const yyyy = today.getFullYear();
	return `${dd}/${mm}/${yyyy}`;
}


// Returns hash of today’s date using crypto.subtle
export async function getTodayDateHash() {
	const dateStr = getTodayDate(); 
	const encoded = new TextEncoder().encode(dateStr);
	return await sha256(encoded);
}

// Checks input against today’s hash
export async function isCorrectDateInput(input) {
	const encodedInput = new TextEncoder().encode(input.trim());
	const inputHash = await sha256(encodedInput);
	const todayHash = await getTodayDateHash();
	return inputHash === todayHash;
}

// changes colors of body and text based on path
export function ColorController({ theme }) {
	const location = useLocation();
	
	useEffect(() => {
		const footer = document.querySelector('footer');
		const isHome = location.pathname === '/';
		const isAbout = location.pathname === '/about';

		// Reset body classes and styles
		document.body.classList.remove('p2', 'theme-day', 'theme-night');
		document.body.style.background = '';
		document.body.style.color = '';

		// Reset theme classes
		['main', 'h2', 'section'].forEach(selector => {
			document.querySelectorAll(selector).forEach(el => {
				el.classList.remove('theme-day', 'theme-night');
			});
		});

		if (isHome || isAbout) {
			document.body.style.background = "var(--primary-bg)";
			document.body.style.color = "var(--primary-text)";
			document.body.classList.add("p2");
			footer.classList.add('footer-primary');
			footer.classList.remove('footer-secondary');
		} else {
			document.body.classList.remove('p2');
			document.body.className = `theme-${theme}`;
			footer.classList.add('footer-secondary');
			footer.classList.remove('footer-primary');

			// Apply theme classes 
			['main', 'h2', 'section'].forEach(selector => {
				document.querySelectorAll(selector).forEach(el => {
				el.classList.add(`theme-${theme}`);
				});
			});
		}
	}, [location.pathname, theme]);
	
}

export function ThemeToggle({ theme, onToggle }) {
	return (
		<label className="theme-switch" title="Toggle theme">
			<input
				type="checkbox"
				checked={theme === 'night'}
				onChange={onToggle}
				aria-label="Toggle theme"
			/>
			<span className="slider">
				<FontAwesomeIcon icon={faCircleHalfStroke} className="icon" />
			</span>
		</label>
	);
}

// scrolls to the top when changing path
export function ScrollToTop() {
	const { pathname } = useLocation();

	useEffect(() => {
		window.scrollTo(0, 0);
	}, [pathname]);

	return null;
}


// show error or success message
export function Msg({ message, error, onClear }) {
	const [fadeOut, setFadeOut] = useState(false);

	useEffect(() => {
		if (message) {
	
		setFadeOut(false);

		const fadeTimer = setTimeout(() => setFadeOut(true), 1000);
		const clearTimer = setTimeout(() => onClear(), 3000);
		
		return () => {
			clearTimeout(fadeTimer);
			clearTimeout(clearTimer);
		};
		}
	}, [message, onClear]);

	if (!message) return null;

	return (
		<div 
			id="msg" 
			className={`${error ? 'error-msg' : 'success-msg'} 
			${fadeOut ? 'fade-out' : ''}`}
			>
			{message}
		</div>
	);
}

/**
 * @param {boolean} show - whether to show the loader at all
 * @param {'encode'|'decode'} mode - affects styling (e.g., color/verb)
 * @param {string} emoji - emoji to display
 * @param {number} bytes - bytes size compared to threshold = 50000
 */
export function Loader({ show = false, mode = "", type = "", emoji = "", bytes = 0}) {
	const threshold = 50000;

	if (!show || bytes <= threshold) return null;

	const defaultMsg = `${mode}... Please wait`;

	return (
		<div className="loader-overlay" aria-live="polite">
			<div className="loader-wrapper">
				<div className={`${type}`} />
				<div className="loader-icon">{emoji}</div>
			</div>
			<div className="loader-text">{defaultMsg}</div>
		</div>
	);
}

// updates views 
export async function extractViewData(bytes) {
	const base64 = btoa(String.fromCharCode(...bytes));
	let utf8;

	try {
		utf8 = new TextDecoder().decode(bytes);
	} catch {
		utf8 = "[Unreadable binary data]";
	}

	const ext = await detectFileExtension(bytes);
	return { base64, utf8, ext };
}

export const PreCopyOutputBlock = ({ outputId, text }) => {
	const [copied, setCopied] = useState(false);
	const [fadeOut, setFadeOut] = useState(false);

	let output;

	if (!text) text = output;

	const copyToClipboard = () => {
		output = document.getElementById(outputId)?.innerText || '';
		navigator.clipboard.writeText(output).then(() => {
			setCopied(true);
			setFadeOut(false);
			setTimeout(() => setFadeOut(true), 1000);
			setTimeout(() => setCopied(false), 1500);
		});
	};

	return (
		<div className="code-block">
			<pre id={outputId}>{text}</pre>
			{copied ? (
				<>
				<span className={`copy-msg ${fadeOut ? 'fade-out' : ''}`}>Copied!</span>
				<Msg message="Copied to clipboard!" error={false} />
				</>
			) : (
				<FontAwesomeIcon
					icon={faClone}
					className="copy-icon"
					onClick={copyToClipboard}
				/>
			)}
		</div>
	);
};


/**
 * Generate a QR code into a given container.
 * @param {Object} opts
 * @param {string} opts.input - The string to encode.
 * @param {HTMLElement} opts.container - DOM element to receive the canvas.
 * @param {string} [opts.fgColor='#000000'] - Dark color.
 * @param {string} [opts.bgColor='#ffffff'] - Light color.
 * @param {'L'|'M'|'Q'|'H'} [opts.errorCorrectionLevel='M'] - QR error correction level.
 * @param {number} [opts.margin=2] - Quiet zone around QR.
 */
export function generateQrCode({ input, container, fgColor = '#000000', bgColor = '#ffffff', errorCorrectionLevel, margin = 1}) {
	if (!container) return Promise.reject(new Error("QR code container is required."));

	container.innerHTML = '';

	const opts = {
		margin,
		errorCorrectionLevel,
		scale: 8,
		color: {
			dark: fgColor,
			light: bgColor,
		},
	};

	return new Promise((resolve, reject) => {
		QRCode.toCanvas(input, opts, (err, canvas) => {
			if (err) {
				return reject(new Error("QR generation failed: " + err.message));
			}
			container.appendChild(canvas);
			resolve(canvas);
		});
	});
}

/**
 * Hook: keeps a byte count of the value of a DOM input/textarea via ref.
 * @param {string<HTMLElement>} input
 * @param {(n:number)=>void} setCount
 */
export function useByteCounter(input, setCount) {
	useEffect(() => {
		const encoder = new TextEncoder();
		setCount(encoder.encode(input).length);
	}, [input, setCount]);
}

/**
 * Given the byte length of the input, returns the error correction info string and metadata.
 * @param {number} byteLength
 * @returns {{ level: string|null, label: string, maxBytes: number|null }}
 */
export function getQrCorrectionInfo(byteLength) {
	if (byteLength === 0) return { level: null, label: "No data" };
	if (byteLength <= 1200) return { level: "H", label: "High (H) - max 1200 B" };
	if (byteLength <= 1600) return { level: "Q", label: "Quartile (Q) - max 1600 B" };
	if (byteLength <= 2300) return { level: "M", label: "Medium (M) - max 2300 B" };
	if (byteLength <= 2900) return { level: "L", label: "Low (L) - max 2900 B" };
	return { level: null, label: "Data too large for QR, max 2900 B" };
}

export const QrScanner = ({
  onScan,
  onClose,
  fps = 10,
  facingMode = "environment",
}) => {
	const qrRegionId = "qr-scanner";
	const html5QrCodeRef = useRef(null);
	const isStartingRef = useRef(false); 
	const [isRunning, setIsRunning] = useState(false);

	const stopScanner = useCallback(async () => {
		// Prevent stopping during start phase
		if (isStartingRef.current) {
			return;
		}

		if (!html5QrCodeRef.current || !isRunning) {
			return; // Safe guard
		}

		try {
			await html5QrCodeRef.current.stop();
			await html5QrCodeRef.current.clear();
		} catch (err) {
			return { error: "Failed to stop scanner." };
		} finally {
			setIsRunning(false);
			onClose?.();
		}
	}, [isRunning, onClose]);

	const startScanner = useCallback(async () => {
		if (!window.Html5Qrcode) {
			return { error: "QR scanning library not found." };
		}

		if (!html5QrCodeRef.current) {
			html5QrCodeRef.current = new window.Html5Qrcode(qrRegionId);
		}

		isStartingRef.current = true; 

		try {
			await html5QrCodeRef.current.start(
				{ facingMode },
				{ fps },
				(decodedText) => {
					onScan(decodedText);
					setTimeout(() => stopScanner(), 1000);
				},
				(errorMessage) => {
					// console.warn("QR Scan error:", errorMessage);
					return { error: "QR Scan error:" + errorMessage };
				}
			);

			setIsRunning(true);
			return { success: true };
		} catch (err) {
			await stopScanner();
			return { error: `Camera error: ${err?.message || "Unknown error"}` };
		} finally {
			isStartingRef.current = false; 
		}
	}, [fps, facingMode, onScan, stopScanner]);

	useEffect(() => {
		const timeoutId = setTimeout(startScanner, 200);

		return () => {
			clearTimeout(timeoutId);

			if (isRunning) {
				stopScanner();
			}
		};
	}, [startScanner, stopScanner, isRunning]);

	return (
		<div className="overlay">
		<div id={qrRegionId} className="qr-region" />
			<button className="close-button" aria-label="Close QR Scanner" onClick={stopScanner}>X</button>
		</div>
	);
};

