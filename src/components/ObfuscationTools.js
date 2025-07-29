import React from 'react';
import { Link } from 'react-router-dom';
import { PreCopyOutputBlock } from '../utils/uiHelpers'
import {
  reverseString,
  unicodeEscape,
  unicodeUnescape,
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
  compressText,
  decompressText
} from '../utils/obfuscationUtils';


const ObfuscationTools = () => {

  const doReverse = () => {
    const text = document.getElementById('reverse_input').value;
    document.getElementById('reverse_output').innerText = reverseString(text);
  };

  const doUnicodeEscape = () => {
    const text = document.getElementById('unicode_input').value;
    document.getElementById('unicode_output').innerText = unicodeEscape(text);
  };

  const doUnicodeUnescape = () => {
    const text = document.getElementById('unicode_input').value;
    document.getElementById('unicode_output').innerText = unicodeUnescape(text);
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
    const n = parseInt(document.getElementById('rot_n_value').value) || 13;
    document.getElementById('rot_output').innerText = rotN(text, n);
  };

  const doXor = () => {
    const text = document.getElementById('xor_input').value;
    document.getElementById('xor_output').innerText = xorShuffle(text);
  };

  const doXorBase64 = () => {
    const text = document.getElementById('xor_input').value;
    document.getElementById('xor_output').innerText = xorBase64Encode(text);
  };

  const doXorBase64Decode = () => {
    const text = document.getElementById('xor_input').value;
    document.getElementById('xor_output').innerText = xorBase64Decode(text);
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

  const doCompress = () => {
    const text = document.getElementById('compress_input').value;
    document.getElementById('compress_output').innerText = compressText(text);
  };

  const doDecompress = () => {
    const text = document.getElementById('compress_input').value;
    document.getElementById('compress_output').innerText = decompressText(text);
  };



  return (
    <main id='obfuscation' className="container">
      <nav>
        <Link to="/">Home</Link>
      </nav>
      <h2>Obfuscation &amp; Encoding</h2>

      <section>
        <h3>Reverse</h3>
        <textarea id="reverse_input" placeholder="Enter text to reverse"></textarea>
        <div className="obfuscation-btn">
            <button onClick={doReverse} className="encode">Reverse</button>
        </div>
        <PreCopyOutputBlock outputId="reverse_output" />
      </section>

      <section>
        <h3>Unicode Escape/Unescape</h3>
        <textarea id="unicode_input" placeholder="Enter text for Unicode escape"></textarea>
        <div className="obfuscation-btn">
            <button onClick={doUnicodeEscape} className="encode">Escape</button>
            <button onClick={doUnicodeUnescape} className="decode">Unescape</button>
        </div>
        <PreCopyOutputBlock outputId="unicode_output" />
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
          defaultValue="10"
        />
        <div className="obfuscation-btn">
            <button onClick={doRot13} className="encode">ROT13</button>
            <button onClick={doRot18} className="encode">ROT18</button>
            <button onClick={doRotN} className="encode">ROTN</button>
        </div>
        <PreCopyOutputBlock outputId="rot_output" />
      </section>

      <section>
        <h3>XOR / XOR + Base64</h3>
        <textarea id="xor_input" placeholder="Enter text for XOR"></textarea>
        <div className="obfuscation-btn">
            <button onClick={doXor} className="encode">XOR</button>
            <button onClick={doXorBase64} className="encode">XOR + Base64</button>
            <button onClick={doXorBase64Decode} className="decode">Decode XOR + Base64</button>
        </div>
        <PreCopyOutputBlock outputId="xor_output" />
      </section>

      <section>
        <h3>Hex Encode/Decode</h3>
        <textarea id="hex_input" placeholder="Enter text for Hex"></textarea>
        <div className="obfuscation-btn">
            <button onClick={doHexEncode} className="encode">Encode</button>
            <button onClick={doHexDecode} className="decode">Decode</button> 
        </div>
        <PreCopyOutputBlock outputId="hex_output" />
      </section>

      <section>
        <h3>Base64 Encode/Decode</h3>
        <textarea id="base64_input" placeholder="Enter text for Base64"></textarea>
        <div className="obfuscation-btn">
            <button onClick={doBase64Encode} className="encode">Encode</button>
            <button onClick={doBase64Decode} className="decode">Decode</button>   
        </div>
        <PreCopyOutputBlock outputId="base64_output" />
      </section>

      <section>
        <h3>Compress/Decompress (Zlib)</h3>
        <textarea id="compress_input" placeholder="Enter text to compress"></textarea>
        <div className="obfuscation-btn">
            <button onClick={doCompress} className="encode">Compress</button>
            <button onClick={doDecompress} className="decode">Decompress</button>
        </div>
        <PreCopyOutputBlock outputId="compress_output" />
      </section>
    </main>
  );
};

export default ObfuscationTools;