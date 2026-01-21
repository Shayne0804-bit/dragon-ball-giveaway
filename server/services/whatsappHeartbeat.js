/**
 * Service Heartbeat pour WhatsApp
 * Vérifie régulièrement que la connexion est active
 * Auto-reconnect en cas de déconnexion détectée
 */

class WhatsAppHeartbeat {
  constructor(bot) {
    this.bot = bot;
    this.interval = null;
    this.checkInterval = parseInt(process.env.WHATSAPP_HEARTBEAT_INTERVAL || '300000'); // 5 min par défaut
    this.maxHeartbeatAge = 600; // 10 minutes
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
  }

  /**
   * Démarrer le service heartbeat
   */
  start() {
    console.log(`[HEARTBEAT] 🚀 Service démarré`);
    console.log(`[HEARTBEAT]   Vérification tous les ${this.checkInterval / 1000}s`);
    console.log(`[HEARTBEAT]   Max heartbeat age: ${this.maxHeartbeatAge}s`);

    // Première vérification après 10 secondes
    setTimeout(() => this.check(), 10000);

    // Puis vérification régulière
    this.interval = setInterval(() => this.check(), this.checkInterval);
  }

  /**
   * Effectuer une vérification du heartbeat
   */
  async check() {
    try {
      const timestamp = new Date().toLocaleTimeString('fr-FR');
      console.log(`\n[HEARTBEAT] ⏱️  Vérification à ${timestamp}`);

      // ===== Étape 1: Vérifier que le bot est en mémoire =====
      if (!this.bot) {
        console.error('[HEARTBEAT] ❌ Bot non disponible');
        return;
      }

      // ===== Étape 2: Vérifier que la socket est initié =====
      if (!this.bot.sock) {
        console.warn('[HEARTBEAT] ⚠️  Socket non initialisée - Reconnexion requise');
        await this.attemptReconnect();
        return;
      }

      // ===== Étape 3: Vérifier que le socket est prêt =====
      if (!this.bot.isReady) {
        console.warn('[HEARTBEAT] ⚠️  Bot non prêt - État: indisponible');
        console.log('[HEARTBEAT]   Tentative de reconnexion...');
        await this.attemptReconnect();
        return;
      }

      // ===== Étape 4: Vérifier les credentials =====
      const meId = this.bot.sock?.authState?.creds?.me?.id;
      if (!meId) {
        console.warn('[HEARTBEAT] ⚠️  me.id manquant - Session invalide');
        await this.attemptReconnect();
        return;
      }

      // ===== Étape 5: Vérifier le heartbeat dans Redis/cache =====
      const heartbeat = await this.bot.redis.getHeartbeat();
      if (!heartbeat) {
        console.warn('[HEARTBEAT] ⚠️  Aucun heartbeat en cache - Premier démarrage?');
        await this.updateHeartbeat();
        return;
      }

      const lastUpdate = new Date(heartbeat.timestamp);
      const now = new Date();
      const ageSeconds = Math.floor((now - lastUpdate) / 1000);

      if (ageSeconds > this.maxHeartbeatAge) {
        console.warn(`[HEARTBEAT] ⚠️  Heartbeat trop ancien (${ageSeconds}s > ${this.maxHeartbeatAge}s)`);
        await this.attemptReconnect();
        return;
      }

      // ===== Étape 6: Vérifier que les sockets listeners sont actifs =====
      const hasListeners = this.bot.sock?.ev?.listenerCount?.('messages.upsert') > 0;
      if (!hasListeners) {
        console.warn('[HEARTBEAT] ⚠️  Aucun listener actif sur les messages');
        await this.attemptReconnect();
        return;
      }

      // ===== ✅ SUCCÈS: Tout va bien =====
      console.log('[HEARTBEAT] ✅ Connexion saine');
      console.log(`[HEARTBEAT]   - Bot prêt: ${this.bot.isReady}`);
      console.log(`[HEARTBEAT]   - Socket actif: ${!!this.bot.sock}`);
      console.log(`[HEARTBEAT]   - ID téléphone: ${meId.substring(0, 20)}...`);
      console.log(`[HEARTBEAT]   - Heartbeat age: ${ageSeconds}s`);
      console.log(`[HEARTBEAT]   - Listeners: ${this.bot.sock.ev.listenerCount('messages.upsert')} sur messages.upsert`);

      // Réinitialiser le compteur d'essais de reconnexion
      this.reconnectAttempts = 0;

      // Mettre à jour le heartbeat
      await this.updateHeartbeat();

    } catch (error) {
      console.error('[HEARTBEAT] ❌ Erreur lors de la vérification:', error.message);
      console.error('[HEARTBEAT]   Stack:', error.stack);
    }
  }

  /**
   * Mettre à jour le heartbeat dans Redis/cache
   */
  async updateHeartbeat() {
    try {
      if (this.bot.redis) {
        await this.bot.redis.setHeartbeat(600); // TTL 10 minutes
        console.log('[HEARTBEAT] 💾 Heartbeat mis à jour');
      }
    } catch (error) {
      console.warn('[HEARTBEAT] ⚠️  Impossible de mettre à jour le heartbeat:', error.message);
    }
  }

  /**
   * Tentative de reconnexion intelligente
   */
  async attemptReconnect() {
    this.reconnectAttempts++;

    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      console.error(`[HEARTBEAT] ❌ Max reconnexion atteint (${this.maxReconnectAttempts})`);
      console.error('[HEARTBEAT] ℹ️  Redémarrage complet du bot requis');
      console.error('[HEARTBEAT] 🔄 Redémarrage en 30 secondes...');

      // Redémarrage complet
      setTimeout(async () => {
        try {
          console.log('[HEARTBEAT] 🔄 Redémarrage du bot...');
          await this.bot.restart();
          this.reconnectAttempts = 0;
        } catch (err) {
          console.error('[HEARTBEAT] ❌ Erreur lors du redémarrage:', err.message);
        }
      }, 30000);

      return;
    }

    console.log(`[HEARTBEAT] 🔄 Tentative reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    try {
      // Essayer d'abord de charger depuis Redis/MongoDB
      const savedSession = await this.bot.redis.loadCredentials();

      if (savedSession) {
        console.log('[HEARTBEAT] 📦 Session trouvée en cache - Restauration en cours...');
        if (this.bot.sock?.authState) {
          this.bot.sock.authState.creds = savedSession;
        }
      }

      // Réinitialiser la socket
      if (this.bot.sock?.ev) {
        this.bot.sock.ev.removeAllListeners();
      }

      // Redémarrer le bot
      await this.bot.initialize();

      console.log('[HEARTBEAT] ✅ Reconnexion réussie');
      this.reconnectAttempts = 0;
      await this.updateHeartbeat();

    } catch (error) {
      console.error(`[HEARTBEAT] ❌ Reconnexion tentative ${this.reconnectAttempts} échouée:`, error.message);

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        // Attendre avant la prochaine tentative (backoff exponentiel)
        const delayMs = Math.min(5000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
        console.log(`[HEARTBEAT] ⏳ Prochaine tentative dans ${delayMs / 1000}s...`);
      }
    }
  }

  /**
   * Arrêter le service heartbeat
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      console.log('[HEARTBEAT] 🛑 Service arrêté');
    }
  }

  /**
   * Obtenir les statistiques du service
   */
  getStatus() {
    return {
      running: !!this.interval,
      checkInterval: `${this.checkInterval / 1000}s`,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      maxHeartbeatAge: `${this.maxHeartbeatAge}s`,
    };
  }
}

module.exports = WhatsAppHeartbeat;
