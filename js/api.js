// API client for SSI127 backend
class API {
    constructor(baseURL = 'https://ssi.127crew.dev') {
        this.baseURL = baseURL;
    }

    async request(method, endpoint, data = null, tokenOverride = null) {
        const url = `${this.baseURL}${endpoint}`;
        const options = {
            method,
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

	async linkIdentity(forumToken, did, nonce, signature) {
		return this.request('POST', '/auth/link', { did, nonce, signature }, forumToken);
	}

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
	async authorize(clientId, redirectUri, did, nonce, signature, state = '', codeChallenge = '', codeChallengeMethod = '') {
        return this.request('POST', '/oauth/authorize', {
            client_id: clientId,
            redirect_uri: redirectUri,
            did,
            nonce,
            signature,
			state,
			code_challenge: codeChallenge,
			code_challenge_method: codeChallengeMethod
        });
    }

    async token(grantType, code, clientId, clientSecret) {
        return this.request('POST', '/oauth/token', {
            grant_type: grantType,
            code,
            client_id: clientId,
            client_secret: clientSecret
        });
    }
}

// Global API instance - update baseURL as needed
const API_CLIENT = new API(
    window.location.hostname === 'localhost'
        ? 'http://localhost:8080'
        : 'https://ssi.127crew.dev'
);

// For testing: override API URL if needed
if (window.location.hostname === 'localhost' && window.location.search.includes('api=')) {
    const params = new URLSearchParams(window.location.search);
    const customAPI = params.get('api');
    if (customAPI) {
        Object.defineProperty(API_CLIENT, 'baseURL', { value: customAPI, writable: true });
    }
}
