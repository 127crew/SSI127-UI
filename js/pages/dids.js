// DIDs Management Page
const DidsPage = {
    async render(container) {
        container.innerHTML = `
            <div class="dashboard">
                <nav class="navbar">
                    <div class="container nav-container">
                        <a href="#/dashboard" class="logo">127<span>Crew</span> SSI</a>
                        <div class="nav-links">
                            <a href="#/dashboard" class="nav-link">Dashboard</a>
                            <a href="#/dids" class="nav-link active">DIDs</a>
                            <a href="#/clients" class="nav-link">Dev Portal</a>
                            <a href="#/profile" class="nav-link">Profile</a>
                        </div>
                        <button id="logoutBtn" class="btn btn-secondary" style="padding: 8px 16px; font-size: 0.85rem;">Logout</button>
                    </div>
                </nav>
                
                <main class="main-content">
                    <div class="container">
                        <h1>Decentralized Identifiers (DIDs)</h1>
                        <p class="text-secondary">Create, import, and manage your DIDs</p>
                        
                        <div style="margin-top: var(--spacing-lg);">
                            <button id="createDidBtn" class="btn btn-primary" style="margin-bottom: var(--spacing-lg);">Create New DID</button>
                        </div>
                        
                        <div class="card">
                            <span class="card-meta">INFO</span>
                            <h3>Current DID</h3>
                            <p id="currentDid" class="mono" style="word-break: break-all; font-size: 0.85rem; color: var(--primary-accent); margin: var(--spacing-md) 0;"></p>
                            <button id="exportDidBtn" class="btn btn-secondary" style="font-size: 0.85rem; margin-right: var(--spacing-md);">Export</button>
                            <button id="copyDidBtn" class="btn btn-secondary" style="font-size: 0.85rem;">Copy</button>
                        </div>
                        
                        <div id="didList" style="margin-top: var(--spacing-lg);"></div>
						<div class="card" style="margin-top: var(--spacing-lg);">
							<span class="card-meta">RECOVERY & PASSKEYS</span>
							<h3>Protect this browser wallet</h3>
							<p class="text-secondary">Add a passkey to require device verification when this DID signs in. Keep the downloaded encrypted file for recovery on another device.</p>
							<div class="form-group"><label class="form-label" for="walletRecoveryPassword">Current recovery password</label><input id="walletRecoveryPassword" type="password" class="form-input" autocomplete="current-password" placeholder="Password used when creating this DID"></div>
							<button id="enablePasskeyBtn" class="btn btn-primary">Enable passkey login</button>
						</div>
                        <div id="didStatus" class="auth-status"></div>
                    </div>
                </main>
            </div>
        `;
    },

    async onMount() {
        if (!Storage.isAuthenticated()) {
            APP_ROUTER.push('/login');
            return;
        }
        const user = Storage.getUser();
        document.getElementById('currentDid').textContent = user?.did || 'No DID';
        document.getElementById('logoutBtn').addEventListener('click', logoutCurrentSession);

        this.renderWalletList();
		document.getElementById('enablePasskeyBtn').addEventListener('click', async () => {
			const status = document.getElementById('didStatus');
			try {
				const wallet = await Storage.getWallet(user.did);
				if (!wallet?.passwordBackup) throw new Error('This older wallet has no encrypted recovery material. Create and link a new recoverable DID.');
				status.textContent = 'Confirm your passkey provider…';
				const payload = await RecoveryUtils.unlockPasswordBackup(wallet.passwordBackup, document.getElementById('walletRecoveryPassword').value);
				const passkeyBackup = await RecoveryUtils.createPasskeyBackup(payload);
				await Storage.saveWallet({ did: wallet.did, publicKey: wallet.publicKey, passwordBackup: wallet.passwordBackup, passkeyBackup });
				RecoveryUtils.download(passkeyBackup, wallet.did);
				status.textContent = 'Passkey enabled. Future sign-ins require it; keep both recovery files safe.';
				await this.renderWalletList();
			} catch (err) { status.textContent = `Passkey setup failed: ${err.message}`; }
		});

        document.getElementById('createDidBtn').addEventListener('click', async () => {
			Storage.logout();
			APP_ROUTER.push('/login');
        });

        document.getElementById('copyDidBtn').addEventListener('click', () => {
            const did = user?.did || '';
            navigator.clipboard.writeText(did).then(() => {
                const status = document.getElementById('didStatus');
                status.innerHTML = '<div class="success">DID copied!</div>';
                setTimeout(() => status.innerHTML = '', 2000);
            });
        });

		document.getElementById('exportDidBtn').textContent = 'Export Public DID';
		document.getElementById('exportDidBtn').addEventListener('click', async () => {
			const wallet = await Storage.getWallet(user.did);
			if (wallet) {
				const data = JSON.stringify({ did: wallet.did, publicKey: wallet.publicKey }, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ssi127-wallet-${user.did.substring(0, 15)}.json`;
                a.click();
            }
        });
    },

	async renderWalletList() {
		const wallets = await Storage.getWallets();
        const listEl = document.getElementById('didList');

        if (wallets.length === 0) {
			listEl.replaceChildren(); const empty = document.createElement('p'); empty.className = 'text-secondary'; empty.textContent = 'No other DIDs found.'; listEl.appendChild(empty);
            return;
        }

		listEl.replaceChildren(); const heading = document.createElement('h3'); heading.textContent = `Your Wallets (${wallets.length})`; listEl.appendChild(heading);
        const container = document.createElement('div');
        container.className = 'grid grid-3';

        wallets.forEach(w => {
            const card = document.createElement('div');
            card.className = 'card';
			const meta = document.createElement('span'); meta.className = 'card-meta'; meta.textContent = w.passkeyProtected ? 'PASSKEY · ED25519' : (w.hasRecovery ? 'RECOVERABLE · ED25519' : 'LEGACY · ED25519');
			const did = document.createElement('p'); did.className = 'mono'; did.style.cssText = 'word-break: break-all; font-size: 0.75rem;'; did.textContent = w.did;
			const actions = document.createElement('div'); actions.className = 'flex'; actions.style.marginTop = '10px';
			const switchButton = document.createElement('button'); switchButton.className = 'btn btn-secondary btn-sm'; switchButton.textContent = 'Switch';
			switchButton.addEventListener('click', () => LoginPage.authenticate(w.did, document.getElementById('didStatus')));
			const deleteButton = document.createElement('button'); deleteButton.className = 'btn btn-secondary btn-sm'; deleteButton.style.cssText = 'color: #ff4d4d; border-color: #442222;'; deleteButton.textContent = 'Delete';
			deleteButton.addEventListener('click', () => this.deleteWallet(w.did));
			actions.append(switchButton, deleteButton); card.append(meta, did, actions);
            container.appendChild(card);
        });
        listEl.appendChild(container);
    },

	async deleteWallet(did) {
		const wallet = await Storage.getWallet(did);
		if (!wallet?.passwordBackup && !wallet?.passkeyBackup) { alert('This wallet has no recovery backup. Deletion is blocked to prevent permanent account loss.'); return; }
        if (confirm('Delete this DID from this browser? Confirm that your encrypted recovery file is stored safely first.')) {
			await Storage.deleteWallet(did);
			await this.renderWalletList();
        }
    }
};

// Make accessible globally for onclick handlers
window.DidsPage = DidsPage;
