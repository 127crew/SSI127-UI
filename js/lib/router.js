// Simple client-side router for SPA
class Router {
    constructor(rootSelector) {
        this.root = document.querySelector(rootSelector);
        this.routes = {};
        this.currentPage = null;

        window.addEventListener('popstate', () => this.navigate(window.location.hash.slice(1) || '/'));
    }

    register(path, page) {
        this.routes[path] = page;
    }

    async navigate(path) {
		const routePath = path.split('?')[0];
		const route = this.routes[routePath];
        if (!route) {
            this.navigate('/login');
            return;
        }

        // Clear root
        this.root.innerHTML = '';
        this.currentPage = route;

        try {
            await route.render(this.root);
            if (route.onMount) await route.onMount();
        } catch (err) {
            console.error('Navigation error:', err);
            this.root.innerHTML = `<div class="error">Error loading page</div>`;
        }
    }

    push(path) {
        window.history.pushState({}, '', `#${path}`);
        this.navigate(path);
    }

    go(path) {
        this.push(path);
    }
}

// Global router instance
let APP_ROUTER;
