export const aboutInfo = [
  {
    id: "about-app",
    title: "About This App",
    description:
        "This encryption toolkit is designed as an educational and demonstration tool to showcase a variety of shuffle and cryptographic techniques. It is a static JavaScript app that handles encryption entirely on the front end, within the browser. Therefore, no backend is needed. However, this means there may be limitations due to browser memory or device speed, so large images or files can cause the browser to crash. I have not implemented any restrictions on file sizes - this app is completely experimental, explore the features and learn how each component works. The libraries used in this app consist of:",
    libs: [
        "crypto-js - Providing AES (CBC & GCM) encryption and hashing algorithms like SHA-256.",
        "pako - Zlib-compatible compression and decompression of data.",
        "qrcode - For generating customizable QR codes.",
        "jsQR - For reading and decoding QR codes from images.",
        "html5-qrcode - Used for scanning and reading QR codes from a device camera.",
        "secrets.js-grempe - JavaScript library for Shamir's Secret Sharing.",
        "jszip - For detecting file types though binary data such as word .doxc.",
    ],
  },
  {
    id: "about-aes-cbc",
    title: "About AES-CBC Encryption",
    description:
        "AES-CBC (Cipher Block Chaining) is a symmetric encryption mode that secures your data by chaining together encrypted blocks. This section explains how we implement AES-CBC for strong data encryption and decryption.",
    steps: [
        "Upload a file or enter text to encrypt.",
        "Enter your password (key) and press 'Encrypt'.",
        "A random 16-byte salt is generated and combined with your password to derive a encryption key using PBKDF2. Similar to applying a hash function (like SHA-256) repeatedly, 1000 iterations to stretch the key derived from the key + salt.",
        "A random 16-byte initialization vector (IV) is generated to ensure unique encryption even with the same key.",
        "The data is encrypted block-by-block using AES in CBC mode with the derived key and IV.",
        "The salt, IV, and ciphertext are combined into a single output for storage or transmission.",
        "During decryption, the salt and IV are extracted to regenerate the key and decrypt the data."
    ],
    additional: "If your password is weak, an attacker who obtains the encrypted data (including the salt and IV) can attempt to brute force the password using the same key derivation and encryption methods. The salt and IV do not protect against guessing the password - they only ensure unique encryption and key derivation. Therefore, using a strong, password is essential to maintain security.",
    originalPage: "/aes-cbc-enc",
    linkText: "Go to AES-CBC Encryption Tool"
  },
  {
    id: "about-aes-gcm",
    title: "About AES-GCM Encryption",
    description:
        "AES-GCM provides both confidentiality and integrity through authenticated encryption. Here you can learn how AES-GCM enhances security by preventing tampering along with encrypting your data.",
    steps: [
        "Upload a file or enter text to encrypt.",
        "Enter your password (key) and press 'Encrypt'.",
        "A random 16-byte salt is generated and combined with your password to derive an encryption key using PBKDF2. This process applies a hash function (SHA-256) repeatedly, 100,000 iterations (stretching the key).",
        "A random 12-byte (recommended) initialization vector (IV) is generated to ensure unique encryption even with the same key.",
        "The data is encrypted using AES in Galois/Counter Mode (GCM) with the derived key and IV, providing both confidentiality and integrity via an authentication tag.",
        "The salt, IV, and ciphertext (including authentication tag) are combined into a single output for storage or transmission.",
        "During decryption, the salt and IV are extracted to regenerate the key and verify the authentication tag before decrypting the data."
    ],
    additional: "Similar to AES-CBC, if your password is weak, the encryption is vulnerable to brute force attacks - where an attacker tries hundreds of thousands of password combinations using computational methods. AES-GCM provides confidentiality and integrity via an authentication tag (also called a MAC - Message Authentication Code), which helps detect if the data has been tampered with. However, using a strong, high-entropy password is essential to ensure your data remains secure.",
    originalPage: "/aes-gcm-enc",
    linkText: "Go to AES-GCM Encryption Tool"
  },
  {
    id: "about-obfuscation-tools",
    title: "About Obfuscation Tools",
    description:
      "Obfuscation tools modify and encode text to make it harder to read or analyze, adding a layer of security through obscurity. This section shows you some basic methods of data transformation, also useful for testing.",
    steps: [
        "Reverse: Reverse the characters of the input text.",
        "ROT13 / ROT18 / ROTN: Apply letter/number rotation to obfuscate the text.",
        "XOR / XOR + Base64: Obfuscate text using XOR with optional Base64 encoding; can also decode.",
        "Base64 Encode/Decode: Convert text to/from Base64 representation.",
        "Compress/Decompress (Zlib): Compress text to reduce size, or decompress it back to original.",
        "Hex Encode/Decode: Convert text to/from hexadecimal representation.",
        "Unicode Escape/Unescape (UTF-8): Escape or unescape text to/from UTF-8 Unicode sequences.",
        "Unicode Escape/Unescape (UTF-16): Escape or unescape text to/from UTF-16 Unicode sequences.",
        "Unicode Escape/Unescape (Code Points): Escape or unescape text using full Unicode code points (32-bit).",
        "Unit 8 Array (8 bits): Convert text to/from 8-bit arrays; each element stores 0 - 255.",
        "Unit 16 Array (16 bits): Convert text to/from 16-bit arrays; each element stores 0 - 65,535.",
        "Uint32 Array (32 bits): Convert text to/from 32-bit arrays; each element stores 0 - 4,294,967,295."
    ],
    originalPage: "/obfuscation-tools",
    linkText: "Go to Obfuscation Tools"
  },
  {
    id: "about-mulberry-shuffle",
    title: "About Mulberry Shuffle",
    description:
      "Mulberry Shuffle is a deterministic algorithm that rearranges data to make it unpredictable before encrypting it with AES-CBC, increasing complexity and security.",
    steps: [
      "Input data is shuffled using the Mulberry algorithm.",
      "Shuffled data is then encrypted with AES-CBC.",
      "Decryption reverses the AES-CBC encryption.",
      "Shuffled data is unshuffled to retrieve original content."
    ],
    originalPage: "/mulberry-shuffle-enc",
    linkText: "Go to Mulberry Shuffle Tool"
  },
  {
    id: "about-quant-shuffle",
    title: "About Quantum Shuffle",
    description:
      "Quantum Shuffle applies a high-load randomization process to files or text and then encrypts the result using AES-GCM for robust security against pattern analysis.",
    steps: [
      "Apply heavy randomization to the input data.",
      "Encrypt the randomized data with AES-GCM.",
      "Transmit encrypted data securely.",
      "Decrypt and reverse the shuffle process to recover data."
    ],
    originalPage: "/quant-shuffle-enc",
    linkText: "Go to Quantum Shuffle Tool"
  },
  {
    id: "about-opt-quant",
    title: "About Optimised Quantum Shuffle",
    description:
      "An all-in-one optimized variant of the Quantum Shuffle, combining efficient randomization with AES-GCM encryption for enhanced performance and security.",
    steps: [
      "Efficiently randomize input data with optimized algorithm.",
      "Encrypt randomized data with AES-GCM.",
      "Use optimized methods for decryption and unshuffling."
    ],
    originalPage: "/opt-quant-enc",
    linkText: "Go to Optimised Quantum Shuffle Tool"
  },
  {
    id: "about-rot-encoder",
    title: "About Rotation Encoder",
    description:
      "This tool applies rotation ciphers and integrates advanced encryption to encode text, providing an additional layer of complexity for secure communication.",
    steps: [
      "Input text is encoded using rotation cipher techniques.",
      "Encrypted with AES-GCM or similar methods.",
      "Decoding requires reversing rotation and decryption."
    ],
    originalPage: "/rot-encoder",
    linkText: "Go to Rotation Encoder Tool"
  },
  {
    id: "about-file-integrity",
    title: "About File Integrity Check",
    description:
      "Ensure your files remain unaltered by using common hashing algorithms that verify data integrity and detect any unauthorized changes.",
    steps: [
      "Select file to check integrity.",
      "Apply hashing algorithm (e.g., SHA-256).",
      "Compare hash output to expected value.",
      "Detect tampering if hashes don't match."
    ],
    originalPage: "/file-integrity",
    linkText: "Go to File Integrity Check Tool"
  },
  {
    id: "about-hashing",
    title: "About SHA-256 & Argon2 Hashing",
    description:
      "This section explains how multiple SHA-256 and Argon2 hashing algorithms are implemented to securely hash files or text, safeguarding data against attacks.",
    steps: [
      "Input data is hashed with SHA-256 for fixed-length output.",
      "Argon2 is used for memory-hard hashing improving security.",
      "Hashes can be used for verification or password storage."
    ],
    originalPage: "/hashing",
    linkText: "Go to SHA-256 & Argon2 Hashing Tool"
  },
  {
    id: "about-xor-based",
    title: "About XOR-Based Hash Encoder",
    description:
      "Explore how XOR-based encoding combines with hashing to provide a lightweight method of obscuring data and adding security.",
    steps: [
      "Apply XOR operation on input data with a key.",
      "Hash the XORed data for additional security.",
      "Reverse XOR operation for decoding."
    ],
    originalPage: "/xor-based-enc",
    linkText: "Go to XOR-Based Hash Encoder Tool"
  },
  {
    id: "about-sss",
    title: "About Secret Sharing",
    description:
      "Secret Sharing allows you to split sensitive information into multiple parts or shares, requiring a threshold number to reconstruct, enhancing secure key management.",
    steps: [
      "Input secret or private key.",
      "Split into multiple shares with defined threshold.",
      "Distribute shares securely to participants.",
      "Combine threshold number of shares to reconstruct secret."
    ],
    originalPage: "/sss-enc",
    linkText: "Go to Secret Sharing Tool"
  },
  {
    id: "about-password-gen",
    title: "About Password Generator",
    description:
      "Learn how the password generator creates strong, random, and secure passwords to help protect your accounts and data from unauthorized access.",
    steps: [
      "Select password length and complexity options.",
      "Generate random password using secure randomization.",
      "Use generated password for account or data protection."
    ],
    originalPage: "/password-gen",
    linkText: "Go to Password Generator Tool"
  },
  {
    id: "about-totp-sim",
    title: "About TOTP & Captcha Simulator",
    description:
      "This tool simulates Time-Based One-Time Passwords (TOTP) and bot-detection captchas to demonstrate multifactor authentication and security against automated attacks.",
    steps: [
      "Generate TOTP codes based on shared secret and current time.",
      "Validate TOTP codes for authentication.",
      "Use Captcha to prevent automated bot access."
    ],
    originalPage: "/totp-sim",
    linkText: "Go to TOTP & Captcha Simulator Tool"
  },
  {
    id: "about-qr-enc",
    title: "About Encrypted QR Codes",
    description:
      "Generate QR codes with encrypted data to securely share sensitive information while protecting it from unauthorized scanning or interception.",
    steps: [
      "Encrypt the data to be embedded in the QR code.",
      "Generate QR code with encrypted payload.",
      "Scan and decrypt QR code on the receiving end."
    ],
    originalPage: "/qr-enc",
    linkText: "Go to Encrypted QR Code Tool"
  },
  {
    id: "about-qr-gen",
    title: "About QR Code Generator",
    description:
      "Create QR codes easily for URLs, text, or other data. This section covers how QR codes are generated and their practical uses within the app.",
    steps: [
      "Input URL, text, or data.",
      "Generate QR code based on input.",
      "Use QR codes for sharing or quick access."
    ],
    originalPage: "/qr-generator",
    linkText: "Go to QR Code Generator Tool"
  },
];
