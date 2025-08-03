class SimplifiedAnimations {
    constructor() {
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.init();
        this.setupEventListeners();
    }

    init() {
        this.setupBasicInteractions();
        this.setupPerformanceOptimization();
        this.initializeElements();
    }

    initializeElements() {
        // Show all elements immediately without animation
        document.querySelectorAll('.trending-item, .insight-card, .performance-card, .stat-card').forEach((item) => {
            item.style.opacity = '1';
            item.style.transform = 'none';
        });
    }

    setupBasicInteractions() {
        // Basic scroll visibility without complex animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    // Simple counter animation for stats only
                    if (entry.target.classList.contains('stat-card')) {
                        this.animateCounter(entry.target.querySelector('.stat-number'));
                    }
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.trending-item, .insight-card, .stat-card, .performance-card').forEach(el => {
            observer.observe(el);
        });
    }

    animateCounter(element) {
        if (!element) return;
        
        const target = parseInt(element.textContent.replace(/[^\d]/g, ''));
        const duration = 1000;
        const startTime = Date.now();
        
        const updateCounter = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(progress * target);
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };
        
        updateCounter();
    }

    setupEventListeners() {
        // Mobile menu is handled by MobileMenuManager in theme-toggle.js
        // No need for duplicate setup here

        // Header scroll effect
        this.setupHeaderScrollEffects();
        
        // Loading screen
        this.setupLoadingScreen();
        
        // Basic card hover effects
        this.setupCardHoverEffects();
    }

    setupHeaderScrollEffects() {
        const header = document.querySelector('.header');
        if (!header) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    setupLoadingScreen() {
        window.addEventListener('load', () => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                setTimeout(() => {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                    }, 300);
                }, 1000);
            }
        });
    }

    setupCardHoverEffects() {
        document.querySelectorAll('.trending-item, .insight-card, .performance-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                if (!this.prefersReducedMotion) {
                    card.style.transform = 'translate(-2px, -2px)';
                }
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'none';
            });
        });

        // Add glitch hover effect to hero title
        const heroTitle = document.getElementById('heroTitle');
        if (heroTitle) {
            heroTitle.classList.add('brutal-title-glitch-home');
        }
    }

    setupPerformanceOptimization() {
        // Reserved for future performance optimizations
    }

}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SimplifiedAnimations();
});

// YouTube API Integration (simplified)
class YouTubeIntegration {
    constructor() {
        this.apiKey = ''; // Removed for security - handled by backend
        this.channelId = ''; // Removed for security - handled by backend
        this.loadConfig();
    }

    async loadConfig() {
        try {
            // Load secure configuration if available
            if (window.YOUTUBE_CONFIG) {
                this.baseUrl = window.YOUTUBE_CONFIG.BASE_URL || '/api/youtube';
                // API key and channel ID are now handled securely by backend
            } else {
                this.baseUrl = '/api/youtube'; // Default to secure proxy
            }
        } catch (error) {
            this.baseUrl = '/api/youtube';
        }
    }

    async fetchLatestVideos(maxResults = 6) {
        try {
            const url = `${this.baseUrl}/videos?maxResults=${maxResults}&order=date`;
            
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(url, { 
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorData = await response.json();
                
                // Handle quota exceeded error
                if (errorData.error?.errors?.[0]?.reason === 'quotaExceeded') {
                    this.showQuotaExceededMessage();
                    // Return empty to show skeleton, then fallback
                    return [];
                }
                
                // Handle other API errors
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }
            
            const data = await response.json();
            return data.items || [];
            
        } catch (error) {
            
            // Handle different types of errors
            if (error.name === 'AbortError') {
                // API request timed out
            } else if (error.message.includes('Failed to fetch')) {
                this.showNetworkErrorMessage();
            }
            
            // Return empty array to trigger skeleton display
            return [];
        }
    }

    getFallbackVideoData() {
        // Fallback video data for when API is unavailable
        return [
            {
                id: { videoId: 'fallback1' },
                snippet: {
                    title: 'Latest Mobile Legends Stream',
                    description: 'Join us for exciting Mobile Legends gameplay and community interaction.',
                    publishedAt: new Date().toISOString(),
                    thumbnails: {
                        medium: { url: 'assets/diamond.png' },
                        high: { url: 'assets/diamond.png' }
                    }
                }
            },
            {
                id: { videoId: 'fallback2' },
                snippet: {
                    title: 'Community Tournament Highlights',
                    description: 'Best moments from our recent community tournament.',
                    publishedAt: new Date(Date.now() - 86400000).toISOString(),
                    thumbnails: {
                        medium: { url: 'assets/weekly.png' },
                        high: { url: 'assets/weekly.png' }
                    }
                }
            },
            {
                id: { videoId: 'fallback3' },
                snippet: {
                    title: 'Tips and Strategies',
                    description: 'Learn advanced strategies and tips to improve your gameplay.',
                    publishedAt: new Date(Date.now() - 172800000).toISOString(),
                    thumbnails: {
                        medium: { url: 'assets/starlight.png' },
                        high: { url: 'assets/starlight.png' }
                    }
                }
            }
        ];
    }

    showQuotaExceededMessage() {
        this.showAPIErrorOverlay('API quota exceeded');
    }

    showNetworkErrorMessage() {
        this.showAPIErrorOverlay('Network connection failed');
    }

    showAPIErrorOverlay(errorType = 'Unable to connect to YouTube servers') {
        const errorSection = document.getElementById('youtubeErrorSection');
        
        if (errorSection) {
            // Update error message
            const errorMessage = document.getElementById('errorMessage');
            if (errorMessage) {
                errorMessage.textContent = 'Unable to connect to YouTube servers. All video functionality has been temporarily disabled except navigation. Displaying cached content instead.';
            }

            // Update error title
            const errorTitle = errorSection.querySelector('h3');
            if (errorTitle) {
                errorTitle.textContent = 'UNABLE TO LOAD VIDEOS';
            }

            // Show error section inline without overlay
            errorSection.style.display = 'block';

            // Setup error handlers if not already set
            this.setupErrorHandlers();

            // Show fallback content after a delay
            setTimeout(() => {
                if (window.skeletonManager) {
                    window.skeletonManager.autoHideSkeleton('heroContent', 3000, this.getFallbackContentHTML());
                    window.skeletonManager.autoHideSkeleton('trendingVideos', 3000);
                }
                this.displayVideos(this.getFallbackVideoData(), 'trendingVideos');
            }, 2000);
        }
    }

    setupErrorHandlers() {
        const retryBtn = document.getElementById('retryBtn');
        const visitChannelBtn = document.getElementById('visitChannelBtn');
        
        // Update button texts to match the requested format
        if (retryBtn && !retryBtn.textContent.includes('TRY AGAIN')) {
            retryBtn.innerHTML = `
                <i class="fas fa-refresh"></i>
                TRY AGAIN
            `;
        }
        
        if (visitChannelBtn && !visitChannelBtn.textContent.includes('VISIT YOUTUBE CHANNEL')) {
            visitChannelBtn.innerHTML = `
                <i class="fas fa-external-link-alt"></i>
                VISIT YOUTUBE CHANNEL
            `;
        }
        
        if (retryBtn && !retryBtn.hasAttribute('data-handler-set')) {
            retryBtn.setAttribute('data-handler-set', 'true');
            retryBtn.addEventListener('click', () => {
                retryBtn.innerHTML = `
                    <i class="fas fa-refresh"></i>
                    Retrying...
                `;
                retryBtn.disabled = true;

                setTimeout(() => {
                    location.reload();
                }, 1000);
            });
        }
        
        if (visitChannelBtn && !visitChannelBtn.hasAttribute('data-handler-set')) {
            visitChannelBtn.setAttribute('data-handler-set', 'true');
            visitChannelBtn.addEventListener('click', () => {
                visitChannelBtn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    visitChannelBtn.style.transform = '';
                }, 100);
                
                window.open('https://www.youtube.com/@Afterlife_AL/streams', '_blank');
            });
        }
    }

    getFallbackContentHTML() {
        return `
            <div style="text-align: center; padding: 3rem; background: var(--card-bg); border: 2px solid var(--border-color); border-radius: 12px; margin: 2rem 0;">
                <div style="font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.6; color: var(--accent-color);">
                    <i class="fas fa-video"></i>
                </div>
                <h2 style="margin-bottom: 1rem; color: var(--text-primary);">Viewing Cached Content</h2>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">You are currently viewing cached content. Some videos may not be up to date.</p>
                <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
                    <a href="https://www.youtube.com/@Afterlife_AL/streams" target="_blank" class="btn primary" style="text-decoration: none;">
                        <i class="fab fa-youtube" style="margin-right: 0.5rem;"></i>
                        Visit YouTube Channel
                    </a>
                </div>
            </div>
        `;
    }

    displayVideos(videos, containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;

        // Check if we have videos
        if (!videos || videos.length === 0) {
            var errorHTML = `
                <div style="text-align: center; padding: 3rem; background: var(--card-bg); border: 2px solid var(--danger); border-radius: 12px; grid-column: 1 / -1;">
                    <div style="font-size: 3rem; margin-bottom: 1rem; color: var(--danger);">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3 style="margin-bottom: 1rem; color: var(--text-primary);">UNABLE TO LOAD VIDEOS</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Unable to connect to YouTube servers. All video functionality has been temporarily disabled except navigation.</p>
                    <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
                        <button onclick="location.reload()" class="cta-button cta-primary">
                            <i class="fas fa-refresh"></i>
                            TRY AGAIN
                        </button>
                        <a href="https://www.youtube.com/@Afterlife_AL/streams" target="_blank" class="cta-button cta-secondary" style="text-decoration: none;">
                            <i class="fas fa-external-link-alt"></i>
                            VISIT YOUTUBE CHANNEL
                        </a>
                    </div>
                </div>
            `;
            
            // Hide skeleton and show error content
            if (window.skeletonManager && window.skeletonManager.isSkeletonActive(containerId)) {
                window.skeletonManager.hideSkeleton(container, errorHTML);
            } else {
                container.innerHTML = errorHTML;
            }
            return;
        }

        // Check if videos are fallback data
        var isFallbackData = videos[0].id.videoId.startsWith('fallback');
        
        // Generate content HTML
        var contentHTML = videos.slice(0, 3).map(function(video) {
            return `
            <div class="trending-item glass smooth-transition hover-lift">
                <div class="trending-image">
                    <img src="${video.snippet.thumbnails.medium.url}" alt="${video.snippet.title}" loading="lazy">
                </div>
                <div class="trending-content">
                    <span class="trending-category">${isFallbackData ? 'SAMPLE' : 'LATEST'}</span>
                    <h3>${video.snippet.title.length > 50 ? video.snippet.title.substring(0, 50) + '...' : video.snippet.title}</h3>
                    <div class="video-stats">
                        <span class="views">${isFallbackData ? 'Sample Content' : 'New Video'}</span>
                        <span class="duration">${isFallbackData ? 'Demo' : 'YouTube'}</span>
                    </div>
                    ${!isFallbackData ? `
                        <a href="https://youtube.com/watch?v=${video.id.videoId}" target="_blank" class="watch-btn">
                            <i class="fas fa-play"></i>
                            Watch
                        </a>
                    ` : `
                        <div class="watch-btn" style="opacity: 0.6; cursor: not-allowed;">
                            <i class="fas fa-play"></i>
                            Sample
                        </div>
                    `}
                </div>
            </div>
            `;
        }).join('');

        // Hide skeleton and show content
        if (window.skeletonManager && window.skeletonManager.isSkeletonActive(containerId)) {
            window.skeletonManager.hideSkeleton(container, contentHTML);
        } else {
            // Direct update if skeleton not active
            container.innerHTML = contentHTML;
        }
    }

    updateHeroSection(video) {
        if (!video) {
            // Keep skeleton active and auto-hide with fallback content
            if (window.skeletonManager) {
                window.skeletonManager.autoHideSkeleton('heroContent', 8000, `
                    <h1 class="hero-title">Welcome to Afterlife</h1>
                    <p class="hero-subtitle">Your premier gaming community hub</p>
                    <div class="featured-article glass card-stack smooth-transition">
                        <div class="article-image">
                            <img src="assets/diamond.png" alt="Afterlife Gaming Community" loading="lazy">
                        </div>
                        <div class="article-content">
                            <span class="article-category">COMMUNITY</span>
                            <h2 class="article-title">Join Our Gaming Community</h2>
                            <p class="article-excerpt">Connect with fellow gamers, participate in tournaments, and stay updated with the latest gaming content and events.</p>
                            <div class="article-meta">
                                <span class="author">By Afterlife Team</span>
                                <span class="date">${new Date().toLocaleDateString()}</span>
                                <span class="read-time">Always Active</span>
                            </div>
                        </div>
                    </div>
                `);
            }
            return;
        }

        // Check if this is fallback data
        const isFallbackData = video.id.videoId.startsWith('fallback');
        
        // Generate hero content HTML
        const heroContentHTML = `
            <h1 class="hero-title">${isFallbackData ? 'Sample Content: ' : 'Latest Video: '}${video.snippet.title}</h1>
            <p class="hero-subtitle">${isFallbackData ? 'This is sample content for demonstration' : 'Check out our newest content!'}</p>
            <div class="featured-article glass card-stack smooth-transition">
                <div class="article-image">
                    <img src="${video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium.url}" alt="${video.snippet.title}" loading="lazy">
                </div>
                <div class="article-content">
                    <span class="article-category">${isFallbackData ? 'SAMPLE' : 'LATEST'}</span>
                    <h2 class="article-title">${video.snippet.title}</h2>
                    <p class="article-excerpt">${video.snippet.description.substring(0, 150)}...</p>
                    <div class="article-meta">
                        <span class="author">By Afterlife</span>
                        <span class="date">${new Date(video.snippet.publishedAt).toLocaleDateString()}</span>
                        <span class="read-time">${isFallbackData ? 'Sample Content' : 'Watch Now'}</span>
                    </div>
                    ${!isFallbackData ? `
                        <a href="https://youtube.com/watch?v=${video.id.videoId}" target="_blank" class="btn primary" style="margin-top: 1rem; text-decoration: none;">
                            <i class="fas fa-play" style="margin-right: 0.5rem;"></i>
                            Watch Video
                        </a>
                    ` : `
                        <div class="btn secondary" style="margin-top: 1rem; opacity: 0.6; cursor: not-allowed;">
                            <i class="fas fa-eye" style="margin-right: 0.5rem;"></i>
                            Sample Content
                        </div>
                    `}
                </div>
            </div>
        `;

        // Hide skeleton and show content
        if (window.skeletonManager && window.skeletonManager.isSkeletonActive('heroContent')) {
            window.skeletonManager.hideSkeleton('heroContent', heroContentHTML);
        } else {
            // Direct update if skeleton not active
            const heroContainer = document.getElementById('heroContent');
            if (heroContainer) {
                heroContainer.innerHTML = heroContentHTML;
            }
        }
    }

    async fetchVideoStatistics(videoIds) {
        if (!this.apiKey || !videoIds.length) {
            return [];
        }

        try {
            const url = `https://www.googleapis.com/youtube/v3/videos?key=${this.apiKey}&id=${videoIds.join(',')}&part=statistics,snippet`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }
            
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            return [];
        }
    }

    async fetchChannelStatistics() {
        if (!this.apiKey || !this.channelId) {
            return null;
        }

        try {
            const url = `https://www.googleapis.com/youtube/v3/channels?key=${this.apiKey}&id=${this.channelId}&part=statistics,snippet`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }
            
            const data = await response.json();
            return data.items?.[0] || null;
        } catch (error) {
            return null;
        }
    }

    async updateChannelPerformance() {
        try {
            // Get latest videos first
            const videos = await this.fetchLatestVideos(10);
            if (!videos.length) {
                this.showPerformanceError();
                return;
            }

            // Check if videos are fallback data
            const isFallbackData = videos[0].id.videoId.startsWith('fallback');
            
            if (isFallbackData) {
                this.showFallbackPerformanceData();
                return;
            }

            // Get video IDs for statistics
            const videoIds = videos.map(video => video.id.videoId);
            const videoStats = await this.fetchVideoStatistics(videoIds);
            
            // Get channel statistics
            const channelStats = await this.fetchChannelStatistics();

            // Find most popular video
            let mostPopularVideo = null;
            let maxViews = 0;

            videoStats.forEach(video => {
                const views = parseInt(video.statistics.viewCount || 0);
                if (views > maxViews) {
                    maxViews = views;
                    mostPopularVideo = video;
                }
            });

            // Update most popular video
            if (mostPopularVideo) {
                const mostPopularTitle = document.getElementById('mostPopularTitle');
                const mostPopularViews = document.getElementById('mostPopularViews');
                
                if (mostPopularTitle) {
                    mostPopularTitle.textContent = mostPopularVideo.snippet.title.length > 40 
                        ? mostPopularVideo.snippet.title.substring(0, 40) + '...' 
                        : mostPopularVideo.snippet.title;
                }
                if (mostPopularViews) {
                    mostPopularViews.textContent = `${parseInt(mostPopularVideo.statistics.viewCount).toLocaleString()} views`;
                }
            }

            // Update channel growth info
            const channelGrowthText = document.getElementById('channelGrowthText');
            const recentUploads = document.getElementById('recentUploads');
            
            if (channelGrowthText && channelStats) {
                const totalVideos = channelStats.statistics.videoCount;
                channelGrowthText.textContent = `${parseInt(totalVideos).toLocaleString()} videos published`;
            }
            
            if (recentUploads) {
                // Count videos from last 30 days
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                
                const recentVideoCount = videos.filter(video => 
                    new Date(video.snippet.publishedAt) > thirtyDaysAgo
                ).length;
                
                recentUploads.textContent = `${recentVideoCount} uploads this month`;
            }

            // Update community engagement
            const engagementText = document.getElementById('engagementText');
            const avgViews = document.getElementById('avgViews');
            
            if (videoStats.length > 0) {
                // Calculate average views
                const totalViews = videoStats.reduce((sum, video) => 
                    sum + parseInt(video.statistics.viewCount || 0), 0);
                const averageViews = Math.round(totalViews / videoStats.length);
                
                // Calculate total engagement (likes + comments)
                const totalEngagement = videoStats.reduce((sum, video) => 
                    sum + parseInt(video.statistics.likeCount || 0) + parseInt(video.statistics.commentCount || 0), 0);
                const avgEngagement = Math.round(totalEngagement / videoStats.length);
                
                if (engagementText) {
                    engagementText.textContent = `${avgEngagement} avg. likes & comments per video`;
                }
                
                if (avgViews) {
                    avgViews.textContent = `${averageViews.toLocaleString()} average views`;
                }
            }

        } catch (error) {
            this.showPerformanceError();
        }
    }

    showFallbackPerformanceData() {
        const mostPopularTitle = document.getElementById('mostPopularTitle');
        const mostPopularViews = document.getElementById('mostPopularViews');
        const channelGrowthText = document.getElementById('channelGrowthText');
        const recentUploads = document.getElementById('recentUploads');
        const engagementText = document.getElementById('engagementText');
        const avgViews = document.getElementById('avgViews');

        if (mostPopularTitle) mostPopularTitle.textContent = 'Mobile Legends Tournament';
        if (mostPopularViews) mostPopularViews.textContent = '2,500+ views';
        if (channelGrowthText) channelGrowthText.textContent = '50+ videos published';
        if (recentUploads) recentUploads.textContent = '8 uploads this month';
        if (engagementText) engagementText.textContent = '25 avg. likes & comments per video';
        if (avgViews) avgViews.textContent = '850 average views';
    }

    showPerformanceError() {
        // Show skeleton for performance section when API fails
        if (window.skeletonManager) {
            const performanceGrid = document.querySelector('.performance-grid');
            if (performanceGrid) {
                window.skeletonManager.showPerformanceSkeleton('performanceCards', 3);
                window.skeletonManager.autoHideSkeleton('performanceCards', 8000, this.getFallbackPerformanceHTML());
                return;
            }
        }

        // Fallback to text updates if skeleton manager not available
        const mostPopularTitle = document.getElementById('mostPopularTitle');
        const mostPopularViews = document.getElementById('mostPopularViews');
        const channelGrowthText = document.getElementById('channelGrowthText');
        const recentUploads = document.getElementById('recentUploads');
        const engagementText = document.getElementById('engagementText');
        const avgViews = document.getElementById('avgViews');

        if (mostPopularTitle) mostPopularTitle.textContent = 'Content trending well';
        if (mostPopularViews) mostPopularViews.textContent = 'Great engagement';
        if (channelGrowthText) channelGrowthText.textContent = 'Growing with fresh content';
        if (recentUploads) recentUploads.textContent = 'Regular uploads';
        if (engagementText) engagementText.textContent = 'Active community';
        if (avgViews) avgViews.textContent = 'Strong viewership';
    }

    getFallbackPerformanceHTML() {
        return `
            <div class="performance-grid gpu-accelerated">
                <div class="performance-card glass card-stack smooth-transition hover-lift">
                    <div class="performance-icon animate-float">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 4V12L24 8L16 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M3 12H13V20H3V12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="performance-content">
                        <h3>Most Popular Video</h3>
                        <p>Content trending well</p>
                        <span class="performance-stat">Great engagement</span>
                    </div>
                </div>
                <div class="performance-card glass card-stack smooth-transition hover-lift">
                    <div class="performance-icon animate-float" style="animation-delay: 0.5s;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="performance-content">
                        <h3>Channel Growth</h3>
                        <p>Growing with fresh content</p>
                        <span class="performance-stat">Regular uploads</span>
                    </div>
                </div>
                <div class="performance-card glass card-stack smooth-transition hover-lift">
                    <div class="performance-icon animate-float" style="animation-delay: 1s;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="performance-content">
                        <h3>Community Engagement</h3>
                        <p>Active community</p>
                        <span class="performance-stat">Strong viewership</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize YouTube integration
document.addEventListener('DOMContentLoaded', async () => {
    const youtube = new YouTubeIntegration();
    
    // Show initial skeletons immediately while loading
    if (window.skeletonManager) {
        // Show skeleton for hero section
        window.skeletonManager.showHeroSkeleton('heroContent');
        
        // Show skeleton for trending videos
        window.skeletonManager.showTrendingSkeleton('trendingVideos', 3);
        
        // Show skeleton for performance cards
        window.skeletonManager.showPerformanceSkeleton('performanceCards', 3);
    }
    
    // Wait for config to load
    await youtube.loadConfig();
    
    // Check if API is configured
    const isApiConfigured = youtube.apiKey && youtube.channelId;
    
    if (!isApiConfigured) {
        // Show error section immediately since API is not configured
        youtube.showAPIErrorOverlay('API not configured');
        
        // Auto-hide skeletons after timeout when API is not configured
        if (window.skeletonManager) {
            // Hero section fallback
            setTimeout(() => {
                if (window.skeletonManager.isSkeletonActive('heroContent')) {
                    const noApiHeroHTML = `
                        <div class="hero-content">
                            <h1 class="hero-title">Welcome to Afterlife</h1>
                            <p class="hero-subtitle">Your ultimate gaming community and streaming platform where legends are born and champions rise</p>
                            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 2rem;">
                                <a href="stream.html" class="cta-button cta-primary">
                                    <i class="fas fa-play"></i>
                                    Start Streaming
                                </a>
                                <a href="tools.html" class="cta-button cta-secondary">
                                    <i class="fas fa-tools"></i>
                                    Youtube Tools
                                </a>
                                <a href="store.html" class="cta-button cta-accent">
                                    <i class="fas fa-store"></i>
                                    Visit Store
                                </a>
                            </div>
                        </div>
                    `;
                    window.skeletonManager.hideSkeleton(document.getElementById('heroContent'), noApiHeroHTML);
                }
            }, 2000);
            
            // Trending videos fallback
            setTimeout(() => {
                if (window.skeletonManager.isSkeletonActive('trendingVideos')) {
                    youtube.displayVideos(youtube.getFallbackVideoData(), 'trendingVideos');
                }
            }, 2500);
            
            // Performance cards fallback  
            setTimeout(() => {
                if (window.skeletonManager.isSkeletonActive('performanceCards')) {
                    const noApiPerformanceHTML = youtube.getFallbackPerformanceHTML();
                    window.skeletonManager.hideSkeleton(document.getElementById('performanceCards'), noApiPerformanceHTML);
                }
            }, 3000);
        }
        return;
    }
    
    // API is configured, try to load data
    try {
        const videos = await youtube.fetchLatestVideos();
        
        if (videos.length > 0) {
            
            // Update hero section with latest video
            youtube.updateHeroSection(videos[0]);
            
            // Display trending videos
            youtube.displayVideos(videos, 'trendingVideos');
            
            // Update channel performance section
            await youtube.updateChannelPerformance();
        } else {
            
            // Show error section for no videos
            youtube.showAPIErrorOverlay('No videos found');
            
            // Display fallback content
            setTimeout(() => {
                if (window.skeletonManager.isSkeletonActive('heroContent')) {
                    youtube.updateHeroSection(null);
                }
                if (window.skeletonManager.isSkeletonActive('trendingVideos')) {
                    youtube.displayVideos([], 'trendingVideos');
                }
                youtube.showPerformanceError();
            }, 1000);
        }
        
    } catch (error) {
        
        // Show API error overlay
        youtube.showAPIErrorOverlay(error.message);
        
        // Display fallback content after skeleton timeout
        setTimeout(() => {
            if (window.skeletonManager.isSkeletonActive('heroContent')) {
                youtube.updateHeroSection(null);
            }
            if (window.skeletonManager.isSkeletonActive('trendingVideos')) {
                youtube.displayVideos(youtube.getFallbackVideoData(), 'trendingVideos');
            }
            youtube.showPerformanceError();
        }, 2000);
    }
});

// Add CSS styles for the glitch effect
const glitchStyles = `
@keyframes brutal-home-glitch {
    0%, 100% { 
        transform: translate(0);
        color: inherit;
    }
    20% { 
        transform: translate(-1px, 1px);
        color: var(--primary);
        text-shadow: 1px 1px 0 var(--secondary);
    }
    40% { 
        transform: translate(-1px, -1px);
        color: var(--accent);
        text-shadow: -1px -1px 0 var(--primary);
    }
    60% { 
        transform: translate(1px, 1px);
        color: var(--secondary);
        text-shadow: 1px 1px 0 var(--accent);
    }
    80% { 
        transform: translate(1px, -1px);
        color: var(--success);
        text-shadow: -1px 1px 0 var(--primary);
    }
}

.brutal-title-glitch-home:hover {
    animation: brutal-home-glitch 0.8s ease-in-out;
}
`;

// Inject the styles into the document
const styleSheet = document.createElement('style');
styleSheet.textContent = glitchStyles;
document.head.appendChild(styleSheet);
