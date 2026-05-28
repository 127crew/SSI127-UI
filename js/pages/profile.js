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
                            <a href="#/clients" class="nav-link">Clients</a>
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
                                <h3>Session</h3>
                                <p style="margin-bottom: var(--spacing-lg);">You are logged in with your DID authentication.</p>
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
        
        document.getElementById('logoutBtn').addEventListener('click', () => {
            Storage.logout();
            APP_ROUTER.push('/login');
        });
        
        document.getElementById('logoutBtnProfile').addEventListener('click', () => {
            Storage.logout();
            APP_ROUTER.push('/login');
        });
        
        document.getElementById('copyTokenBtn').addEventListener('click', () => {
            const token = Storage.getToken();
            navigator.clipboard.writeText(token).then(() => alert('Token copied!'));
        });
    }
};
