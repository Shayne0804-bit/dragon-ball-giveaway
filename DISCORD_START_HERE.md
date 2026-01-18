# 🤖 Intégration Bot Discord - Guide de Démarrage

Vous venez de recevoir une **intégration complète du Bot Discord** pour votre plateforme de giveaways!

## 🚀 Démarrage en 5 Minutes

### Étape 1 : Vérifier l'Installation
```bash
node verify-discord-bot.js
```

Si tout est ✅, passez à l'étape 2.
Si quelque chose manque, suivez les instructions affichées.

### Étape 2 : Créer le Bot Discord
Allez sur : **https://discord.com/developers/applications**

1. "New Application" → Donnez un nom → "Create"
2. "Bot" → "Add Bot"
3. Sous le nom du bot, cliquez "Copy" (TOKEN)
4. Gardez ce token secret!

### Étape 3 : Configurer les Permissions
1. "OAuth2" → "URL Generator"
2. SCOPES: Cochez `bot`
3. PERMISSIONS: Cochez:
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Read Messages/View Channels
4. Copiez l'URL et ouvrez-la pour inviter le bot

### Étape 4 : Récupérer l'ID du Canal
1. Dans Discord, allez dans Paramètres → Avancés
2. Activez "Mode Développeur"
3. Clic droit sur le canal → "Copier l'ID du canal"

### Étape 5 : Configurer `.env`
Éditez le fichier `.env` :
```env
DISCORD_BOT_TOKEN=votre_token_ici
DISCORD_CHANNEL_ID=votre_id_canal_ici
```

### Étape 6 : Redémarrer et Tester
```bash
npm run dev
```

Puis testez:
```bash
node test-discord-bot.js
```

## ✅ Vérification

Vous devriez voir dans les logs:
```
✅ Bot Discord connecté: YourBotName#1234
✅ Bot Discord connecté et prêt à envoyer des notifications
```

## 📚 Documentation Disponible

Lisez ces fichiers dans cet ordre:

1. **DISCORD_BOT_SETUP_SUMMARY.md** ← Résumé complet (recommandé)
2. **DISCORD_QUICK_START.md** ← Guide rapide (5 min)
3. **DISCORD_BOT_SETUP.md** ← Guide détaillé complet
4. **DISCORD_BOT_README.md** ← Documentation technique

## 🎯 Fonctionnalités

Le bot Discord envoie automatiquement des messages quand:

- 🎉 **Un giveaway est lancé**
- 🔒 **Un giveaway est fermé**
- 🏆 **Un giveaway est terminé**

Les messages incluent:
- Titres avec emojis
- Descriptions détaillées
- Dates et heures
- Nombre de participants
- Liste des gagnants

## 📁 Fichiers Créés

### Services
- `server/services/discordBot.js` - Le bot Discord complet

### Configuration
- `server/config/discord.js` - Couleurs, messages, configuration

### Tests et Vérification
- `test-discord-bot.js` - Tester le bot
- `verify-discord-bot.js` - Vérifier l'installation

### Documentation
- `DISCORD_BOT_SETUP_SUMMARY.md` - Résumé complet
- `DISCORD_QUICK_START.md` - Démarrage rapide
- `DISCORD_BOT_SETUP.md` - Guide détaillé
- `DISCORD_BOT_README.md` - Documentation
- `DISCORD_INSTALLATION_CHECKLIST.md` - Checklist

### Scripts d'Installation
- `install-discord-bot.sh` - Installation Linux/Mac
- `install-discord-bot.ps1` - Installation Windows

## 🔧 Fichiers Modifiés

- `server/server.js` - Initialisation du bot
- `server/controllers/giveawayMultiController.js` - Notifications
- `server/controllers/participantController.js` - Support complet
- `package.json` - Dépendances
- `.env.example` - Variables exemple

## 🆘 Besoin d'Aide?

### Le bot ne se connecte pas
- Vérifier le TOKEN dans `.env`
- Vérifier l'ID du canal
- Lancer `node verify-discord-bot.js`
- Relancer le serveur

### Pas de messages Discord
- Vérifier que le bot a accès au canal
- Vérifier les permissions du bot
- Lancer `node test-discord-bot.js`

### Erreur "Discord not found"
```bash
npm install discord.js
```

## 📝 Points Importants

⚠️ **Sécurité:**
- Ne partagez JAMAIS votre token
- Ne committez JAMAIS `.env` dans Git
- Utilisez `.gitignore` pour `.env`

✅ **C'est Prêt:**
- Discord.js est installé
- Le code du bot est complet
- La documentation est exhaustive
- Les tests sont prêts

## 🎉 Ça Marche!

Une fois configuré:
1. Créez un giveaway
2. Regardez Discord
3. Un message apparaît automatiquement! 🎉

---

**Questions?** Consultez les fichiers de documentation.
**Problème?** Exécutez `node verify-discord-bot.js` pour diagnostiquer.

Enjoy! 🚀
