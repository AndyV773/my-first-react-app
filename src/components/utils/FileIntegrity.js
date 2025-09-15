import React, { useState } from "react";
import { Link } from 'react-router-dom';
import CryptoJS from "crypto-js";
import { formatBytes } from "utils/fileUtils";
import { ThemeToggle, PreCopyOutputBlock } from "utils/uiHelpers";


const FileIntegrity = ({ showMsg, theme, onToggleTheme }) => {
	const [fileInfo, setFileInfo] = useState(null);
	const [hashes, setHashes] = useState(null);

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		setFileInfo({
		name: file.name,
		type: file.type || "Unknown",
		size: file.size,
		});

		const reader = new FileReader();
		reader.onload = (event) => {
			const arrayBuffer = event.target.result;
			const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);

			const md5 = CryptoJS.MD5(wordArray).toString(CryptoJS.enc.Hex);
			const sha1 = CryptoJS.SHA1(wordArray).toString(CryptoJS.enc.Hex);
			const sha256 = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
			const sha512 = CryptoJS.SHA512(wordArray).toString(CryptoJS.enc.Hex);

			setHashes({ md5, sha1, sha256, sha512 });
		};

		reader.readAsArrayBuffer(file);
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
				<h2>File Integrity Check</h2>
				<Link to="/about#about-file-integrity">Learn more</Link>          
			</div>

			<section className="file">
				<input type="file" onChange={handleFileChange} />

				<div>
				{fileInfo && (
					<div className="file">
						<p>File Information:</p>
						<ul className="file">
							<li>Name: {fileInfo.name}</li>
							<li>Type: {fileInfo.type}</li>
							<li>Size: {formatBytes(fileInfo.size)} / {fileInfo.size} bytes</li>
						</ul>
					</div>
				)}
				</div>

				{hashes && (
					<div className="file-pre">
						<h3>Hashes:</h3>
						<div>
							MD5: 
							<PreCopyOutputBlock outputId={`hash-`} text={hashes.md5} />
						</div>
						<div>
							SHA-1: 
							<PreCopyOutputBlock outputId={`hash-`} text={hashes.sha1} />
						</div>
						<div>
							SHA-256:
							<PreCopyOutputBlock outputId={`hash-`} text={hashes.sha256} />
						</div>
						<div>
							SHA-512: 
							<PreCopyOutputBlock outputId={`hash-`} text={hashes.sha512} />
						</div>
					</div>
				)}
			</section>
		</main>
	);
};

export default FileIntegrity;
