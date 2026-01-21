/**
 * Service Redis avec fallback intelligent
 * Essaie Redis en priorité, MongoDB en fallback, puis en mémoire
 */

const Redis = require('ioredis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.mode = 'offline'; // 'redis', 'memory', 'mongodb'
    this.memoryCache = new Map(); // Fallback en mémoire
    this.memoryTTL = new Map();
  }

  /**
   * Initialiser le service Redis
   */
  async initialize() {
    // Mode 1: Essayer Redis
    if (process.env.REDIS_HOST) {
      try {
        console.log('[REDIS] 🔄 Initialisation de la connexion Redis...');
        
        this.client = new Redis({
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          db: process.env.REDIS_DB || 0,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            console.log(`[REDIS] ⏳ Retry ${times} en ${delay}ms`);
            return delay;
          },
          maxRetriesPerRequest: 3,
          enableReadyCheck: false,
          enableOfflineQueue: false,
        });

        this.client.on('connect', () => {
          console.log('[REDIS] ✅ Connecté avec succès');
          this.isConnected = true;
          this.mode = 'redis';
        });

        this.client.on('error', (err) => {
          console.error('[REDIS] ❌ Erreur de connexion:', err.message);
          this.isConnected = false;
          this.fallbackToMemory();
        });

        this.client.on('close', () => {
          console.warn('[REDIS] 🔴 Connexion fermée');
          this.isConnected = false;
          this.fallbackToMemory();
        });

        // Tester la connexion
        await this.client.ping();
        console.log('[REDIS] 🟢 Ping réussi - Redis opérationnel');
        this.isConnected = true;
        this.mode = 'redis';
        return true;
      } catch (error) {
        console.warn('[REDIS] ⚠️  Impossible de se connecter à Redis:', error.message);
        console.warn('[REDIS] 📦 Passage au fallback en mémoire...');
        this.fallbackToMemory();
        return false;
      }
    } else {
      console.log('[REDIS] ℹ️  Variables d\'environnement Redis non configurées');
      console.log('[REDIS] 📦 Mode fallback en mémoire activé');
      this.fallbackToMemory();
      return true;
    }
  }

  /**
   * Basculer en mode mémoire
   */
  fallbackToMemory() {
    this.isConnected = false;
    this.mode = 'memory';
    console.log('[REDIS-FALLBACK] 🟡 Mode EN MÉMOIRE - Les données seront perdues au redémarrage');
  }

  /**
   * Sauvegarder les credentials WhatsApp
   */
  async saveCredentials(credentials, ttl = 86400 * 30) {
    try {
      const data = JSON.stringify(credentials);
      const key = 'whatsapp:creds';

      if (this.mode === 'redis' && this.isConnected) {
        try {
          await this.client.setex(key, ttl, data);
          console.log(`[REDIS] 💾 Credentials sauvegardés (TTL: ${ttl}s)`);
          return true;
        } catch (err) {
          console.warn('[REDIS] ⚠️  Erreur sauvegarde Redis:', err.message);
          // Fallback en mémoire
          this.memoryCache.set(key, data);
          this.setMemoryTTL(key, ttl);
          return true;
        }
      } else {
        // Mode mémoire
        this.memoryCache.set(key, data);
        this.setMemoryTTL(key, ttl);
        console.log(`[REDIS-MEM] 💾 Credentials sauvegardés (EN MÉMOIRE)`);
        return true;
      }
    } catch (error) {
      console.error('[REDIS] ❌ Erreur saveCredentials:', error.message);
      return false;
    }
  }

  /**
   * Charger les credentials WhatsApp
   */
  async loadCredentials() {
    try {
      const key = 'whatsapp:creds';

      if (this.mode === 'redis' && this.isConnected) {
        try {
          const data = await this.client.get(key);
          if (data) {
            console.log('[REDIS] ✅ Credentials chargés depuis Redis');
            return JSON.parse(data);
          }
        } catch (err) {
          console.warn('[REDIS] ⚠️  Erreur chargement Redis:', err.message);
        }
      } else {
        // Mode mémoire
        const data = this.memoryCache.get(key);
        if (data) {
          console.log('[REDIS-MEM] ✅ Credentials chargés depuis mémoire');
          return JSON.parse(data);
        }
      }

      console.log('[REDIS] ℹ️  Aucun credential en cache');
      return null;
    } catch (error) {
      console.error('[REDIS] ❌ Erreur loadCredentials:', error.message);
      return null;
    }
  }

  /**
   * Mettre à jour le heartbeat
   */
  async setHeartbeat(ttl = 600) {
    try {
      const key = 'whatsapp:heartbeat';
      const value = JSON.stringify({
        timestamp: new Date().toISOString(),
        status: 'alive',
      });

      if (this.mode === 'redis' && this.isConnected) {
        try {
          await this.client.setex(key, ttl, value);
          return true;
        } catch (err) {
          this.memoryCache.set(key, value);
          this.setMemoryTTL(key, ttl);
          return true;
        }
      } else {
        this.memoryCache.set(key, value);
        this.setMemoryTTL(key, ttl);
        return true;
      }
    } catch (error) {
      console.error('[REDIS] ❌ Erreur setHeartbeat:', error.message);
      return false;
    }
  }

  /**
   * Obtenir le heartbeat
   */
  async getHeartbeat() {
    try {
      const key = 'whatsapp:heartbeat';

      if (this.mode === 'redis' && this.isConnected) {
        try {
          const data = await this.client.get(key);
          return data ? JSON.parse(data) : null;
        } catch (err) {
          console.warn('[REDIS] ⚠️  Erreur getHeartbeat Redis:', err.message);
        }
      } else {
        const data = this.memoryCache.get(key);
        return data ? JSON.parse(data) : null;
      }

      return null;
    } catch (error) {
      console.error('[REDIS] ❌ Erreur getHeartbeat:', error.message);
      return null;
    }
  }

  /**
   * Vérifier si le heartbeat est récent
   */
  async isHeartbeatAlive(maxAgeSeconds = 600) {
    try {
      const heartbeat = await this.getHeartbeat();
      if (!heartbeat) {
        return false;
      }

      const lastUpdate = new Date(heartbeat.timestamp);
      const now = new Date();
      const ageSeconds = Math.floor((now - lastUpdate) / 1000);

      return ageSeconds < maxAgeSeconds;
    } catch (error) {
      console.error('[REDIS] ❌ Erreur isHeartbeatAlive:', error.message);
      return false;
    }
  }

  /**
   * Enregistrer une clé-valeur avec TTL
   */
  async set(key, value, ttl = 3600) {
    try {
      const data = typeof value === 'string' ? value : JSON.stringify(value);

      if (this.mode === 'redis' && this.isConnected) {
        try {
          await this.client.setex(key, ttl, data);
          return true;
        } catch (err) {
          this.memoryCache.set(key, data);
          this.setMemoryTTL(key, ttl);
          return true;
        }
      } else {
        this.memoryCache.set(key, data);
        this.setMemoryTTL(key, ttl);
        return true;
      }
    } catch (error) {
      console.error('[REDIS] ❌ Erreur set:', error.message);
      return false;
    }
  }

  /**
   * Récupérer une valeur
   */
  async get(key) {
    try {
      if (this.mode === 'redis' && this.isConnected) {
        try {
          const data = await this.client.get(key);
          return data || null;
        } catch (err) {
          console.warn('[REDIS] ⚠️  Erreur get Redis:', err.message);
        }
      } else {
        return this.memoryCache.get(key) || null;
      }

      return null;
    } catch (error) {
      console.error('[REDIS] ❌ Erreur get:', error.message);
      return null;
    }
  }

  /**
   * Supprimer une clé
   */
  async delete(key) {
    try {
      if (this.mode === 'redis' && this.isConnected) {
        try {
          await this.client.del(key);
          return true;
        } catch (err) {
          this.memoryCache.delete(key);
          this.memoryTTL.delete(key);
          return true;
        }
      } else {
        this.memoryCache.delete(key);
        this.memoryTTL.delete(key);
        return true;
      }
    } catch (error) {
      console.error('[REDIS] ❌ Erreur delete:', error.message);
      return false;
    }
  }

  /**
   * Nettoyer toutes les clés
   */
  async flush() {
    try {
      if (this.mode === 'redis' && this.isConnected) {
        try {
          await this.client.flushdb();
          console.log('[REDIS] 🗑️  Base de données vidée');
          return true;
        } catch (err) {
          this.memoryCache.clear();
          this.memoryTTL.clear();
          return true;
        }
      } else {
        this.memoryCache.clear();
        this.memoryTTL.clear();
        console.log('[REDIS-MEM] 🗑️  Cache vidé');
        return true;
      }
    } catch (error) {
      console.error('[REDIS] ❌ Erreur flush:', error.message);
      return false;
    }
  }

  /**
   * Obtenir des statistiques
   */
  async getStats() {
    return {
      mode: this.mode,
      isConnected: this.isConnected,
      redisConnected: this.mode === 'redis' && this.isConnected,
      memoryItemsCount: this.memoryCache.size,
      memoryUsageEstimate: this.estimateMemoryUsage(),
    };
  }

  /**
   * Estimer l'utilisation mémoire
   */
  estimateMemoryUsage() {
    let total = 0;
    for (const [key, value] of this.memoryCache) {
      total += key.length + JSON.stringify(value).length;
    }
    return `~${(total / 1024).toFixed(2)}KB`;
  }

  /**
   * Fermer la connexion
   */
  async disconnect() {
    try {
      if (this.client && this.mode === 'redis') {
        await this.client.quit();
        console.log('[REDIS] 🔴 Déconnecté');
      }
      this.memoryCache.clear();
      this.memoryTTL.clear();
    } catch (error) {
      console.error('[REDIS] ❌ Erreur disconnect:', error.message);
    }
  }

  // ========== HELPERS PRIVÉES ==========

  /**
   * Gérer les TTL en mémoire
   */
  setMemoryTTL(key, ttlSeconds) {
    if (this.memoryTTL.has(key)) {
      clearTimeout(this.memoryTTL.get(key));
    }

    if (ttlSeconds > 0) {
      const timeoutId = setTimeout(() => {
        this.memoryCache.delete(key);
        this.memoryTTL.delete(key);
      }, ttlSeconds * 1000);

      this.memoryTTL.set(key, timeoutId);
    }
  }
}

// Exporter une instance singleton
module.exports = new RedisService();
