// Profile Page - User settings
const ProfilePage = {
    async render(container) {
        const user = Storage.getUser();
        const createdDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';

        container.innerHTML = `
            <div class="dashboard">
                <nav class="navbar">
                    <div class="container nav-container">
                        <a href="#/dashboard" class="logo">127<span>Crew</span> SSI</a>
                        <div class="nav-links">
                            <a href="#/dashboard" class="nav-link">Dashboard</a>
                            <a href="#/dids" class="nav-link">DIDs</a>
                            <a href="#/clients" class="nav-link">Dev Portal</a>
                            <a href="#/profile" class="nav-link active">Profile</a>
                        </div>
                        <button id="logoutBtn" class="btn btn-secondary" style="padding: 8px 16px; font-size: 0.85rem;">Logout</button>
                    </div>
                </nav>
                
                <main class="main-content">
                    <div class="container">
                        <h1>Profile Settings</h1>
                        <p class="text-secondary">Manage your account</p>
                        
                        <div class="grid grid-2" style="margin-top: var(--spacing-xl);">
                            <div class="card">
                                <span class="card-meta">ACCOUNT</span>
                                <h3>Identity</h3>
                                <p style="margin-bottom: var(--spacing-md);"><strong>DID:</strong></p>
                                <p class="mono" style="word-break: break-all; font-size: 0.85rem; color: var(--primary-accent);">${user?.did || 'Unknown'}</p>
                                <p style="margin-top: var(--spacing-lg); margin-bottom: var(--spacing-md);"><strong>Account Created:</strong></p>
                                <p>${createdDate}</p>
                            </div>
                            
                            <div class="card">
                                <span class="card-meta">SECURITY</span>
                                <h3>Active sessions</h3>
                                <p style="margin-bottom: var(--spacing-lg);">Review and revoke tokens issued to your account and connected apps.</p>
                                <div id="sessionList" style="display: grid; gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">
                                    <p class="text-secondary">Loading sessions…</p>
                                </div>
                                <button id="logoutBtnProfile" class="btn btn-primary">Logout</button>
                            </div>
                        </div>
                        
                        <div class="card" style="margin-top: var(--spacing-lg);">
                            <span class="card-meta">INFO</span>
                            <h3>API Authentication</h3>
                            <p style="margin-top: var(--spacing-md);">Use your JWT token to authenticate API requests:</p>
                            <p class="mono" style="word-break: break-all; font-size: 0.75rem; background: rgba(0,0,0,0.3); padding: var(--spacing-md); border-radius: 4px; margin: var(--spacing-md) 0;">Authorization: Bearer &lt;your-jwt-token&gt;</p>
                            <button id="copyTokenBtn" class="btn btn-secondary" style="font-size: 0.85rem;">Copy Token</button>
                        </div>
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

        document.getElementById('logoutBtn').addEventListener('click', logoutCurrentSession);
        document.getElementById('logoutBtnProfile').addEventListener('click', logoutCurrentSession);

        document.getElementById('copyTokenBtn').addEventListener('click', () => {
            const token = Storage.getToken();
            navigator.clipboard.writeText(token).then(() => alert('Token copied!'));
        });

        await this.loadSessions();
    },

    async loadSessions() {
        const list = document.getElementById('sessionList');
        try {
            const result = await API_CLIENT.listSessions();
            list.replaceChildren();
            for (const session of result.sessions || []) {
                const row = document.createElement('div');
                row.style.cssText = 'padding: var(--spacing-md); border: 1px solid var(--border-color); border-radius: 4px;';

                const title = document.createElement('strong');
                const current = session.id === result.current;
                title.textContent = session.client_id ? `Connected app: ${session.client_id}` : `SSI account${current ? ' (current)' : ''}`;
                row.appendChild(title);

                const details = document.createElement('p');
                details.className = 'text-secondary';
                details.style.cssText = 'font-size: 0.8rem; margin: 6px 0 10px;';
                details.textContent = `${session.revoked_at ? 'Revoked' : 'Active'} · expires ${new Date(session.expires_at).toLocaleString()}`;
                row.appendChild(details);

                if (!session.revoked_at) {
                    const revoke = document.createElement('button');
                    revoke.className = 'btn btn-secondary';
                    revoke.style.cssText = 'padding: 6px 10px; font-size: 0.8rem;';
                    revoke.textContent = current ? 'Revoke and log out' : 'Revoke session';
                    revoke.addEventListener('click', async () => {
                        revoke.disabled = true;
                        try {
                            await API_CLIENT.revokeSession(session.id);
                            if (current) {
                                Storage.logout();
                                APP_ROUTER.push('/login');
                                return;
                            }
                            await this.loadSessions();
                        } catch (error) {
                            alert(error.message);
                            revoke.disabled = false;
                        }
                    });
                    row.appendChild(revoke);
                }
                list.appendChild(row);
            }
            if (!list.childElementCount) list.textContent = 'No active sessions.';
        } catch (error) {
            list.textContent = `Could not load sessions: ${error.message}`;
        }
    }
};
