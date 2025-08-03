const YOUTUBE_CONFIG = {
    // Secure configuration - no exposed API keys
    API_KEY: '', // Removed for security - handled by backend
    CHANNEL_ID: '', // Removed for security - handled by backend
    BASE_URL: '/api/youtube', // Use secure proxy endpoints
    MAX_RESULTS: 20,
    ENDPOINTS: {
        CHANNELS: '/channel',
        SEARCH: '/videos',
        VIDEOS: '/video'
    },
    // Fallback configuration for when API is unavailable
    FALLBACK_ENABLED: true,
    FALLBACK_CHANNEL_NAME: 'Afterlife',
    FALLBACK_CHANNEL_URL: 'https://www.youtube.com/@Afterlife_AL'
};

// Make available globally for browser usage
if (typeof window !== 'undefined') {
    window.YOUTUBE_CONFIG = YOUTUBE_CONFIG;
}

// Node.js export if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = YOUTUBE_CONFIG;
}
