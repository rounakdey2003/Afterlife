const YOUTUBE_CONFIG = {
    // Development configuration - for admin mode local testing
    // In production, these are handled by backend/Netlify functions
    API_KEY: (window && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) 
        ? 'AIzaSyDOfMa_fXXby2gAHiqy8TMXALaF9v_nyNk' 
        : '', // Empty for production - handled by backend
    CHANNEL_ID: (window && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) 
        ? 'UCAlaNcIETblKsMFIm42W0Ow' 
        : '', // Empty for production - handled by backend
    BASE_URL: (window && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) 
        ? '/api/youtube' 
        : '/.netlify/functions', // Use Netlify Functions for deployed version
    MAX_RESULTS: 20,
    ENDPOINTS: {
        CHANNELS: (window && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) 
            ? '/channel' 
            : '/youtube-channel',
        SEARCH: (window && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) 
            ? '/videos' 
            : '/youtube-videos',
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
