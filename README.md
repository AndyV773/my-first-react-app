# My First React App

## Data Transformation and Encryption Toolkit

This is a static JavaScript app designed for educational and demonstration purposes. It showcases a variety of shuffle and cryptographic techniques and performs all encryption entirely in the browser - no backend is required.

This project is hosted on github pages and can be found here: [https://andyv773.github.io/my-first-react-app/](https://andyv773.github.io/my-first-react-app/)
This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Features

This project includes the following tools:

- Transformation Tools
- AES-CBC Encryption
- AES-GCM Encryption
- Fisher-Yates Algorithm
- Shamir's Secret Sharing
- XOR-Based Hash Encoder
- ROT/XOR Uint8
- ROT/XOR Uint32
- Quantum Shuffle
- Optimised Quantum Shuffle
- Quantum Shuffle Uint32
- Chaotic Key Stretcher
- Chaotic Encoder
- Encrypted QR Codes
- QR Code Generator
- SHA & Argon2 Hashing
- File Integrity Check
- IP Information
- TOTP & Captcha Simulator
- Password Generator

## Deployment

### Deployment to GitHub Pages

This React app was deployed using GitHub Pages as a static front-end application.

### 1. Install `gh-pages`

```bash
npm install --save-dev gh-pages
```

### 2. Add a homepage field to your `package.json`:

```json
"homepage": "https://<your-username>.github.io/<repository-name>"
```

### 3. Add deployment scripts to package.json:

```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```

### 4. Build and deploy the app:

```bash
npm run deploy
```

This will create a production build in the build folder and push it to the gh-pages branch of your repository.

### 5. Access your app:

Open the URL you specified in the homepage field https://<your-username>.github.io/<repository-name>.

### 6. Optional: Local testing of the production build:

```bash
npx serve -s build
```

## Libraries Used

- **[crypto-js](https://github.com/brix/crypto-js)** – Provides AES (CBC & GCM) encryption and hashing algorithms like SHA-256.
- **[pako](https://github.com/nodeca/pako)** – Zlib-compatible compression and decompression of data.
- **[qrcode](https://github.com/soldair/node-qrcode)** – Generates customizable QR codes.
- **[jsQR](https://github.com/cozmo/jsQR)** – Reads and decodes QR codes from images.
- **[html5-qrcode](https://github.com/mebjas/html5-qrcode)** – Scans and reads QR codes from a device camera.
- **[secrets.js-grempe](https://github.com/grempe/secrets.js)** – JavaScript library for Shamir's Secret Sharing.
- **[JSZip](https://stuk.github.io/jszip/)** – Creates, reads, and edits `.zip` files in JavaScript.
- **[Argon2](https://github.com/antelle/argon2-browser)** – Browser implementation of the Argon2 password hashing algorithm.
- **[Font Awesome](https://fontawesome.com/)** – Icon toolkit for web projects.
- **[gh-pages](https://www.npmjs.com/package/gh-pages)** – Utility to publish to GitHub Pages from npm scripts.
