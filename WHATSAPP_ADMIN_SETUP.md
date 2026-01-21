# Configuration des Administrateurs WhatsApp

## Numéros Admins Configurés

```
+2290154959093 (Admin 1)
+225 0758652488 (Admin 2)
```

## Configuration dans les Variables d'Environnement

### Format attendu:
```env
WHATSAPP_OWNER_NUMBERS=2290154959093,2250758652488
```

**Important:** 
- ✅ Garder seulement les chiffres (pas de +, pas d'espaces)
- ✅ Séparer les numéros par des virgules
- ✅ Le système nettoiera automatiquement les numéros

### Accepte aussi:
```env
# Avec espaces
WHATSAPP_OWNER_NUMBERS=229 0154959093, 225 0758652488

# Avec le préfixe +
WHATSAPP_OWNER_NUMBERS=+2290154959093,+2250758652488

# Format mélangé
WHATSAPP_OWNER_NUMBERS=229-0154959093,+225 075-8652488
```

## Vérification des Permissions

Quand vous utilisez une commande admin, le système:

1. ✅ Lit le numéro du message WhatsApp (format: `2290154959093@c.us`)
2. ✅ Enlève le suffixe `@c.us` pour obtenir le numéro
3. ✅ Garde seulement les chiffres
4. ✅ Compare avec la liste des admins configurés
5. ✅ Accorde l'accès si match

## Logs de Débogage

Les logs montrent:
```
[COMMANDS] 👑 Numéros owners configurés (format propre): 2290154959093, 2250758652488
[COMMANDS] 🔐 Vérification permission: 2290154959093@c.us → 2290154959093
[COMMANDS] 🔐 Numéros owners: ["2290154959093","2250758652488"]
[COMMANDS] 🔐 Est admin? true
```

## Commandes Admin Disponibles

### Giveaway (Admin)
- `.give start` - Démarrer un giveaway
- `.give end` - Fermer le giveaway
- `.give info` - Infos du giveaway
- `.give prize` - Voir le lot
- `.give participants` - Nombre de participants
- `.setprize <lot>` - Définir le lot
- `.draw` - Tirage du gagnant
- `.reset` - Réinitialiser

### Groupe (Admin)
- `.tagall` - Mentionner tous
- `.link` - Lien d'invitation
- `.open` - Ouvrir le groupe
- `.close` - Fermer le groupe

### Owner (Seulement super-admin)
- `.broadcast <message>` - Message global
- `.restart` - Redémarrer le bot
- `.mode <public|private>` - Mode du bot

## Troubleshooting

### Les commandes admin ne marchent pas?

1. **Vérifiez le format du numéro:**
   ```bash
   # Votre numéro WhatsApp doit être:
   # Chat: 2290154959093
   # Config: WHATSAPP_OWNER_NUMBERS=2290154959093
   ```

2. **Vérifiez les logs:**
   ```
   grep "COMMANDS.*permission" logs.log
   grep "Est admin?" logs.log
   ```

3. **Testez avec .owner:**
   ```
   Répondez: .owner
   Si le bot répond, la connexion fonctionne
   ```

4. **Redéployez après changement:**
   ```bash
   git add -A
   git commit -m "fix: mise à jour numéros admins"
   git push
   ```

## Exemple Railway

Dans les variables d'environnement Railway:
```
WHATSAPP_OWNER_NUMBERS=2290154959093,2250758652488
```

Puis redéployer le service.
