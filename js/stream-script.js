class StreamYouTubeAPI {
    constructor() {
        // Load secure configuration
        if (typeof YOUTUBE_CONFIG !== 'undefined') {
            this.apiKey = YOUTUBE_CONFIG.API_KEY; // Will be empty for security
            this.channelId = YOUTUBE_CONFIG.CHANNEL_ID; // Will be empty for security
            this.baseUrl = YOUTUBE_CONFIG.BASE_URL; // Points to secure proxy
            this.maxResults = YOUTUBE_CONFIG.MAX_RESULTS;
        } else {
            // Fallback to secure proxy endpoints
            this.apiKey = ''; // No API key needed - handled by backend
            this.channelId = ''; // No channel ID needed - handled by backend
            this.baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
                ? '/api/youtube' 
                : '/.netlify/functions'; // Use Netlify Functions for deployed version
            this.maxResults = 50;
        }
        this.videosData = [];
        this.currentFilter = 'all';
        this.currentSort = 'date';
        this.currentView = 'grid';
        this.nextPageToken = null; // For pagination
        this.totalResults = 0; // Track total available results
        this.isLoading = false; // Prevent multiple simultaneous requests
        this.init();
    }

    async init() {
        try {
            
            if (!navigator.onLine) {
                throw new Error('No internet connection detected');
            }
            
            await this.loadChannelData();
            await this.loadVideos();
            this.hideLoadingScreen();
        } catch (error) {
            this.handleAPIError();
        }
    }

    showInitialSkeletons() {
        if (window.skeletonManager) {
            
            // Show skeleton for featured stream
            window.skeletonManager.showFeaturedStreamSkeleton('featuredPlayer');
            
            // Show skeleton for videos grid (use same as homepage)
            window.skeletonManager.showTrendingSkeleton('videosGrid', 6);
            
            // Show skeleton for stream stats
            window.skeletonManager.showStreamStatsSkeleton();
        }
    }

    async loadChannelData() {
        try {
            const channelEndpoint = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
                ? `${this.baseUrl}/channel` 
                : `${this.baseUrl}/youtube-channel`;
            const response = await fetch(channelEndpoint);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                const channel = data.items[0];
                this.updateChannelStats(channel.statistics);
                this.updateChannelInfo(channel);
            }
        } catch (error) {
            throw error;
        }
    }

    async loadVideos() {
        try {
            const videosEndpoint = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
                ? `${this.baseUrl}/videos` 
                : `${this.baseUrl}/youtube-videos`;
            const response = await fetch(
                `${videosEndpoint}?maxResults=${this.maxResults}&order=date`
            );
            
            if (!response.ok) {
                let errorMessage = '';
                switch (response.status) {
                    case 403:
                        errorMessage = 'API quota exceeded. Please try again later.';
                        break;
                    case 404:
                        errorMessage = 'Channel not found. Please check the configuration.';
                        break;
                    case 500:
                        errorMessage = 'YouTube servers are experiencing issues. Please try again later.';
                        break;
                    default:
                        errorMessage = `Server error (${response.status}). Please try again later.`;
                }
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                // The backend already includes statistics in the items, no need for separate API call
                this.videosData = this.processVideoData(data.items);
                
                // Store pagination information
                this.nextPageToken = data.nextPageToken || null;
                this.totalResults = data.pageInfo?.totalResults || data.items.length;
                
                await this.checkForLiveStreams();
                
                // Hide skeletons and show real content
                this.hideSkeletonsAndShowContent();
                
                this.setupLoadMoreFeature();
            } else {
                throw new Error('No videos found for this channel.');
            }
        } catch (error) {
            this.lastErrorMessage = error.message;
            throw error;
        }
    }

    hideSkeletonsAndShowContent() {
        // Simply render the videos directly
        this.renderVideos(this.videosData);
    }

    async loadVideoDetails(videoIds) {
        try {
            const videosEndpoint = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
                ? `${this.baseUrl}/video-details` 
                : `${this.baseUrl}/youtube-videos`;
            const response = await fetch(
                `${videosEndpoint}?part=statistics,contentDetails,liveStreamingDetails&id=${videoIds}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.warn('Failed to load video details:', error);
            return [];
        }
    }

    async checkForLiveStreams() {
        try {
            // For now, since we don't have a live stream endpoint in our proxy,
            // we'll just set up the first video as featured
            const featuredVideo = this.videosData[0];
            if (featuredVideo) {
                this.setupFeaturedStream(featuredVideo, false);
            }
        } catch (error) {
            // Handle error silently
        }
    }

    processVideoData(videoItems) {
        return videoItems.map(video => {
            // Statistics are already included in the video item from the backend
            const statistics = video.statistics || {};
            const contentDetails = video.contentDetails || {};
            const isLive = contentDetails.liveStreamingDetails?.actualStartTime && !contentDetails.liveStreamingDetails?.actualEndTime;
            
            return {
                id: video.id.videoId,
                title: video.snippet.title,
                thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default.url,
                description: video.snippet.description,
                publishedAt: video.snippet.publishedAt,
                duration: isLive ? 'LIVE' : this.formatDuration(contentDetails.duration || 'PT0S'),
                views: statistics.viewCount || '0',
                likes: statistics.likeCount || '0',
                category: this.categorizeVideo(video.snippet.title, video.snippet.description),
                isLive: isLive,
                url: `https://www.youtube.com/watch?v=${video.id.videoId}`
            };
        });
    }

    categorizeVideo(title, description) {
        const titleLower = title.toLowerCase();
        const descLower = description.toLowerCase();
        
        if (titleLower.includes('live') || titleLower.includes('stream')) {
            return 'gaming';
        } else if (titleLower.includes('guide') || titleLower.includes('tutorial') || titleLower.includes('tips')) {
            return 'education';
        } else if (titleLower.includes('compilation') || titleLower.includes('highlights') || titleLower.includes('funny')) {
            return 'entertainment';
        } else {
            return 'gaming';
        }
    }

    updateChannelStats(stats) {

        // Hide skeleton stats and show real data
        if (window.skeletonManager) {
            const totalVideos = document.getElementById('totalVideos');
            const totalViews = document.getElementById('totalViews');
            const subscribers = document.getElementById('subscribers');

            if (totalVideos && stats.videoCount) {
                const videoCount = parseInt(stats.videoCount) || 0;
                if (window.skeletonManager.isSkeletonActive('totalVideos')) {
                    window.skeletonManager.hideSkeleton(totalVideos, '');
                }
                this.animateCounter(totalVideos, videoCount);
            }
            
            if (totalViews && stats.viewCount) {
                const viewCount = parseInt(stats.viewCount) || 0;
                if (window.skeletonManager.isSkeletonActive('totalViews')) {
                    window.skeletonManager.hideSkeleton(totalViews, '');
                }
                this.animateCounter(totalViews, viewCount);
            }
            
            if (subscribers && stats.subscriberCount) {
                const subCount = parseInt(stats.subscriberCount) || 0;
                if (window.skeletonManager.isSkeletonActive('subscribers')) {
                    window.skeletonManager.hideSkeleton(subscribers, '');
                }
                this.animateCounter(subscribers, subCount);
            }
        } else {
            // Fallback without skeleton manager
            const totalVideos = document.getElementById('totalVideos');
            const totalViews = document.getElementById('totalViews');
            const subscribers = document.getElementById('subscribers');

            if (totalVideos && stats.videoCount) {
                const videoCount = parseInt(stats.videoCount) || 0;
                this.animateCounter(totalVideos, videoCount);
            }
            
            if (totalViews && stats.viewCount) {
                const viewCount = parseInt(stats.viewCount) || 0;
                this.animateCounter(totalViews, viewCount);
            }
            
            if (subscribers && stats.subscriberCount) {
                const subCount = parseInt(stats.subscriberCount) || 0;
                this.animateCounter(subscribers, subCount);
            }
        }
    }

    updateChannelInfo(channel) {
        const channelInfo = document.getElementById('channelInfo');
        const channelThumbnail = document.getElementById('channelThumbnail');
        const channelTitle = document.getElementById('channelTitle');
        const channelDescription = document.getElementById('channelDescription');
        const channelSubscribers = document.getElementById('channelSubscribers');
        const channelVideoCount = document.getElementById('channelVideoCount');
        const channelViewCount = document.getElementById('channelViewCount');
        const channelLink = document.getElementById('channelLink');

        if (channelInfo) {
            channelInfo.style.display = 'block';
            channelInfo.classList.add('brutal-channel-entry');
        }

        if (channelThumbnail) {
            channelThumbnail.src = channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.default.url;
            channelThumbnail.alt = channel.snippet.title;
        }

        if (channelTitle) channelTitle.textContent = channel.snippet.title;
        if (channelDescription) {
            const description = channel.snippet.description.length > 200 
                ? channel.snippet.description.substring(0, 200) + '...'
                : channel.snippet.description;
            channelDescription.textContent = description;
        }

        if (channelSubscribers) channelSubscribers.textContent = `${this.formatNumber(channel.statistics.subscriberCount)} subscribers`;
        if (channelVideoCount) channelVideoCount.textContent = `${this.formatNumber(channel.statistics.videoCount)} videos`;
        if (channelViewCount) channelViewCount.textContent = `${this.formatNumber(channel.statistics.viewCount)} total views`;
        
        if (channelLink) {
            channelLink.href = `https://www.youtube.com/channel/${this.channelId}`;
        }
    }

    setupFeaturedStream(video, isLive) {
        const featuredSection = document.getElementById('featuredSection');
        const featuredPlayer = document.getElementById('featuredPlayer');
        
        if (featuredSection && featuredPlayer) {
            featuredSection.style.display = 'block';
            featuredSection.classList.add('brutal-featured-entry');
            
            const featuredHTML = `
                <div class="featured-video-player">
                    <img src="${video.thumbnail || video.snippet?.thumbnails?.high?.url}" alt="${video.title || video.snippet?.title}" loading="eager">
                    <div class="featured-overlay">
                        <div class="featured-info">
                            <h3>${video.title || video.snippet?.title}</h3>
                            <div class="featured-meta">
                                <span class="${isLive ? 'live-badge' : 'featured-badge'}">${isLive ? 'LIVE' : 'FEATURED'}</span>
                                <span>${isLive ? `${this.formatNumber(video.views || '0')} watching` : `${this.formatNumber(video.views || '0')} views`}</span>
                            </div>
                        </div>
                        <button class="featured-play-btn brutal-btn primary" onclick="window.open('${video.url || `https://www.youtube.com/watch?v=${video.id?.videoId || video.id}`}', '_blank')">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 5V19L19 12L8 5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            ${isLive ? 'Join Live Stream' : 'Watch Now'}
                        </button>
                    </div>
                </div>
            `;
            
            featuredPlayer.innerHTML = featuredHTML;
        } else {
        
        }
    }

    renderVideos(videos) {
        const videosGrid = document.getElementById('videosGrid');
        if (!videosGrid) return;

        if (!videos.length) {
            videosGrid.innerHTML = `
                <div style="text-align: center; padding: 3rem; background: var(--card-bg); border: 2px solid var(--border-color); border-radius: 12px;">
                    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.6;">
                        <i class="fas fa-video"></i>
                    </div>
                    <h3 style="margin-bottom: 1rem; color: var(--text-primary);">No Videos Found</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">We're working to bring you the latest content.</p>
                    <a href="https://www.youtube.com/@Afterlife_AL/streams" target="_blank" class="btn primary" style="text-decoration: none;">
                        <i class="fab fa-youtube" style="margin-right: 0.5rem;"></i>
                        Visit YouTube Channel
                    </a>
                </div>
            `;
            return;
        }

        const videoCardsHTML = videos.map((video, index) => `
            <div class="video-card ${this.currentView === 'list' ? 'list-view' : ''}" style="animation-delay: ${index * 0.1}s;">
                <div class="video-thumbnail">
                    <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                    <div class="video-duration ${video.isLive ? 'live' : ''}">${video.duration}</div>
                    ${video.isLive ? '<div class="live-indicator-small">LIVE</div>' : ''}
                    <div class="video-overlay">
                        <button class="play-btn brutal-btn primary" onclick="window.open('${video.url}', '_blank')">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 5V19L19 12L8 5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            ${video.isLive ? 'Join Stream' : 'Watch Now'}
                        </button>
                    </div>
                </div>
                <div class="video-info">
                    <h3 class="video-title">${video.title}</h3>
                    <div class="video-meta">
                        <span class="video-views">${this.formatNumber(video.views)} ${video.isLive ? 'watching' : 'views'}</span>
                        <span class="video-date">${this.formatDate(new Date(video.publishedAt))}</span>
                        <span class="video-category">${video.category.toUpperCase()}</span>
                    </div>
                </div>
            </div>
        `).join('');

        videosGrid.innerHTML = videoCardsHTML;

        // Setup video card animations after render
        setTimeout(() => {
            this.setupVideoCards();
        }, 100);
    }

    formatDuration(duration) {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (!match) return '0:00';
        
        const hours = (match[1] || '').replace('H', '');
        const minutes = (match[2] || '').replace('M', '');
        const seconds = (match[3] || '').replace('S', '');
        
        if (hours) {
            return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
        } else {
            return `${minutes || '0'}:${seconds.padStart(2, '0')}`;
        }
    }

    formatNumber(num) {
        const number = parseInt(num);
        if (number >= 1000000) {
            return (number / 1000000).toFixed(1) + 'M';
        } else if (number >= 1000) {
            return (number / 1000).toFixed(1) + 'K';
        }
        return number.toString();
    }

    formatDate(date) {
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    animateCounter(element, target, suffix = '') {
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }

            const displayValue = this.formatNumber(Math.floor(current));
            element.textContent = displayValue + suffix;
        }, 50);
    }

    handleAPIError() {
        
        this.hideLoadingScreen();
        this.showAPIErrorBox();
    }

    getFallbackFeaturedContent() {
        return `
            <div class="featured-video-player">
                <img src="https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg" alt="Epic MLBB Rank Push - Road to Mythic" loading="eager">
                <div class="featured-overlay">
                    <div class="featured-info">
                        <h3>Epic MLBB Rank Push - Road to Mythic</h3>
                        <div class="featured-meta">
                            <span class="featured-badge">FEATURED</span>
                            <span>12.5K views</span>
                        </div>
                    </div>
                    <button class="featured-play-btn brutal-btn primary" onclick="window.open('https://www.youtube.com/@Afterlife_AL', '_blank')">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 5V19L19 12L8 5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Watch Now
                    </button>
                </div>
            </div>
        `;
    }

    getFallbackVideosContent() {
        const fallbackVideos = [
            {
                title: "Epic MLBB Rank Push - Road to Mythic",
                thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
                duration: "2:34:15",
                views: "12500",
                publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                category: "gaming",
                isLive: false
            },
            {
                title: "LIVE: Morning Gaming Session",
                thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
                duration: "LIVE",
                views: "847",
                publishedAt: new Date().toISOString(),
                category: "gaming",
                isLive: true
            },
            {
                title: "Mobile Legends Tutorial - Advanced Tips",
                thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
                duration: "15:42",
                views: "8500",
                publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                category: "education",
                isLive: false
            },
            {
                title: "Mythic Rank Push Highlights",
                thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
                duration: "18:25",
                views: "6200",
                publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                category: "gaming",
                isLive: false
            },
            {
                title: "Hero Guide: Advanced Strategies",
                thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
                duration: "12:33",
                views: "9800",
                publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                category: "education",
                isLive: false
            },
            {
                title: "Community Tournament Finals",
                thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
                duration: "45:12",
                views: "23400",
                publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                category: "entertainment",
                isLive: false
            }
        ];

        return fallbackVideos.map((video, index) => `
            <div class="video-card" style="animation-delay: ${index * 0.1}s;">
                <div class="video-thumbnail">
                    <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                    <div class="video-duration ${video.isLive ? 'live' : ''}">${video.duration}</div>
                    ${video.isLive ? '<div class="live-indicator-small">LIVE</div>' : ''}
                    <div class="video-overlay">
                        <button class="play-btn brutal-btn primary" onclick="window.open('https://www.youtube.com/@Afterlife_AL', '_blank')">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 5V19L19 12L8 5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            ${video.isLive ? 'Visit Channel' : 'Visit Channel'}
                        </button>
                    </div>
                </div>
                <div class="video-info">
                    <h3 class="video-title">${video.title}</h3>
                    <div class="video-meta">
                        <span class="video-views">${this.formatNumber(video.views)} ${video.isLive ? 'watching' : 'views'}</span>
                        <span class="video-date">${this.formatDate(new Date(video.publishedAt))}</span>
                        <span class="video-category">${video.category.toUpperCase()}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    showAPIErrorBox() {
        const videosGrid = document.getElementById('videosGrid');
        const featuredPlayer = document.getElementById('featuredPlayer');
        
        // Clear any existing content
        if (videosGrid) videosGrid.innerHTML = '';
        if (featuredPlayer) featuredPlayer.innerHTML = '';

        // Create the API error glass box
        const errorBoxHTML = `
            <div class="api-error-container">
                <div class="api-error-box glass-card">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="error-content">
                        <h2 class="error-title">We Apologize for the Inconvenience</h2>
                        <p class="error-message">
                            Our YouTube API service is currently experiencing issues due to quota limitations. 
                            We're working to resolve this as soon as possible.
                        </p>
                        <div class="error-details">
                            <div class="error-detail-item">
                                <i class="fas fa-clock"></i>
                                <span>Service should resume within 24 hours</span>
                            </div>
                            <div class="error-detail-item">
                                <i class="fas fa-tools"></i>
                                <span>Our team has been notified</span>
                            </div>
                            <div class="error-detail-item">
                                <i class="fas fa-shield-alt"></i>
                                <span>No data has been compromised</span>
                            </div>
                        </div>
                        <div class="error-actions">
                            <button onclick="location.reload()" class="cta-button cta-primary">
                                <i class="fas fa-refresh"></i>
                                Try Again
                            </button>
                            <button onclick="window.open('https://www.youtube.com/@Afterlife_AL', '_blank')" class="cta-button cta-secondary">
                                <i class="fab fa-youtube"></i>
                                Visit YouTube Channel
                            </button>
                        </div>
                        <div class="error-footer">
                            <p>Thank you for your patience and understanding.</p>
                            <p><strong>- Afterlife Team</strong></p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Show error in videos grid area
        if (videosGrid) {
            videosGrid.innerHTML = errorBoxHTML;
            videosGrid.classList.add('error-state');
        }

        // Hide featured section or show minimal error there
        if (featuredPlayer) {
            featuredPlayer.innerHTML = `
                <div class="featured-error glass-card">
                    <div class="featured-error-content">
                        <i class="fas fa-video-slash"></i>
                        <p>Featured content temporarily unavailable</p>
                    </div>
                </div>
            `;
        }

        // Update stats with placeholder values and add error indicator
        this.updateStatsWithError();
    }

    updateStatsWithError() {
        const totalVideos = document.getElementById('totalVideos');
        const totalViews = document.getElementById('totalViews');
        const subscribers = document.getElementById('subscribers');

        if (totalVideos) {
            totalVideos.textContent = '';
            totalVideos.parentElement.classList.add('stat-error');
        }
        if (totalViews) {
            totalViews.textContent = '';
            totalViews.parentElement.classList.add('stat-error');
        }
        if (subscribers) {
            subscribers.textContent = '';
            subscribers.parentElement.classList.add('stat-error');
        }
    }

    setupErrorSectionHandlers() {
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
        
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {

                retryBtn.innerHTML = `
                    <i class="fas fa-spinner fa-spin"></i>
                    Retrying...
                `;
                retryBtn.disabled = true;

                setTimeout(() => {
                    location.reload();
                }, 1000);
            });
        }
        
        if (visitChannelBtn) {
            visitChannelBtn.addEventListener('click', () => {

                visitChannelBtn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    visitChannelBtn.style.transform = '';
                }, 100);
                
                window.open(`https://www.youtube.com/channel/${this.channelId}`, '_blank');
            });
        }
    }

    setupMockData() {

        const mockVideos = [
            {
                id: 'mock1',
                title: "Epic MLBB Rank Push - Road to Mythic",
                thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
                duration: "2:34:15",
                views: "12500",
                publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                category: "gaming",
                isLive: false,
                url: 'https://www.youtube.com/@Afterlife_AL'
            },
            {
                id: 'mock2',
                title: "LIVE: Morning Gaming Session", 
                thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
                duration: "LIVE",
                views: "847",
                publishedAt: new Date().toISOString(),
                category: "gaming",
                isLive: true,
                url: 'https://www.youtube.com/@Afterlife_AL'
            },
            {
                id: 'mock3',
                title: "Mythic Rank Push Highlights",
                thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
                duration: "18:25",
                views: "6200",
                publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                category: "gaming", 
                isLive: false,
                url: 'https://www.youtube.com/@Afterlife_AL'
            },
            {
                id: 'mock4',
                title: "Hero Guide: Advanced Strategies",
                thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
                duration: "12:33",
                views: "9800", 
                publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                category: "education",
                isLive: false,
                url: 'https://www.youtube.com/@Afterlife_AL'
            },
            {
                id: 'mock5',
                title: "Community Tournament Finals",
                thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
                duration: "45:12",
                views: "23400",
                publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                category: "entertainment",
                isLive: false,
                url: 'https://www.youtube.com/@Afterlife_AL'
            }
        ];

        this.videosData = mockVideos;
        this.renderVideos(mockVideos);

        const totalVideos = document.getElementById('totalVideos');
        const totalViews = document.getElementById('totalViews');
        const subscribers = document.getElementById('subscribers');

        if (totalVideos) this.animateCounter(totalVideos, 25);
        if (totalViews) this.animateCounter(totalViews, 150000);
        if (subscribers) this.animateCounter(subscribers, 2500);
    }

    filterByCategory(videos) {
        if (this.currentFilter === 'all') {
            return videos;
        }
        return videos.filter(video => video.category === this.currentFilter);
    }

    sortVideos() {
        let sortedVideos = [...this.videosData];
        
        switch (this.currentSort) {
            case 'views':
                sortedVideos.sort((a, b) => parseInt(b.views) - parseInt(a.views));
                break;
            case 'duration':
                sortedVideos.sort((a, b) => this.parseDuration(b.duration) - this.parseDuration(a.duration));
                break;
            case 'title':
                sortedVideos.sort((a, b) => a.title.localeCompare(b.title));
                break;
            default:
                sortedVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
                break;
        }
        
        const filteredVideos = this.filterByCategory(sortedVideos);
        this.renderVideos(filteredVideos);
        
        // Update load more button visibility for filtered results
        this.updateLoadMoreForFilters(filteredVideos);
    }

    searchVideos(query) {
        if (!query.trim()) {
            const filteredVideos = this.filterByCategory(this.videosData);
            this.renderVideos(filteredVideos);
            this.updateLoadMoreForFilters(filteredVideos);
            return;
        }
        
        const searchResults = this.videosData.filter(video =>
            video.title.toLowerCase().includes(query.toLowerCase())
        );
        
        const filteredResults = this.filterByCategory(searchResults);
        this.renderVideos(filteredResults);
        this.updateLoadMoreForFilters(filteredResults);
    }

    updateLoadMoreForFilters(filteredVideos) {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            // If we're showing filtered results, hide load more unless we're showing all videos
            if (this.currentFilter === 'all' && !document.getElementById('searchInput')?.value?.trim()) {
                // Show load more only if there might be more videos to load
                if (this.nextPageToken || this.videosData.length < this.totalResults) {
                    loadMoreBtn.style.display = 'block';
                } else {
                    loadMoreBtn.style.display = 'none';
                }
            } else {
                // Hide load more when filtering/searching
                loadMoreBtn.style.display = 'none';
            }
        }
    }

    parseDuration(duration) {
        if (duration === 'LIVE') return Infinity;
        const parts = duration.split(':').map(Number);
        return parts.reduce((total, part) => total * 60 + part, 0);
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('brutal-loading-exit');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 1000);
        }
    }

    setupLoadMoreFeature() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            // Show load more button if there's a next page token or if we have the maximum results
            if (this.nextPageToken || (this.videosData.length >= this.maxResults && this.videosData.length < this.totalResults)) {
                loadMoreBtn.style.display = 'block';
                // Remove any existing event listeners to prevent duplicates
                loadMoreBtn.replaceWith(loadMoreBtn.cloneNode(true));
                const newLoadMoreBtn = document.getElementById('loadMoreBtn');
                newLoadMoreBtn.addEventListener('click', async () => {
                    await this.loadMoreVideos();
                });
            } else {
                loadMoreBtn.style.display = 'none';
            }
        }
    }

    async loadMoreVideos() {
        // Prevent multiple simultaneous requests
        if (this.isLoading) {
            return;
        }
        
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (!loadMoreBtn) return;
        
        this.isLoading = true;
        const originalText = loadMoreBtn.innerHTML;
        loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        loadMoreBtn.disabled = true;
        
        try {
            const videosEndpoint = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
                ? `${this.baseUrl}/videos` 
                : `${this.baseUrl}/youtube-videos`;
            
            // Build the URL with pagination token if available
            let url = `${videosEndpoint}?maxResults=${this.maxResults}&order=date`;
            if (this.nextPageToken) {
                url += `&pageToken=${this.nextPageToken}`;
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                // Process the new video data
                const newVideosData = this.processVideoData(data.items);
                
                // Append new videos to existing ones
                this.videosData = [...this.videosData, ...newVideosData];
                
                // Update pagination information
                this.nextPageToken = data.nextPageToken || null;
                this.totalResults = data.pageInfo?.totalResults || this.videosData.length;
                
                // Re-render all videos with the new data
                this.renderVideos(this.filterByCategory(this.videosData));
                
                // Update load more button visibility
                if (this.nextPageToken && this.videosData.length < this.totalResults) {
                    loadMoreBtn.innerHTML = originalText;
                    loadMoreBtn.disabled = false;
                } else {
                    loadMoreBtn.innerHTML = '<i class="fas fa-check"></i> All Videos Loaded';
                    setTimeout(() => {
                        loadMoreBtn.style.display = 'none';
                    }, 2000);
                }
                
                // Show notification of new videos loaded
                this.showNotification(`Loaded ${newVideosData.length} more videos ${this.getSVGIcon('video')}`, 'success');
                
            } else {
                // No more videos available
                loadMoreBtn.innerHTML = '<i class="fas fa-check"></i> All Videos Loaded';
                setTimeout(() => {
                    loadMoreBtn.style.display = 'none';
                }, 2000);
                
                this.showNotification('No more videos available', 'info');
            }
        } catch (error) {
            console.error('Error loading more videos:', error);
            loadMoreBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Failed to Load';
            
            // Show error notification
            this.showNotification('Failed to load more videos. Please try again.', 'error');
            
            // Restore original button after 3 seconds
            setTimeout(() => {
                loadMoreBtn.innerHTML = originalText;
                loadMoreBtn.disabled = false;
            }, 3000);
        } finally {
            this.isLoading = false;
        }
    }

    setupVideoCards() {
        const videoCards = document.querySelectorAll('.video-card');
        
        videoCards.forEach((card, index) => {
            card.classList.add('brutal-video-entry');
            card.style.animationDelay = `${index * 0.1}s`;
            
            card.addEventListener('mouseenter', () => {
                card.classList.add('brutal-video-hover');
            });
            
            card.addEventListener('mouseleave', () => {
                card.classList.remove('brutal-video-hover');
            });
        });
    }

    showNotification(message, type = 'info') {
        const notificationContainer = document.getElementById('notificationContainer');
        if (!notificationContainer) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
                <button class="notification-close" aria-label="Close notification">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="notification-progress"></div>
        `;
        
        notificationContainer.appendChild(notification);
        
        const progressBar = notification.querySelector('.notification-progress');
        
        // Add click handler for close button
        const closeBtn = notification.querySelector('.notification-close');
        const closeNotification = () => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        };
        
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeNotification();
        });
        
        // Close on notification click
        notification.addEventListener('click', closeNotification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
            // Start progress bar animation
            if (progressBar) {
                progressBar.style.animation = 'progress-bar 5s linear forwards';
            }
        }, 100);
        
        // Auto-remove notification after 5 seconds
        setTimeout(() => {
            if (notification.parentNode && notification.classList.contains('show')) {
                closeNotification();
            }
        }, 5000);
    }

    // Helper function to get SVG icons
    getSVGIcon(name) {
        const icons = {
            gamepad: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; margin-left: 4px; vertical-align: middle;">
                <path d="M6 10H10M8 8V12M14 11L16 13L20 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6 4H18C19.1046 4 20 4.89543 20 6V14C20 17.3137 17.3137 20 14 20H10C6.68629 20 4 17.3137 4 14V6C4 4.89543 4.89543 4 6 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
            video: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; margin-left: 4px; vertical-align: middle;">
                <path d="M22 8L16 12L22 16V8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="2" y="6" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
            play: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; margin-left: 4px; vertical-align: middle;">
                <polygon points="5,3 19,12 5,21" stroke="currentColor" stroke-width="2" fill="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`
        };
        
        return icons[name] || '';
    }
}

class NeoBrutalStreamAnimations {
    constructor() {
        this.currentFilter = 'all';
        this.currentSort = 'date';
        this.currentView = 'grid';
        this.init();
        this.setupEventListeners();
    }

    init() {
        this.addAnimationClasses();
        this.setupScrollAnimations();
    }

    addAnimationClasses() {
        const streamHero = document.querySelector('.stream-hero');
        const filterSection = document.querySelector('.filter-section');
        const streamStats = document.querySelectorAll('.stat-item');
        const heroTitle = document.querySelector('.hero-title');

        if (streamHero) streamHero.classList.add('brutal-stream-entry');
        if (filterSection) filterSection.classList.add('brutal-filter-slide');
        if (heroTitle) heroTitle.classList.add('brutal-title-glitch-stream');
        
        streamStats.forEach((stat, index) => {
            stat.classList.add('brutal-stat-count');
            stat.style.animationDelay = `${index * 0.2}s`;
        });
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -30px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('brutal-animate-visible');
                }
            });
        }, observerOptions);

        const animatableElements = document.querySelectorAll(
            '.video-card, .filter-bar, .channel-card, .featured-player'
        );
        
        animatableElements.forEach(el => observer.observe(el));
    }

    setupEventListeners() {
        // Mobile menu is handled by MobileMenuManager in theme-toggle.js
        // No need for duplicate setup here

        this.setupFilterControls();

        this.setupViewToggle();

        this.setupSearchFeatures();

        this.setupButtonAnimations();
    }

    setupFilterControls() {
        const sortSelect = document.getElementById('sortSelect');
        const categorySelect = document.getElementById('categorySelect');

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.animateFilterChange();
                if (window.streamAPI) {
                    window.streamAPI.currentSort = e.target.value;
                    window.streamAPI.sortVideos();
                }
            });
        }

        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.animateFilterChange();
                if (window.streamAPI) {
                    window.streamAPI.currentFilter = e.target.value;
                    const filteredVideos = window.streamAPI.filterByCategory(window.streamAPI.videosData);
                    window.streamAPI.renderVideos(filteredVideos);
                    window.streamAPI.updateLoadMoreForFilters(filteredVideos);
                }
            });
        }
    }

    setupViewToggle() {
        const gridView = document.getElementById('gridView');
        const listView = document.getElementById('listView');
        const videosGrid = document.getElementById('videosGrid');

        if (gridView && listView) {
            gridView.addEventListener('click', () => {
                this.switchView('grid', gridView, listView, videosGrid);
            });

            listView.addEventListener('click', () => {
                this.switchView('list', listView, gridView, videosGrid);
            });
        }
    }

    setupSearchFeatures() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                if (window.streamAPI) {
                    window.streamAPI.searchVideos(e.target.value);
                }
            });

            searchInput.addEventListener('focus', () => {
                searchInput.classList.add('brutal-search-focus');
            });

            searchInput.addEventListener('blur', () => {
                searchInput.classList.remove('brutal-search-focus');
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.addSearchAnimation();
                if (searchInput && window.streamAPI) {
                    window.streamAPI.searchVideos(searchInput.value);
                }
            });
        }
    }

    setupButtonAnimations() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('brutal-btn') || 
                e.target.classList.contains('view-btn') ||
                e.target.classList.contains('load-more-btn')) {
                this.addButtonClickEffect(e.target, e);
            }
        });
    }

    switchView(viewType, activeBtn, inactiveBtn, videosGrid) {
        this.currentView = viewType;
        if (window.streamAPI) window.streamAPI.currentView = viewType;
        
        activeBtn.classList.add('active');
        inactiveBtn.classList.remove('active');
        
        videosGrid.classList.add('brutal-view-transition');
        
        setTimeout(() => {
            if (viewType === 'list') {
                videosGrid.classList.add('list-view');
            } else {
                videosGrid.classList.remove('list-view');
            }
            
            videosGrid.classList.remove('brutal-view-transition');
        }, 200);
    }

    animateFilterChange() {
        const videosGrid = document.getElementById('videosGrid');
        if (videosGrid) {
            videosGrid.classList.add('brutal-filter-transition');
            
            setTimeout(() => {
                videosGrid.classList.remove('brutal-filter-transition');
            }, 300);
        }
    }

    addSearchAnimation() {
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.classList.add('brutal-search-spin');
            setTimeout(() => {
                searchBtn.classList.remove('brutal-search-spin');
            }, 1000);
        }
    }

    addButtonClickEffect(button, event) {
        const circle = document.createElement('div');
        circle.classList.add('brutal-video-circle');
        button.appendChild(circle);
        
        setTimeout(() => {
            if (circle.parentNode) {
                circle.parentNode.removeChild(circle);
            }
        }, 800);
    }
}

const streamAnimationsCSS = `

@keyframes brutal-stream-entry {
    from {
        transform: translateY(50px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes brutal-filter-slide {
    from {
        transform: translateY(-30px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes brutal-stat-count {
    from {
        transform: scale(0.8);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes brutal-video-entry {
    from {
        transform: translateY(30px) scale(0.95);
        opacity: 0;
    }
    to {
        transform: translateY(0) scale(1);
        opacity: 1;
    }
}

@keyframes brutal-stream-glitch {
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

@keyframes brutal-live-pulse {
    0%, 100% {
        background-color: var(--danger);
        transform: scale(1);
    }
    50% {
        background-color: var(--primary);
        transform: scale(1.1);
    }
}

@keyframes brutal-loading-exit {
    from {
        opacity: 1;
        transform: scale(1);
    }
    to {
        opacity: 0;
        transform: scale(0.9);
    }
}

@keyframes brutal-search-spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

@keyframes brutal-video-circle-expand {
    from {
        transform: scale(0);
        opacity: 1;
    }
    to {
        transform: scale(3);
        opacity: 0;
    }
}

@keyframes brutal-channel-entry {
    from {
        transform: translateX(-50px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes brutal-featured-entry {
    from {
        transform: scale(0.95);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}

.brutal-stream-entry {
    animation: brutal-stream-entry 1s ease-out;
}

.brutal-filter-slide {
    animation: brutal-filter-slide 0.8s ease-out;
}



.brutal-stat-count {
    animation: brutal-stat-count 0.6s ease-out;
}

.brutal-video-entry {
    animation: brutal-video-entry 0.5s ease-out;
}

.brutal-video-hover {
    transform: translate(-3px, -3px);
    box-shadow: 6px 6px 0px var(--primary);
    transition: all 0.2s ease;
}

.brutal-live-pulse {
    animation: brutal-live-pulse 2s infinite;
}

.brutal-loading-exit {
    animation: brutal-loading-exit 0.5s ease-out forwards;
}

.brutal-search-focus {
    transform: translate(-2px, -2px);
    box-shadow: 4px 4px 0px var(--primary);
    border-color: var(--primary);
}

.brutal-search-spin {
    animation: brutal-search-spin 1s ease-in-out;
}

.brutal-video-circle {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    background: var(--primary);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: brutal-video-circle-expand 0.8s ease-out;
    pointer-events: none;
    z-index: 10;
}

.brutal-view-transition {
    opacity: 0.5;
    transition: opacity 0.2s ease;
}

.brutal-filter-transition {
    opacity: 0.7;
    transform: scale(0.98);
    transition: all 0.3s ease;
}

.brutal-channel-entry {
    animation: brutal-channel-entry 0.8s ease-out;
}

.brutal-featured-entry {
    animation: brutal-featured-entry 1s ease-out;
}

.loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--bg-primary);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.videos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.videos-grid.list-view {
    grid-template-columns: 1fr;
}

.video-card {
    background: var(--bg-secondary);
    border: 3px solid var(--black);
    box-shadow: 6px 6px 0px var(--black);
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s ease;
}

.video-card.list-view {
    display: flex;
    gap: 1rem;
}

.video-card:hover {
    transform: translate(-2px, -2px);
    box-shadow: 8px 8px 0px var(--black);
}

.video-thumbnail {
    position: relative;
    overflow: hidden;
    aspect-ratio: 16/9;
}

.video-card.list-view .video-thumbnail {
    flex: 0 0 200px;
}

.video-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.video-card:hover .video-thumbnail img {
    transform: scale(1.05);
}

.video-duration {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 2px;
}

.video-duration.live {
    background: var(--danger);
    animation: brutal-live-pulse 2s infinite;
}

.live-indicator-small {
    position: absolute;
    top: 8px;
    left: 8px;
    background: var(--danger);
    color: white;
    padding: 4px 8px;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    animation: brutal-live-pulse 2s infinite;
}

.video-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.video-card:hover .video-overlay {
    opacity: 1;
}

.play-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
}

.video-info {
    padding: 1rem;
}

.video-card.list-view .video-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.video-title {
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    line-height: 1.3;
}

.video-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.video-category {
    background: var(--primary);
    color: white;
    padding: 2px 6px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.filter-section {
    background: var(--bg-secondary);
    border-bottom: 2px solid var(--gray-200);
    padding: 1rem 0;
    margin-bottom: 2rem;
}

.filter-bar {
    display: flex;
    align-items: center;
    gap: 2rem;
    flex-wrap: wrap;
}

.filter-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.filter-select {
    padding: 0.5rem;
    border: 2px solid var(--black);
    background: var(--bg-secondary);
    font-weight: 600;
}

.search-group {
    display: flex;
    gap: 0.5rem;
    margin-left: auto;
}

.search-input {
    padding: 0.5rem 1rem;
    border: 2px solid var(--black);
    background: var(--bg-secondary);
    min-width: 200px;
}

.search-btn {
    padding: 0.5rem 1rem;
    border: 2px solid var(--black);
    background: var(--primary);
    color: white;
    cursor: pointer;
}

.view-toggle {
    display: flex;
    gap: 0.5rem;
}

.view-btn {
    padding: 0.5rem;
    border: 2px solid var(--black);
    background: var(--bg-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
}

.view-btn.active {
    background: var(--primary);
    color: white;
}

.featured-stream {
    margin: 2rem 0;
}

.featured-video-player {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.featured-video-player img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.featured-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
    padding: 2rem;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}

.featured-info h3 {
    font-size: 1.5rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
}

.featured-meta {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.live-badge {
    background: var(--danger);
    padding: 4px 8px;
    font-weight: 800;
    font-size: 0.75rem;
    text-transform: uppercase;
    animation: brutal-live-pulse 2s infinite;
}

.featured-play-btn {
    padding: 1rem 2rem;
    font-size: 1.1rem;
}

.featured-badge {
    background: var(--primary);
    padding: 4px 8px;
    font-weight: 800;
    font-size: 0.75rem;
    text-transform: uppercase;
}

.live-indicator {
    background: var(--danger);
    color: white;
    padding: 0.5rem 1rem;
    font-weight: 800;
    text-transform: uppercase;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    animation: brutal-live-pulse 2s infinite;
}

.live-indicator::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    background: currentColor;
    border-radius: 50%;
    animation: brutal-live-pulse 1s infinite;
    margin-right: 4px;
}

/* API Error Box Styles */
.api-error-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 600px;
    padding: 2rem;
    grid-column: 1 / -1;
    width: 100%;
}

.api-error-box {
    max-width: 600px;
    width: 100%;
    padding: 3rem;
    text-align: center;
    background: var(--bg-secondary);
    border: 3px solid var(--border-color);
    box-shadow: 8px 8px 0px var(--black);
    position: relative;
    overflow: visible;
    height: auto;
    min-height: 500px;
}

.videos-grid.error-state {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 600px;
    grid-template-columns: none;
}

.error-state .api-error-container {
    grid-column: unset;
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
}

.api-error-box::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--danger), var(--warning), var(--danger));
    animation: error-pulse 2s ease-in-out infinite;
}

@keyframes error-pulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
}

.error-icon {
    font-size: 4rem;
    color: var(--warning);
    margin-bottom: 1.5rem;
    animation: error-shake 0.5s ease-in-out;
}

@keyframes error-shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}

.error-title {
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: 1rem;
    text-transform: uppercase;
}

.error-message {
    font-size: 1.1rem;
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: 2rem;
}

.error-details {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: var(--bg-primary);
    border: 2px solid var(--border-color);
    border-radius: 8px;
    min-height: 120px;
}

.error-detail-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.95rem;
    color: var(--text-secondary);
}

.error-detail-item i {
    color: var(--primary);
    width: 20px;
    text-align: center;
}

.error-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
}

.error-footer {
    padding-top: 1.5rem;
    border-top: 2px solid var(--border-color);
    color: var(--text-secondary);
}

.error-footer p {
    margin: 0.5rem 0;
}

.featured-error {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
    background: var(--bg-secondary);
    border: 3px solid var(--border-color);
}

.featured-error-content {
    text-align: center;
    color: var(--text-secondary);
}

.featured-error-content i {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: var(--warning);
}

.stat-error {
    opacity: 0.5;
    position: relative;
}

.stat-error::after {
    content: 'unavailable';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.8rem;
    color: var(--danger);
    text-transform: uppercase;
    font-weight: 600;
    background: var(--bg-secondary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    border: 1px solid var(--danger);
}

.error-state {
    display: flex !important;
    justify-content: center;
    align-items: flex-start;
    grid-template-columns: none !important;
    gap: 0;
}

.stream-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.stat-item {
    text-align: center;
    padding: 1rem;
    background: var(--bg-secondary);
    border: 2px solid var(--black);
    box-shadow: 4px 4px 0px var(--black);
}

.stat-number {
    display: block;
    font-size: 2rem;
    font-weight: 900;
    color: var(--primary);
}

.stat-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    font-weight: 600;
}

@media (max-width: 768px) {
    .filter-bar {
        flex-direction: column;
        align-items: stretch;
    }
    
    .search-group {
        margin-left: 0;
    }
    
    .search-input {
        min-width: auto;
        flex: 1;
    }
    
    .videos-grid {
        grid-template-columns: 1fr;
    }
    
    .video-card.list-view {
        flex-direction: column;
    }
    
    .video-card.list-view .video-thumbnail {
        flex: none;
    }
    
    .api-error-box {
        padding: 2rem 1rem;
        margin: 1rem;
        min-height: 400px;
    }
    
    .api-error-container {
        min-height: 500px;
        padding: 1rem;
    }
    
    .error-title {
        font-size: 1.4rem;
    }
    
    .error-actions {
        flex-direction: column;
    }
    
    .error-details {
        padding: 1rem;
        min-height: 100px;
    }
    
    .featured-overlay {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }
    
    .stream-stats {
        grid-template-columns: repeat(2, 1fr);
    }
}
`;

const streamStyleSheet = document.createElement('style');
streamStyleSheet.textContent = streamAnimationsCSS;
document.head.appendChild(streamStyleSheet);

document.addEventListener('DOMContentLoaded', () => {
    window.streamAPI = new StreamYouTubeAPI();
    new NeoBrutalStreamAnimations();
});
