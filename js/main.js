document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('open');

            // Update aria-expanded for accessibility
            const isExpanded = navLinks.classList.contains('open');
            mobileMenuBtn.setAttribute('aria-expanded', isExpanded);

            // Change icon
            mobileMenuBtn.textContent = isExpanded ? '✕' : '☰';
        });
    }

    // Add simple hover effect for cards to show "active" border color
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.borderColor = 'var(--primary-accent)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.borderColor = 'var(--border-color)';
        });
    });

    // Membership Modal Logic (if present)
    const joinBtn = document.getElementById('joinBtn');
    const modal = document.getElementById('membershipModal');
    const closeModal = document.querySelector('.close-modal');
    const membershipForm = document.getElementById('membershipForm');

    if (joinBtn && modal && closeModal) {
        joinBtn.addEventListener('click', () => { modal.style.display = 'flex'; });
        closeModal.addEventListener('click', () => { modal.style.display = 'none'; });
        window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    }

    if (membershipForm) {
        membershipForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = membershipForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;

            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;

            const formData = new FormData(membershipForm);
            const data = Object.fromEntries(formData.entries());
            data.sheetName = 'Membership';

            const scriptURL = 'https://script.google.com/macros/s/AKfycbypKOlcdLilh71YnzqtFRKy5V4Nr3taQidJ2nXXqePueVlZECH7-WsZzW_JqJRpIR3GjQ/exec';

            if (scriptURL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
                alert('Please configure the Google Apps Script URL in js/main.js');
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
                return;
            }

            fetch(scriptURL, { method: 'POST', body: JSON.stringify(data), mode: 'no-cors', headers: { 'Content-Type': 'application/json' } })
                .then(() => {
                    alert('Thank you for joining 127 Crew! We will be in touch.');
                    membershipForm.reset();
                    modal.style.display = 'none';
                })
                .catch(error => {
                    console.error('Error!', error.message);
                    alert('Something went wrong. Please try again later.');
                })
                .finally(() => {
                    submitBtn.textContent = originalBtnText;
                    submitBtn.disabled = false;
                });
        });
    }

    // Contact Form Logic (if present)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;

            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());
            data.sheetName = 'Contact';

            const scriptURL = 'https://script.google.com/macros/s/AKfycbypKOlcdLilh71YnzqtFRKy5V4Nr3taQidJ2nXXqePueVlZECH7-WsZzW_JqJRpIR3GjQ/exec';

            fetch(scriptURL, { method: 'POST', body: JSON.stringify(data), mode: 'no-cors', headers: { 'Content-Type': 'application/json' } })
                .then(() => {
                    alert('Message sent! We will get back to you shortly.');
                    contactForm.reset();
                })
                .catch(error => {
                    console.error('Error!', error.message);
                    alert('Something went wrong. Please try again later.');
                })
                .finally(() => {
                    submitBtn.textContent = originalBtnText;
                    submitBtn.disabled = false;
                });
        });
    }
});
