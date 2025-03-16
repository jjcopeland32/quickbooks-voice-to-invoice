const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voice.controller');

/**
 * @route POST /api/process-voice
 * @desc Process voice input for a specific field
 * @access Public
 */
router.post('/process-voice', voiceController.processVoice);

/**
 * @route POST /api/refine-text
 * @desc Refine text using OpenAI
 * @access Public
 */
router.post('/refine-text', voiceController.refineText);

module.exports = router; 