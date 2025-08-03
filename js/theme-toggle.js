// Theme Toggle Manager - Dark/Light Mode with Neo-Brutalism Style
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        // Initialize theme settings
        this.setTheme(this.currentTheme);
        this.addInteractiveEffects();
        this.initAccessibility();
        this.createThemeToggle();
    }

    setTheme(theme = 'light') {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        document.body.className = `${theme}-theme neo-brutalism-theme`;
        localStorage.setItem('theme', theme);
        
        // Update theme toggle button if it exists
        this.updateThemeToggleButton();
    }

    createThemeToggle() {
        // Check if toggle already exists
        if (document.getElementById('themeToggle')) return;
        
        const toggle = document.createElement('button');
        toggle.id = 'themeToggle';
        toggle.className = 'theme-toggle smooth-transition';
        toggle.setAttribute('aria-label', `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} mode`);
        toggle.setAttribute('title', `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} mode`);
        
        // Add toggle to navigation
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            // Insert before admin link
            const adminLink = navMenu.querySelector('.admin-link');
            if (adminLink) {
                navMenu.insertBefore(toggle, adminLink);
            } else {
                navMenu.appendChild(toggle);
            }
        }
        
        // Add click event
        toggle.addEventListener('click', () => this.toggleTheme());
        
        // Set initial icon
        this.updateThemeToggleButton();
    }

    updateThemeToggleButton() {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;
        
        const isDark = this.currentTheme === 'dark';
        toggle.innerHTML = isDark 
            ? '<i class="fas fa-sun"></i><span>Light</span>' 
            : '<i class="fas fa-moon"></i><span>Dark</span>';
        
        toggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
        toggle.setAttribute('title', `Switch to ${isDark ? 'light' : 'dark'} mode`);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    addInteractiveEffects() {
        // Add hover effects to interactive elements
        this.addButtonEffects();
        this.addCardEffects();
        this.addLinkEffects();
    }

    addButtonEffects() {
        const buttons = document.querySelectorAll('button, .btn, .cta-button, .admin-btn');
        
        buttons.forEach(button => {
            button.addEventListener('mouseenter', (e) => {
                if (!e.target.disabled) {
                    e.target.style.transform = 'translate(-2px, -2px)';
                    e.target.style.boxShadow = '6px 6px 0 var(--black)';
                }
            });
            
            button.addEventListener('mouseleave', (e) => {
                if (!e.target.disabled) {
                    e.target.style.transform = 'translate(0, 0)';
                    e.target.style.boxShadow = 'none';
                }
            });
            
            button.addEventListener('mousedown', (e) => {
                if (!e.target.disabled) {
                    e.target.style.transform = 'translate(0, 0)';
                    e.target.style.boxShadow = '2px 2px 0 var(--black)';
                }
            });
            
            button.addEventListener('mouseup', (e) => {
                if (!e.target.disabled) {
                    e.target.style.transform = 'translate(-2px, -2px)';
                    e.target.style.boxShadow = '6px 6px 0 var(--black)';
                }
            });
        });
    }

    addCardEffects() {
        const cards = document.querySelectorAll('.card, .glass-card, .tool-card, .performance-card');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', (e) => {
                e.target.style.transform = 'translate(-2px, -2px)';
                e.target.style.boxShadow = '6px 6px 0 var(--black)';
            });
            
            card.addEventListener('mouseleave', (e) => {
                e.target.style.transform = 'translate(0, 0)';
                e.target.style.boxShadow = 'none';
            });
        });
    }

    addLinkEffects() {
        const links = document.querySelectorAll('.nav-link');
        
        links.forEach(link => {
            link.addEventListener('mouseenter', (e) => {
                if (!e.target.classList.contains('active')) {
                    e.target.style.transform = 'translate(-1px, -1px)';
                    e.target.style.boxShadow = '3px 3px 0 var(--black)';
                }
            });
            
            link.addEventListener('mouseleave', (e) => {
                if (!e.target.classList.contains('active')) {
                    e.target.style.transform = 'translate(0, 0)';
                    e.target.style.boxShadow = 'none';
                }
            });
        });
    }

    initAccessibility() {
        // Add focus indicators
        const focusableElements = document.querySelectorAll('button, input, select, textarea, a, [tabindex]');
        
        focusableElements.forEach(element => {
            element.addEventListener('focus', (e) => {
                e.target.style.outline = '3px solid var(--primary)';
                e.target.style.outlineOffset = '2px';
            });
            
            element.addEventListener('blur', (e) => {
                e.target.style.outline = 'none';
                e.target.style.outlineOffset = '0';
            });
        });
    }
}

// Mobile Menu Handler
class MobileMenuManager {
    constructor() {
        this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        this.navMenu = document.getElementById('navMenu');
        this.init();
    }

    init() {
        if (this.mobileMenuBtn && this.navMenu) {
            this.mobileMenuBtn.addEventListener('click', () => this.toggleMenu());
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.mobileMenuBtn.contains(e.target) && !this.navMenu.contains(e.target)) {
                    this.closeMenu();
                }
            });
            
            // Close menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeMenu();
                }
            });
        }
    }

    toggleMenu() {
        this.navMenu.classList.toggle('active');
        this.mobileMenuBtn.classList.toggle('active');
        
        // Update aria-expanded
        const isExpanded = this.navMenu.classList.contains('active');
        this.mobileMenuBtn.setAttribute('aria-expanded', isExpanded);
        
        // Prevent body scroll when menu is open
        if (isExpanded) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    closeMenu() {
        this.navMenu.classList.remove('active');
        this.mobileMenuBtn.classList.remove('active');
        this.mobileMenuBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }
}

// Back to Top Button
class BackToTopManager {
    constructor() {
        this.backToTopBtn = document.getElementById('backToTop');
        this.init();
    }

    init() {
        if (this.backToTopBtn) {
            window.addEventListener('scroll', () => this.handleScroll());
            this.backToTopBtn.addEventListener('click', () => this.scrollToTop());
        }
    }

    handleScroll() {
        if (window.pageYOffset > 300) {
            this.backToTopBtn.classList.add('show');
        } else {
            this.backToTopBtn.classList.remove('show');
        }
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// Notification System
class NotificationManager {
    constructor() {
        this.container = document.getElementById('notificationContainer');
        this.init();
    }

    init() {
        if (!this.container) {
            this.createContainer();
        }
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notificationContainer';
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 5000) {
        // Check for duplicate notifications to prevent multiple identical notifications
        const existingNotifications = this.container.querySelectorAll('.notification');
        for (let notification of existingNotifications) {
            const existingMessage = notification.querySelector('span')?.textContent;
            if (existingMessage === message) {
                return notification; // Don't create duplicate notification
            }
        }

        // Limit maximum number of notifications (prevent spam)
        if (existingNotifications.length >= 3) {
            existingNotifications[0].remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" aria-label="Close notification" class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        this.container.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
        
        return notification;
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Animation Observer for scroll-triggered animations
class AnimationObserver {
    constructor() {
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                (entries) => this.handleIntersection(entries),
                {
                    threshold: 0.1,
                    rootMargin: '0px 0px -50px 0px'
                }
            );
            
            this.observeElements();
        }
    }

    observeElements() {
        const elements = document.querySelectorAll('.animate-fade-in, .animate-slide-up, .animate-scale-in');
        elements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = this.getInitialTransform(el);
            this.observer.observe(el);
        });
    }

    getInitialTransform(element) {
        if (element.classList.contains('animate-slide-up')) {
            return 'translateY(30px)';
        } else if (element.classList.contains('animate-scale-in')) {
            return 'scale(0.9)';
        }
        return 'translateY(0)';
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                element.style.opacity = '1';
                element.style.transform = 'translateY(0) scale(1)';
                element.style.transition = 'all 0.6s ease-out';
                this.observer.unobserve(element);
            }
        });
    }
}

// Initialize all theme components
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme manager
    window.themeManager = new ThemeManager();
    
    // Initialize mobile menu
    window.mobileMenuManager = new MobileMenuManager();
    
    // Initialize back to top
    window.backToTopManager = new BackToTopManager();
    
    // Initialize notifications
    window.notificationManager = new NotificationManager();
    
    // Initialize animations
    window.animationObserver = new AnimationObserver();
    
    // Add global utility functions
    window.showNotification = (message, type, duration) => {
        return window.notificationManager.show(message, type, duration);
    };
    
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ThemeManager,
        MobileMenuManager,
        BackToTopManager,
        NotificationManager,
        AnimationObserver
    };
}
