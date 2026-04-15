const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');

const SERVICE_URLS = require('../config/services').SERVICE_URLS;

const createServiceProxy = (serviceKey) =>
  createProxyMiddleware({
    target: SERVICE_URLS[serviceKey],
    changeOrigin: true,
    pathRewrite: (path, req) => `${req.baseUrl}${path}`,
    onError: (err, req, res) => {
      console.error(`Proxy error for ${serviceKey}:`, err.message);
      res.status(503).json({
        success: false,
        message: `Service ${serviceKey} is unavailable`
      });
    },
    on: {
      proxyReq: (proxyReq, req) => {
        // Forward authorization header if present
        if (req.headers.authorization) {
          proxyReq.setHeader('Authorization', req.headers.authorization);
        }

        // Ensure request body is forwarded after express.json() parsing in gateway
        fixRequestBody(proxyReq, req);
      }
    }
  });

module.exports = {
  createServiceProxy
};
