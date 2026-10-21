/**
 * server/routes/whatsappRoutes.js
 * 
 * Express Router for Meta WhatsApp Cloud API Webhook and AI Assistance
 * Endpoints:
 * - GET  /api/whatsapp/webhook   (Meta Challenge Verification)
 * - POST /api/whatsapp/webhook   (Meta Inbound Event Processing)
 * - GET  /api/whatsapp/health    (Configuration & Token Health Check)
 * - POST /api/whatsapp/test      (Development Simulator)
 */

const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// 1. Webhook Handshake & Verification
router.get('/webhook', (req, res) => whatsappController.handleVerification(req, res));
router.get('/', (req, res) => whatsappController.handleVerification(req, res));

// 2. Incoming Event Processing
router.post('/webhook', (req, res) => whatsappController.handleWebhook(req, res));
router.post('/', (req, res) => whatsappController.handleWebhook(req, res));

// 3. Health Diagnostics
router.get('/health', (req, res) => whatsappController.getHealth(req, res));

// 4. Test Simulation
router.post('/test', (req, res) => whatsappController.handleTest(req, res));

module.exports = router;
