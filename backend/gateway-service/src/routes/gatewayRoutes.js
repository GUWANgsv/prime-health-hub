const express = require('express');

const { verifyToken, optionalToken } = require('../middleware/authMiddleware');
const { createServiceProxy } = require('../middleware/proxyMiddleware');

const router = express.Router();

// Auth service routes (public, no JWT required for register/login)
router.use('/auth', createServiceProxy('auth'));

// Public payment callbacks from third-party gateways
router.post('/appointments/payhere/notify', createServiceProxy('appointment'));

// Protected routes - all require JWT token
router.use('/patients', verifyToken, createServiceProxy('patient'));
router.use('/doctors', optionalToken, createServiceProxy('doctor'));
router.use('/appointments', verifyToken, createServiceProxy('appointment'));
router.use('/notifications', verifyToken, createServiceProxy('notification'));
router.use('/ai', verifyToken, createServiceProxy('ai'));

module.exports = router;
