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
        const API_KEY = process.env.YOUTUBE_API_KEY;
        const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

        if (!API_KEY || !CHANNEL_ID) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'YouTube API configuration missing',
                    fallback: true 
                })
            };
        }

        // Parse query parameters
        const queryParams = event.queryStringParameters || {};
        const maxResults = queryParams.maxResults || 20;
        const order = queryParams.order || 'date';

        // Search for videos
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet,id&channelId=${CHANNEL_ID}&maxResults=${maxResults}&order=${order}&type=video&key=${API_KEY}`;
        
        const searchResponse = await fetch(searchUrl);
        
        if (!searchResponse.ok) {
            const errorData = await searchResponse.json().catch(() => ({}));
            throw new Error(`YouTube API Error: ${searchResponse.status} - ${errorData.error?.message || searchResponse.statusText}`);
        }
        
        const searchData = await searchResponse.json();
        
        if (searchData.items && searchData.items.length > 0) {
            // Get video statistics
            const videoIds = searchData.items.map(item => item.id.videoId).join(',');
            const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${API_KEY}`;
            
            const videoResponse = await fetch(videoUrl);
            const videoData = await videoResponse.json();
            
            // Combine search and video data
            const combinedData = searchData.items.map(searchItem => {
                const videoItem = videoData.items.find(v => v.id === searchItem.id.videoId);
                return {
                    ...searchItem,
                    statistics: videoItem?.statistics || {},
                    contentDetails: videoItem?.contentDetails || {}
                };
            });
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ ...searchData, items: combinedData })
            };
        } else {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(searchData)
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to fetch videos',
                fallback: true 
            })
        };
    }
};
