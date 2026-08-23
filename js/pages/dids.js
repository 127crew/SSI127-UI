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
        document.getElementById('logoutBtn').addEventListener('click', () => {
            Storage.logout();
            APP_ROUTER.push('/login');
        });

        this.renderWalletList();

        document.getElementById('createDidBtn').addEventListener('click', async () => {
            const status = document.getElementById('didStatus');
            try {
                status.innerHTML = '<div class="info">Generating new DID...</div>';
                const pair = await CryptoUtils.generateKeypair();
				await Storage.saveWallet(pair);
				await this.renderWalletList();
                status.innerHTML = '<div class="success">New DID created!</div>';
                setTimeout(() => status.innerHTML = '', 3000);
            } catch (err) {
                status.innerHTML = `<div class="error">${err.message}</div>`;
            }
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
            listEl.innerHTML = '<p class="text-secondary">No other DIDs found.</p>';
            return;
        }

        listEl.innerHTML = `<h3>Your Wallets (${wallets.length})</h3>`;
        const container = document.createElement('div');
        container.className = 'grid grid-3';

        wallets.forEach(w => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <span class="card-meta">ED25519</span>
                <p class="mono" style="word-break: break-all; font-size: 0.75rem;">${w.did}</p>
                <div class="flex" style="margin-top: 10px;">
                    <button class="btn btn-secondary btn-sm" onclick="LoginPage.authenticate('${w.did}', document.getElementById('didStatus'))">Switch</button>
                    <button class="btn btn-secondary btn-sm" style="color: #ff4d4d; border-color: #442222;" onclick="DidsPage.deleteWallet('${w.did}')">Delete</button>
                </div>
            `;
            container.appendChild(card);
        });
        listEl.appendChild(container);
    },

	async deleteWallet(did) {
        if (confirm('Are you sure you want to delete this DID from local storage? You will LOSE access to it if you have not exported your private key.')) {
			await Storage.deleteWallet(did);
			await this.renderWalletList();
        }
    }
};

// Make accessible globally for onclick handlers
window.DidsPage = DidsPage;
