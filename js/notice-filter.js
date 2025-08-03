class NoticeFilter {
    constructor() {
        this.notices = [];
        this.filteredNotices = [];
        this.currentFilters = {
            category: 'all',
            search: '',
            author: '',
            dateRange: '',
            sortBy: 'date-desc'
        };
        this.viewMode = 'grid';
        this.initialized = false;
        this.init();
    }

    init() {
        // Wait for DOM to be fully ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.delayedInit());
        } else {
            this.delayedInit();
        }
    }

    delayedInit() {
        // Add a small delay to ensure all other scripts are loaded
        setTimeout(() => {
            try {
                // Prevent double initialization
                if (this.initialized) {
                    return;
                }
                
                this.loadNotices();
                this.setupEventListeners();
                this.updateResultsCount();
                this.updateFilterCounts();
                this.initialized = true;
            } catch (error) {
                
            }
        }, 300);
    }

    loadNotices() {
        // Get all notice cards from the DOM - ensure we only target actual notice cards
        const noticeCards = document.querySelectorAll('.notice-card:not(.skeleton):not(.notice-skeleton)');
        
        this.notices = Array.from(noticeCards).map((card, index) => {
            const titleElement = card.querySelector('h3');
            const contentElement = card.querySelector('p');
            const dateElement = card.querySelector('.notice-date');
            const authorElement = card.querySelector('.notice-author');
            
            return {
                element: card,
                category: card.dataset.category || 'general',
                author: card.dataset.author || (authorElement ? authorElement.textContent : ''),
                date: new Date(card.dataset.date || Date.now()),
                priority: parseInt(card.dataset.priority || '4'),
                title: titleElement ? titleElement.textContent.toLowerCase() : '',
                content: contentElement ? contentElement.textContent.toLowerCase() : '',
                dateString: card.dataset.date || '',
                index: index
            };
        });
        
        this.filteredNotices = [...this.notices];
    }

    setupEventListeners() {
        
        // Category filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Update active state
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Apply filter
                this.currentFilters.category = btn.dataset.filter;
                this.applyFilters();
            });
        });

        // Search input
        const searchInput = document.getElementById('noticeSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value.toLowerCase().trim();
                this.applyFilters();
            });
        } else {
            
        }

        // Sort dropdown
        const sortSelect = document.getElementById('noticeSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentFilters.sortBy = e.target.value;
                this.applyFilters();
            });
        } else {
            
        }

        // Author filter
        const authorSelect = document.getElementById('authorFilter');
        if (authorSelect) {
            authorSelect.addEventListener('change', (e) => {
                this.currentFilters.author = e.target.value;
                this.applyFilters();
            });
        }

        // Date range filter
        const dateSelect = document.getElementById('dateFilter');
        if (dateSelect) {
            dateSelect.addEventListener('change', (e) => {
                this.currentFilters.dateRange = e.target.value;
                this.applyFilters();
            });
        }

        // Advanced filters toggle
        const advancedToggle = document.getElementById('toggleAdvanced');
        const advancedFilters = document.getElementById('advancedFilters');
        if (advancedToggle && advancedFilters) {
            advancedToggle.addEventListener('click', (e) => {
                e.preventDefault();
                const isVisible = advancedFilters.style.display !== 'none';
                advancedFilters.style.display = isVisible ? 'none' : 'block';
                advancedToggle.innerHTML = isVisible 
                    ? '<i class="fas fa-sliders-h"></i> More'
                    : '<i class="fas fa-times"></i> Less';
            });
        }

        // Clear filters button
        const clearButton = document.getElementById('clearFilters');
        if (clearButton) {
            clearButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearAllFilters();
            });
        }

        // View toggle buttons
        this.setupViewToggle();
        
    }

    setupViewToggle() {
        const gridViewBtn = document.getElementById('gridView');
        const listViewBtn = document.getElementById('listView');
        const noticesGrid = document.getElementById('noticesGrid');

        if (gridViewBtn && listViewBtn && noticesGrid) {
            
            gridViewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.viewMode = 'grid';
                gridViewBtn.classList.add('active');
                listViewBtn.classList.remove('active');
                noticesGrid.classList.remove('list-view');
                noticesGrid.classList.add('grid-view');
            });

            listViewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.viewMode = 'list';
                listViewBtn.classList.add('active');
                gridViewBtn.classList.remove('active');
                noticesGrid.classList.remove('grid-view');
                noticesGrid.classList.add('list-view');
            });
        } else {
            
        }
    }

    applyFilters() {
        try {
            
            // Start with all notices
            let filtered = [...this.notices];

            // Apply category filter
            if (this.currentFilters.category !== 'all') {
                filtered = filtered.filter(notice => 
                    notice.category === this.currentFilters.category
                );
            }

            // Apply search filter
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                filtered = filtered.filter(notice => 
                    notice.title.includes(searchTerm) || 
                    notice.content.includes(searchTerm) ||
                    notice.author.toLowerCase().includes(searchTerm)
                );
            }

            // Apply author filter
            if (this.currentFilters.author) {
                filtered = filtered.filter(notice => 
                    notice.author === this.currentFilters.author
                );
            }

            // Apply date range filter
            if (this.currentFilters.dateRange) {
                const now = new Date();
                filtered = filtered.filter(notice => {
                    switch (this.currentFilters.dateRange) {
                        case 'today':
                            return this.isSameDay(notice.date, now);
                        case 'week':
                            return this.isWithinDays(notice.date, now, 7);
                        case 'month':
                            return this.isWithinDays(notice.date, now, 30);
                        case 'quarter':
                            return this.isWithinDays(notice.date, now, 90);
                        default:
                            return true;
                    }
                });
            }

            // Apply sorting
            filtered = this.sortNotices(filtered);

            this.filteredNotices = filtered;
            this.displayNotices();
            this.updateResultsCount();
            this.updateFilterCounts();
        } catch (error) {
            
        }
    }

    sortNotices(notices) {
        return notices.sort((a, b) => {
            switch (this.currentFilters.sortBy) {
                case 'date-desc':
                    return b.date - a.date;
                case 'date-asc':
                    return a.date - b.date;
                case 'priority':
                    return a.priority - b.priority;
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'author':
                    return a.author.localeCompare(b.author);
                default:
                    return b.date - a.date;
            }
        });
    }

    displayNotices() {
        const noticesGrid = document.getElementById('noticesGrid');
        const noResults = document.getElementById('noResults');

        if (!noticesGrid) {
            
            return;
        }

        // Store current scroll position to prevent jumping
        const scrollPosition = window.pageYOffset;

        // Hide all notices first - but avoid affecting header/glass elements
        this.notices.forEach(notice => {
            if (notice.element && notice.element.classList.contains('notice-card')) {
                notice.element.style.display = 'none';
                notice.element.style.opacity = '0';
                notice.element.style.transform = 'translateY(10px)';
            }
        });

        if (this.filteredNotices.length === 0) {
            // Show no results message
            if (noResults) {
                noResults.style.display = 'block';
            }
        } else {
            // Hide no results message
            if (noResults) {
                noResults.style.display = 'none';
            }

            // Show filtered notices with animation - reduced animation for stability
            this.filteredNotices.forEach((notice, index) => {
                if (notice.element && notice.element.classList.contains('notice-card')) {
                    notice.element.style.display = 'flex';
                    // Use requestAnimationFrame for smoother animations
                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            notice.element.style.opacity = '1';
                            notice.element.style.transform = 'translateY(0)';
                            notice.element.style.transition = 'all 0.3s ease-out';
                            notice.element.classList.add('animate-fade-in');
                        }, index * 25); // Reduced delay for faster rendering
                    });
                }
            });
        }

        // Restore scroll position to prevent layout jump
        setTimeout(() => {
            window.scrollTo(0, scrollPosition);
        }, 50);
    }

    updateResultsCount() {
        const resultsCount = document.getElementById('resultsCount');
        const totalNotices = document.getElementById('totalNotices');
        
        if (resultsCount) {
            const showing = this.filteredNotices.length;
            const total = this.notices.length;
            resultsCount.textContent = `Showing ${showing} of ${total} notices`;
        }

        if (totalNotices) {
            totalNotices.textContent = this.notices.length;
        }
    }

    updateFilterCounts() {
        // Update category filter counts
        const categories = ['urgent', 'important', 'info', 'general'];
        
        categories.forEach(category => {
            const button = document.querySelector(`[data-filter="${category}"]`);
            if (button) {
                const count = this.notices.filter(notice => notice.category === category).length;
                const countSpan = button.querySelector('.filter-count');
                if (countSpan) {
                    countSpan.textContent = count;
                }
            }
        });

        // Update urgent and today counts in hero section
        const urgentCount = document.getElementById('urgentCount');
        const todayCount = document.getElementById('todayCount');
        
        if (urgentCount) {
            const urgent = this.notices.filter(notice => notice.category === 'urgent').length;
            urgentCount.textContent = urgent;
        }

        if (todayCount) {
            const today = this.notices.filter(notice => 
                this.isSameDay(notice.date, new Date())
            ).length;
            todayCount.textContent = today;
        }
    }

    clearAllFilters() {
        // Reset all filters
        this.currentFilters = {
            category: 'all',
            search: '',
            author: '',
            dateRange: '',
            sortBy: 'date-desc'
        };

        // Reset UI elements
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === 'all') {
                btn.classList.add('active');
            }
        });

        const searchInput = document.getElementById('noticeSearch');
        if (searchInput) searchInput.value = '';

        const sortSelect = document.getElementById('noticeSort');
        if (sortSelect) sortSelect.value = 'date-desc';

        const authorSelect = document.getElementById('authorFilter');
        if (authorSelect) authorSelect.value = '';

        const dateSelect = document.getElementById('dateFilter');
        if (dateSelect) dateSelect.value = '';

        // Hide advanced filters
        const advancedFilters = document.getElementById('advancedFilters');
        const advancedToggle = document.getElementById('toggleAdvanced');
        if (advancedFilters && advancedToggle) {
            advancedFilters.style.display = 'none';
            advancedToggle.innerHTML = '<i class="fas fa-sliders-h"></i> More';
        }

        // Apply filters (show all)
        this.applyFilters();
    }

    // Utility functions
    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    isWithinDays(date, referenceDate, days) {
        const timeDiff = referenceDate.getTime() - date.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return daysDiff <= days && daysDiff >= 0;
    }

    // Public method to add new notices dynamically
    addNotice(noticeElement) {
        const notice = {
            element: noticeElement,
            category: noticeElement.dataset.category || 'general',
            author: noticeElement.dataset.author || '',
            date: new Date(noticeElement.dataset.date || Date.now()),
            priority: parseInt(noticeElement.dataset.priority || '4'),
            title: noticeElement.querySelector('h3')?.textContent.toLowerCase() || '',
            content: noticeElement.querySelector('p')?.textContent.toLowerCase() || '',
            dateString: noticeElement.dataset.date || ''
        };
        
        this.notices.push(notice);
        this.applyFilters();
    }

    // Public method to remove notices
    removeNotice(noticeElement) {
        this.notices = this.notices.filter(notice => notice.element !== noticeElement);
        this.applyFilters();
    }
}

// Global function for clearing filters (used in HTML)
function clearAllFilters() {
    if (window.noticeFilter) {
        window.noticeFilter.clearAllFilters();
    }
}

// Initialize the filter system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other scripts to load and prevent multiple instances
    setTimeout(() => {
        if (!window.noticeFilter) {
            window.noticeFilter = new NoticeFilter();
        }
    }, 100);
});
