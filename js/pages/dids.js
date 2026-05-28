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
                            <a href="#/clients" class="nav-link">Clients</a>
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
        document.getElementById('createDidBtn').addEventListener('click', () => {
            document.getElementById('didStatus').innerHTML = '<div class="info">DID creation coming soon</div>';
        });
        document.getElementById('copyDidBtn').addEventListener('click', () => {
            const did = user?.did || '';
            navigator.clipboard.writeText(did).then(() => {
                document.getElementById('didStatus').innerHTML = '<div class="success">DID copied!</div>';
                setTimeout(() => document.getElementById('didStatus').innerHTML = '', 3000);
            });
        });
    }
};
