const { app } = require('@azure/functions');

app.http('directline-token', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        // Handle CORS preflight
        const corsHeaders = {
            'Access-Control-Allow-Origin': 'https://sunelt13.github.io',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        };

        if (request.method === 'OPTIONS') {
            return { status: 204, headers: corsHeaders };
        }

        const secret = process.env.DIRECT_LINE_SECRET;
        if (!secret) {
            context.error('DIRECT_LINE_SECRET environment variable is not set');
            return {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                jsonBody: { error: 'Token server misconfigured' }
            };
        }

        try {
            const response = await fetch(
                'https://directline.botframework.com/v3/directline/tokens/generate',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${secret}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                context.error(`Direct Line token API returned ${response.status}`);
                return {
                    status: 502,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    jsonBody: { error: 'Failed to generate token' }
                };
            }

            const data = await response.json();

            return {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                jsonBody: { token: data.token }
            };
        } catch (err) {
            context.error('Token generation failed:', err.message);
            return {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                jsonBody: { error: 'Internal server error' }
            };
        }
    }
});
