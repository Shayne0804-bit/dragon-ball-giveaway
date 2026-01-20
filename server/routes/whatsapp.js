const express = require('express');
const router = express.Router();
const whatsappBot = require('../services/whatsappBot');
const { validateRequest } = require('../middlewares/validation');

/**
 * GET /api/whatsapp/status
 * Vérifier le statut du bot WhatsApp
 */
router.get('/status', (req, res) => {
  try {
    const status = {
      connected: whatsappBot.isReady,
      timestamp: new Date(),
      uptime: Math.floor(process.uptime() / 60),
      environment: process.env.NODE_ENV,
    };

    res.json(status);
  } catch (error) {
    console.error('[WHATSAPP ROUTE] Erreur status:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/send-message
 * Envoyer un message WhatsApp
 * Body: { phoneNumber, message }
 */
router.post('/send-message', validateRequest, async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        error: 'phoneNumber et message sont requis',
      });
    }

    // Validation admin optionnelle - commentez si vous voulez l'enlever
    // if (!req.session.admin) {
    //   return res.status(403).json({ error: 'Accès refusé' });
    // }

    const result = await whatsappBot.sendMessage(phoneNumber, message);

    if (result) {
      res.json({ success: true, message: 'Message envoyé' });
    } else {
      res.status(500).json({ error: 'Impossible d\'envoyer le message' });
    }
  } catch (error) {
    console.error('[WHATSAPP ROUTE] Erreur send-message:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/notify-giveaway
 * Notifier les utilisateurs d'un nouveau giveaway
 * Body: { giveawayId, phoneNumbers: [...] }
 */
router.post('/notify-giveaway', validateRequest, async (req, res) => {
  try {
    const { giveawayId, phoneNumbers } = req.body;

    // Validation admin
    if (!req.session.admin) {
      return res.status(403).json({ error: 'Accès refusé - admin requis' });
    }

    if (!giveawayId || !phoneNumbers || !Array.isArray(phoneNumbers)) {
      return res.status(400).json({
        error: 'giveawayId et phoneNumbers (array) sont requis',
      });
    }

    // Récupérer le giveaway
    const Giveaway = require('../models/Giveaway');
    const giveaway = await Giveaway.findById(giveawayId);

    if (!giveaway) {
      return res.status(404).json({ error: 'Giveaway non trouvé' });
    }

    // Envoyer les notifications
    await whatsappBot.notifyGiveaway(giveaway, phoneNumbers);

    res.json({
      success: true,
      message: `${phoneNumbers.length} notification(s) envoyée(s)`,
    });
  } catch (error) {
    console.error('[WHATSAPP ROUTE] Erreur notify-giveaway:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/notify-winner
 * Notifier le gagnant
 * Body: { winnerId }
 */
router.post('/notify-winner', validateRequest, async (req, res) => {
  try {
    const { winnerId } = req.body;

    // Validation admin
    if (!req.session.admin) {
      return res.status(403).json({ error: 'Accès refusé - admin requis' });
    }

    if (!winnerId) {
      return res.status(400).json({ error: 'winnerId est requis' });
    }

    // Récupérer le gagnant
    const Winner = require('../models/Winner');
    const winner = await Winner.findById(winnerId).populate('giveawayId');

    if (!winner) {
      return res.status(404).json({ error: 'Gagnant non trouvé' });
    }

    if (!winner.phoneNumber) {
      return res.status(400).json({ error: 'Numéro de téléphone non trouvé' });
    }

    // Envoyer la notification
    await whatsappBot.notifyWinner(winner, winner.giveawayId);

    res.json({ success: true, message: 'Notification envoyée au gagnant' });
  } catch (error) {
    console.error('[WHATSAPP ROUTE] Erreur notify-winner:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/webhook
 * Recevoir les webhooks de WhatsApp Business API (optionnel)
 */
router.post('/webhook', async (req, res) => {
  try {
    const token = process.env.WHATSAPP_WEBHOOK_TOKEN;

    // Valider le token
    if (req.headers['x-webhook-token'] !== token && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Token invalide' });
    }

    const { messages } = req.body;

    if (messages && Array.isArray(messages)) {
      for (const msg of messages) {
        console.log('[WHATSAPP] Webhook reçu:', msg.from, msg.text);
        // Traiter le message si nécessaire
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[WHATSAPP ROUTE] Erreur webhook:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
