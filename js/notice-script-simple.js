// Simple notice page functionality
class SimpleNoticeInteractions {
    constructor() {
        this.init();
    }

    init() {
        this.setupNoticeCardInteractions();
        this.setupScrollEffects();
    }

    setupNoticeCardInteractions() {
        // Add click interactions to notice cards
        document.querySelectorAll('.notice-card').forEach(card => {
            // Add hover effects
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-2px)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });

            // Add click handler for notice expansion/details
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on a button or link inside the card
                if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
                    return;
                }

                const title = card.querySelector('h3')?.textContent || 'Notice';
                const category = card.dataset.category || 'general';
                
                this.showNoticeModal(card);
            });
        });
    }

    showNoticeModal(noticeCard) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'notice-modal-overlay';
        modal.innerHTML = `
            <div class="notice-modal">
                <div class="notice-modal-header">
                    <h2>${noticeCard.querySelector('h3').textContent}</h2>
                    <button class="notice-modal-close" aria-label="Close modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="notice-modal-content">
                    <div class="notice-modal-meta">
                        <span class="notice-modal-date">${noticeCard.querySelector('.notice-date').textContent}</span>
                        <span class="notice-modal-author">By ${noticeCard.querySelector('.notice-author').textContent}</span>
                        <span class="notice-modal-category ${noticeCard.dataset.category}">
                            ${noticeCard.querySelector('.notice-badge').textContent}
                        </span>
                    </div>
                    <div class="notice-modal-text">
                        ${noticeCard.querySelector('p').textContent}
                    </div>
                    <div class="notice-modal-actions">
                        <button class="btn secondary" onclick="this.closest('.notice-modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                            Close
                        </button>
                        <button class="btn primary" onclick="navigator.clipboard.writeText(window.location.href + '#notice-' + Date.now())">
                            <i class="fas fa-share"></i>
                            Share
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal styles if not already present
        if (!document.getElementById('notice-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notice-modal-styles';
            styles.textContent = `
                .notice-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(5px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    animation: fadeIn 0.3s ease;
                }

                .notice-modal {
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    animation: slideUp 0.3s ease;
                }

                .notice-modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .notice-modal-header h2 {
                    margin: 0;
                    color: var(--text-primary);
                }

                .notice-modal-close {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: 1.2rem;
                    padding: 0.5rem;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                }

                .notice-modal-close:hover {
                    background: var(--hover-bg);
                    color: var(--text-primary);
                }

                .notice-modal-content {
                    padding: 1.5rem;
                }

                .notice-modal-meta {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                    flex-wrap: wrap;
                }

                .notice-modal-meta span {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }

                .notice-modal-category {
                    padding: 0.25rem 0.5rem;
                    border-radius: 6px;
                    font-weight: 600;
                    text-transform: uppercase;
                    font-size: 0.8rem;
                }

                .notice-modal-category.urgent {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                }

                .notice-modal-category.important {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
                }

                .notice-modal-category.info {
                    background: rgba(59, 130, 246, 0.1);
                    color: #3b82f6;
                }

                .notice-modal-category.general {
                    background: rgba(107, 114, 128, 0.1);
                    color: #6b7280;
                }

                .notice-modal-text {
                    line-height: 1.6;
                    color: var(--text-primary);
                    margin-bottom: 1.5rem;
                }

                .notice-modal-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        // Close modal when clicking overlay
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Close modal when clicking close button
        modal.querySelector('.notice-modal-close').addEventListener('click', () => {
            modal.remove();
        });

        // Close modal with Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        document.body.appendChild(modal);
    }

    setupScrollEffects() {
        // Smooth scroll behavior for notice navigation
        const noticeCards = document.querySelectorAll('.notice-card');
        
        // Add intersection observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        noticeCards.forEach(card => {
            observer.observe(card);
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SimpleNoticeInteractions();
});
