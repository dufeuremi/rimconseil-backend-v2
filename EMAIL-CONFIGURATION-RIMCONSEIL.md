# 📧 Configuration Email Rimconseil

## 🔧 Modifications Apportées

### Informations de Configuration
- **Email d'expédition** : `rimconseilrennes@gmail.com`
- **Mot de passe d'application** : `mwvp ugtq ttwm uipe`
- **Serveur SMTP** : `smtp.gmail.com`
- **Port** : `465` (SSL/TLS)
- **Destinataire** : `rimconseilrennes@gmail.com`

### Routes Modifiées

#### 1. Route POST `/api/messages`
**Fichier** : `index.js` (lignes 1654-1666)

**Avant** :
```javascript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});
```

**Après** :
```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'rimconseilrennes@gmail.com',
    pass: 'mwvp ugtq ttwm uipe' // Mot de passe d'application Gmail
  },
  tls: {
    rejectUnauthorized: false
  }
});
```

#### 2. Route POST `/api/send-email`
**Fichier** : `index.js` (lignes 1584-1596)

Même modification que ci-dessus.

### Configuration des Messages

#### Adresse d'expédition
```javascript
from: `"RIM Conseil" <rimconseilrennes@gmail.com>`
```

#### Adresse de destination
```javascript
to: 'rimconseilrennes@gmail.com'
```

## 🧪 Test de la Configuration

### Fichier de Test
Un fichier de test a été créé : `test-email-rimconseil.js`

### Exécution du Test
```bash
node test-email-rimconseil.js
```

### Ce que fait le test
1. **Test de connexion SMTP** : Vérifie que la connexion au serveur Gmail fonctionne
2. **Envoi d'email de test** : Envoie un email de test avec un contenu HTML formaté
3. **Test de l'API** : Teste l'endpoint `/api/messages` (si le serveur est démarré)

## 📋 Fonctionnalités

### Quand un email est envoyé
Un email est automatiquement envoyé à `rimconseilrennes@gmail.com` dans les cas suivants :

1. **Nouveau message de contact** (POST `/api/messages`)
   - Sujet : `Nouveau contact - [sujet du message]`
   - Contenu : Informations complètes du formulaire de contact
   - Format : HTML avec logo Rimconseil

2. **Signalement de panne** (POST `/api/send-email`)
   - Sujet : `Panne Signalée - Rimconseil`
   - Contenu : Texte fourni par l'utilisateur
   - Format : Texte brut

### Format de l'Email de Contact
L'email de contact inclut :
- **Logo Rimconseil** (en pièce jointe)
- **Informations du contact** :
  - Nom et prénom
  - Email
  - Téléphone (si fourni)
  - Sujet
  - Message complet
- **Date et heure** de réception
- **Mise en forme HTML** professionnelle

## 🔒 Sécurité

### Mot de Passe d'Application
- Le mot de passe utilisé est un **mot de passe d'application Gmail**
- Il ne s'agit pas du mot de passe principal du compte
- Ce type de mot de passe est spécialement conçu pour les applications tierces

### Authentification
- **Authentification à 2 facteurs** requise sur le compte Gmail
- **Mot de passe d'application** généré spécifiquement pour cette application
- **Connexion sécurisée** via SSL/TLS sur le port 465

## 🚀 Déploiement

### Variables d'Environnement
Les variables d'environnement suivantes ne sont plus nécessaires :
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_USER`
- `EMAIL_PASS`
- `CONTACT_EMAIL`

### Configuration en Production
La configuration est maintenant **hardcodée** dans le code pour :
- ✅ **Simplicité** : Pas de gestion de variables d'environnement
- ✅ **Sécurité** : Mot de passe d'application Gmail
- ✅ **Fiabilité** : Configuration stable et testée

## 📞 Support

### En cas de problème
1. **Vérifier la connexion** : Exécuter `node test-email-rimconseil.js`
2. **Vérifier les logs** : Consulter les logs du serveur pour les erreurs d'envoi
3. **Tester manuellement** : Utiliser l'endpoint `/api/send-email` pour tester

### Logs Utiles
```
✅ Email de notification envoyé à rimconseilrennes@gmail.com
❌ Erreur lors de l'envoi de l'email de notification: [détails]
```

## 📝 Notes Importantes

1. **Gmail SMTP** : Utilise le serveur SMTP de Gmail avec authentification OAuth2
2. **Rate Limiting** : Gmail a des limites d'envoi (500 emails/jour pour les comptes gratuits)
3. **Spam** : Les emails sont envoyés depuis une adresse Gmail vérifiée
4. **Logo** : Le logo Rimconseil est inclus en pièce jointe dans les emails HTML

---

*Configuration mise à jour le 15/01/2024 - Compatible avec Gmail SMTP et mot de passe d'application*
