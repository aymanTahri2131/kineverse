# 🚂 Guide de déploiement Backend sur Railway.app

## 📋 Pourquoi Railway ?

- ✅ **5$ de crédit gratuit/mois** (suffisant pour un MVP)
- ✅ **Pas de sleep mode** (toujours actif)
- ✅ **Déploiement depuis GitHub** (automatique)
- ✅ **SSL/HTTPS gratuit**
- ✅ **Variables d'environnement sécurisées**
- ✅ **Logs en temps réel**
- ✅ **Base de données PostgreSQL/MongoDB intégrée**

---

## 🎯 Prérequis

### 1. Compte Railway
👉 https://railway.app/
- Inscrivez-vous avec GitHub (recommandé)
- Pas besoin de carte bancaire pour commencer

### 2. MongoDB Atlas (Base de données)
👉 https://www.mongodb.com/cloud/atlas/register

Si vous n'avez pas encore MongoDB Atlas :
1. Créez un compte gratuit
2. Créez un cluster (M0 Free Tier - 512 MB)
3. Créez un utilisateur DB
4. Whitelist toutes les IP : `0.0.0.0/0`
5. Récupérez votre URI de connexion

---

## 🚀 Déploiement en 5 minutes

### Étape 1 : Créer un nouveau projet sur Railway

1. Allez sur https://railway.app/dashboard
2. Cliquez sur **"New Project"**
3. Sélectionnez **"Deploy from GitHub repo"**
4. Autorisez Railway à accéder à GitHub
5. Sélectionnez le repo **`kineverse`**

### Étape 2 : Configuration du service

Railway détectera automatiquement votre backend Node.js.

**Paramètres importants :**
- Root Directory : `backend`
- Start Command : `node server.js`
- Port : Détecté automatiquement (Railway utilise la variable `PORT`)

### Étape 3 : Variables d'environnement

Dans Railway → Votre projet → **Variables** :

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kineverse?retryWrites=true&w=majority

# JWT Secrets (générez des strings aléatoires)
JWT_ACCESS_SECRET=votre_secret_access_tres_long_et_aleatoire
JWT_REFRESH_SECRET=votre_secret_refresh_tres_long_et_aleatoire

# Server
PORT=5000
NODE_ENV=production

# Email (Gmail)
EMAIL_USER=votre.email@gmail.com
EMAIL_PASSWORD=votre_app_password_gmail

# Cloudinary
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret

# CORS (URL du frontend Netlify)
FRONTEND_URL=https://votre-site.netlify.app

# Twilio (optionnel, pour SMS/WhatsApp)
TWILIO_ACCOUNT_SID=votre_sid
TWILIO_AUTH_TOKEN=votre_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890
```

### Étape 4 : Déployer

Railway déploiera automatiquement après avoir ajouté les variables.

**Votre backend sera accessible sur :**
```
https://kineverse-production.up.railway.app
```

---

## 🔧 Configuration du backend pour Railway

### 1. Vérifier server.js

Assurez-vous que `backend/server.js` utilise la variable `PORT` :

```javascript
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 2. Configuration CORS

Dans `backend/server.js`, ajoutez le frontend Netlify :

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL, // URL Netlify
  ],
  credentials: true
}));
```

---

## 🔗 Connecter Frontend et Backend

### 1. Récupérer l'URL Railway

Dans Railway → Votre service → **Settings** → **Domains**
Exemple : `https://kineverse-production.up.railway.app`

### 2. Mettre à jour Netlify

Dans Netlify → **Site settings** → **Environment variables** :

```
VITE_API_URL=https://kineverse-production.up.railway.app/api
```

**IMPORTANT :** 
- Ajoutez `/api` à la fin si vos routes backend sont sous `/api`
- Pas de slash `/` final après `/api`

### 3. Redéployer le frontend

Dans Netlify → **Deploys** → **Trigger deploy**

---

## 📊 Monitoring et Logs

### Voir les logs en temps réel

Railway → Votre service → **Logs**

### Commandes utiles :

- **Restart** : Redémarrer le service
- **Redeploy** : Redéployer depuis GitHub
- **Sleep** : Mettre en pause (économiser les crédits)

---

## 💰 Coûts estimés

### Plan Hobby (avec 5$ gratuits/mois)

| Ressource | Estimation |
|-----------|------------|
| 512 MB RAM | ~3-4$/mois |
| vCPU | Inclus |
| Trafic sortant | 100 GB gratuits |

**Votre MVP :** ~3-4$/mois (couvert par les 5$ gratuits ✅)

Après épuisement du crédit : 5-10$/mois selon l'usage

---

## 🧪 Tester le backend déployé

### 1. Vérifier que le serveur répond

Ouvrez dans le navigateur :
```
https://votre-backend.up.railway.app/
```

Vous devriez voir une réponse (page d'accueil ou erreur 404, selon votre config)

### 2. Tester l'API

```bash
# Test de santé
curl https://votre-backend.up.railway.app/api/health

# Test d'authentification
curl -X POST https://votre-backend.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### 3. Tester depuis le frontend

Une fois Netlify mis à jour avec la nouvelle URL :
- Essayez de vous connecter
- Créez un rendez-vous
- Vérifiez que les données sont sauvegardées

---

## ⚠️ Problèmes courants

### 1. Build échoue

**Cause :** `package.json` ou dépendances manquantes

**Solution :**
```bash
cd backend
npm install
```

Committez et poussez sur GitHub.

### 2. Base de données inaccessible

**Cause :** IP non whitelistée sur MongoDB Atlas

**Solution :**
- MongoDB Atlas → Network Access
- Ajoutez `0.0.0.0/0` (autoriser toutes les IP)

### 3. CORS errors

**Cause :** Frontend URL non autorisée

**Solution :**
- Ajoutez l'URL Netlify dans les origines CORS
- Variable `FRONTEND_URL` sur Railway

### 4. Variables d'environnement manquantes

**Cause :** `.env` local pas sur Railway

**Solution :**
- Copiez TOUTES les variables de `backend/.env`
- Collez-les dans Railway → Variables

### 5. Port invalide

**Erreur :** `Port 5000 is already in use`

**Solution :**
Railway injecte automatiquement la variable `PORT`. Utilisez-la :
```javascript
const PORT = process.env.PORT || 5000;
```

---

## 🔐 Sécurité

### Secrets à générer

Pour JWT secrets, générez des strings aléatoires sécurisés :

```bash
# Dans un terminal Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copiez le résultat dans `JWT_ACCESS_SECRET` et `JWT_REFRESH_SECRET`

### Gmail App Password

Pour `EMAIL_PASSWORD`, utilisez un **App Password** :
1. Google Account → Security
2. 2-Step Verification (activez-la)
3. App passwords → Generate
4. Utilisez ce mot de passe (pas votre mot de passe Gmail)

---

## 🚀 Déploiements automatiques

Railway redéploie automatiquement à chaque `git push` sur `main`.

Pour désactiver :
Railway → Settings → **Deployment** → Désactivez **Auto-deploy**

---

## 📈 Scaling (si besoin plus tard)

### Augmenter les ressources

Railway → Settings → **Resources**
- RAM : 512 MB → 1 GB → 2 GB
- vCPU : Augmentation automatique

### Plusieurs instances

Railway → Settings → **Instances**
- Créez plusieurs réplicas pour load balancing

---

## ✅ Checklist de déploiement

Avant de mettre en production :

- [ ] MongoDB Atlas configuré et accessible
- [ ] Toutes les variables d'environnement sur Railway
- [ ] CORS configuré avec URL Netlify
- [ ] Backend accessible via URL Railway
- [ ] Frontend Netlify mis à jour avec URL backend
- [ ] Tests de login/register fonctionnent
- [ ] Tests de création de RDV fonctionnent
- [ ] Upload d'images Cloudinary fonctionne
- [ ] Emails de notification fonctionnent

---

## 🎉 Architecture finale

```
Frontend (Netlify)
    ↓ HTTPS
Backend (Railway)
    ↓
MongoDB Atlas
    ↓
Cloudinary (images)
```

---

## 📞 Support

**Railway Documentation :** https://docs.railway.app/
**Railway Discord :** https://discord.gg/railway
**MongoDB Atlas Support :** https://www.mongodb.com/support

---

## 🔄 Prochaines étapes

1. ✅ Déployer sur Railway
2. Configurer un domaine personnalisé (optionnel)
3. Ajouter monitoring (Sentry, LogRocket)
4. Configurer backups MongoDB
5. Implémenter rate limiting
6. Ajouter tests automatisés

Besoin d'aide pour une étape spécifique ? 🚀
