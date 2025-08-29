import React from 'react';
import { Link } from 'react-router-dom';
import { PreCopyOutputBlock, ThemeToggle } from '../utils/uiHelpers'
import { textDecoder } from '../utils/cryptoUtils';
import {
	reverseString,
	utf8Escape,
	utf8Unescape,
	utf16Escape,
	utf16Unescape,
	stringCodePoints,
	decimalCodePoints,
	rot13,
	rot18,
	rotN,
	xorShuffle,
	xorBase64Encode,
	xorBase64Decode,
	hexEncode,
	hexDecode,
	base64Encode,
	base64Decode,
	base85Encode,
	base85Decode,
	base91Encode,
	base91Decode,
	compressText,
	decompressText,
	toUint8Array,
	fromUint8Array,
	toUint16Array,
	fromUint16Array,
	toUint32Array,
	fromUint32Array,
} from '../utils/obfuscationUtils';


const ObfuscationTools = ({ theme, onToggleTheme }) => {

	const doReverse = () => {
		const text = document.getElementById('reverse_input').value;
		document.getElementById('reverse_output').innerText = reverseString(text);
	};

	const doRot13 = () => {
		const text = document.getElementById('rot_input').value;
		document.getElementById('rot_output').innerText = rot13(text);
	};

	const doRot18 = () => {
		const text = document.getElementById('rot_input').value;
		document.getElementById('rot_output').innerText = rot18(text);
	};

	const doRotN = () => {
		const text = document.getElementById('rot_input').value;
		const n = parseInt(document.getElementById('rot_n_value').value) || 7;
		document.getElementById('rot_output').innerText = rotN(text, n);
	};

	const doXor = () => {
		const text = document.getElementById('xor_input').value;
		const n = parseInt(document.getElementById('xor_value').value) || 42;
		document.getElementById('xor_output').innerText = xorShuffle(text, n);
	};

	const doXorBase64 = () => {
		const text = document.getElementById('xor_input').value;
		const n = parseInt(document.getElementById('xor_value').value) || 42;
		document.getElementById('xor_output').innerText = xorBase64Encode(text, n);
	};

	const doXorBase64Decode = () => {
		const text = document.getElementById('xor_input').value;
		const n = parseInt(document.getElementById('xor_value').value) || 42;
		document.getElementById('xor_output').innerText = xorBase64Decode(text, n);
	};

	const doUnicodeEscape8 = () => {
		const text = document.getElementById('unicode_input8').value;
		document.getElementById('unicode_output8').innerText = utf8Escape(text);
	};

	const doUnicodeUnescape8 = () => {
		const text = document.getElementById('unicode_input8').value;
		document.getElementById('unicode_output8').innerText = utf8Unescape(text);
	};

	const doUnicodeEscape16 = () => {
		const text = document.getElementById('unicode_input16').value;
		document.getElementById('unicode_output16').innerText = utf16Escape(text);
	};

	const doUnicodeUnescape16 = () => {
		const text = document.getElementById('unicode_input16').value;
		document.getElementById('unicode_output16').innerText = utf16Unescape(text);
	};

	const doStringCodePoints = () => {
		const text = document.getElementById('input_points').value;
		document.getElementById('output_points').innerText = stringCodePoints(text);
	};

	const doDecimalCodePoints = () => {
		const num = document.getElementById('input_points').value;
		document.getElementById('output_points').innerText = decimalCodePoints(num);
	};

	const doHexEncode = () => {
		const text = document.getElementById('hex_input').value;
		document.getElementById('hex_output').innerText = hexEncode(text);
	};

	const doHexDecode = () => {
		const text = document.getElementById('hex_input').value;
		document.getElementById('hex_output').innerText = hexDecode(text);
	};

	const doBase64Encode = () => {
		const text = document.getElementById('base64_input').value;
		document.getElementById('base64_output').innerText = base64Encode(text);
	};

	const doBase64Decode = () => {
		const text = document.getElementById('base64_input').value;
		document.getElementById('base64_output').innerText = base64Decode(text);
	};
	const doBase85Encode = () => {
		const text = document.getElementById('base85_input').value;
		document.getElementById('base85_output').innerText = base85Encode(text);
	};

	const doBase85Decode = () => {
		const text = document.getElementById('base85_input').value;
		document.getElementById('base85_output').innerText = base85Decode(text);
	};

	const doBase91Encode = () => {
		const text = document.getElementById('base91_input').value;
		document.getElementById('base91_output').innerText = base91Encode(text);
	};

	const doBase91Decode = () => {
		const text = document.getElementById('base91_input').value;
		document.getElementById('base91_output').innerText = base91Decode(text);
	};

	const doCompress = () => {
		const text = document.getElementById('compress_input').value;
		document.getElementById('compress_output').innerText = compressText(text);
	};

	const doDecompress = () => {
		const text = document.getElementById('compress_input').value;
		document.getElementById('compress_output').innerText = decompressText(text);
	};

	const doUint8Array = () => {
		const text = document.getElementById('uint8_input').value;
		document.getElementById('uint8_output').innerText = toUint8Array(text);
	};

	const doFromUint8Array = () => {
		const text = document.getElementById('uint8_input').value;
		document.getElementById('uint8_output').innerText = fromUint8Array(text);
	};

	const doUint16Array = () => {
		const text = document.getElementById('uint16_input').value;
		document.getElementById('uint16_output').innerText = toUint16Array(text);
	};

	const doFromUint16Array = () => {
		const text = document.getElementById('uint16_input').value;
		document.getElementById('uint16_output').innerText = fromUint16Array(text);
	};

	const doUint32Array = () => {
		const text = document.getElementById('uint32_input').value;
		document.getElementById('uint32_output_uint8').innerText = toUint32Array(text);
	};

	const doFromUint32Array = () => {
		const text = document.getElementById('uint32_input').value;
		const bytes = fromUint32Array(text);
		document.getElementById('uint32_output_uint8').innerText = bytes;
		let decodedText;
		if (bytes.length > 0) {
			try {
				decodedText = textDecoder(bytes);
			} catch {
				decodedText = "[unreadable or invalid UTF-8]";
			}
		}
		document.getElementById('uint32_output_utf8').innerText = decodedText;
	};

	return (
		<main id='obfuscation' className="container">
			<nav>
				<Link to="/">Home</Link>
				<ThemeToggle theme={theme} onToggle={onToggleTheme} />
			</nav>

			<div className="learn-more">
				<h2>Obfuscation &amp; Encoding</h2>  
				<Link to="/about#about-obfuscation-tools">Learn more</Link>        
			</div>

			
			<section>
				<h3>Reverse</h3>
				<textarea id="reverse_input" placeholder="Enter text to reverse"></textarea>
				<div className="flex g1">
					<button onClick={doReverse} className="encode">Reverse</button>
				</div>
				<PreCopyOutputBlock outputId="reverse_output" />
			</section>

			<section>
				<h3>ROT13 / ROT18 / ROTN</h3>
				<textarea id="rot_input" placeholder="Enter text for ROT"></textarea>
				<label htmlFor="rot_n_value">Input rotation value</label>
				<input
					type="number"
					id="rot_n_value"
					name="rot_n_value"
					placeholder="Enter ROTN value"
					defaultValue="7"
				/>
				<div className="flex g1">
					<button onClick={doRot13} className="encode">ROT13</button>
					<button onClick={doRot18} className="encode">ROT18</button>
					<button onClick={doRotN} className="encode">ROTN</button>
				</div>
				<PreCopyOutputBlock outputId="rot_output" />
			</section>

			<section>
				<h3>XOR / XOR + Base64</h3>
				<textarea id="xor_input" placeholder="Enter text for XOR"></textarea>
				<input
					type="number"
					id="xor_value"
					name="xor_value"
					placeholder="Enter XOR key"
					defaultValue="42"
				/>
				<div id='xor-btn' className="flex g1 wrap">
					<div className="flex fg2300 g1">
						<button onClick={doXor} className="encode">XOR</button>
						<button onClick={doXorBase64} className="encode">XOR + Base64</button>
					</div>
					<div className="flex fg1300">
						<button onClick={doXorBase64Decode} className="decode">Decode XOR + Base64</button>
					</div>
				</div>
				<PreCopyOutputBlock outputId="xor_output" />
			</section>

			<section>
				<h3>Base64 Encode/Decode</h3>
				<p>Uses 64 characters (A-Z, a-z, 0-9, +, /). This add a overhead ~33%.</p>
				<textarea id="base64_input" placeholder="Enter text for Base64"></textarea>
				<div className="flex g1">
					<button onClick={doBase64Encode} className="encode">Encode</button>
					<button onClick={doBase64Decode} className="decode">Decode</button>   
				</div>
				<PreCopyOutputBlock outputId="base64_output" />
			</section>

			<section>
				<h3>Base85 Encode/Decode</h3>
				<p>Uses 85 characters (A-Z, a-z, 0-9, and !-u). This adds a overhead ~25%.</p>
				<textarea id="base85_input" placeholder="Enter text for Base85"></textarea>
				<div className="flex g1">
					<button onClick={doBase85Encode} className="encode">Encode</button>
					<button onClick={doBase85Decode} className="decode">Decode</button>   
				</div>
				<PreCopyOutputBlock outputId="base85_output" />
			</section>

			<section>
				<h3>Base91 Encode/Decode</h3>
				<p>Uses 91 characters (A-Z, a-z, 0-9, and ! # $ % & ( ) * + , . : / ; &lt; = &gt; ? @ [ ] ^ _ ` &#x7b; &#x7c; &#x7d; ~ &#x22;). This adds a overhead of ~23%.</p>
				<textarea id="base91_input" placeholder="Enter text for Base91"></textarea>
				<div className="flex g1">
					<button onClick={doBase91Encode} className="encode">Encode</button>
					<button onClick={doBase91Decode} className="decode">Decode</button>   
				</div>
				<PreCopyOutputBlock outputId="base91_output" />
			</section>

			<section>
				<h3>Compress/Decompress (Zlib)</h3>
				<textarea id="compress_input" placeholder="Enter text to compress"></textarea>
				<div className="flex g1">
					<button onClick={doCompress} className="encode">Compress</button>
					<button onClick={doDecompress} className="decode">Decompress</button>
				</div>
				<PreCopyOutputBlock outputId="compress_output" />
			</section>

			<section>
				<h3>Hex Encode/Decode</h3>
				<textarea id="hex_input" placeholder="Enter text for Hex"></textarea>
				<div className="flex g1">
					<button onClick={doHexEncode} className="encode">Encode</button>
					<button onClick={doHexDecode} className="decode">Decode</button> 
				</div>
				<PreCopyOutputBlock outputId="hex_output" />
			</section>

			<section>
				<h3>Unicode Escape/Unescape (UTF-8)</h3>
				<textarea id="unicode_input8" placeholder="Enter text for Unicode escape"></textarea>
				<div className="flex g1">
					<button onClick={doUnicodeEscape8} className="encode">Escape</button>
					<button onClick={doUnicodeUnescape8} className="decode">Unescape</button>
				</div>
				<PreCopyOutputBlock outputId="unicode_output8" />
			</section>

			<section>
				<h3>Unicode Escape/Unescape (UTF-16)</h3>
				<textarea id="unicode_input16" placeholder="Enter text for Unicode escape"></textarea>
				<div className="flex g1">
					<button onClick={doUnicodeEscape16} className="encode">Escape</button>
					<button onClick={doUnicodeUnescape16} className="decode">Unescape</button>
				</div>
				<PreCopyOutputBlock outputId="unicode_output16" />
			</section>

			<section>
				<h3>Unicode Escape/Unescape (Code Points)</h3>
				<p>Code points range from 0 to 1,114,112 (0x10FFFF).</p>
				<textarea id="input_points" placeholder="Enter text for Unicode escape"></textarea>
				<div className="flex g1">
					<button onClick={doStringCodePoints} className="encode">Escape</button>
					<button onClick={doDecimalCodePoints} className="decode">Unescape</button>
				</div>
				<PreCopyOutputBlock outputId="output_points" />
			</section>

			<section>
				<h3>Uint 8 Array (8 bits)</h3>
				<p>Each element can store values from 0 - 256 (0xFF).</p>
				<textarea id="uint8_input" placeholder="Enter text to compress"></textarea>
				<div className="flex g1">
					<button onClick={doUint8Array} className="encode">Escape</button>
					<button onClick={doFromUint8Array} className="decode">Unescape</button>
				</div>
				<PreCopyOutputBlock outputId="uint8_output" />
			</section>

			<section>
				<h3>Uint 16 Array (16 bits)</h3>
				<p>Each element can store values from 0 - 65,535 (0xFFFF).</p>
				<textarea id="uint16_input" placeholder="Enter text to compress"></textarea>
				<div className="flex g1">
					<button onClick={doUint16Array} className="encode">Escape</button>
					<button onClick={doFromUint16Array} className="decode">Unescape</button>
				</div>
				<PreCopyOutputBlock outputId="uint16_output" />
			</section>

			<section>
				<h3>Uint32 Array (32 bits)</h3>
				<p>Each element can store values from 0 to 4,294,967,295 (0xFFFFFFFF).</p>
				<textarea id="uint32_input" placeholder="Enter text to compress"></textarea>
				<div className="flex g1">
					<button onClick={doUint32Array} className="encode">Escape</button>
					<button onClick={doFromUint32Array} className="decode">Unescape</button>
				</div>
				<p></p>
				<PreCopyOutputBlock outputId="uint32_output_uint8" />
				<p>UTF8</p>
				<PreCopyOutputBlock outputId="uint32_output_utf8" />
			</section>
		</main>
	);
};

export default ObfuscationTools;