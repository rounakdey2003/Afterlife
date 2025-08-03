exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: 'ok', 
                timestamp: new Date().toISOString(),
                hasApiKey: !!process.env.YOUTUBE_API_KEY,
                hasChannelId: !!process.env.YOUTUBE_CHANNEL_ID,
                platform: 'netlify'
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Health check failed' 
            })
        };
    }
};
