// OAuth Authorization Page - User consent and approval
const AuthorizePage = {
    async render(container) {
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        const clientId = params.get('client_id');
        const redirectUri = params.get('redirect_uri');
		const responseType = params.get('response_type');
		const state = params.get('state');
		const codeChallenge = params.get('code_challenge');
		const codeChallengeMethod = params.get('code_challenge_method');

		const secureRequest = clientId && redirectUri && responseType === 'code' && state &&
			codeChallenge && codeChallengeMethod === 'S256';
        if (!secureRequest) {
            container.innerHTML = `
                <div class="auth-container">
                    <div class="auth-card">
                        <h1 class="auth-title">Error</h1>
						<p class="auth-subtitle">This authorization request is incomplete. OAuth code flow, state, and S256 PKCE are required.</p>
                        <a href="#/dashboard" class="btn btn-secondary">Go to Dashboard</a>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <h1 class="auth-title">Authorize App</h1>
                    <p class="auth-subtitle">An application is requesting access to your identity.</p>
                    
                    <div class="info" style="margin-bottom: var(--spacing-lg);">
                        <p><strong>Application:</strong></p>
                        <p id="clientName" class="mono">${clientId}</p>
                    </div>

                    <div id="authContent">
                        <p class="text-secondary">By approving, you allow this app to verify your DID and access your basic profile information.</p>
                        
                        <div style="margin-top: var(--spacing-xl);">
                            <button id="approveBtn" class="btn btn-primary btn-full">Approve & Continue</button>
                            <button id="cancelBtn" class="btn btn-secondary btn-full" style="margin-top: var(--spacing-md);">Cancel</button>
                        </div>
                    </div>

                    <div id="status" class="auth-status"></div>
                </div>
            </div>
        `;
    },

    async onMount() {
        const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const clientId = params.get('client_id');
		const redirectUri = params.get('redirect_uri');
		const codeChallenge = params.get('code_challenge') || '';
		const codeChallengeMethod = params.get('code_challenge_method') || '';
		const responseType = params.get('response_type');
		const state = params.get('state') || '';
		if (!clientId || !redirectUri || responseType !== 'code' || !state || !codeChallenge || codeChallengeMethod !== 'S256') return;

        // Ensure user is authenticated to approve
        if (!Storage.isAuthenticated()) {
            // Redirect to login but save the current intent
            window.location.hash = `#/login?return_to=${encodeURIComponent(window.location.hash.slice(1))}`;
            return;
        }

        const user = Storage.getUser();
		const wallet = await Storage.getWallet(user.did);
        const approveBtn = document.getElementById('approveBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const statusEl = document.getElementById('status');
		try {
			const client = await API_CLIENT.getClient(clientId);
			if (!client.redirect_uris.includes(redirectUri)) throw new Error('The requested redirect is not registered.');
			document.getElementById('clientName').textContent = client.name;
		} catch (error) {
			document.getElementById('authContent').replaceChildren();
			statusEl.textContent = `Cannot authorize this application: ${error.message}`;
			return;
		}

        cancelBtn.addEventListener('click', () => {
            let cancelUrl = redirectUri + '?error=access_denied';
            if (state) cancelUrl += '&state=' + encodeURIComponent(state);
            window.location.href = cancelUrl;
        });

        approveBtn.addEventListener('click', async () => {
            try {
                approveBtn.disabled = true;
                statusEl.innerHTML = '<div class="info">Generating secure authorization...</div>';

                // 1. Get challenge
                const chalRes = await API_CLIENT.authChallenge(user.did);
                const nonce = chalRes.nonce;

                // 2. Sign challenge
                const signature = await CryptoUtils.sign(nonce, wallet.privateKey);

                // 3. Authorize with backend
                statusEl.innerHTML = '<div class="info">Approving with identity provider...</div>';
				const authRes = await API_CLIENT.authorize(clientId, redirectUri, user.did, nonce, signature, state, codeChallenge, codeChallengeMethod);

                statusEl.innerHTML = '<div class="success">Approved! Redirecting back...</div>';

                // 4. Redirect back to client
                setTimeout(() => {
                    window.location.href = authRes.redirect_url;
                }, 1000);
            } catch (error) {
                approveBtn.disabled = false;
				statusEl.textContent = `Authorization failed: ${error.message}`;
            }
        });
    }
};
