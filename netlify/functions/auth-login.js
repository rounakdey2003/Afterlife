const crypto = require('crypto');

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
        const { password } = JSON.parse(event.body);
        
        // Get admin password from environment variables
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
        
        if (!ADMIN_PASSWORD) {
            return {
                statusCode: 503,
                headers,
                body: JSON.stringify({ 
                    error: 'Admin authentication not configured',
                    fallback: true 
                })
            };
        }
        
        if (!password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Password is required' 
                })
            };
        }
        
        // Simple password comparison
        if (password === ADMIN_PASSWORD) {
            // Generate a simple session token
            const sessionToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    token: sessionToken,
                    expiresAt: expiresAt,
                    message: 'Authentication successful' 
                })
            };
        } else {
            // Add delay to prevent brute force attacks
            await new Promise(resolve => setTimeout(resolve, 1000));
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ 
                    error: 'Invalid password. Access denied.' 
                })
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Authentication service unavailable' 
            })
        };
    }
};
