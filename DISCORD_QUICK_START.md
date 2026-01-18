# ⚡ Guide Démarrage Rapide - Bot Discord

Voici un guide étape par étape pour configurer le bot Discord en 5 minutes !

## 🚀 Étapes Rapides

### 1. Créer une Application Discord
1. Allez sur https://discord.com/developers/applications
2. Cliquez sur "New Application" et donnez un nom (ex: "Mon Bot Giveaway")
3. Cliquez sur "Create"

### 2. Ajouter un Bot
1. Cliquez sur "Bot" dans le menu de gauche
2. Cliquez sur "Add Bot"
3. Sous le nom du bot, cliquez sur "Reset Token" puis "Copy"
4. **Gardez ce token secret !**

### 3. Obtenir l'URL d'Invitation
1. Cliquez sur "OAuth2" → "URL Generator"
2. Cochez "bot" sous SCOPES
3. Cochez ces permissions:
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Read Messages/View Channels
4. Copiez l'URL générée en bas
5. Ouvrez-la dans votre navigateur pour ajouter le bot à votre serveur

### 4. Trouver l'ID du Canal
1. Dans Discord, activez Mode Développeur:
   - Paramètres → Avancés → Mode Développeur (ON)
2. Cliquez droit sur le canal où vous voulez les notifications
3. Cliquez sur "Copier l'ID du canal"
4. Gardez cet ID à portée de main

### 5. Configurer le Fichier `.env`
Créez ou modifiez le fichier `.env` à la racine du projet:

```env
DISCORD_BOT_TOKEN=VOTRE_TOKEN_ICI
DISCORD_CHANNEL_ID=VOTRE_ID_CANAL_ICI
```

Remplacez:
- `VOTRE_TOKEN_ICI` par le token copié à l'étape 2
- `VOTRE_ID_CANAL_ICI` par l'ID copié à l'étape 4

### 6. Redémarrer le Serveur
```bash
npm run dev
```

### 7. (Optionnel) Tester le Bot
```bash
node test-discord-bot.js
```

## ✅ Ça Marche!

Si vous avez suivi tous les pas, le bot devrait maintenant:
- ✅ Se connecter automatiquement au démarrage du serveur
- ✅ Envoyer un message Discord quand un giveaway est créé
- ✅ Envoyer un message Discord quand un giveaway est fermé
- ✅ Envoyer un message Discord quand un giveaway est terminé

## ❓ Besoin d'Aide?

Consultez `DISCORD_BOT_SETUP.md` pour plus de détails et le dépannage complet.
