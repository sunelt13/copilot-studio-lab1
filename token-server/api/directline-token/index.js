const https = require('https');

function generateToken(secret) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'directline.botframework.com',
            path: '/v3/directline/tokens/generate',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secret}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`Direct Line API returned ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        req.end();
    });
}

module.exports = async function (context, req) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (req.method === 'OPTIONS') {
        context.res = { status: 204, headers: corsHeaders };
        return;
    }

    const secret = process.env.DIRECT_LINE_SECRET;
    if (!secret) {
        context.res = {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Token server misconfigured - no secret' })
        };
        return;
    }

    try {
        const data = await generateToken(secret);
        context.res = {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: data.token })
        };
    } catch (err) {
        context.res = {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: `Token generation failed: ${err.message}` })
        };
    }
};
