const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Same-origin proxy for local CRA so browser calls /api/v1/* on localhost:3000
 * and the dev server forwards to Render (avoids cross-origin "Failed to fetch").
 */
module.exports = function setupProxy(app) {
    const target =
        process.env.REACT_APP_PROXY_TARGET
        || 'https://treasure-services-mani.onrender.com';

    app.use(
        '/api',
        createProxyMiddleware({
            target,
            changeOrigin: true,
            secure: true,
            logLevel: 'warn',
            onError(err, req, res) {
                console.error('[setupProxy] proxy error:', err.message);
                if (!res.headersSent) {
                    res.writeHead(502, { 'Content-Type': 'application/json' });
                }
                res.end(JSON.stringify({
                    error: true,
                    message: `Proxy could not reach ${target}. ${err.message}`,
                }));
            },
        })
    );
};
