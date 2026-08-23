/**
 * LocalStorage utilities for auth tokens and user data
 */
class Storage {
    static setToken(token) {
		sessionStorage.setItem('access_token', token);
		localStorage.removeItem('access_token');
    }

    static getToken() {
		return sessionStorage.getItem('access_token');
    }

    static clearToken() {
		sessionStorage.removeItem('access_token');
    }

    static setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    static getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    static clearUser() {
        localStorage.removeItem('user');
    }

    static getWallets() {
        const wallets = localStorage.getItem('ssi_wallets');
        return wallets ? JSON.parse(wallets) : [];
    }

    static saveWallet(wallet) {
        const wallets = this.getWallets();
        // Remove existing if same DID
        const filtered = wallets.filter(w => w.did !== wallet.did);
        filtered.push(wallet);
        localStorage.setItem('ssi_wallets', JSON.stringify(filtered));
    }

    static getWallet(did) {
        return this.getWallets().find(w => w.did === did);
    }

    static deleteWallet(did) {
        const wallets = this.getWallets().filter(w => w.did !== did);
        localStorage.setItem('ssi_wallets', JSON.stringify(wallets));
    }

    static isAuthenticated() {
		const token = this.getToken();
		if (!token) return false;
		try {
			const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
			if (!payload.exp || payload.exp * 1000 <= Date.now() || payload.token_use !== 'access') { this.logout(); return false; }
			return true;
		} catch (_) { this.logout(); return false; }
    }

    static logout() {
        this.clearToken();
        this.clearUser();
    }
}
