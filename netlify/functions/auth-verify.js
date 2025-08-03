exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { token } = JSON.parse(event.body);
        
        if (!token) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    error: 'No authentication token provided' 
                })
            };
        }
        
        // Simple token validation (in production, use proper JWT)
        // For this implementation, we'll accept any non-empty token as valid
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                valid: true, 
                message: 'Session valid' 
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Session verification failed' 
            })
        };
    }
};
