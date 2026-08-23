import * as ed from 'https://esm.sh/@noble/ed25519@2.2.3';
import { sha512 } from 'https://esm.sh/@noble/hashes@1.4.0/sha512';

// Set fallbacks for environments without crypto.subtle or for internal sync requirements
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));
ed.etc.sha512Async = (...m) => Promise.resolve(ed.etc.sha512Sync(...m));

// Utility to convert hex to bytes
function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}

// Utility to convert bytes to hex
function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function base58Encode(bytes) {
	const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
	let value = 0n;
	for (const byte of bytes) value = value * 256n + BigInt(byte);
	let encoded = '';
	while (value > 0n) { encoded = alphabet[Number(value % 58n)] + encoded; value /= 58n; }
	for (const byte of bytes) { if (byte !== 0) break; encoded = '1' + encoded; }
	return encoded;
}

const CryptoUtils = {
    async generateKeypair() {
        const privKey = crypto.getRandomValues(new Uint8Array(32));
        const pubKey = await ed.getPublicKey(privKey);
		const multicodecKey = new Uint8Array(2 + pubKey.length);
		multicodecKey.set([0xed, 0x01]);
		multicodecKey.set(pubKey, 2);
		const did = `did:key:z${base58Encode(multicodecKey)}`;
        return {
            privateKey: bytesToHex(privKey),
            publicKey: bytesToHex(pubKey),
            did
        };
    },

    async sign(nonce, privateKeyHex) {
        const privKey = hexToBytes(privateKeyHex);
        const encoder = new TextEncoder();
        const nonceBytes = encoder.encode(nonce);
        const sig = await ed.signAsync(nonceBytes, privKey);
        // Return base64 signature
        let binary = '';
        const len = sig.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(sig[i]);
        }
        return window.btoa(binary);
    }
};

window.CryptoUtils = CryptoUtils;
