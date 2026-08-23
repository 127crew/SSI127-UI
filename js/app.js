// Main app entry point and router setup
document.addEventListener('DOMContentLoaded', () => {
    // Initialize router
    APP_ROUTER = new Router('#app');

    // Register pages
    APP_ROUTER.register('/login', LoginPage);
	APP_ROUTER.register('/link', LinkPage);
    APP_ROUTER.register('/authorize', AuthorizePage);
    APP_ROUTER.register('/dashboard', DashboardPage);
    APP_ROUTER.register('/dids', DidsPage);
    APP_ROUTER.register('/clients', ClientsPage);
    APP_ROUTER.register('/profile', ProfilePage);

    // Navigate to current route or login
    const hash = window.location.hash.slice(1);
    const route = hash || (Storage.isAuthenticated() ? '/dashboard' : '/login');
    APP_ROUTER.navigate(route);
});
