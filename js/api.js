/**
 * API client for SSI127 backend
 */
class API {
    constructor(baseURL = 'https://ssi.127crew.dev') {
        this.baseURL = baseURL;
    }

    async request(method, endpoint, data = null) {
        const url = `${this.baseURL}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        // Add auth token if available
        const token = Storage.getToken();
        if (token) {
            options.headers.Authorization = `Bearer ${token}`;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || response.statusText);
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

    // OAuth endpoints
    async authorize(clientId, redirectUri, did, nonce, signature) {
        return this.request('POST', '/oauth/authorize', {
            client_id: clientId,
            redirect_uri: redirectUri,
            did,
            nonce,
            signature
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

// Global API instance
const API_CLIENT = new API(window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://ssi.127crew.dev');
