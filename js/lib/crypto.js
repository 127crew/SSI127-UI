import * as ed from 'https://cdn.jsdelivr.net/npm/@noble/ed25519@2.2.3/+esm';

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

const CryptoUtils = {
    async generateKeypair() {
        const privKey = ed.utils.randomPrivateKey();
        const pubKey = await ed.getPublicKey(privKey);
        const did = `did:key:z${bytesToHex(pubKey)}`; // simplified did:key format
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
