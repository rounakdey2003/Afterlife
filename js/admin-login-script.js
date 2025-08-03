// Enhanced admin-login page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Password visibility toggle
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('passwordInput');
    const eyeOpen = togglePassword.querySelector('.eye-open');
    const eyeClosed = togglePassword.querySelector('.eye-closed');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            if (type === 'text') {
                eyeOpen.style.display = 'none';
                eyeClosed.style.display = 'block';
            } else {
                eyeOpen.style.display = 'block';
                eyeClosed.style.display = 'none';
            }
        });
    }
    // Check if already authenticated
    if (localStorage.getItem('adminAuth') === 'true') {
        window.location.href = 'admin.html';
        return;
    }

    // Form handling
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoading = loginBtn.querySelector('.btn-loading');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const password = passwordInput.value.trim();
            
            if (!password) {
                showError('Please enter a password.');
                return;
            }
            
                        // Show loading state
            setLoading(true);
            
            // Secure authentication via backend API
            authenticateWithServer(password);
        });
    }

    async function authenticateWithServer(password) {
        try {
            // Use Netlify Functions for deployed version, fallback to local API for development
            const apiEndpoint = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? '/api/auth/login' 
                : '/.netlify/functions/auth-login';
                
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store secure session token
                localStorage.setItem('adminAuth', 'true');
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminExpires', data.expiresAt);
                
                showSuccess();
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1500);
            } else {
                showError(data.error || 'Authentication failed. Please try again.');
                passwordInput.value = '';
                passwordInput.focus();
                
                // Add shake animation to form
                const form = document.querySelector('.admin-login-form');
                if (form) {
                    form.style.animation = 'shake 0.5s ease-in-out';
                    setTimeout(() => {
                        form.style.animation = '';
                    }, 500);
                }
            }
        } catch (error) {
            showError('Unable to connect to authentication server. Please try again.');
            passwordInput.value = '';
            passwordInput.focus();
        }
        
        setLoading(false);
    }

    function setLoading(loading) {
        if (loading) {
            loginBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
        } else {
            loginBtn.disabled = false;
            btnText.style.display = 'block';
            btnLoading.style.display = 'none';
        }
    }

    function showError(message) {
        if (errorMessage) {
            errorMessage.querySelector('span').textContent = message;
            errorMessage.style.display = 'flex';
            errorMessage.style.animation = 'slideInDown 0.3s ease-out';
        }
        if (successMessage) {
            successMessage.style.display = 'none';
        }
        
        // Also show notification if available
        if (window.showNotification) {
            window.showNotification(message, 'error', 5000);
        }
        
        setTimeout(() => {
            if (errorMessage) {
                errorMessage.style.display = 'none';
            }
        }, 5000);
    }

    function showSuccess() {
        if (successMessage) {
            successMessage.style.display = 'flex';
            successMessage.style.animation = 'slideInDown 0.3s ease-out';
        }
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    }

    // Focus password input
    if (passwordInput) {
        passwordInput.focus();
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        // Alt + P to focus password field
        if (event.altKey && event.key === 'p') {
            event.preventDefault();
            passwordInput.focus();
        }
        
        // Escape to clear form
        if (event.key === 'Escape') {
            passwordInput.value = '';
            errorMessage.style.display = 'none';
            successMessage.style.display = 'none';
        }
    });

    // Security monitoring (basic)
    let attemptCount = parseInt(localStorage.getItem('loginAttempts') || '0');
    
    function incrementAttempts() {
        attemptCount++;
        localStorage.setItem('loginAttempts', attemptCount.toString());
        
        if (attemptCount >= 5 && window.notificationManager) {
            window.notificationManager.warning('Multiple failed attempts detected. Please ensure you have the correct credentials.');
        }
    }

    // Track failed attempts
    const originalShowError = showError;
    showError = function(message) {
        if (message.includes('Invalid password')) {
            incrementAttempts();
        }
        originalShowError(message);
    };

    // Add CSS animation for shake effect
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
});
