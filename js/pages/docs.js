const DocsPage = {
    async render(container) {
        container.innerHTML = `
            <div class="dashboard docs-page">
                <nav class="navbar">
                    <div class="container nav-container">
                        <a href="#/login" class="logo">127<span>Crew</span> SSI</a>
                        <div class="nav-links">
                            <button class="nav-link docs-nav" data-section="quickstart">Quickstart</button>
                            <button class="nav-link docs-nav" data-section="flow">OIDC flow</button>
                            <button class="nav-link docs-nav" data-section="tokens">Tokens</button>
                            <button class="nav-link docs-nav" data-section="security">Security</button>
                        </div>
                        <a id="portalLink" href="#/login" class="btn btn-secondary btn-sm">Developer portal</a>
                    </div>
                </nav>
                <main class="docs-shell container">
                    <aside class="docs-sidebar" aria-label="Documentation sections">
                        <span class="card-meta">INTEGRATION GUIDE</span>
                        <button class="docs-nav" data-section="overview">Overview</button><button class="docs-nav" data-section="quickstart">Quickstart</button>
                        <button class="docs-nav" data-section="flow">Authorization flow</button><button class="docs-nav" data-section="callback">Callback</button>
                        <button class="docs-nav" data-section="tokens">Tokens & refresh</button><button class="docs-nav" data-section="scopes">Scopes</button>
                        <button class="docs-nav" data-section="logout">Logout & revocation</button><button class="docs-nav" data-section="security">Production checklist</button>
                    </aside>
                    <article class="docs-content">
                        <section id="overview" class="docs-hero">
                            <span class="auth-eyebrow">SSI127 FOR DEVELOPERS</span>
                            <h1>Add trusted 127crew sign-in</h1>
							<p>Use OpenID Connect Authorization Code flow with S256 PKCE. SSI127 handles registered community identities and DID authentication; your backend receives standards-based tokens.</p>
                            <div class="docs-callout"><strong>Discovery URL</strong><code id="discoveryUrl"></code><button class="copy-code" data-copy="discoveryUrl">Copy</button></div>
                        </section>

                        <section id="quickstart" class="docs-section">
                            <span class="docs-step">01</span><h2>Register your application</h2>
							<p>Officially verified @127crew.dev developers can open the Developer Portal and register an exact HTTPS callback URL. The client secret is displayed once. Store it only in your backend secret manager—never frontend JavaScript.</p>
                            <a href="#/clients" class="btn btn-primary">Open Developer Portal</a>
                            <div class="docs-note"><strong>Local development:</strong> loopback HTTP callbacks are supported. Deployed callbacks require HTTPS; wildcards are rejected.</div>
                        </section>

                        <section id="flow" class="docs-section">
                            <span class="docs-step">02</span><h2>Start authorization</h2>
                            <p>Your backend creates a short-lived login transaction containing random <code>state</code>, OIDC <code>nonce</code>, and a PKCE verifier. Store it in an HttpOnly, Secure, SameSite=Lax session cookie.</p>
                            <div class="code-panel"><div class="code-title"><span>Authorization redirect</span><button class="copy-code" data-copy="authorizeCode">Copy</button></div><pre><code id="authorizeCode"></code></pre></div>
                            <p>Generate a new state, nonce, and verifier for every attempt. Never accept values supplied by another user or reuse a completed transaction.</p>
                        </section>

                        <section id="callback" class="docs-section">
                            <span class="docs-step">03</span><h2>Handle the callback</h2>
                            <p>Reject a missing or mismatched state before exchanging the code. Exchange from your backend using the original redirect URI and PKCE verifier.</p>
                            <div class="code-panel"><div class="code-title"><span>Server-side token exchange</span><button class="copy-code" data-copy="tokenCode">Copy</button></div><pre><code id="tokenCode"></code></pre></div>
                            <p>Confidential clients authenticate with HTTP Basic. Do not put the client secret, authorization code, or verifier into browser logs or analytics.</p>
                        </section>

                        <section id="tokens" class="docs-section">
                            <span class="docs-step">04</span><h2>Validate tokens</h2>
                            <p>Fetch signing keys from <code>/auth/jwks</code>. Require RS256, a known <code>kid</code>, the configured issuer, your client ID as audience, an unexpired token, <code>token_use=id</code>, and the exact nonce from your login transaction.</p>
                            <div class="docs-grid"><div class="card"><span class="card-meta">ACCESS TOKEN</span><h3>15 minutes</h3><p>Use for API access. Introspect when immediate revocation enforcement matters.</p></div><div class="card"><span class="card-meta">REFRESH TOKEN</span><h3>30 days</h3><p>Issued only with offline_access. It rotates on every use; reuse revokes its family.</p></div></div>
                        </section>

                        <section id="scopes" class="docs-section">
                            <span class="docs-step">05</span><h2>Request minimal scopes</h2>
							<div class="docs-table"><div><code>openid</code><span>Required. Issues an ID token.</span></div><div><code>profile</code><span>Name, username, and profile picture.</span></div><div><code>email</code><span>Email and its verified-ownership status.</span></div><div><code>forum</code><span>Linked Forum identifier.</span></div><div><code>offline_access</code><span>Rotating refresh token; request only when needed.</span></div></div>
                        </section>

                        <section id="logout" class="docs-section">
                            <span class="docs-step">06</span><h2>Refresh, revoke, and log out</h2>
                            <p>Replace the stored refresh token after every successful refresh. If an already-used token is presented, discard the entire local session. Call <code>/oauth/revoke</code> during logout or credential removal and clear your own Secure, HttpOnly session cookie.</p>
                        </section>

                        <section id="security" class="docs-section">
                            <span class="docs-step">07</span><h2>Production checklist</h2>
                            <ul class="docs-checklist"><li>Exact HTTPS redirect URI with no wildcard</li><li>S256 PKCE, state, and nonce on every login</li><li>Server-side client secret and code exchange</li><li>JWKS signature, issuer, audience, expiry, token-use, and nonce validation</li><li>Secure, HttpOnly, SameSite application session cookies</li><li>Token revocation on logout and monitored authentication failures</li><li>No tokens, codes, secrets, verifiers, state, or nonce in logs</li></ul>
                            <div class="docs-note"><strong>Do not ship until negative tests pass.</strong> A reused code, mismatched state/nonce, plain PKCE, unknown redirect URI, invalid signature, and old rotated refresh token must all be rejected.</div>
                        </section>
                    </article>
                </main>
            </div>`;
    },

    async onMount() {
        const issuer = API_CLIENT.baseURL.replace(/\/$/, '');
        document.getElementById('portalLink').href = Storage.isAuthenticated() ? '#/clients' : '#/login?return_to=%2Fclients';
        document.getElementById('discoveryUrl').textContent = `${issuer}/.well-known/openid-configuration`;
        document.getElementById('authorizeCode').textContent = `GET ${issuer}/oauth/authorize?\n  response_type=code&\n  client_id=YOUR_CLIENT_ID&\n  redirect_uri=https%3A%2F%2Fyour-app.example%2Fauth%2Fcallback&\n  scope=openid%20profile&\n  state=RANDOM_STATE&\n  nonce=RANDOM_NONCE&\n  code_challenge=BASE64URL_SHA256_VERIFIER&\n  code_challenge_method=S256`;
        document.getElementById('tokenCode').textContent = `curl -X POST '${issuer}/oauth/token' \\\n+  -u 'YOUR_CLIENT_ID:YOUR_CLIENT_SECRET' \\\n+  -H 'Content-Type: application/json' \\\n+  -d '{\n    "grant_type":"authorization_code",\n    "client_id":"YOUR_CLIENT_ID",\n    "code":"CALLBACK_CODE",\n    "redirect_uri":"https://your-app.example/auth/callback",\n    "code_verifier":"ORIGINAL_PKCE_VERIFIER"\n  }'`;
        document.querySelectorAll('.copy-code').forEach(button => button.addEventListener('click', async () => {
            const source = document.getElementById(button.dataset.copy);
            await navigator.clipboard.writeText(source.textContent);
            const old = button.textContent; button.textContent = 'Copied'; setTimeout(() => { button.textContent = old; }, 1200);
        }));
		document.querySelectorAll('.docs-nav').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.section)?.scrollIntoView({ behavior: 'smooth' })));
    }
};
window.DocsPage = DocsPage;
