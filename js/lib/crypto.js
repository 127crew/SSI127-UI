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
		if (!crypto.subtle) throw new Error('Secure browser key storage is unavailable.');
		const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, false, ['sign', 'verify']);
		const pubKey = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
		const multicodecKey = new Uint8Array(2 + pubKey.length);
		multicodecKey.set([0xed, 0x01]);
		multicodecKey.set(pubKey, 2);
		const did = `did:key:z${base58Encode(multicodecKey)}`;
        return {
			privateKey: pair.privateKey,
            publicKey: bytesToHex(pubKey),
            did
        };
    },

	async sign(nonce, privateKey) {
		if (!(privateKey instanceof CryptoKey) || privateKey.type !== 'private' || privateKey.algorithm.name !== 'Ed25519') {
			throw new Error('Secure signing key is unavailable.');
		}
		const encoder = new TextEncoder();
		const nonceBytes = encoder.encode(nonce);
		const sig = new Uint8Array(await crypto.subtle.sign('Ed25519', privateKey, nonceBytes));
        // Return base64 signature
        let binary = '';
        const len = sig.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(sig[i]);
        }
        return window.btoa(binary);
	},

	async importLegacyPrivateKey(privateKeyHex) {
		const seed = hexToBytes(privateKeyHex);
		const prefix = hexToBytes('302e020100300506032b657004220420');
		const pkcs8 = new Uint8Array(prefix.length + seed.length);
		pkcs8.set(prefix); pkcs8.set(seed, prefix.length);
		return crypto.subtle.importKey('pkcs8', pkcs8, { name: 'Ed25519' }, false, ['sign']);
	}
};

window.CryptoUtils = CryptoUtils;
