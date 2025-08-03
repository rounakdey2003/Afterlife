const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for your domain and local network
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',') 
            : ['http://localhost:3000'];
        
        // Add local network patterns
        const localNetworkPatterns = [
            /^http:\/\/localhost:\d+$/,
            /^http:\/\/127\.0\.0\.1:\d+$/,
            /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
            /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
            /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+:\d+$/
        ];
        
        const isLocalNetwork = localNetworkPatterns.some(pattern => pattern.test(origin));
        const isAllowed = allowedOrigins.includes(origin) || isLocalNetwork;
        
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(express.static('.'));

// YouTube API proxy endpoints
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

// Admin authentication
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

// Validate environment variables
if (!API_KEY || !CHANNEL_ID) {
    if (!API_KEY) process.stderr.write('Missing YOUTUBE_API_KEY\n');
    if (!CHANNEL_ID) process.stderr.write('Missing YOUTUBE_CHANNEL_ID\n');
    process.stderr.write('Please create a .env file with these variables.\n');
    process.exit(1);
}

if (!ADMIN_PASSWORD) {
    // Admin login will be disabled
}

// Environment variables loaded successfully

// Helper function to make YouTube API requests
async function makeYouTubeRequest(endpoint, params = {}) {
    const url = new URL(`${YOUTUBE_API_BASE}${endpoint}`);
    url.searchParams.append('key', API_KEY);
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, value);
        }
    });

    try {
        const response = await fetch(url.toString());
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`YouTube API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// API Routes

// Admin Authentication
app.post('/api/auth/login', async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!ADMIN_PASSWORD) {
            return res.status(503).json({ 
                error: 'Admin authentication not configured',
                fallback: true 
            });
        }
        
        if (!password) {
            return res.status(400).json({ 
                error: 'Password is required' 
            });
        }
        
        // Simple password comparison (in production, use bcrypt)
        if (password === ADMIN_PASSWORD) {
            // Generate a simple session token
            const sessionToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
            
            res.json({ 
                success: true, 
                token: sessionToken,
                expiresAt: expiresAt,
                message: 'Authentication successful' 
            });
        } else {
            // Add delay to prevent brute force attacks
            await new Promise(resolve => setTimeout(resolve, 1000));
            res.status(401).json({ 
                error: 'Invalid password. Access denied.' 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            error: 'Authentication service unavailable' 
        });
    }
});

// Verify admin session
app.post('/api/auth/verify', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(401).json({ 
                error: 'No authentication token provided' 
            });
        }
        
        // Simple token validation (in production, use proper JWT)
        // For this implementation, we'll accept any non-empty token as valid
        // You can enhance this with proper JWT validation
        res.json({ 
            valid: true, 
            message: 'Session valid' 
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Session verification failed' 
        });
    }
});

// Get channel information
app.get('/api/youtube/channel', async (req, res) => {
    try {
        const data = await makeYouTubeRequest('/channels', {
            part: 'snippet,statistics',
            id: CHANNEL_ID
        });
        
        res.json(data);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to fetch channel data',
            fallback: true 
        });
    }
});

// Get channel videos
app.get('/api/youtube/videos', async (req, res) => {
    try {
        const maxResults = req.query.maxResults || 20;
        const order = req.query.order || 'date';
        
        const searchData = await makeYouTubeRequest('/search', {
            part: 'snippet,id',
            channelId: CHANNEL_ID,
            maxResults: maxResults,
            order: order,
            type: 'video'
        });
        
        if (searchData.items && searchData.items.length > 0) {
            // Get video statistics
            const videoIds = searchData.items.map(item => item.id.videoId).join(',');
            const videoData = await makeYouTubeRequest('/videos', {
                part: 'statistics,snippet,contentDetails',
                id: videoIds
            });
            
            // Combine search and video data
            const combinedData = searchData.items.map(searchItem => {
                const videoItem = videoData.items.find(v => v.id === searchItem.id.videoId);
                return {
                    ...searchItem,
                    statistics: videoItem?.statistics || {},
                    contentDetails: videoItem?.contentDetails || {}
                };
            });
            
            res.json({ ...searchData, items: combinedData });
        } else {
            res.json(searchData);
        }
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to fetch videos',
            fallback: true 
        });
    }
});

// Get specific video details
app.get('/api/youtube/video/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        
        const data = await makeYouTubeRequest('/videos', {
            part: 'snippet,statistics,contentDetails',
            id: videoId
        });
        
        res.json(data);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to fetch video data',
            fallback: true 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        hasApiKey: !!API_KEY,
        hasChannelId: !!CHANNEL_ID
    });
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    
    // Find the main network interface IP
    let networkIP = 'Unable to determine';
    for (const [name, interfaces] of Object.entries(networkInterfaces)) {
        for (const interface of interfaces) {
            // Skip internal and IPv6 addresses
            if (!interface.internal && interface.family === 'IPv4') {
                networkIP = interface.address;
                break;
            }
        }
        if (networkIP !== 'Unable to determine') break;
    }
    
    console.log(`Server running on:`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://${networkIP}:${PORT}`);
});
