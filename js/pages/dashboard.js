// Dashboard Page - Main user interface
const DashboardPage = {
    async render(container) {
        const user = Storage.getUser();
        container.innerHTML = `
            <div class="dashboard">
                <nav class="navbar">
                    <div class="container nav-container">
                        <a href="#/dashboard" class="logo">127<span>Crew</span> SSI</a>
                        <div class="nav-links">
                            <a href="#/dashboard" class="nav-link active">Dashboard</a>
                            <a href="#/dids" class="nav-link">DIDs</a>
                            <a href="#/clients" class="nav-link">Dev Portal</a>
                            <a href="#/profile" class="nav-link">Profile</a>
                        </div>
                        <button id="logoutBtn" class="btn btn-secondary" style="padding: 8px 16px; font-size: 0.85rem;">Logout</button>
                    </div>
                </nav>
                
                <main class="main-content">
                    <div class="container">
                        <h1>Welcome to SSI127</h1>
                        <p class="text-secondary">Your self-sovereign identity management dashboard</p>
                        
                        <div class="grid grid-2" style="margin-top: var(--spacing-xl);">
                            <div class="card">
                                <span class="card-meta">ACCOUNT</span>
                                <h3>Your DID</h3>
								<p id="dashboardDid" class="mono" style="word-break: break-all; font-size: 0.85rem; color: var(--primary-accent); margin: var(--spacing-md) 0;"></p>
                                <a href="#/profile" class="btn btn-primary" style="font-size: 0.85rem;">View Profile</a>
                            </div>
                            
                            <div class="card">
                                <span class="card-meta">MANAGEMENT</span>
                                <h3>Quick Actions</h3>
                                <div style="display: flex; flex-direction: column; gap: var(--spacing-md); margin-top: var(--spacing-md);">
                                    <a href="#/dids" class="btn btn-secondary" style="font-size: 0.85rem; text-align: center;">Manage DIDs</a>
                                    <a href="#/clients" class="btn btn-secondary" style="font-size: 0.85rem; text-align: center;">Register OAuth Client</a>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card" style="margin-top: var(--spacing-lg);">
                            <span class="card-meta">GETTING STARTED</span>
                            <h3>Next Steps</h3>
                            <ul style="list-style: disc; padding-left: var(--spacing-lg); margin-top: var(--spacing-md);">
                                <li>Create or import a DID</li>
                                <li>Register an OAuth application</li>
                                <li>Issue or verify credentials</li>
                                <li>Integrate with your service</li>
                            </ul>
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
		document.getElementById('dashboardDid').textContent = Storage.getUser()?.did || 'Unknown';
        document.getElementById('logoutBtn').addEventListener('click', logoutCurrentSession);
    }
};
