// API client for SSI127 backend
class API {
    constructor(baseURL = 'https://ssi.127crew.dev') {
        this.baseURL = baseURL;
    }

    async request(method, endpoint, data = null, tokenOverride = null) {
        const url = `${this.baseURL}${endpoint}`;
        const options = {
            method,
			credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        };

		const token = tokenOverride || Storage.getToken();
        if (token) {
            options.headers.Authorization = `Bearer ${token}`;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const text = await response.text();

            let result;
            try {
                result = text ? JSON.parse(text) : {};
            } catch (e) {
                console.error('Failed to parse response:', text);
                throw new Error(`Backend returned invalid JSON. Status: ${response.status}. Response: ${text.substring(0, 200)}`);
            }

            if (!response.ok) {
                throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return result;
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    }

    // Auth endpoints
    async authChallenge(did) {
        return this.request('POST', '/auth/challenge', { did });
    }

    async authVerify(did, nonce, signature) {
        return this.request('POST', '/auth/verify', { did, nonce, signature });
    }

	async linkIdentity(did, nonce, signature) {
		return this.request('POST', '/auth/link', { did, nonce, signature });
	}

	async logout() { return this.request('POST', '/auth/logout'); }
	async listSessions() { return this.request('GET', '/auth/sessions'); }
	async revokeSession(sessionId) { return this.request('DELETE', `/auth/sessions/${encodeURIComponent(sessionId)}`); }

    async authJWKS() {
        return this.request('GET', '/auth/jwks');
    }

    // Clients endpoints
    async registerClient(name, redirectUris) {
        return this.request('POST', '/clients/register', {
            name,
            redirect_uris: redirectUris
        });
    }

	async listClients() { return this.request('GET', '/clients/'); }
	async getClient(clientId) { return this.request('GET', `/clients/${encodeURIComponent(clientId)}/public`); }
	async rotateClientSecret(clientId) { return this.request('POST', `/clients/${encodeURIComponent(clientId)}/rotate-secret`); }
	async revokeClient(clientId) { return this.request('DELETE', `/clients/${encodeURIComponent(clientId)}`); }

    // OAuth endpoints
	async authorize(clientId, redirectUri, did, challengeNonce, signature, state, codeChallenge, oidcNonce, scope, codeChallengeMethod = 'S256') {
        return this.request('POST', '/oauth/authorize', {
			response_type: 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            did,
			challenge_nonce: challengeNonce,
			nonce: oidcNonce,
			scope,
            signature,
			state,
			code_challenge: codeChallenge,
			code_challenge_method: codeChallengeMethod
        });
    }

    async token(grantType, code, clientId, clientSecret, redirectUri, codeVerifier) {
        return this.request('POST', '/oauth/token', {
            grant_type: grantType,
            code,
            client_id: clientId,
            client_secret: clientSecret,
			redirect_uri: redirectUri,
			code_verifier: codeVerifier
        });
    }

	async refreshToken(refreshToken, clientId, clientSecret) {
		return this.request('POST', '/oauth/token', {
			grant_type: 'refresh_token', refresh_token: refreshToken,
			client_id: clientId, client_secret: clientSecret
		});
	}
}

async function logoutCurrentSession() {
    try {
        if (Storage.getToken()) await API_CLIENT.logout();
    } catch (error) {
        console.warn('The server session could not be revoked:', error);
    } finally {
        Storage.logout();
        APP_ROUTER.push('/login');
    }
}

function configuredAPIURL() {
    const fallback = window.location.hostname === 'localhost'
        ? 'http://localhost:8080'
        : 'https://ssi.127crew.dev';
    const candidate = window.SSI127_CONFIG?.apiURL || fallback;
    const parsed = new URL(candidate);
    const localHTTP = parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !localHTTP) throw new Error('SSI127 API URL must use HTTPS outside local development');
    if (parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) throw new Error('SSI127 API URL must be a plain origin');
    return parsed.origin;
}

// Global API instance. Production defaults are in js/config.js; staging and
// self-hosted deployments replace only that public file.
const API_CLIENT = new API(configuredAPIURL());

// For testing: override API URL if needed
if (window.location.hostname === 'localhost' && window.location.search.includes('api=')) {
    const params = new URLSearchParams(window.location.search);
    const customAPI = params.get('api');
    if (customAPI) {
        Object.defineProperty(API_CLIENT, 'baseURL', { value: customAPI, writable: true });
    }
}
