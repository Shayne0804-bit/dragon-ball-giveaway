# Configuration Railway - Variables d'Environnement

## Numéros WhatsApp Configurés

### Bot
- **Numéro**: +225017188860
- **Rôle**: Numéro du bot (pour le pairing code initial)

### Administrateurs
1. **Admin 1**: +2290154959093 (Commands OWNER)
2. **Admin 2**: +225758652488 (Commands OWNER)

## Variables à Configurer sur Railway

Allez à: **Railway Dashboard** → Votre Service → **Variables**

### 1. WHATSAPP_PHONE_NUMBER
```
+225017188860
```
**Copie de**: Le numéro du bot pour générer le code d'appairage

### 2. WHATSAPP_OWNER_NUMBERS
```
+2290154959093,+225758652488
```
**Format**: Numéros séparés par des virgules (**SANS ESPACES**)

### 3. WHATSAPP_ENABLED
```
true
```

## Autres Variables Nécessaires

### Base de Données
- **MONGODB_URI**: Votre MongoDB Atlas connection string
- Format: `mongodb+srv://username:password@cluster.mongodb.net/database`

### Session
- **SESSION_SECRET**: Clé secrète aléatoire (32+ caractères)
- Générez avec: `openssl rand -hex 32`

### CORS
- **CORS_ORIGIN**: URL de votre service Railway
- Format: `https://votre-service.up.railway.app`

## Test des Numéros

Après configuration:

1. **Railway rebuild** et redémarrage
2. **Vérifiez les logs** pour:
   ```
   [WHATSAPP] 📱 Numéro du bot configuré: +225017188860
   [COMMANDS] 👑 Numéros owners configurés: +2290154959093, +225758652488
   ```

3. **Entrez le code d'appairage** avec le compte +225017188860

4. **Envoyez un message admin** depuis l'un des numéros owners:
   ```
   .help
   .stats
   .users
   ```

## Format des Numéros

✅ **Correct**:
- `+225017188860`
- `+2290154959093,+225758652488`

❌ **Incorrect**:
- `+225 017188860` (espaces)
- `225017188860` (sans +)
- `+225 017 188 860` (espaces multiples)

## Dépannage

### Bot ne reconnait pas les admins
- Vérifiez le format: Pas d'espaces
- Vérifiez WHATSAPP_OWNER_NUMBERS est défini
- Redémarrage du service

### Pairing code ne génère pas
- Vérifiez WHATSAPP_PHONE_NUMBER est configuré
- Vérifiez format: `+225...` (avec +)
- Check les logs Railway

### Commandes ne fonctionnent pas
- Envoyez `.help` pour vérifier l'accès
- Vérifiez le numéro est dans WHATSAPP_OWNER_NUMBERS
- Format du numéro dans le message doit correspondre
