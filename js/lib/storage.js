class Storage {
    static dbPromise = null;
    static setToken(token) { sessionStorage.setItem('access_token', token); localStorage.removeItem('access_token'); }
    static getToken() { return sessionStorage.getItem('access_token'); }
    static clearToken() { sessionStorage.removeItem('access_token'); }
    static setUser(user) { localStorage.setItem('user', JSON.stringify(user)); }
    static getUser() { try { return JSON.parse(localStorage.getItem('user')) || null; } catch (_) { return null; } }
    static clearUser() { localStorage.removeItem('user'); }

    static openWalletDB() {
        if (this.dbPromise) return this.dbPromise;
        this.dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open('ssi127-secure-wallets', 1);
            request.onupgradeneeded = () => request.result.createObjectStore('wallets', { keyPath: 'did' });
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        return this.dbPromise;
    }

    static async walletTransaction(mode, operation) {
        const db = await this.openWalletDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('wallets', mode);
            const request = operation(transaction.objectStore('wallets'));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            transaction.onerror = () => reject(transaction.error);
        });
    }

    static async migrateLegacyWallets() {
        const raw = localStorage.getItem('ssi_wallets');
        if (!raw) return;
        let wallets;
        try { wallets = JSON.parse(raw); } catch (_) { localStorage.removeItem('ssi_wallets'); return; }
        for (const wallet of wallets) {
            if (!wallet?.did || !wallet?.privateKey) continue;
            const privateKey = await CryptoUtils.importLegacyPrivateKey(wallet.privateKey);
            await this.saveWallet({ did: wallet.did, publicKey: wallet.publicKey, privateKey });
        }
        localStorage.removeItem('ssi_wallets');
    }

    static async getWallets() {
        await this.migrateLegacyWallets();
        return (await this.walletTransaction('readonly', store => store.getAll())).map(({ did, publicKey }) => ({ did, publicKey }));
    }
    static async saveWallet(wallet) { return this.walletTransaction('readwrite', store => store.put(wallet)); }
    static async getWallet(did) { await this.migrateLegacyWallets(); return this.walletTransaction('readonly', store => store.get(did)); }
    static async deleteWallet(did) { return this.walletTransaction('readwrite', store => store.delete(did)); }

    static isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (!payload.exp || payload.exp * 1000 <= Date.now() || payload.token_use !== 'access') { this.logout(); return false; }
            return true;
        } catch (_) { this.logout(); return false; }
    }
    static logout() { this.clearToken(); this.clearUser(); }
}
