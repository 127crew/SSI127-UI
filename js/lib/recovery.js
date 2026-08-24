const RecoveryUtils = {
	bytesToBase64Url(bytes) {
		let s = ''; for (const b of bytes) s += String.fromCharCode(b);
		return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	},
	base64UrlToBytes(value) {
		const s = atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4));
		return Uint8Array.from(s, c => c.charCodeAt(0));
	},
	async aesKey(material, usage) { return crypto.subtle.importKey('raw', material, 'AES-GCM', false, [usage]); },
	async passwordKey(password, salt) {
		const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
		return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 600000 }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
	},
	async encrypt(payload, key, type, extra = {}) {
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const data = new TextEncoder().encode(JSON.stringify(payload));
		const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
		return { format: 'ssi127-wallet-recovery', version: 1, type, ...extra, iv: this.bytesToBase64Url(iv), ciphertext: this.bytesToBase64Url(new Uint8Array(encrypted)) };
	},
	async decrypt(envelope, key) {
		if (envelope?.format !== 'ssi127-wallet-recovery' || envelope.version !== 1) throw new Error('Unsupported recovery file.');
		const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: this.base64UrlToBytes(envelope.iv) }, key, this.base64UrlToBytes(envelope.ciphertext));
		return JSON.parse(new TextDecoder().decode(clear));
	},
	async createPasswordBackup(payload, password) {
		if (password.length < 12) throw new Error('Recovery password must be at least 12 characters.');
		const salt = crypto.getRandomValues(new Uint8Array(16));
		return this.encrypt(payload, await this.passwordKey(password, salt), 'password', { kdf: 'PBKDF2-SHA256', iterations: 600000, salt: this.bytesToBase64Url(salt) });
	},
	async unlockPasswordBackup(envelope, password) {
		if (envelope.type !== 'password' || envelope.iterations !== 600000) throw new Error('This is not a supported password recovery file.');
		return this.decrypt(envelope, await this.passwordKey(password, this.base64UrlToBytes(envelope.salt)));
	},
	async createPasskeyBackup(payload) {
		if (!window.PublicKeyCredential) throw new Error('Passkeys are not supported by this browser.');
		const prfSalt = crypto.getRandomValues(new Uint8Array(32));
		const credential = await navigator.credentials.create({ publicKey: {
			challenge: crypto.getRandomValues(new Uint8Array(32)), rp: { name: 'SSI127' },
			user: { id: crypto.getRandomValues(new Uint8Array(32)), name: payload.did, displayName: 'SSI127 wallet' },
			pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
			authenticatorSelection: { residentKey: 'required', userVerification: 'required' }, timeout: 60000, attestation: 'none', extensions: { prf: { eval: { first: prfSalt } } }
		} });
		if (!credential.getClientExtensionResults().prf?.enabled) throw new Error('This passkey provider does not support secure PRF wallet recovery.');
		const result = await this.getPrf(credential.rawId, prfSalt);
		return this.encrypt(payload, await this.aesKey(result, 'encrypt'), 'passkey', { credentialId: this.bytesToBase64Url(new Uint8Array(credential.rawId)), prfSalt: this.bytesToBase64Url(prfSalt), rpId: location.hostname });
	},
	async getPrf(credentialId, salt) {
		const assertion = await navigator.credentials.get({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), allowCredentials: [{ type: 'public-key', id: credentialId }], userVerification: 'required', timeout: 60000, extensions: { prf: { eval: { first: salt } } } } });
		const result = assertion.getClientExtensionResults().prf?.results?.first;
		if (!result) throw new Error('The selected passkey cannot unlock this wallet.');
		return new Uint8Array(result);
	},
	async unlockPasskeyBackup(envelope) {
		if (envelope.type !== 'passkey' || envelope.rpId !== location.hostname) throw new Error('This passkey backup belongs to a different site.');
		const result = await this.getPrf(this.base64UrlToBytes(envelope.credentialId), this.base64UrlToBytes(envelope.prfSalt));
		return this.decrypt(envelope, await this.aesKey(result, 'decrypt'));
	},
	download(envelope, did) {
		const url = URL.createObjectURL(new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' }));
		const a = document.createElement('a'); a.href = url; a.download = `ssi127-recovery-${did.slice(0, 18)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 0);
	}
};
window.RecoveryUtils = RecoveryUtils;
