// Login Page - DID-based authentication
const LoginPage = {
    async render(container) {
        container.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <h1 class="auth-title">SSI127</h1>
                    <p class="auth-subtitle">Self-Sovereign Identity</p>
                    
                    <form id="loginForm" class="auth-form">
                        <div class="form-group">
                            <label class="form-label">DID (Decentralized Identifier)</label>
                            <input type="text" id="didInput" name="did" class="form-input" placeholder="did:key:z..." required>
                            <small class="form-hint">Enter your DID or use a stored wallet</small>
                        </div>
                        
                        <div id="storedWallets" style="margin-bottom: var(--spacing-md); display: none;">
                            <label class="form-label">Saved Wallets</label>
                            <select id="walletSelect" class="form-input" style="margin-bottom: var(--spacing-sm);">
                                <option value="">-- Select a wallet --</option>
                            </select>
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-full">Sign In</button>
                        
                        <div class="auth-divider">or</div>
                        
                        <button type="button" id="createWalletBtn" class="btn btn-secondary btn-full">Create New Identity</button>
						<p class="auth-help">First time here? <a href="#/link">Connect a verified forum account</a></p>
                    </form>
                    
                    <div id="authStatus" class="auth-status"></div>
                    
                    <div class="auth-help">
                        <p><strong>System Status:</strong> <span id="backendStatus">Checking...</span></p>
                        <p style="font-size: 0.75rem; color: #888; margin-top: 5px;">API: <span id="backendUrl"></span></p>
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
                statusEl.innerHTML = '<div class="info">Generating secure keys...</div>';
                const pair = await CryptoUtils.generateKeypair();
				await Storage.saveWallet(pair);

                didInput.value = pair.did;
                this.loadStoredWallets();
                walletSelect.value = pair.did;

                statusEl.innerHTML = `
                    <div class="success">
                        New DID created and saved!<br>
                        <small style="word-break: break-all;">${pair.did}</small>
                    </div>
                `;
            } catch (err) {
                statusEl.innerHTML = `<div class="error">Generation failed: ${err.message}</div>`;
            }
        });
    },

	async loadStoredWallets() {
		const wallets = await Storage.getWallets();
        const select = document.getElementById('walletSelect');
        const container = document.getElementById('storedWallets');

        if (wallets.length > 0) {
            container.style.display = 'block';
            select.innerHTML = '<option value="">-- Select a wallet --</option>';
            wallets.forEach(w => {
                const opt = document.createElement('option');
                opt.value = w.did;
                opt.textContent = w.did.substring(0, 15) + '...';
                select.appendChild(opt);
            });
        }
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
            const signature = await CryptoUtils.sign(nonce, wallet.privateKey);

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
            el.innerHTML = res.ok ? '<span style="color: #00F0FF;">ONLINE</span>' : '<span style="color: #ff4d4d;">ERROR</span>';
        } catch (e) {
            el.innerHTML = '<span style="color: #ff4d4d;">OFFLINE</span>';
        }
    }
};
