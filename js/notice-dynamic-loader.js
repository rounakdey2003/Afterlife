// Dynamic Notice Loader - Loads notices from localStorage for admin management
class DynamicNoticeLoader {
    constructor() {
        this.notices = [];
        this.lastRenderedHash = null; // Track content changes to prevent unnecessary re-renders
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.loadNotices());
        } else {
            this.loadNotices();
        }

        // Listen for storage changes (when admin updates notices)
        window.addEventListener('storage', (e) => {
            if (e.key === 'afterlife_notices' || e.key === 'notices_updated') {
                this.loadNotices();
            }
        });

        // Check for updates periodically - increased interval to reduce layout thrashing
        setInterval(() => {
            this.checkForUpdates();
        }, 30000); // Changed from 5 seconds to 30 seconds to reduce frequent DOM updates
    }

    loadNotices() {
        try {
            const storedNotices = localStorage.getItem('afterlife_notices');
            if (storedNotices) {
                this.notices = JSON.parse(storedNotices);
                this.renderNotices();
                this.updateCounts();
            } else {
                // If no notices in localStorage, generate default ones
                this.generateDefaultNotices();
            }
        } catch (error) {
            
            this.generateDefaultNotices();
        }
    }

    generateDefaultNotices() {
        const defaultNotices = [
            {
                id: Date.now() - 7000,
                title: "Server Maintenance Scheduled",
                type: "urgent",
                content: "We will be performing scheduled maintenance on our servers this weekend. Some services may be temporarily unavailable during this time.",
                priority: "high",
                author: "Admin Team",
                time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                isNew: false
            },
            {
                id: Date.now() - 6000,
                title: "Security Update Required",
                type: "urgent",
                content: "Please update your passwords immediately. We've detected unusual activity and are taking precautionary measures to protect your account.",
                priority: "high",
                author: "Security Team",
                time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                isNew: false
            },
            {
                id: Date.now() - 5000,
                title: "New Features Released",
                type: "important",
                content: "We've released several new features including improved streaming quality, enhanced user profiles, and better notification management.",
                priority: "medium",
                author: "Dev Team",
                time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                isNew: false
            },
            {
                id: Date.now() - 4000,
                title: "Terms of Service Update",
                type: "important",
                content: "We've updated our Terms of Service to better protect your privacy and clarify our data usage policies. Please review the changes.",
                priority: "medium",
                author: "Admin Team",
                time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                isNew: false
            },
            {
                id: Date.now() - 3000,
                title: "Championship Tournament Announcement",
                type: "important",
                content: "The annual Afterlife Championship is coming! Registration opens next week with a prize pool of $10,000. Don't miss this opportunity!",
                priority: "medium",
                author: "Events Team",
                time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                isNew: false
            },
            {
                id: Date.now() - 2000,
                title: "New Tournament Registration Open",
                type: "info",
                content: "Registration for our upcoming MLBB tournament is now open! Join us for exciting matches and amazing prizes.",
                priority: "low",
                author: "Events Team",
                time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                isNew: false
            },
            {
                id: Date.now() - 1000,
                title: "Weekly Community Roundup",
                type: "general",
                content: "Check out this week's highlights from our amazing community members, including top streams, best plays, and upcoming events.",
                priority: "low",
                author: "Community Team",
                time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                isNew: false
            }
        ];

        this.notices = defaultNotices;
        localStorage.setItem('afterlife_notices', JSON.stringify(defaultNotices));
        this.renderNotices();
        this.updateCounts();
    }

    renderNotices() {
        const noticesGrid = document.getElementById('noticesGrid');
        if (!noticesGrid) {
            
            return;
        }

        // Sort notices - featured first, then by date
        const sortedNotices = [...this.notices].sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return new Date(b.time) - new Date(a.time);
        });

        noticesGrid.innerHTML = sortedNotices.map(notice => this.createNoticeHTML(notice)).join('');

        // Trigger filter system update if it exists - only if content actually changed
        if (window.noticeFilter && !this.lastRenderedHash) {
            this.lastRenderedHash = this.generateContentHash(sortedNotices);
            setTimeout(() => {
                window.noticeFilter.loadNotices();
                window.noticeFilter.applyFilters();
            }, 100);
        } else if (window.noticeFilter) {
            const currentHash = this.generateContentHash(sortedNotices);
            if (currentHash !== this.lastRenderedHash) {
                this.lastRenderedHash = currentHash;
                setTimeout(() => {
                    window.noticeFilter.loadNotices();
                    window.noticeFilter.applyFilters();
                }, 100);
            }
        }
    }

    createNoticeHTML(notice) {
        const date = new Date(notice.time);
        const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        const timeAgo = this.getTimeAgo(date);
        const priorityLevel = this.getPriorityLevel(notice.type, notice.priority);

        return `
            <div class="notice-card ${notice.type} ${notice.featured ? 'featured' : ''}" 
                 data-category="${notice.type}" 
                 data-author="${notice.author}" 
                 data-date="${notice.time.split('T')[0]}" 
                 data-priority="${priorityLevel}">
                <div class="notice-card-header">
                    <div class="notice-card-icon">
                        <i class="fas fa-${this.getTypeIcon(notice.type)}"></i>
                    </div>
                    <div class="notice-badge ${notice.type}">
                        <i class="fas fa-${this.getTypeIcon(notice.type)}"></i>
                        ${notice.type.charAt(0).toUpperCase() + notice.type.slice(1)}
                    </div>
                    ${notice.featured ? '<div class="featured-badge"><i class="fas fa-star"></i></div>' : ''}
                </div>
                <div class="notice-card-content">
                    <h3>${notice.title}</h3>
                    <p>${notice.content}</p>
                </div>
                <div class="notice-card-meta">
                    <span class="notice-date">${formattedDate}</span>
                    <span class="notice-author">${notice.author}</span>
                    <span class="notice-time">${timeAgo}</span>
                    ${notice.lastModified ? '<span class="notice-modified">Modified</span>' : ''}
                </div>
            </div>
        `;
    }

    getTypeIcon(type) {
        switch(type) {
            case 'urgent': return 'exclamation-triangle';
            case 'important': return 'star';
            case 'info': return 'info-circle';
            case 'general': return 'comments';
            default: return 'info-circle';
        }
    }

    getPriorityLevel(type, priority) {
        const priorityMap = {
            'urgent': 1,
            'important': 2,
            'info': 3,
            'general': 4
        };
        return priorityMap[type] || 4;
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
        return date.toLocaleDateString();
    }

    updateCounts() {
        // Update the hero section statistics
        const totalElement = document.getElementById('totalNotices');
        const urgentElement = document.getElementById('urgentCount');
        const todayElement = document.getElementById('todayCount');

        if (totalElement) totalElement.textContent = this.notices.length;
        
        if (urgentElement) {
            const urgentCount = this.notices.filter(n => n.type === 'urgent').length;
            urgentElement.textContent = urgentCount;
        }

        if (todayElement) {
            const today = new Date();
            const todayCount = this.notices.filter(n => {
                const noticeDate = new Date(n.time);
                return noticeDate.toDateString() === today.toDateString();
            }).length;
            todayElement.textContent = todayCount;
        }

        // Update filter counts
        this.updateFilterCounts();
    }

    updateFilterCounts() {
        const categories = ['urgent', 'important', 'info', 'general'];
        
        categories.forEach(category => {
            const button = document.querySelector(`[data-filter="${category}"]`);
            if (button) {
                const count = this.notices.filter(notice => notice.type === category).length;
                const countSpan = button.querySelector('.filter-count');
                if (countSpan) {
                    countSpan.textContent = count;
                }
            }
        });

        // Update "All" filter count
        const allButton = document.querySelector('[data-filter="all"]');
        if (allButton) {
            const countSpan = allButton.querySelector('.filter-count');
            if (countSpan) {
                countSpan.textContent = this.notices.length;
            }
        }
    }

    checkForUpdates() {
        const lastUpdate = localStorage.getItem('notices_updated');
        if (lastUpdate && this.lastUpdate !== lastUpdate) {
            this.lastUpdate = lastUpdate;
            this.loadNotices();
        }
    }

    // Generate a hash of current notices content to detect actual changes
    generateContentHash(notices) {
        const contentString = notices.map(notice => 
            `${notice.id}-${notice.title}-${notice.content}-${notice.time}`
        ).join('|');
        
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < contentString.length; i++) {
            const char = contentString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }
}

// Add CSS for featured notices
const style = document.createElement('style');
style.textContent = `
    .notice-card.featured {
        border: 2px solid var(--warning);
        position: relative;
        box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
    }

    .featured-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: var(--warning);
        color: var(--black);
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        border: 2px solid var(--black);
        font-weight: 700;
    }

    .notice-modified {
        color: var(--warning);
        font-weight: 600;
        font-size: 0.75rem;
    }

    .notice-card {
        transition: all 0.3s ease;
    }

    .notice-card:hover {
        transform: translateY(-2px);
    }

    /* Prevent glass elements from being affected by notice updates */
    .header.glass,
    .glass-card,
    .hero-filter-section {
        position: relative;
        z-index: 100;
        will-change: auto; /* Prevent hardware acceleration conflicts */
    }

    /* Ensure stable layout for notices grid */
    .notices-grid {
        contain: layout style; /* CSS containment for better performance */
    }

    .notice-card.animate-fade-in {
        animation: fadeInStable 0.3s ease-out forwards;
    }

    @keyframes fadeInStable {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Initialize the dynamic loader
if (!window.dynamicNoticeLoader) {
    window.dynamicNoticeLoader = new DynamicNoticeLoader();
}
