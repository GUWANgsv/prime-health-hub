const express = require('express');

const { analyze } = require('../controllers/aiController');

const router = express.Router();

router.post('/analyze', analyze);

module.exports = router;
