// Loading Manager for Neo-Brutalism Theme
class LoadingManager {
    constructor() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.loadingText = document.querySelector('.loading-text');
        this.loadingSpinner = document.querySelector('.loading-spinner');
        this.init();
    }

    init() {
        if (this.loadingScreen) {
            this.setupLoadingAnimation();
            this.startLoading();
        }
    }

    setupLoadingAnimation() {
        // Add neo-brutalism style to loading spinner
        if (this.loadingSpinner) {
            this.loadingSpinner.style.border = '4px solid var(--gray-200)';
            this.loadingSpinner.style.borderTop = '4px solid var(--primary)';
            this.loadingSpinner.style.borderRadius = '50%';
        }

        // Animate loading text
        if (this.loadingText) {
            this.animateLoadingText();
        }
    }

    animateLoadingText() {
        const messages = [
            'Loading amazing content...',
            'Preparing your experience...',
            'Almost ready...',
            'Just a moment...'
        ];
        
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (this.loadingText && this.loadingScreen.style.display !== 'none') {
                this.loadingText.textContent = messages[currentIndex];
                currentIndex = (currentIndex + 1) % messages.length;
            } else {
                clearInterval(interval);
            }
        }, 1000);
    }

    startLoading() {
        // Simulate loading time
        const minLoadingTime = 1000; // Minimum 1 second
        const startTime = Date.now();
        
        // Wait for page load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.completeLoading(startTime, minLoadingTime);
            });
        } else {
            this.completeLoading(startTime, minLoadingTime);
        }
        
        // Also listen for window load
        window.addEventListener('load', () => {
            this.completeLoading(startTime, minLoadingTime);
        });
    }

    completeLoading(startTime, minLoadingTime) {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        setTimeout(() => {
            this.hideLoadingScreen();
        }, remainingTime);
    }

    hideLoadingScreen() {
        if (this.loadingScreen) {
            // Add fade out animation
            this.loadingScreen.style.opacity = '0';
            this.loadingScreen.style.transition = 'opacity 0.3s ease-out';
            
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
                this.onLoadingComplete();
            }, 300);
        }
    }

    onLoadingComplete() {
        // Trigger any post-loading animations
        document.body.classList.add('loaded');
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('loadingComplete'));
        
        // Show notification if notification manager is available and not already shown
        if (window.notificationManager && !sessionStorage.getItem('welcomeNotificationShown')) {
            // Mark notification as shown for this session
            sessionStorage.setItem('welcomeNotificationShown', 'true');
            
            setTimeout(() => {
                window.notificationManager.success('Welcome to Afterlife! <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01-.01.05V22h12v-5.94-.01-.05L18 16l-4-4 4-3.99-.01-.01.01-.05V2H6zm10 16.5l-1 .5H9l-1-.5v-1l1-.5h6l1 .5v1zm0-15l-1-.5H9l-1 .5v1l1 .5h6l1-.5v-1z"/></svg>', 3000);
            }, 500);
        }
    }

    // Method to show loading screen manually
    show(text = 'Loading...') {
        if (this.loadingScreen) {
            if (this.loadingText) {
                this.loadingText.textContent = text;
            }
            this.loadingScreen.style.display = 'flex';
            this.loadingScreen.style.opacity = '1';
        }
    }

    // Method to hide loading screen manually
    hide() {
        this.hideLoadingScreen();
    }
}

// Page Transition Manager
class PageTransitionManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupPageTransitions();
    }

    setupPageTransitions() {
        // Add transition effects to navigation links
        const navLinks = document.querySelectorAll('.nav-link[href]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                
                // Only handle internal links
                if (href && !href.startsWith('http') && !href.startsWith('#')) {
                    e.preventDefault();
                    this.transitionToPage(href);
                }
            });
        });
    }

    transitionToPage(url) {
        // Create overlay for transition
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--primary);
            z-index: 10001;
            opacity: 0;
            transition: opacity 0.3s ease-out;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: 'Archivo Black', sans-serif;
            font-size: 2rem;
            text-transform: uppercase;
        `;
        overlay.textContent = 'Loading...';
        
        document.body.appendChild(overlay);
        
        // Trigger animation
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
        
        // Navigate after animation
        setTimeout(() => {
            window.location.href = url;
        }, 300);
    }
}

// Initialize loading manager
document.addEventListener('DOMContentLoaded', function() {
    window.loadingManager = new LoadingManager();
    window.pageTransitionManager = new PageTransitionManager();
    
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LoadingManager,
        PageTransitionManager
    };
}
