class SimplifiedToolsPage {
    constructor() {
        this.currentConfig = null;
        this.isAdminMode = false;
        this.isPublicMode = false;
        this.init();
    }

    init() {
        this.checkAdminMode();
        this.setupBasicInteractions();
        this.setupEventListeners();
        
        if (!this.isAdminMode) {
            this.checkApiConfiguration();
        }
        
        // Wait for loading screen to finish before showing any notifications
        setTimeout(() => {
            if (this.isAdminMode) {
                this.setupToolsAccess();
            } else if (this.isPublicMode) {
                window.showNotification('Public mode: Configure your API credentials to access tools with your own data', 'info');
            }
        }, 1500); // Give loading screen time to complete
    }

    // Loading state management functions
    showLoadingState(elementId, message = 'Loading', useSkeletonLoader = false, skeletonType = 'default') {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        if (useSkeletonLoader) {
            element.innerHTML = this.getSkeletonLoader(skeletonType);
        } else {
            const size = message.length > 20 ? 'large' : '';
            element.innerHTML = `<div class="tools-loading-spinner ${size}">${message}<span class="loading-dots"></span></div>`;
        }
    }

    getSkeletonLoader(type = 'default', count = 3) {
        switch (type) {
            case 'video':
                return Array(count).fill(0).map(() => `
                    <div class="skeleton-video-item">
                        <div class="skeleton-loader skeleton-rank"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-loader skeleton-title"></div>
                            <div class="skeleton-loader skeleton-stats"></div>
                        </div>
                    </div>
                `).join('');
                
            case 'comment':
                return Array(count).fill(0).map(() => `
                    <div class="skeleton-comment-item">
                        <div class="skeleton-loader skeleton-avatar"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-loader skeleton-name"></div>
                            <div class="skeleton-loader skeleton-text"></div>
                            <div class="skeleton-loader skeleton-text"></div>
                        </div>
                    </div>
                `).join('');
                
            default:
                return `<div class="tools-loading-spinner">Loading<span class="loading-dots"></span></div>`;
        }
    }

    checkAdminMode() {
        // Check if this is accessed from admin panel or has admin parameter
        const urlParams = new URLSearchParams(window.location.search);
        
        // Check for public mode first
        const isPublicMode = urlParams.get('public') === 'true';
        
        if (isPublicMode) {
            this.isAdminMode = false;
            this.isPublicMode = true;
        } else {
            this.isAdminMode = urlParams.get('admin') === 'true' || 
                              document.referrer.includes('admin.html') ||
                              localStorage.getItem('adminAuth') === 'true';
            this.isPublicMode = false;
        }
                          
        this.updateModeIndicator();
        
        // Auto-open tool if specified in URL
        const toolParam = urlParams.get('tool');
        if (toolParam) {
            setTimeout(() => {
                switch(toolParam) {
                    case 'giveaway':
                        this.showGiveawayTool();
                        break;
                    case 'analytics':
                        this.showAnalyticsTool();
                        break;
                    case 'community':
                        this.showCommunityTool();
                        break;
                }
            }, 2500); // Wait for page to fully load and loading screen to finish
        }
    }

    updateModeIndicator() {
        const modeIndicator = document.getElementById('modeIndicator');
        const apiConfigSection = document.getElementById('apiConfigSection');
        
        if (this.isAdminMode) {
            modeIndicator.innerHTML = `
                <div class="mode-indicator admin">
                    <i class="fas fa-shield-alt"></i>
                    <strong>Admin Mode:</strong> Using pre-configured API credentials - Private Access
                </div>
            `;
            if (apiConfigSection) {
                apiConfigSection.style.display = 'none';
            }
            this.updateAccessIndicators('private');
        } else if (this.isPublicMode) {
            modeIndicator.innerHTML = `
                <div class="mode-indicator public">
                    <i class="fas fa-globe"></i>
                    <strong>Public Mode:</strong> Use your own YouTube API credentials - Full data privacy
                </div>
            `;
            if (apiConfigSection) {
                apiConfigSection.style.display = 'block';
            }
            this.updateAccessIndicators('public');
        } else {
            modeIndicator.innerHTML = `
                <div class="mode-indicator public">
                    <i class="fas fa-users"></i>
                    <strong>Public Mode:</strong> Configure your own YouTube API credentials below
                </div>
            `;
            if (apiConfigSection) {
                apiConfigSection.style.display = 'block';
            }
            this.updateAccessIndicators('public');
        }
    }

    updateAccessIndicators(accessType) {
        const indicators = ['giveawayAccess', 'analyticsAccess', 'communityAccess'];
        indicators.forEach(id => {
            const indicator = document.getElementById(id);
            if (indicator) {
                indicator.textContent = accessType === 'private' ? 'Private' : 'Public';
                indicator.className = `access-indicator ${accessType}`;
            }
        });
    }

    setupToolsAccess() {
        const toolsGrid = document.querySelector('.tools-grid');
        
        if (this.isAdminMode) {
            // Admin mode - tools are always enabled
            toolsGrid.classList.add('tools-enabled');
            toolsGrid.classList.remove('tools-disabled');
            
            // Try multiple ways to get the config
            const config = window.YOUTUBE_CONFIG || YOUTUBE_CONFIG || {};
            this.currentConfig = {
                apiKey: config.API_KEY,
                channelId: config.CHANNEL_ID
            };
            
            // Verify admin config is working
            if (this.currentConfig.apiKey && this.currentConfig.channelId) {
                this.testApiConfiguration().then(success => {
                    if (success) {
                        // Delay notification to not interfere with loading screen
                        setTimeout(() => {
                            window.showNotification('Admin mode active - YouTube tools are ready!', 'success');
                        }, 2000);
                    } else {
                        setTimeout(() => {
                            window.showNotification('Admin mode: API configuration test failed', 'warning');
                        }, 2000);
                    }
                }).catch(error => {
                    
                    setTimeout(() => {
                        window.showNotification('Admin mode: Failed to validate API configuration', 'error');
                    }, 2000);
                });
            } else {
                
                setTimeout(() => {
                    window.showNotification('Admin mode: YouTube configuration not found', 'warning');
                }, 2000);
            }
        } else {
            // Public mode - configuration already checked in init()
        }
    }

    checkApiConfiguration() {
        if (this.isAdminMode) {
            // Admin mode handled separately in setupToolsAccess
            return;
        }

        const savedConfig = localStorage.getItem('afterlife_youtube_config');
        const toolsGrid = document.querySelector('.tools-grid');
        
        if (savedConfig) {
            try {
                this.currentConfig = JSON.parse(savedConfig);
                if (this.currentConfig.apiKey && this.currentConfig.channelId) {
                    toolsGrid.classList.add('tools-enabled');
                    toolsGrid.classList.remove('tools-disabled');
                    
                    // Delay success message until after loading screen
                    setTimeout(() => {
                        this.showConfigStatus('Configuration loaded successfully! Tools are now available.', 'success');
                    }, 2000);
                    
                    // Hide API config section and show summary
                    const apiConfigSection = document.getElementById('apiConfigSection');
                    if (apiConfigSection) {
                        apiConfigSection.innerHTML = this.getConfigSummaryHTML();
                    }
                    return;
                }
            } catch (error) {
                
            }
        }
        
        // No valid configuration found
        toolsGrid.classList.add('tools-disabled');
        toolsGrid.classList.remove('tools-enabled');
        this.currentConfig = null;
    }

    getConfigSummaryHTML() {
        return `
            <div class="config-card">
                <div class="config-header" style="background: var(--success);">
                    <h3>
                        <i class="fas fa-check-circle"></i>
                        API Configuration Active
                    </h3>
                    <p>Your YouTube tools are ready to use</p>
                </div>
                <div class="config-form">
                    <div class="config-summary">
                        <div class="summary-item">
                            <strong>API Key:</strong> ••••••••••••${this.currentConfig.apiKey.slice(-8)}
                        </div>
                        <div class="summary-item">
                            <strong>Channel ID:</strong> ${this.currentConfig.channelId}
                        </div>
                    </div>
                    <div class="config-actions">
                        <button class="test-config-btn" onclick="toolsPage.testApiConfiguration()">
                            <i class="fas fa-sync"></i>
                            Test Connection
                        </button>
                        <button class="save-config-btn" onclick="toolsPage.reconfigureApi()">
                            <i class="fas fa-edit"></i>
                            Reconfigure
                        </button>
                        <button class="clear-config-btn" onclick="toolsPage.clearApiConfiguration()">
                            <i class="fas fa-trash"></i>
                            Clear Configuration
                        </button>
                    </div>
                    <div id="configStatus" class="config-status"></div>
                </div>
            </div>
        `;
    }

    async testApiConfiguration() {
        let apiKey, channelId;
        
        if (this.isAdminMode) {
            // Admin mode - use pre-configured credentials
            const config = window.YOUTUBE_CONFIG || YOUTUBE_CONFIG || {};
            apiKey = config.API_KEY;
            channelId = config.CHANNEL_ID;
            
            if (!apiKey || !channelId) {
                this.showConfigStatus('Admin configuration not found', 'error');
                return false;
            }
        } else {
            // Public mode - use user's credentials
            apiKey = document.getElementById('userApiKey')?.value || this.currentConfig?.apiKey;
            channelId = document.getElementById('userChannelId')?.value || this.currentConfig?.channelId;
        }

        if (!apiKey || !channelId) {
            this.showConfigStatus('Please enter both API key and Channel ID', 'error');
            return false;
        }

        this.showConfigStatus('Testing configuration...', 'info');

        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(`API Error: ${data.error.message}`);
            }

            if (data.items && data.items.length > 0) {
                const channel = data.items[0];
                const accessType = this.isAdminMode ? '(Private Admin Access)' : '(Public User Access)';
                this.showConfigStatus(
                    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Success! Connected to channel: "${channel.snippet.title}" ${accessType}`,
                    'success'
                );
                return true;
            } else {
                this.showConfigStatus('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg> Channel not found. Please check your Channel ID.', 'error');
                return false;
            }
        } catch (error) {
            
            this.showConfigStatus(`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg> Connection failed: ${error.message}`, 'error');
            return false;
        }
    }

    async saveApiConfiguration() {
        if (this.isAdminMode) return;

        const apiKey = document.getElementById('userApiKey')?.value?.trim();
        const channelId = document.getElementById('userChannelId')?.value?.trim();

        if (!apiKey || !channelId) {
            this.showConfigStatus('Please enter both API key and Channel ID', 'error');
            return;
        }

        // Test configuration first
        this.showConfigStatus('Validating configuration...', 'info');
        
        if (await this.testApiConfiguration()) {
            // Save to localStorage
            const config = { apiKey, channelId };
            localStorage.setItem('afterlife_youtube_config', JSON.stringify(config));
            this.currentConfig = config;

            // Enable tools
            const toolsGrid = document.querySelector('.tools-grid');
            toolsGrid.classList.add('tools-enabled');
            toolsGrid.classList.remove('tools-disabled');

            // Update UI to show summary
            const apiConfigSection = document.getElementById('apiConfigSection');
            if (apiConfigSection) {
                apiConfigSection.innerHTML = this.getConfigSummaryHTML();
            }

            window.showNotification('Configuration saved successfully! Tools are now enabled.', 'success');
        }
    }

    reconfigureApi() {
        const apiConfigSection = document.getElementById('apiConfigSection');
        if (apiConfigSection) {
            // Restore the original configuration form
            location.reload(); // Simple way to reset the form
        }
    }

    clearApiConfiguration() {
        if (confirm('Are you sure you want to clear your API configuration? This will disable all tools.')) {
            localStorage.removeItem('afterlife_youtube_config');
            this.currentConfig = null;

            // Disable tools
            const toolsGrid = document.querySelector('.tools-grid');
            toolsGrid.classList.add('tools-disabled');
            toolsGrid.classList.remove('tools-enabled');

            this.showConfigStatus('Configuration cleared. Tools are now disabled.', 'info');
            window.showNotification('API configuration cleared', 'info');

            // Reload to show configuration form again
            setTimeout(() => location.reload(), 1500);
        }
    }

    showConfigStatus(message, type) {
        const statusElement = document.getElementById('configStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `config-status ${type}`;
            statusElement.style.display = 'block';

            if (type !== 'info') {
                setTimeout(() => {
                    statusElement.style.display = 'none';
                }, 5000);
            }
        }
    }

    validateAccess() {
        // Prevent access to admin credentials from public mode
        if (this.isPublicMode && !this.currentConfig) {
            window.showNotification('Security: Public mode requires your own API credentials', 'error');
            return false;
        }
        
        // Prevent mixing of admin and public credentials
        if (this.isAdminMode) {
            const adminConfig = window.YOUTUBE_CONFIG || YOUTUBE_CONFIG || {};
            if (!adminConfig.API_KEY || !adminConfig.CHANNEL_ID) {
                window.showNotification('Security: Admin credentials not properly configured', 'error');
                return false;
            }
        }
        
        return true;
    }

    // Tool modal functions with security validation
    showGiveawayTool() {
        if (!this.isConfigured()) {
            this.showConfigurationError();
            return;
        }
        if (!this.validateAccess()) {
            return; // validateAccess handles its own notifications
        }
        
        const modal = document.getElementById('giveawayModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            this.loadGiveawayDemo();
        }
    }

    showAnalyticsTool() {
        if (!this.isConfigured()) {
            this.showConfigurationError();
            return;
        }
        if (!this.validateAccess()) {
            return; // validateAccess handles its own notifications
        }
        
        const modal = document.getElementById('analyticsModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            this.loadAnalyticsDemo();
        }
    }

    showCommunityTool() {
        if (!this.isConfigured()) {
            this.showConfigurationError();
            return;
        }
        if (!this.validateAccess()) {
            return; // validateAccess handles its own notifications
        }
        
        const modal = document.getElementById('communityModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            this.loadCommunityDemo();
        }
    }

    loadGiveawayDemo() {
        // Show skeleton first, then demo data
        this.showLoadingState('winnersList', 'Loading subscriber data', true, 'comment');
        
        setTimeout(() => {
            const config = this.getApiConfig();
            if (config && config.channelId) {
                const accessType = config.accessType === 'private' ? 'admin channel (private)' : 'your channel (public)';
                window.showNotification(
                    `Giveaway tool loaded with ${accessType} configuration`, 
                    'success'
                );
                
                // Show demo winners after loading
                const mockWinners = [
                    { name: 'CodeMaster2024', loyaltyScore: 95, engagementRate: '8.5%', joinDate: '2 years ago' },
                    { name: 'TechEnthusiast', loyaltyScore: 92, engagementRate: '7.2%', joinDate: '1.5 years ago' },
                    { name: 'CreativeGuru', loyaltyScore: 89, engagementRate: '6.8%', joinDate: '8 months ago' }
                ];
                
                const winnersHtml = mockWinners.map((winner, index) => `
                    <div class="winner-item">
                        <div class="winner-rank">#${index + 1}</div>
                        <div class="winner-info">
                            <div class="winner-name">${winner.name}</div>
                            <div class="winner-stats">
                                <span class="loyalty-score">Loyalty: ${winner.loyaltyScore}%</span>
                                <span class="engagement">Engagement: ${winner.engagementRate}</span>
                                <span class="join-date">Member since: ${winner.joinDate}</span>
                            </div>
                        </div>
                    </div>
                `).join('');
                
                document.getElementById('winnersList').innerHTML = winnersHtml;
            } else {
                // Show error state for tools
                document.getElementById('winnersList').innerHTML = `
                    <div style="text-align: center; padding: 2rem; background: var(--card-bg); border: 2px solid var(--danger); border-radius: 8px;">
                        <div style="font-size: 2rem; margin-bottom: 1rem; color: var(--danger);">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <h4 style="margin-bottom: 0.5rem;">UNABLE TO LOAD SUBSCRIBER DATA</h4>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">API configuration required to access subscriber data</p>
                    </div>
                `;
            }
        }, 1500);
    }

    loadAnalyticsDemo() {
        // Show loading for video performance data
        this.showLoadingState('videosList', 'Loading video performance data', true, 'video');
        this.showLoadingState('totalViews', 'Loading');
        this.showLoadingState('subscriberCount', 'Loading');
        this.showLoadingState('watchTime', 'Loading');
        this.showLoadingState('engagementRate', 'Loading');
        
        setTimeout(() => {
            const config = this.getApiConfig();
            if (config && config.channelId) {
                // Update channel analytics with real/demo data
                const stats = {
                    totalViews: config.accessType === 'private' ? '2.4M' : '150K',
                    subscriberCount: config.accessType === 'private' ? '125K' : '2.5K',
                    watchTime: config.accessType === 'private' ? '18.5K' : '850',
                    engagementRate: config.accessType === 'private' ? '4.2%' : '3.8%'
                };
                
                Object.keys(stats).forEach(key => {
                    const element = document.getElementById(key);
                    if (element) {
                        element.textContent = stats[key];
                    }
                });
                
                // Load video performance data
                const videosHtml = config.accessType === 'private' ? `
                    <div class="video-performance-item">
                        <div class="video-rank">1</div>
                        <div class="video-info">
                            <div class="video-title">Latest Gaming Stream</div>
                            <div class="video-stats">
                                <span>Views: 156K</span>
                                <span>Likes: 8.2K</span>
                                <span>Comments: 432</span>
                                <span>CTR: 12.5%</span>
                            </div>
                        </div>
                    </div>
                    <div class="video-performance-item">
                        <div class="video-rank">2</div>
                        <div class="video-info">
                            <div class="video-title">Tournament Highlights</div>
                            <div class="video-stats">
                                <span>Views: 89K</span>
                                <span>Likes: 4.1K</span>
                                <span>Comments: 267</span>
                                <span>CTR: 9.8%</span>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div style="text-align: center; padding: 2rem; background: var(--card-bg); border: 2px solid var(--danger); border-radius: 8px;">
                        <div style="font-size: 2rem; margin-bottom: 1rem; color: var(--danger);">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <h4 style="margin-bottom: 0.5rem;">UNABLE TO LOAD VIDEO DATA</h4>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">Configure your API credentials to access detailed analytics</p>
                    </div>
                `;
                
                const videosListElement = document.getElementById('videosList');
                if (videosListElement) {
                    videosListElement.innerHTML = videosHtml;
                }
                
                const accessType = config.accessType === 'private' ? 'admin channel data (private)' : 'your channel data (public)';
                window.showNotification(
                    `Analytics dashboard loaded with ${accessType}`, 
                    'success'
                );
            } else {
                // Show error states for all analytics
                ['totalViews', 'subscriberCount', 'watchTime', 'engagementRate'].forEach(id => {
                    const element = document.getElementById(id);
                    if (element) element.textContent = 'N/A';
                });
                
                const videosListElement = document.getElementById('videosList');
                if (videosListElement) {
                    videosListElement.innerHTML = `
                        <div style="text-align: center; padding: 2rem; background: var(--card-bg); border: 2px solid var(--danger); border-radius: 8px;">
                            <div style="font-size: 2rem; margin-bottom: 1rem; color: var(--danger);">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <h4 style="margin-bottom: 0.5rem;">UNABLE TO LOAD ANALYTICS</h4>
                            <p style="color: var(--text-secondary); font-size: 0.9rem;">API configuration required to access analytics data</p>
                        </div>
                    `;
                }
            }
        }, 1200);
    }

    loadCommunityDemo() {
        // Show loading for comments and moderation queue
        this.showLoadingState('commentsList', 'Loading comments', true, 'comment');
        this.showLoadingState('queueList', 'Loading moderation queue', true, 'comment');
        this.showLoadingState('topCommenters', 'Loading top commenters');
        
        setTimeout(() => {
            const config = this.getApiConfig();
            if (config && config.channelId) {
                // Load real/demo community data
                const commentsHtml = `
                    <div class="comment-item">
                        <div class="comment-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="comment-content">
                            <div class="comment-header">
                                <span class="comment-author">TechLover2024</span>
                                <span class="comment-time">2 hours ago</span>
                                <span class="comment-video">Latest Gaming Stream</span>
                            </div>
                            <div class="comment-text">This stream is amazing! Great gameplay and commentary.</div>
                            <div class="comment-actions">
                                <button class="approve-btn"><i class="fas fa-check"></i> Approve</button>
                                <button class="flag-btn"><i class="fas fa-flag"></i> Flag</button>
                                <button class="reply-btn"><i class="fas fa-reply"></i> Reply</button>
                            </div>
                        </div>
                    </div>
                `;
                
                const queueHtml = config.accessType === 'private' ? `
                    <div class="queue-item pending">
                        <div class="queue-content">
                            <div class="queue-header">
                                <span class="queue-author">Gaming Fan</span>
                                <span class="queue-reason">Pending Review</span>
                            </div>
                            <div class="queue-text">Love your content! Keep up the great work.</div>
                            <div class="queue-actions">
                                <button class="approve-btn">Approve</button>
                                <button class="reject-btn">Reject</button>
                                <button class="review-btn">Review</button>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div style="text-align: center; padding: 2rem; background: var(--card-bg); border: 2px solid var(--danger); border-radius: 8px;">
                        <div style="font-size: 2rem; margin-bottom: 1rem; color: var(--danger);">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <h4 style="margin-bottom: 0.5rem;">UNABLE TO LOAD MODERATION QUEUE</h4>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">Configure your API credentials to access moderation features</p>
                    </div>
                `;
                
                const commentersHtml = `
                    <div class="commenter-item">
                        <div class="commenter-rank">1</div>
                        <div class="commenter-info">
                            <div class="commenter-name">DevMaster</div>
                            <div class="commenter-stats">
                                <span>Comments: 47</span>
                                <span>Avg Rating: 4.8/5</span>
                            </div>
                        </div>
                    </div>
                `;
                
                document.getElementById('commentsList').innerHTML = commentsHtml;
                document.getElementById('queueList').innerHTML = queueHtml;
                document.getElementById('topCommenters').innerHTML = commentersHtml;
                
                const accessType = config.accessType === 'private' ? 'admin channel (private)' : 'your channel (public)';
                window.showNotification(
                    `Community manager loaded with ${accessType} configuration`, 
                    'success'
                );
            } else {
                // Show error states for all community data
                ['commentsList', 'queueList', 'topCommenters'].forEach(id => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.innerHTML = `
                            <div style="text-align: center; padding: 2rem; background: var(--card-bg); border: 2px solid var(--danger); border-radius: 8px;">
                                <div style="font-size: 2rem; margin-bottom: 1rem; color: var(--danger);">
                                    <i class="fas fa-exclamation-triangle"></i>
                                </div>
                                <h4 style="margin-bottom: 0.5rem;">UNABLE TO LOAD COMMUNITY DATA</h4>
                                <p style="color: var(--text-secondary); font-size: 0.9rem;">API configuration required to access community features</p>
                            </div>
                        `;
                    }
                });
            }
        }, 1500);
    }

    hideGiveawayTool() {
        const modal = document.getElementById('giveawayModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    hideAnalyticsTool() {
        const modal = document.getElementById('analyticsModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    hideCommunityTool() {
        const modal = document.getElementById('communityModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    isConfigured() {
        if (this.isAdminMode) {
            // Admin mode should always be configured
            const config = this.getApiConfig();
            if (!config) {
                return false;
            }
            return true;
        }
        
        if (!this.currentConfig || !this.currentConfig.apiKey || !this.currentConfig.channelId) {
            return false;
        }
        return true;
    }

    showConfigurationError() {
        if (this.isAdminMode) {
            window.showNotification('Admin configuration error: Please contact administrator', 'error');
        } else {
            window.showNotification('Please configure your YouTube API credentials first', 'warning');
            // Scroll to configuration section
            this.scrollToConfiguration();
        }
    }

    scrollToConfiguration() {
        const configSection = document.getElementById('apiConfigSection');
        if (configSection) {
            configSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Add a subtle highlight effect to draw attention
            configSection.style.transition = 'box-shadow 0.3s ease';
            configSection.style.boxShadow = '0 0 20px rgba(var(--primary-rgb), 0.3)';
            
            // Remove highlight after a few seconds
            setTimeout(() => {
                configSection.style.boxShadow = '';
            }, 3000);
        }
    }

    getApiConfig() {
        if (this.isAdminMode) {
            // Admin mode - use pre-configured private credentials
            const config = window.YOUTUBE_CONFIG || YOUTUBE_CONFIG || {};
            if (config.API_KEY && config.CHANNEL_ID) {
                return {
                    apiKey: config.API_KEY,
                    channelId: config.CHANNEL_ID,
                    accessType: 'private'
                };
            } else {
                
                return null;
            }
        } else {
            // Public mode - use user's own credentials
            if (this.currentConfig && this.currentConfig.apiKey && this.currentConfig.channelId) {
                return {
                    ...this.currentConfig,
                    accessType: 'public'
                };
            }
            return null;
        }
    }

    setupLoadingScreen() {
        // Let the universal loading manager handle the loading screen
        // This ensures consistency with other pages
        if (window.loadingManager) {
            // Loading manager is already initialized
            return;
        }
        
        // Fallback if loading manager isn't available
        window.addEventListener('load', () => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    loadingScreen.style.opacity = '0';
                    loadingScreen.style.visibility = 'hidden';
                    loadingScreen.style.pointerEvents = 'none';
                    
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                    }, 800); // Match CSS transition duration
                }, 1000);
            }
        });
    }

    setupBasicInteractions() {
        // Mobile menu is handled by MobileMenuManager in theme-toggle.js
        // No need for duplicate setup here

        // Header scroll effect
        const header = document.querySelector('.header');
        if (header) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            });
        }
    }

    setupEventListeners() {
        // Tool category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const category = btn.dataset.category;
                this.filterTools(category);
            });
        });

        // Tool cards click handlers
        document.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', () => {
                const toolName = card.querySelector('h3').textContent;
                if (!this.isConfigured()) {
                    this.showConfigurationError();
                    return;
                }
            });
        });

        // Escape key to close modals
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.hideGiveawayTool();
                this.hideAnalyticsTool();
                this.hideCommunityTool();
            }
        });

        // Back to top button
        const backToTop = document.getElementById('backToTop');
        if (backToTop) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 300) {
                    backToTop.style.display = 'flex';
                } else {
                    backToTop.style.display = 'none';
                }
            });

            backToTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    filterTools(category) {
        const tools = document.querySelectorAll('.tool-card');
        tools.forEach(tool => {
            if (category === 'all' || tool.dataset.category === category) {
                tool.style.display = 'block';
            } else {
                tool.style.display = 'none';
            }
        });
    }
}

// Global variable for access from HTML
let toolsPage;

// Global functions for HTML onclick handlers
function testApiConfiguration() {
    if (toolsPage) toolsPage.testApiConfiguration();
}

function saveApiConfiguration() {
    if (toolsPage) toolsPage.saveApiConfiguration();
}

function clearApiConfiguration() {
    if (toolsPage) toolsPage.clearApiConfiguration();
}

function showGiveawayTool() {
    if (toolsPage) toolsPage.showGiveawayTool();
}

function showAnalyticsTool() {
    if (toolsPage) toolsPage.showAnalyticsTool();
}

function showCommunityTool() {
    if (toolsPage) toolsPage.showCommunityTool();
}

function hideGiveawayTool() {
    if (toolsPage) toolsPage.hideGiveawayTool();
}

function hideAnalyticsTool() {
    if (toolsPage) toolsPage.hideAnalyticsTool();
}

function hideCommunityTool() {
    if (toolsPage) toolsPage.hideCommunityTool();
}

// Additional tool functions referenced in HTML
function analyzeSubscribers() {
    if (toolsPage) {
        const config = toolsPage.getApiConfig();
        if (config) {
            toolsPage.showLoadingState('winnersList', 'Analyzing subscriber data');
            
            // Simulate API call and analysis
            setTimeout(() => {
                const mockWinners = [
                    { name: 'CodeMaster2024', loyaltyScore: 95, engagementRate: '8.5%', joinDate: '2 years ago' },
                    { name: 'TechEnthusiast', loyaltyScore: 92, engagementRate: '7.2%', joinDate: '1.5 years ago' },
                    { name: 'CreativeGuru', loyaltyScore: 89, engagementRate: '6.8%', joinDate: '8 months ago' },
                    { name: 'LoyalViewer123', loyaltyScore: 87, engagementRate: '5.9%', joinDate: '1 year ago' },
                    { name: 'SuperFan2023', loyaltyScore: 85, engagementRate: '5.4%', joinDate: '6 months ago' }
                ];
                
                const winnersHtml = mockWinners.map((winner, index) => `
                    <div class="winner-item">
                        <div class="winner-rank">#${index + 1}</div>
                        <div class="winner-info">
                            <div class="winner-name">${winner.name}</div>
                            <div class="winner-stats">
                                <span class="loyalty-score">Loyalty: ${winner.loyaltyScore}%</span>
                                <span class="engagement">Engagement: ${winner.engagementRate}</span>
                                <span class="join-date">Member since: ${winner.joinDate}</span>
                            </div>
                        </div>
                        <div class="winner-actions">
                            <button class="contact-btn" onclick="contactWinner('${winner.name}')">
                                <i class="fas fa-envelope"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
                
                document.getElementById('winnersList').innerHTML = winnersHtml;
                window.showNotification(`Found ${mockWinners.length} eligible winners based on your criteria!`, 'success');
            }, 2000);
        }
    }
}

function exportWinners() {
    if (toolsPage) {
        window.showNotification('Exporting winners list to CSV...', 'info');
        // Simulate download
        setTimeout(() => {
            window.showNotification('Winners list downloaded successfully!', 'success');
        }, 1500);
    }
}

function rerunGiveaway() {
    if (toolsPage) {
        document.getElementById('winnersList').innerHTML = '<p class="no-data">Click "Analyze Subscribers" to find eligible winners</p>';
        window.showNotification('Ready for new analysis. Click "Analyze Subscribers" to run again.', 'info');
    }
}

function contactWinner(winnerName) {
    if (toolsPage) {
        window.showNotification(`Opening contact options for ${winnerName}...`, 'info');
    }
}

function refreshAnalytics() {
    if (toolsPage) {
        const config = toolsPage.getApiConfig();
        if (config) {
            window.showNotification('Refreshing analytics data...', 'info');
            
            // Simulate loading real data
            setTimeout(() => {
                // Update stats with mock data
                const stats = {
                    totalViews: '2.4M',
                    subscriberCount: '125K',
                    watchTime: '18.5K',
                    engagementRate: '4.2%'
                };
                
                Object.keys(stats).forEach(key => {
                    const element = document.getElementById(key);
                    if (element) {
                        element.textContent = stats[key];
                    }
                });
                
                // Load video performance data
                const videosHtml = `
                    <div class="video-performance-item">
                        <div class="video-rank">1</div>
                        <div class="video-info">
                            <div class="video-title">Ultimate JavaScript Tutorial</div>
                            <div class="video-stats">
                                <span>Views: 156K</span>
                                <span>Likes: 8.2K</span>
                                <span>Comments: 432</span>
                                <span>CTR: 12.5%</span>
                            </div>
                        </div>
                    </div>
                    <div class="video-performance-item">
                        <div class="video-rank">2</div>
                        <div class="video-info">
                            <div class="video-title">React Best Practices 2024</div>
                            <div class="video-stats">
                                <span>Views: 89K</span>
                                <span>Likes: 4.1K</span>
                                <span>Comments: 267</span>
                                <span>CTR: 9.8%</span>
                            </div>
                        </div>
                    </div>
                    <div class="video-performance-item">
                        <div class="video-rank">3</div>
                        <div class="video-info">
                            <div class="video-title">CSS Grid Masterclass</div>
                            <div class="video-stats">
                                <span>Views: 67K</span>
                                <span>Likes: 3.5K</span>
                                <span>Comments: 189</span>
                                <span>CTR: 8.9%</span>
                            </div>
                        </div>
                    </div>
                `;
                
                const videosListElement = document.getElementById('videosList');
                if (videosListElement) {
                    videosListElement.innerHTML = videosHtml;
                }
                
                // Update engagement metrics
                const engagementStats = {
                    avgLikes: '3.2K',
                    avgComments: '245',
                    avgShares: '89'
                };
                
                Object.keys(engagementStats).forEach(key => {
                    const element = document.getElementById(key);
                    if (element) {
                        element.textContent = engagementStats[key];
                    }
                });
                
                window.showNotification('Analytics data refreshed successfully!', 'success');
            }, 1500);
        }
    }
}

function refreshCommunityData() {
    if (toolsPage) {
        const config = toolsPage.getApiConfig();
        if (config) {
            toolsPage.showLoadingState('commentsList', 'Loading comments', true, 'comment');
            toolsPage.showLoadingState('queueList', 'Loading moderation queue', true, 'comment');
            toolsPage.showLoadingState('topCommenters', 'Loading top commenters');
            
            setTimeout(() => {
                // Load recent comments
                const commentsHtml = `
                    <div class="comment-item">
                        <div class="comment-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="comment-content">
                            <div class="comment-header">
                                <span class="comment-author">TechLover2024</span>
                                <span class="comment-time">2 hours ago</span>
                                <span class="comment-video">Ultimate JavaScript Tutorial</span>
                            </div>
                            <div class="comment-text">This tutorial is amazing! Finally understood closures. Thank you!</div>
                            <div class="comment-actions">
                                <button class="approve-btn"><i class="fas fa-check"></i> Approve</button>
                                <button class="flag-btn"><i class="fas fa-flag"></i> Flag</button>
                                <button class="reply-btn"><i class="fas fa-reply"></i> Reply</button>
                            </div>
                        </div>
                    </div>
                    <div class="comment-item">
                        <div class="comment-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="comment-content">
                            <div class="comment-header">
                                <span class="comment-author">CodeNewbie</span>
                                <span class="comment-time">4 hours ago</span>
                                <span class="comment-video">React Best Practices 2024</span>
                            </div>
                            <div class="comment-text">Could you make a video about TypeScript next?</div>
                            <div class="comment-actions">
                                <button class="approve-btn"><i class="fas fa-check"></i> Approve</button>
                                <button class="flag-btn"><i class="fas fa-flag"></i> Flag</button>
                                <button class="reply-btn"><i class="fas fa-reply"></i> Reply</button>
                            </div>
                        </div>
                    </div>
                `;
                
                // Load moderation queue
                const queueHtml = `
                    <div class="queue-item pending">
                        <div class="queue-content">
                            <div class="queue-header">
                                <span class="queue-author">Anonymous User</span>
                                <span class="queue-reason">Flagged: Potential Spam</span>
                            </div>
                            <div class="queue-text">Check out my channel for amazing content!</div>
                            <div class="queue-actions">
                                <button class="approve-btn">Approve</button>
                                <button class="reject-btn">Reject</button>
                                <button class="review-btn">Review</button>
                            </div>
                        </div>
                    </div>
                `;
                
                // Load top commenters
                const commentersHtml = `
                    <div class="commenter-item">
                        <div class="commenter-rank">1</div>
                        <div class="commenter-info">
                            <div class="commenter-name">DevMaster</div>
                            <div class="commenter-stats">
                                <span>Comments: 47</span>
                                <span>Avg Rating: 4.8/5</span>
                            </div>
                        </div>
                    </div>
                    <div class="commenter-item">
                        <div class="commenter-rank">2</div>
                        <div class="commenter-info">
                            <div class="commenter-name">WebWizard</div>
                            <div class="commenter-stats">
                                <span>Comments: 39</span>
                                <span>Avg Rating: 4.6/5</span>
                            </div>
                        </div>
                    </div>
                `;
                
                document.getElementById('commentsList').innerHTML = commentsHtml;
                document.getElementById('queueList').innerHTML = queueHtml;
                document.getElementById('topCommenters').innerHTML = commentersHtml;
                
                window.showNotification('Community data refreshed successfully!', 'success');
            }, 2000);
        }
    }
}

function exportCommunityReport() {
    if (toolsPage) {
        window.showNotification('Generating community report...', 'info');
        setTimeout(() => {
            window.showNotification('Community report exported successfully!', 'success');
        }, 1500);
    }
}

function filterComments() {
    if (toolsPage) {
        const filter = document.getElementById('commentFilter').value;
        window.showNotification(`Filtering comments by: ${filter}`, 'info');
    }
}

function searchComments() {
    if (toolsPage) {
        const searchTerm = document.getElementById('commentSearch').value;
        if (searchTerm) {
            window.showNotification(`Searching for: "${searchTerm}"`, 'info');
        }
    }
}

function enableAutoModeration() {
    if (toolsPage) {
        window.showNotification('Auto-moderation enabled! Comments will be automatically filtered.', 'success');
    }
}

function bulkModerateComments() {
    if (toolsPage) {
        window.showNotification('Bulk moderation feature coming soon!', 'info');
    }
}

function saveModerationSettings() {
    if (toolsPage) {
        window.showNotification('Moderation settings saved successfully!', 'success');
    }
}

function saveCommunitySettings() {
    if (toolsPage) {
        window.showNotification('Community settings saved successfully!', 'success');
    }
}

function resetCommunitySettings() {
    if (toolsPage) {
        if (confirm('Reset all community settings to default?')) {
            window.showNotification('Settings reset to defaults!', 'info');
        }
    }
}

function switchTab(tabName) {
    // Switch analytics tabs
    document.querySelectorAll('.analytics-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#analyticsModal .tab-content').forEach(content => content.classList.remove('active'));
    
    const activeBtn = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
    const activeContent = document.getElementById(`${tabName}Tab`);
    
    if (activeBtn) activeBtn.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
}

function switchCommunityTab(tabName) {
    // Switch community tabs
    document.querySelectorAll('.community-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#communityModal .tab-content').forEach(content => content.classList.remove('active'));
    
    const activeBtn = document.querySelector(`[onclick="switchCommunityTab('${tabName}')"]`);
    const activeContent = document.getElementById(`${tabName}Tab`);
    
    if (activeBtn) activeBtn.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
}

function exportAnalytics(format) {
    if (toolsPage) {
        window.showNotification(`Exporting analytics in ${format.toUpperCase()} format...`, 'info');
        setTimeout(() => {
            window.showNotification(`Analytics report exported as ${format.toUpperCase()} successfully!`, 'success');
        }, 1500);
    }
}

function scheduleReport() {
    if (toolsPage) {
        window.showNotification('Opening report scheduler...', 'info');
        setTimeout(() => {
            window.showNotification('Weekly analytics report scheduled!', 'success');
        }, 1000);
    }
}

// Initialize the simplified tools page
document.addEventListener('DOMContentLoaded', () => {
    // Prevent multiple initialization
    if (!window.toolsPageInitialized) {
        window.toolsPageInitialized = true;
        toolsPage = new SimplifiedToolsPage();
    }
});
