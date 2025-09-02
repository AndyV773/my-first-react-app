import React, { useState, useCallback } from "react";
import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";
import LockScreen from "./components/LockedState.js";
import About from "./components/About.js";
import TransformationTools from "./components/TransformationTools.js";
import AesCbcEnc from "./components/AesCbcEnc.js";
import AesCbcDec from "./components/AesCbcDec.js";
import AesGcmEnc from "./components/AesGcmEnc.js";
import AesGcmDec from "./components/AesGcmDec.js";
import FisherAlgoEnc from "./components/FisherAlgoEnc.js";
import FisherAlgoDec from "./components/FisherAlgoDec.js";
import SecretsEnc from "./components/SecretsEnc.js";
import SecretsDec from "./components/SecretsDec.js";
import XorBasedEnc from "./components/XorBasedEnc.js";
import XorBasedDec from "./components/XorBasedDec.js";
import Uint8Enc from "./components/Uint8Enc.js";
import Uint8Dec from "./components/Uint8Dec.js";
import Uint32Enc from "./components/Uint32Enc.js";
import Uint32Dec from "./components/Uint32Dec.js";
import QuantShuffleEnc from "./components/QuantShuffleEnc.js";
import QuantShuffleDec from "./components/QuantShuffleDec.js";
import OptQuantEnc from "./components/OptQuantEnc.js";
import OptQuantDec from "./components/OptQuantDec.js";
import QuantShuffleEnc32 from "./components/QuantShuffleEnc32.js";
import QuantShuffleDec32 from "./components/QuantShuffleDec32.js";
import KeyStretcher from "./components/KeyStretcher.js";
import ChaoticEnc from "./components/ChaoticEnc.js";
import ChaoticDec from "./components/ChaocticDec.js";
import QrEnc from "./components/QrEnc.js";
import QrDec from "./components/QrDec.js";
import QrGenerator from "./components/QrGenerator.js";
import Hashing from "./components/Hashing.js";
import FileIntegrity from "./components/FileIntegrity.js";
import IpAddy from "./components/IpAddy.js";
import TotpSim from "./components/TotpSim.js";
import PasswordGen from "./components/PasswordGen.js";
import "./App.css";
import { motion } from "framer-motion";
import ToolBox from './components/ToolBox.js';
import { tools } from './data/tools.js';
import { containerVariants, itemVariants } from './animations/variants.js';
import { Msg, ColorController, ScrollToTop, Loader } from './utils/uiHelpers.js';


function App() {
	const [unlocked, setUnlocked] = useState(false);
	const [theme, setTheme] = useState('day');
	const [msg, setMsg] = useState({ text: '', error: false });
	const [loaderState, setLoaderState] = useState({ show: false, mode: "encode", type: "loader", emoji: "", bytes: 0});

	const toggleTheme = () => {
		setTheme(prev => (prev === 'day' ? 'night' : 'day'));
	};

	const showMsg = useCallback((text, error = true) => {
		setMsg({ text, error });
	}, []);

	const showLoader = useCallback(
		({ show = false, mode = 'encode', type = "loader", emoji = '', bytes = 0 }) =>
			setLoaderState({ show, mode, type, emoji, bytes }),
		[]
	);

	const NotFound = () => {
		return (
			<div className="text-centre">
				<h1>404 - Page Not Found</h1>
				<p>Sorry, the page you are looking for does not exist.</p>
				<br />
				<br />
				<a href="/">Go back home</a>
			</div>
		);
	};

	return (
		<div className="app-wrapper">
			<ScrollToTop />
			<ColorController theme={theme} />
			<Msg message={msg.text} error={msg.error} onClear={() => setMsg({ text: '', error: false })} />
			<Loader
				show={loaderState.show}
				mode={loaderState.mode}
				type={loaderState.type}
				emoji={loaderState.emoji}
				bytes={loaderState.bytes}
			/>
			<h1>Encryption & Data Transformation Toolkit</h1>

			<Routes>
				<Route
					path="/"
					element={
					!unlocked ? (
						<LockScreen onUnlock={() => setUnlocked(true)} showMsg={showMsg} />
					) : (
						<>
						<main id="home-page">
							<motion.div
								className="grid"
								variants={containerVariants}
								initial="hidden"
								animate="visible"
							>
							{tools.map(({ id, title, description }) => (
								<motion.div key={id} variants={itemVariants}>
									<Link to={`/${id}`} className="toolbox-link">
										<ToolBox key={id} id={id} title={title} description={description} />
									</Link>
								</motion.div>
							))}
							</motion.div>
						</main>
						</>
					)}
				/>
				<Route path="/about" element={<About showMsg={showMsg} />} />
				<Route path="/transformation-tools" element={<TransformationTools showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/aes-cbc-enc" element={<AesCbcEnc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/aes-cbc-dec" element={<AesCbcDec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/aes-gcm-enc" element={<AesGcmEnc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/aes-gcm-dec" element={<AesGcmDec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/fisher-algo-enc" element={<FisherAlgoEnc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/fisher-algo-dec" element={<FisherAlgoDec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/sss-enc" element={<SecretsEnc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/sss-dec" element={<SecretsDec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/xor-based-enc" element={<XorBasedEnc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/xor-based-dec" element={<XorBasedDec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/uint8-enc" element={<Uint8Enc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/uint8-dec" element={<Uint8Dec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/uint32-enc" element={<Uint32Enc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/uint32-dec" element={<Uint32Dec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/quant-shuffle-enc" element={<QuantShuffleEnc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} showLoader={showLoader} />} />
				<Route path="/quant-shuffle-dec" element={<QuantShuffleDec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} showLoader={showLoader} />} />
				<Route path="/opt-quant-enc" element={<OptQuantEnc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} showLoader={showLoader} />} />
				<Route path="/opt-quant-dec" element={<OptQuantDec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} showLoader={showLoader} />} />
				<Route path="/quant-shuffle-enc-32" element={<QuantShuffleEnc32 showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} showLoader={showLoader} />} />
				<Route path="/quant-shuffle-dec-32" element={<QuantShuffleDec32 showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} showLoader={showLoader} />} />
				<Route path="/key-stretcher" element={<KeyStretcher showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} showLoader={showLoader} />} />
				<Route path="/chaotic-enc" element={<ChaoticEnc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} showLoader={showLoader} />} />
				<Route path="/chaotic-dec" element={<ChaoticDec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} showLoader={showLoader} />} />
				<Route path="/qr-enc" element={<QrEnc showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/qr-dec" element={<QrDec showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/qr-generator" element={<QrGenerator showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/hashing" element={<Hashing showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/file-integrity" element={<FileIntegrity showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/ip-addy" element={<IpAddy showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/totp-sim" element={<TotpSim showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="/password-gen" element={<PasswordGen showMsg={showMsg} theme={theme} onToggleTheme={toggleTheme} />} />
				<Route path="*" element={<NotFound />} />
			</Routes>
			<footer className="footer">
				<h3>Donations</h3>
				<p><strong>BTC: bc1qhyu5sjn4jjqncdwfcr3yzrwk2qn3s5wwzajpvy</strong></p>
				<p><strong>SOL: DQdd4KzDuL99aqqXdkaFqTMMH3Gx4MgXfHxktcf11g7k</strong></p>
				<p>
					© {new Date().getFullYear()}{" "}
					<a
						href="https://andyv.uk"
						target="_blank"
						rel="noopener noreferrer"
					>
					andyv.uk
					</a> - All rights reserved.
				</p>
			</footer>
		</div>
	);
}

export default function WrappedApp() {
	return (
		<Router>
			<App />
		</Router>
	);
}
