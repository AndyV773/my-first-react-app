export const aboutInfo = [
	{
		id: "about-app",
		title: "About This App",
		description:
			"This data transformation and encryption toolkit is designed for educational and demonstration purposes to showcase a variety of shuffle and cryptographic techniques. It is a static JavaScript app that handles encryption entirely on the front end, within the browser. Therefore, no backend is needed. However, this means there are limitations due to browser memory or device speed, so large images or files can cause the browser to crash. I have not implemented any restrictions on file sizes - this app is completely experimental, explore the features and learn how each component works. The libraries used in this app consist of:",
		libs: [
			"crypto-js - Providing AES (CBC & GCM) encryption and hashing algorithms like SHA-256. (https://github.com/brix/crypto-js)",
			"pako - Zlib-compatible compression and decompression of data. (https://github.com/nodeca/pako)",
			"qrcode - For generating customizable QR codes. (https://github.com/soldair/node-qrcode)",
			"jsQR - For reading and decoding QR codes from images. (https://github.com/cozmo/jsQR)",
			"html5-qrcode - Used for scanning and reading QR codes from a device camera. (https://github.com/mebjas/html5-qrcode)",
			"secrets.js-grempe - JavaScript library for Shamir's Secret Sharing. (https://github.com/grempe/secrets.js)",
			"jszip - For creating, reading, and editing .zip files in JavaScript. (https://stuk.github.io/jszip/)"
		],
	},
	{
		id: "about-obfuscation-tools",
		title: "About Obfuscation Tools",
		description:
			"Obfuscation tools modify and encode text to make it harder to read or analyse, adding a layer of security through obscurity. This section shows you some basic methods of data transformation, also useful for testing.",
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
		linkText: "Go to AES-CBC Encryption"
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
		linkText: "Go to AES-GCM Encryption"
	},
	{
		id: "about-mulberry-shuffle",
		title: "About Mulberry Shuffle",
		description:
			"Mulberry Shuffle is a deterministic algorithm that rearranges data using a seeded pseudo-random number generator (PRNG) before encrypting it with AES-CBC, increasing complexity and security.",
		steps: [
			"You can upload a file or type text directly, and the content is displayed in both Base64 and UTF-8 formats so you can view the transformation.",
			"Enter a key and click 'Shuffle'. For text input, the data is encoded into a Uint8Array, while file uploads use the raw binary data as-is.",
			"A random salt (16 bytes) is added to the key to make it unique, and another random salt (16 bytes) is added to the input data for additional obscurity.",
			"The data and key are passed through a seeded shuffle, where the key is processed using the mulberry32 pseudo-random number generator (PRNG) to create a reversible shuffle pattern based on the key.",
			"The process can be repeated to increase complexity and security, with transformations viewable at each stage.",
			"AES-CBC encryption can optionally be applied after shuffling for stronger security.",
			"The final output can be saved and downloaded as an encrypted file.",
			"To decode, go to the Decode section, upload the correct file, and enter the correct shuffle key and AES key (if used). If you have shuffled multiple times, you must repeat the steps in the correct reverse order or the data may be lost.",
		],
		additional: "The Mulberry Shuffle is not cryptographic by itself - it is an advanced shuffling technique. Although extra precautions are taken to obscure the data, the data itself remains the same. For example, if you input 'Hello World', you can still see the original characters, just reordered and mixed with additional characters. Try it for yourself!",
		originalPage: "/mulberry-shuffle-enc",
		linkText: "Go to Mulberry Shuffle"
	},
	{
		id: "about-quant-shuffle",
		title: "About Quantum Shuffle",
		description:
			"Quantum Shuffle applies a high-load randomisation process to files or text, using rotation with Unicode code points. You can choose to further encrypt the data using AES-GCM. The process is broken down into stages, allowing you to view the transformation at each stage.",
		steps: [
			"Upload a file or input text. Files are Base64 encoded to handle the binary as text format.",
			"The character range is kept between 10000 to reduce computation. You can check the box to use all characters in the range of 1,114,112 (0x10FFFF) Unicode characters.",
			"When you click Shuffle, a random number is generated for each character within the desired range. This number and the original input are used to generate a new Unicode code point representing the data. It is then split into two outputs: the shuffled data and the rotation key.",
			"Next, you have the choice to add AES-GCM encryption using a separate key for both the data and the key. You can also choose to skip encryption.",
			"In the final stage, you can choose to store and save the binary data as Base64. This is the preferred method for QR codes, as some QR codes will not generate correctly with binary data.",
			"You can then choose to generate and save a QR code. If the data or key is below 2,900 bytes, it will display the error correction level of the QR code based on its size. Alternatively, you can save it as an encrypted file.",
			"Decrypt and reverse the shuffle process to recover the data."
		],
		additional: "This technique is not original - it has been known for many years and uses rotation with Unicode code points. I named it Quantum Shuffle, as I believe it is not possible to decode without the correct key. The key or data alone are meaningless, the key can be extremely long, based on the size of the input. Even if the user inputs 'Hello World' (11 bytes), each character is shuffled randomly so that, even with the data, attempting to brute-force the original input without the key could yield any 11-byte string, e.g., 'big red fox' or any other 11-byte word or phrase. I will be adding a technique later to disguise the character length, making it even more difficult. If you believe I am wrong and know of a way to break the encryption, I am always open for discussion - please get in touch.",
		originalPage: "/quant-shuffle-enc",
		linkText: "Go to Quantum Shuffle"
	},
	{
		id: "about-opt-quant",
		title: "About Optimised Quantum Shuffle",
		description:
			"An all-in-one optimised variant of the Quantum Shuffle, combining efficient randomization with AES-GCM encryption for enhanced performance and security.",
		steps: [
			"Upload a file or enter text.",
			"Choose all characters (1,114,112 possibilities) or keep the default 10,000, and enter the AES key for both data and key.",
			"Click 'Encrypt' and then choose to download as a .ec file or as a QR code if the data is small enough.",
			"To decode, upload both files and enter the correct AES keys to reveal the data."
		],
		additional: "Same process as Quantum Shuffle, but without the extra steps and with less rendering in the browser, saving on computation.",
		originalPage: "/opt-quant-enc",
		linkText: "Go to Optimised Quantum Shuffle"
	},
	{
		id: "about-quant-shuffle-32",
		title: "About Quantum Shuffle Uint32",
		description:
			"High-load Uint32 array randomised shuffle method with variable length, a variation of the Quantum Shuffle that originally used Unicode characters.",
		steps: [
			"Upload a file or enter text, then choose to include all characters (over 4 billion possibilities) or stick with the default (~1 million).",
			"Once you click 'Shuffle', the data is first handled as a Uint8 array. Two random numbers (0-99) are generated, and that amount of random Uint8 values is appended to the front and back of the data.",
			"Next, the data is converted into a Uint32 array and then shuffled using the randomly generated key, similar to the Quantum Shuffle.",
			"When the process is finished, you can download both the key and the data as an .ec32 file.",
			"To decode, upload both correct files and click 'Unshuffle' to reveal the original data."
		],
		additional: "Quantum Shuffle (Uint32) uses the same rotation method as previous quantum methods, but it operates bit-wise or word-wise and utilizes the full range of the Uint32 array, providing up to 4,294,967,295 possibilities. Unlike previous methods, it does not need to avoid surrogate pairs, making it much more versatile and not reliant on character code points.",
		originalPage: "/quant-shuffle-enc-32",
		linkText: "Go to Quantum Shuffle Uint32"
	},
	{
		id: "about-rot-encoder",
		title: "About Rotation Encoder Uint8",
		description:
			"This tool applies byte-wise rotation with wrap-around (byte-wise mod 256), modifying the values of a Uint8 array across all 256 possible byte values.",
		steps: [
			"Upload a file or enter text.",
			"You can randomly generate a key first, then use the slider to select the range of values from 256-1024. Any value over 256 will wrap around from 0-256.",
			"Next, enter the number of rotations you would like. The best approach is to have a key the same length as the input for maximum randomness. If the key is shorter than the data, it will repeat to match the length of the data.",
			"Alternatively, you can enter values manually, separated by commas. Once done, you can download the key as a .txt file.",
			"Click 'Encode' to see the UTF-8 output. You can then download it as a .ec file.",
			"To decode, upload the data and input the key or upload the key file. Click 'Decode' and the original output will be restored."
		],
		originalPage: "/rot-encoder",
		linkText: "Go to Rotation Encoder"
	},
	{
		id: "about-xor-based",
		title: "About XOR-Based Hash Encoder",
		description:
			"Explore how XOR-based encoding combines with hashing to provide a lightweight method of obscuring data and adding security.",
		steps: [
			"Upload a file or enter text.",
			"The input box allows you to specify how many iterations you would like to apply with different hash keys.",
			"Once you click 'Generate Hash and Encrypt,' the process will generate a 64-byte salt (the length of a SHA-256 hash key) and append it to the input. This helps obfuscate small inputs and ensures randomness.",
			"A hash key will then be generated from the total input value. This is hex-encoded into numbers and used to perform XOR encoding on the data.",
			"Depending on the number of iterations entered, this process will be repeated, but with a smaller salt (16 bytes) to reduce size, and a different hash generated each time.",
			"You can then download all hash keys to a .txt file and download the data, which is base64-encoded into a .ec file.",
			"To decode, upload the file or enter the base64 text. Then either upload the hash key file or input each key individually. As long as they are in the correct order, you will recover the original input."
		],
		originalPage: "/xor-based-enc",
		linkText: "Go to XOR-Based Hash Encoder"
	},
	{
		id: "about-xor-enc",
		title: "About XOR Uint32",
		description:
			"XOR encoding with a Uint32 array using bitwise shuffling for each 32-bit chunk.",
		steps:[
			"Upload a file or input text.",
			"Select the numeric range using the slider (from 1,000,000 to 10,000,000,000) and enter the amount you would like to generate. A good rule of thumb is to generate 1 key block per 4 characters and add an additional one for the length. For instance, 'hello world' is 11 bytes, so generate 3 plus 1 for length, making 4 in total.",
			"Click 'Generate' to create a random key, or experiment with different values by entering them manually. You can then download the key as a .txt file by clicking 'Download Key'.",
			"Click 'Encode' to reveal the XOR-shuffled message. This will show you the returned UTF-8 preview. You can then click 'Download' to save as a .ec32 file.",
			"To decode, upload the data and either upload or enter the key, then click 'Decode' to reveal the original data.",
		],
		additional: "This method works best if each key, separated by commas, is 10 digits long (32-bits) or negative numbers. For example, if the word is 'hello' (Uint8: 104,101,108,108,111), the original length is appended to the Uint32 array and will become [5,1819043176,111]. If XOR is done using a small key, only the first few bytes of the Uint32 array will change, leaving some original characters intact. This is still experimental, and improvements are being explored.",
		originalPage: "/xor-enc",
		linkText: "Go to XOR Uint32"
	},
	{
		id: "about-sss",
		title: "About Shamir's Secret Sharing",
		description:
			"Shamir's Secret Sharing allows you to split sensitive information into multiple parts or shares, requiring a threshold number to reconstruct, enhancing secure key management.",
		steps: [
			"Input the secret and set the number of shares. This determines how many people can potentially split it.",
			"Set the threshold - the number of shares required to reveal the secret. The minimum is 2. For example, if the total number of shares is 5, you could set the threshold to 3 or 4 so that if someone loses their share, the secret can still be recovered. Any fewer than the threshold and recovery is not possible.",
			"Click 'Split Secret' and the data will be divided into the selected number of shares. You can easily copy them to the clipboard or download all as a .txt file.",
			"To recover the secret, paste the threshold number of shares into the input boxes (order does not matter), or simply upload the file for easy testing. Click 'Combine Shares' to reveal the secret."
		],
		additional: "One of my favorite concepts, implemented via CDN due to conflicts I had with other libraries. Try it for yourself: https://cdn.jsdelivr.net/npm/secrets.js-grempe/secrets.min.js",
		originalPage: "/sss-enc",
		linkText: "Go to Secret Sharing"
	},
	{
		id: "about-key-stretcher",
		title: "About Chaotic Key Stretcher",
		description:
			"Key Stretcher uses multiple hashing algorithms (SHA-512 and SHA3-512), exponentiation, and custom mathematical operations to derive a long, secure key from a short, manageable key. This process increases computational complexity, making brute-force attacks more difficult.",
		steps: [
			"Enter a key. The longer, the better - anything 16 bytes or over is fine. Include special characters and numbers for extra complexity.",
			"Input the number of hashing iterations for both SHA-512 and SHA3-512. The more iterations, the better. Anything between 100,000 and 1,000,000 is good; over 1,000,000 is excessive.",
			"Enter the number of iterations for key stretching. This determines how many times the key is processed to increase its size. A value of 10 or under works well; higher values may cause the browser to crash or exceed JavaScript string limits.",
			"Once you click 'Stretch Key', the key is converted into bytes. These bytes are then transformed into two hash keys based on the iterations. The hash keys are converted to hex, which is then increased using exponentiation and densified to remove trailing zeros. The result is split into 2-digit chunks and further increased using exponentiation. This process repeats for the specified iteration range. Finally, it is split into 3-digit chunks to be used in a Uint8 256-byte rotation or XOR encoder.",
			"You can view the original bytes, the hash keys used, and the output data. Both the key and the key output can be downloaded for easy storage."
		],
		additional: "",
		originalPage: "/key-stretcher",
		linkText: "Go to Chaotic Key Stretcher"
	},
	{
		id: "about-chaotic-enc",
		title: "About Chaotic Encoder",
		description:
			"Key Stretcher uses multiple hashing algorithms (SHA-512 and SHA3-512), exponentiation, and custom mathematical operations to derive a long, secure key from a short, manageable key. This process increases computational complexity, making brute-force attacks more difficult.",
		steps: [
			"Enter a key. The longer, the better - anything 16 bytes or over is fine. Include special characters and numbers for extra complexity.",
			"Input the number of hashing iterations for both SHA-512 and SHA3-512. The more iterations, the better. Anything between 100,000 and 1,000,000 is good; over 1,000,000 is excessive.",
			"Enter the number of iterations for key stretching. This determines how many times the key is processed to increase its size. A value of 10 or under works well; higher values may cause the browser to crash or exceed JavaScript string limits.",
			"Once you click 'Stretch Key', the key is converted into bytes. These bytes are then transformed into two hash keys based on the iterations. The hash keys are converted to hex, which is then increased using exponentiation and densified to remove trailing zeros. The result is split into 2-digit chunks and further increased using exponentiation. This process repeats for the specified iteration range. Finally, it is split into 3-digit chunks to be used in a Uint8 256-byte rotation or XOR encoder.",
			"You can view the original bytes, the hash keys used, and the output data. Both the key and the key output can be downloaded for easy storage."
		],
		additional: "",
		originalPage: "/chaotic-enc",
		linkText: "Go to Chaotic Encoder"
	},
	{
		id: "about-qr-enc",
		title: "About Encrypted QR Codes",
		description:
			"Generate QR codes with encrypted data to securely share sensitive information while protecting it from unauthorised scanning or interception.",
		steps: [
			"Enter any text or information into the input box and provide a strong key. The encryption uses AES-GCM.",
			"Click 'Generate Encrypted QR' and a QR code will be created. The encoded data (Base64) will also be displayed for safe use within the QR code.",
			"Click 'Download QR Code' to save it as a .png file.",
			"To decode, upload the QR code image and enter the correct password. Then click 'Decrypt'—if the password is correct, the original data will be displayed."
		],
		additional: "A QR scanner using HTML5-QRcode is still in development. The QR codes are generated with the qrcode library, and AES-GCM encryption is provided by crypto-js.",
		originalPage: "/qr-enc",
		linkText: "Go to Encrypted QR Code"
	},
	{
		id: "about-qr-gen",
		title: "About QR Code Generator",
		description:
			"Create QR codes easily for URLs, text, or other data.",
		steps: [
			"Enter any text or information into the input box.",
			"QR codes are generated instantly as you type, so you can see the code update in real time.",
			"You can customise the QR code by changing the foreground and background colours.",
			"Click the 'Download QR' button to save the QR code as a .png file."
		],
		additional: "This application uses the qrcode library across all interfaces.",
		originalPage: "/qr-generator",
		linkText: "Go to QR Code Generator"
	},
	{
		id: "about-hashing",
		title: "About SHA & Argon2 Hashing",
		description:
			"Use SHA and Argon2 algorithms to securely hash text or files, providing fixed-length outputs or computationally expensive hashes for enhanced security.",
		steps: [
			"Upload a file or input text to hash.",
			"Select a hashing algorithm: SHA-2 (256, 384, 512), SHA-3 (256, 384, 512), or Argon2.",
			"For SHA algorithms, you can iterate as many times as you like - higher iteration counts increase computation time.",
			"For Argon2, iterations are limited to 12 to balance security and computation.",
			"Generate the hash and copy it for verification, storage, or comparison."
		],
		additional:
			"Argon2 is an award-winning memory-hard hashing algorithm primarily used for password hashing. Each password is hashed with a unique random salt, making the output different each time. Its computationally intensive design prevents attackers from easily deriving the original password from the hash, unlike classic SHA hashes which produce deterministic outputs.",
		originalPage: "/hashing",
		linkText: "Go to SHA & Argon2 Hashing"
	},
	{
		id: "about-file-integrity",
		title: "About File Integrity Check",
		description:
			"Ensure your files remain unaltered by using common hashing algorithms to verify data integrity and detect any unauthorised changes.",
		steps: [
			"Upload a file to quickly view its name, type, and size.",
			"Generate common hashing algorithms to check integrity. MD5 and SHA-1 are still used, but collisions are possible. SHA-256 and SHA-512 are highly secure and collision-resistant.",
			"If you have a reliable source, comparing the hashes helps detect any tampering. If the hashes differ, the file may have been altered or contain malicious content."
		],
		additional:
			"Always verify that both the file and its hash come from a legitimate source. Ideally, you would also check for a digital signature.",
		originalPage: "/file-integrity",
		linkText: "Go to File Integrity Check"
	},
	{
		id: "about-ip-addy",
		title: "About IP Information",
		description:
			"Check your IP address and location with ease. Quickly view your current IP, ISP, and country details, with one-click copy to clipboard.",
		steps: [
			"Click 'Get My IP Info'.",
			"Instantly view your up-to-date IP address.",
			"Easily copy the IP address to your clipboard.",
			"See additional details like your country and Internet Service Provider (ISP)."
		],
		additional:
			"This feature uses the free API service from https://ipinfo.io/json to fetch accurate IP address and location details in real time.",
		originalPage: "/ip-addy",
		linkText: "Go to IP Information"
	},
	{
		id: "about-totp-sim",
		title: "About TOTP & Captcha Simulator",
		description:
			"This tool simulates Time-Based One-Time Passwords (TOTP) and bot-detection captchas to demonstrate multifactor authentication and protection against automated attacks.",
		steps: [
			"TOTP is a simple method where a hash value is generated every 30 seconds from a 6-digit PIN. The user enters the PIN, and the hash values are compared. If they match, a success message is shown; if not, a new code is generated. In real cases, the 6-digit PIN is shared through an authentication app like Google Authenticator.",
			"The bot captcha is another simple method using randomly generated math equations. Solving them correctly proves you are human. There is also a honeypot trap to detect bots if a hidden input is filled. Additionally, answering the equations too quickly can indicate bot activity. This is a basic method; advanced bots can be designed to bypass it."
		],
		originalPage: "/totp-sim",
		linkText: "Go to TOTP & Captcha Simulator"
	},
	{
		id: "about-password-gen",
		title: "About Password Generator",
		description:
			"Generator strong passwords, random, and secure passwords to help protect your accounts and data from unauthorised access.",
		steps: [
			"You can create a password of any length and split it into chunks using hyphens for readability.",
			"By default, the full ASCII character range is used, including special characters. You can uncheck the box to limit the set to standard characters (a-z, A-Z, 0-9).",
			"Each time you click 'Generate Password,' six new randomly generated passwords are created, which you can easily copy to the clipboard by clicking the icon in the top-right corner."
		],
		originalPage: "/password-gen",
		linkText: "Go to Password Generator"
	},
];
