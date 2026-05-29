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
                        <p class="text-secondary">Register OAuth applications (Admin only)</p>
                        
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

        document.getElementById('logoutBtn').addEventListener('click', () => {
            Storage.logout();
            APP_ROUTER.push('/login');
        });

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
                statusEl.innerHTML = `
                    <div class="success">
                        <h4>Client Registered!</h4>
                        <p><strong>Client ID:</strong></p>
                        <p class="mono" style="word-break: break-all; font-size: 0.85rem;">${res.client_id}</p>
                        <p><strong>Client Secret (save this now):</strong></p>
                        <p class="mono" style="word-break: break-all; font-size: 0.85rem; background: rgba(0,0,0,0.3); padding: var(--spacing-sm); border-radius: 4px;">${res.client_secret}</p>
                    </div>
                `;
                form.reset();
            } catch (error) {
                statusEl.innerHTML = `<div class="error">Registration failed: ${error.message}</div>`;
            }
        });
    }
};
