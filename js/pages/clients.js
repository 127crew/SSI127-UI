// OAuth Clients Management Page
const ClientsPage = {
    async render(container) {
        container.innerHTML = `
            <div class="dashboard">
                <nav class="navbar">
                    <div class="container nav-container">
                        <a href="#/dashboard" class="logo">127<span>Crew</span> SSI</a>
                        <div class="nav-links">
                            <a href="#/dashboard" class="nav-link">Dashboard</a>
                            <a href="#/dids" class="nav-link">DIDs</a>
                            <a href="#/clients" class="nav-link active">Dev Portal</a>
                            <a href="#/profile" class="nav-link">Profile</a>
                        </div>
                        <button id="logoutBtn" class="btn btn-secondary" style="padding: 8px 16px; font-size: 0.85rem;">Logout</button>
                    </div>
                </nav>
                
                <main class="main-content">
                    <div class="container">
                        <h1>Developer Portal</h1>
						<p class="text-secondary">Create and manage SSO integrations for your websites</p>
                        
                        <form id="registerClientForm" class="form-card" style="margin-top: var(--spacing-lg);">
                            <h3>Register New Client</h3>
                            <div class="form-group">
                                <label class="form-label">Application Name</label>
                                <input type="text" name="name" class="form-input" placeholder="My App" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Redirect URIs</label>
                                <textarea name="redirectUris" class="form-textarea" placeholder="https://example.com/callback" rows="4" required></textarea>
                                <small class="form-hint">One URI per line</small>
                            </div>
                            <button type="submit" class="btn btn-primary">Register Client</button>
                        </form>
                        
                        <div id="clientStatus" class="auth-status" style="margin-top: var(--spacing-lg);"></div>
                        <div id="clientList" style="margin-top: var(--spacing-lg);"></div>
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
        const form = document.getElementById('registerClientForm');
        const statusEl = document.getElementById('clientStatus');
		await this.loadClients();

        document.getElementById('logoutBtn').addEventListener('click', logoutCurrentSession);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = form.querySelector('input[name="name"]').value.trim();
            const redirectUrisText = form.querySelector('textarea[name="redirectUris"]').value.trim();
            const redirectUris = redirectUrisText.split('\n').map(uri => uri.trim()).filter(uri => uri);

            if (!name || redirectUris.length === 0) {
                statusEl.innerHTML = '<div class="error">Please fill all fields</div>';
                return;
            }

            try {
                statusEl.innerHTML = '<div class="info">Registering client...</div>';
                const res = await API_CLIENT.registerClient(name, redirectUris);
				statusEl.replaceChildren();
				const success = document.createElement('div'); success.className = 'success';
				const title = document.createElement('h4'); title.textContent = 'Client Registered!';
				const idLabel = document.createElement('p'); idLabel.textContent = 'Client ID:';
				const id = document.createElement('p'); id.className = 'mono'; id.style.wordBreak = 'break-all'; id.textContent = res.client_id;
				const secretLabel = document.createElement('p'); secretLabel.textContent = 'Client Secret (save this now):';
				const secret = document.createElement('p'); secret.className = 'mono'; secret.style.wordBreak = 'break-all'; secret.textContent = res.client_secret;
				success.append(title, idLabel, id, secretLabel, secret); statusEl.appendChild(success);
                form.reset();
				await this.loadClients();
			} catch (error) {
				statusEl.textContent = `Registration failed: ${error.message}`;
            }
        });
	},

	async loadClients() {
		const list = document.getElementById('clientList');
		try {
			const result = await API_CLIENT.listClients();
			list.replaceChildren();
			const heading = document.createElement('h2'); heading.textContent = 'Your applications'; list.appendChild(heading);
			if (!result.clients.length) { const empty = document.createElement('p'); empty.className = 'text-secondary'; empty.textContent = 'No SSO applications yet.'; list.appendChild(empty); return; }
			for (const client of result.clients) {
				const card = document.createElement('article'); card.className = 'card';
				const title = document.createElement('h3'); title.textContent = client.name;
				const id = document.createElement('p'); id.className = 'mono'; id.textContent = client.client_id;
				const uris = document.createElement('p'); uris.textContent = `Redirects: ${client.redirect_uris.join(', ')}`;
				const state = document.createElement('p'); state.textContent = client.revoked_at ? 'Revoked' : 'Active';
				card.append(title, id, uris, state);
				if (!client.revoked_at) {
					const rotate = document.createElement('button'); rotate.className = 'btn btn-secondary'; rotate.textContent = 'Rotate secret';
					rotate.addEventListener('click', () => this.rotate(client.client_id));
					const revoke = document.createElement('button'); revoke.className = 'btn btn-secondary'; revoke.textContent = 'Revoke';
					revoke.addEventListener('click', () => this.revoke(client.client_id, client.name));
					card.append(rotate, revoke);
				}
				list.appendChild(card);
			}
		} catch (error) { list.textContent = `Could not load applications: ${error.message}`; }
	},

	async rotate(clientId) {
		if (!confirm('Rotate this secret? The existing secret will stop working immediately.')) return;
		const status = document.getElementById('clientStatus');
		try { const result = await API_CLIENT.rotateClientSecret(clientId); status.textContent = `New client secret (save it now): ${result.client_secret}`; }
		catch (error) { status.textContent = `Rotation failed: ${error.message}`; }
	},

	async revoke(clientId, name) {
		if (!confirm(`Revoke ${name}? This application will no longer be able to exchange codes.`)) return;
		try { await API_CLIENT.revokeClient(clientId); await this.loadClients(); }
		catch (error) { document.getElementById('clientStatus').textContent = `Revocation failed: ${error.message}`; }
	}
};
