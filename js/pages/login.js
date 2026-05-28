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
                            <small class="form-hint">Enter your DID to authenticate</small>
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-full">Sign In</button>
                        
                        <div class="auth-divider">or</div>
                        
                        <button type="button" id="demoBtn" class="btn btn-secondary btn-full">Try Demo DID</button>
                    </form>
                    
                    <div id="authStatus" class="auth-status"></div>
                    
                    <div class="auth-help">
                        <p><strong>Backend Status:</strong></p>
                        <p id="backendStatus" style="font-size: 0.8rem; color: #aaa;">Checking...</p>
                        <p style="margin-top: var(--spacing-md);"><strong>Current Backend:</strong></p>
                        <p id="backendUrl" style="font-size: 0.75rem; word-break: break-all; color: #888;"></p>
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
        
        // Show backend URL
        document.getElementById('backendUrl').textContent = API_CLIENT.baseURL;
        
        // Check backend status
        this.checkBackendStatus();
        
        const form = document.getElementById('loginForm');
        const statusEl = document.getElementById('authStatus');
        const demoBtn = document.getElementById('demoBtn');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const did = document.getElementById('didInput').value.trim();
            if (!did) {
                statusEl.innerHTML = '<div class="error">Please enter a DID</div>';
                return;
            }
            await this.authenticate(did, statusEl);
        });
        
        demoBtn.addEventListener('click', async () => {
            document.getElementById('didInput').value = 'did:key:z6MkhaXgBZDvotDkL5257faWxcqoG2YTHL7cJGt1BQnrEd7v';
            await this.authenticate('did:key:z6MkhaXgBZDvotDkL5257faWxcqoG2YTHL7cJGt1BQnrEd7v', statusEl);
        });
    },
    
    async authenticate(did, statusEl) {
        try {
            statusEl.innerHTML = '<div class="info">Getting challenge from backend...</div>';
            const chalRes = await API_CLIENT.authChallenge(did);
            const nonce = chalRes.nonce;
            
            statusEl.innerHTML = '<div class="info">Challenge received. Verifying...</div>';
            const signature = this.createMockSignature(nonce);
            
            const verifyRes = await API_CLIENT.authVerify(did, nonce, signature);
            const token = verifyRes.access_token;
            
            Storage.setToken(token);
            Storage.setUser({ did, createdAt: new Date().toISOString() });
            
            statusEl.innerHTML = '<div class="success">Authentication successful!</div>';
            setTimeout(() => APP_ROUTER.push('/dashboard'), 500);
        } catch (error) {
            console.error('Authentication error:', error);
            statusEl.innerHTML = `<div class="error">❌ Error: ${error.message}</div>`;
        }
    },
    
    async checkBackendStatus() {
        try {
            const response = await fetch(`${API_CLIENT.baseURL}/health`);
            const backendStatusEl = document.getElementById('backendStatus');
            if (response.ok) {
                backendStatusEl.innerHTML = '<span style="color: #22c55e;">✓ Backend is online</span>';
            } else {
                backendStatusEl.innerHTML = `<span style="color: #ef4444;">✗ Backend error (HTTP ${response.status})</span>`;
            }
        } catch (error) {
            const backendStatusEl = document.getElementById('backendStatus');
            backendStatusEl.innerHTML = `<span style="color: #ef4444;">✗ Backend unreachable</span>`;
        }
    },
    
    createMockSignature(nonce) {
        return btoa('mock_signature:' + nonce);
    }
};
