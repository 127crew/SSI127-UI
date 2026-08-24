// Login Page - DID-based authentication
const LoginPage = {
    async render(container) {
        container.innerHTML = `
            <div class="auth-container">
				<div class="auth-card auth-card-wide">
					<div class="auth-layout">
						<aside class="auth-intro">
							<div>
								<span class="auth-eyebrow">127CREW IDENTITY</span>
								<h1 class="auth-title">SSI<span>127</span></h1>
								<p class="auth-subtitle">One verified identity for the 127crew ecosystem and the apps you trust.</p>
							</div>
							<ul class="auth-benefits" aria-label="Identity protections">
								<li><strong>Your key stays local</strong><span>The private signing key never leaves this browser.</span></li>
								<li><strong>Membership gated</strong><span>Activation requires a verified @127crew.dev forum account.</span></li>
								<li><strong>You stay in control</strong><span>Review connected apps and revoke sessions at any time.</span></li>
							</ul>
							<div class="auth-eligibility">
								<span class="auth-eligibility-label">FIRST TIME HERE?</span>
								<p>Generate a local DID, then connect it to your eligible forum membership.</p>
								<a href="#/link">Connect forum account →</a>
							</div>
							<div class="auth-system">
								<span><i class="status-dot"></i> <strong id="backendStatus">Checking…</strong></span>
								<span id="backendUrl" class="mono"></span>
							</div>
						</aside>

						<section class="auth-panel">
							<div class="auth-panel-heading">
								<span class="auth-eyebrow">WELCOME BACK</span>
								<h2>Sign in with your DID</h2>
								<p>Select a wallet saved in this browser or paste its public DID.</p>
							</div>
							<a href="#/link" class="btn btn-primary btn-full">Continue with Forum</a>
							<div class="auth-divider"><span>or use an activated identity</span></div>
							<form id="loginForm" class="auth-form">
								<div id="storedWallets" class="form-group" hidden>
									<label class="form-label" for="walletSelect">Saved wallet</label>
									<select id="walletSelect" class="form-input">
										<option value="">Choose a wallet</option>
									</select>
								</div>
								<div class="form-group">
									<label class="form-label" for="didInput">Decentralized identifier</label>
									<input type="text" id="didInput" name="did" class="form-input mono" placeholder="did:key:z..." autocomplete="username" spellcheck="false" required>
									<small class="form-hint">Public identifier only—the matching private key must exist in this browser.</small>
								</div>
								<button type="submit" class="btn btn-primary btn-full">Sign in securely</button>
								<div class="auth-divider"><span>New identity</span></div>
								<div class="form-group">
									<label class="form-label" for="recoveryPassword">Recovery password</label>
									<input type="password" id="recoveryPassword" class="form-input" minlength="12" autocomplete="new-password" placeholder="12+ characters">
									<small class="form-hint">Required when creating a DID; an encrypted recovery file downloads automatically.</small>
								</div>
								<button type="button" id="createWalletBtn" class="btn btn-secondary btn-full">Create recoverable DID</button>
								<div class="auth-divider"><span>Lost or new device</span></div>
								<input type="file" id="recoveryFile" class="form-input" accept="application/json,.json">
								<button type="button" id="restoreWalletBtn" class="btn btn-secondary btn-full">Restore encrypted wallet</button>
							</form>
							<div id="authStatus" class="auth-status" aria-live="polite"></div>
							<p class="auth-local-note"><strong>Local means local.</strong> Generating a DID creates no server account and grants no access until forum verification is completed.</p>
						</section>
					</div>
                </div>
            </div>
        `;
    },

    async onMount() {
        if (Storage.isAuthenticated()) {
            APP_ROUTER.push('/dashboard');
            return;
        }

        document.getElementById('backendUrl').textContent = API_CLIENT.baseURL;
        this.checkBackendStatus();
        this.loadStoredWallets();

        const form = document.getElementById('loginForm');
        const statusEl = document.getElementById('authStatus');
        const createBtn = document.getElementById('createWalletBtn');
        const walletSelect = document.getElementById('walletSelect');
        const didInput = document.getElementById('didInput');
		const recoveryPassword = document.getElementById('recoveryPassword');
		const recoveryFile = document.getElementById('recoveryFile');

        walletSelect.addEventListener('change', () => {
            if (walletSelect.value) {
                didInput.value = walletSelect.value;
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const did = didInput.value.trim();
            if (!did) return;
            await this.authenticate(did, statusEl);
        });

        createBtn.addEventListener('click', async () => {
            try {
				createBtn.disabled = true;
                statusEl.innerHTML = '<div class="info">Generating secure keys...</div>';
				if (recoveryPassword.value.length < 12) throw new Error('Enter a recovery password of at least 12 characters first.');
                const pair = await CryptoUtils.generateKeypair();
				const backup = await RecoveryUtils.createPasswordBackup(pair.recoveryPayload, recoveryPassword.value);
				await Storage.saveWallet({ ...pair, passwordBackup: backup });
				RecoveryUtils.download(backup, pair.did);
				pair.recoveryPayload.pkcs8 = '';

                didInput.value = pair.did;
				await this.loadStoredWallets();
                walletSelect.value = pair.did;

				statusEl.replaceChildren(); const success = document.createElement('div'); success.className = 'success';
				const message = document.createElement('p'); message.textContent = 'Local DID key generated. It is not active until connected to an eligible forum account.';
				const did = document.createElement('small'); did.style.wordBreak = 'break-all'; did.textContent = pair.did;
				success.append(message, did); statusEl.appendChild(success);
            } catch (err) {
				statusEl.replaceChildren(); const error = document.createElement('div'); error.className = 'error'; error.textContent = `Generation failed: ${err.message}`; statusEl.appendChild(error);
			} finally {
				createBtn.disabled = false;
            }
        });

		document.getElementById('restoreWalletBtn').addEventListener('click', async () => {
			try {
				const file = recoveryFile.files[0]; if (!file) throw new Error('Choose a recovery JSON file first.');
				const envelope = JSON.parse(await file.text());
				const payload = envelope.type === 'passkey' ? await RecoveryUtils.unlockPasskeyBackup(envelope) : await RecoveryUtils.unlockPasswordBackup(envelope, recoveryPassword.value);
				const wallet = await CryptoUtils.importRecoveredWallet(payload);
				await Storage.saveWallet(envelope.type === 'passkey' ? { did: wallet.did, publicKey: wallet.publicKey, passkeyBackup: envelope } : { ...wallet, passwordBackup: envelope });
				didInput.value = wallet.did; await this.loadStoredWallets(); walletSelect.value = wallet.did;
				statusEl.textContent = 'Wallet restored. You can now sign in.';
			} catch (err) { statusEl.textContent = `Restore failed: ${err.message}`; }
		});
    },

	async loadStoredWallets() {
		const wallets = await Storage.getWallets();
        const select = document.getElementById('walletSelect');
        const container = document.getElementById('storedWallets');
		const placeholder = document.createElement('option');
		placeholder.value = '';
		placeholder.textContent = 'Choose a wallet';
		select.replaceChildren(placeholder);

        if (wallets.length > 0) {
            container.hidden = false;
            wallets.forEach(w => {
                const opt = document.createElement('option');
                opt.value = w.did;
                opt.textContent = w.did.substring(0, 15) + '...';
                select.appendChild(opt);
            });
		} else {
			container.hidden = true;
        }
    },

	async signingKeyFor(wallet) {
		if (wallet.privateKey) return wallet.privateKey;
		if (wallet.passkeyBackup) {
			const payload = await RecoveryUtils.unlockPasskeyBackup(wallet.passkeyBackup);
			return (await CryptoUtils.importRecoveredWallet(payload)).privateKey;
		}
		throw new Error('Signing key unavailable. Restore this wallet from its recovery file.');
	},

    async authenticate(did, statusEl) {
        try {
			const wallet = await Storage.getWallet(did);
            if (!wallet) {
                throw new Error("Private key for this DID not found in local storage. Please create or import it first.");
            }

            statusEl.innerHTML = '<div class="info">Phase 1: Getting Auth Nonce...</div>';
            const chalRes = await API_CLIENT.authChallenge(did);
            const nonce = chalRes.nonce;

            statusEl.innerHTML = '<div class="info">Phase 2: Signing internally...</div>';
			if (!wallet.privateKey && wallet.passkeyBackup) {
				statusEl.innerHTML = '<div class="info">Confirm your passkey to unlock the DID...</div>';
			}
			const signingKey = await this.signingKeyFor(wallet);
			const signature = await CryptoUtils.sign(nonce, signingKey);

            statusEl.innerHTML = '<div class="info">Phase 3: Verifying Signature...</div>';
            const verifyRes = await API_CLIENT.authVerify(did, nonce, signature);

            Storage.setToken(verifyRes.access_token);
            Storage.setUser({ did, createdAt: new Date().toISOString() });

            statusEl.innerHTML = '<div class="success">✓ Authenticated successfully!</div>';

            const params = new URLSearchParams(window.location.hash.split('?')[1]);
            const returnTo = params.get('return_to');

            setTimeout(() => {
                if (returnTo) {
                    window.location.hash = '#' + decodeURIComponent(returnTo);
                } else {
                    APP_ROUTER.push('/dashboard');
                }
            }, 800);
        } catch (error) {
			statusEl.textContent = `Authentication failed: ${error.message}`;
        }
    },

    async checkBackendStatus() {
        const el = document.getElementById('backendStatus');
        try {
            const res = await fetch(`${API_CLIENT.baseURL}/health`);
			el.textContent = res.ok ? 'Online' : 'Unavailable';
			el.className = res.ok ? 'status-online' : 'status-error';
        } catch (e) {
			el.textContent = 'Offline';
			el.className = 'status-error';
        }
    }
};
