// Common Header Component
class HeaderComponent {
    static getHTML() {
        return `
            <nav class="navbar">
                <div class="container nav-container">
                    <a href="/" class="logo" style="position: relative;">
                        127<span>Crew</span>
                        <img src="https://i.postimg.cc/Vvjcjsgz/christmas.png" alt="Christmas Cap" class="christmas-cap">
                    </a>
                    <button class="mobile-menu-btn" aria-label="Toggle navigation">☰</button>
                    <div class="nav-links">
                        <a href="/" class="nav-link">Home</a>
                        <a href="/about/" class="nav-link">About</a>
                        <a href="/projects/" class="nav-link">Projects</a>
                        <a href="/contribute/" class="nav-link">Contribute</a>
                        <a href="/community/" class="nav-link">Community</a>
                        <a href="/events/" class="nav-link">Events</a>
                        <a href="/contact/" class="nav-link">Contact</a>
                    </div>
                </div>
            </nav>
        `;
    }

    static init() {
        const headerElement = document.createElement('div');
        headerElement.innerHTML = this.getHTML();
        document.body.insertBefore(headerElement.firstElementChild, document.body.firstChild);
        this.setActiveNavLink();
        this.initMobileMenu();
    }

    static setActiveNavLink() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (currentPath === href || (currentPath === '/' && href === '/') || (currentPath.startsWith(href) && href !== '/')) {
                link.classList.add('active');
            }
        });
    }

    static initMobileMenu() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');
        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    HeaderComponent.init();
});
