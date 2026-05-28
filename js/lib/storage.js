/**
 * LocalStorage utilities for auth tokens and user data
 */
class Storage {
    static setToken(token) {
        localStorage.setItem('access_token', token);
    }

    static getToken() {
        return localStorage.getItem('access_token');
    }

    static clearToken() {
        localStorage.removeItem('access_token');
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

    static isAuthenticated() {
        return !!this.getToken();
    }

    static logout() {
        this.clearToken();
        this.clearUser();
    }
}
