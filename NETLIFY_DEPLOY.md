# 🚀 Guide de déploiement sur Netlify

## 📋 Prérequis

- ✅ Code sur GitHub (fait!)
- ✅ Compte Netlify (gratuit) : https://app.netlify.com/signup

---

## 🌐 Méthode 1 : Déploiement via GitHub (RECOMMANDÉ)

### Étape 1 : Connecter GitHub à Netlify

1. Allez sur https://app.netlify.com
2. Cliquez sur **"Add new site"** → **"Import an existing project"**
3. Choisissez **"Deploy with GitHub"**
4. Autorisez Netlify à accéder à votre GitHub
5. Sélectionnez le repository **`kineverse`**

### Étape 2 : Configuration du build

Netlify détectera automatiquement le `netlify.toml`, mais vérifiez :

```
Base directory: frontend
Build command: npm run build
Publish directory: frontend/dist
```

### Étape 3 : Variables d'environnement

Dans **Site settings** → **Environment variables**, ajoutez :

| Key | Value |
|-----|-------|
| `VITE_API_URL` | URL de votre backend (ex: https://votre-backend.onrender.com) |

**IMPORTANT**: Ne mettez PAS de slash `/` à la fin de l'URL

### Étape 4 : Déployer

1. Cliquez sur **"Deploy site"**
2. Attendez 2-3 minutes ⏱️
3. Votre site sera disponible sur : `https://random-name-12345.netlify.app`

### Étape 5 : Domaine personnalisé (optionnel)

1. **Site settings** → **Domain management**
2. Cliquez sur **"Add custom domain"**
3. Entrez votre domaine (ex: `kineverse.com`)
4. Suivez les instructions DNS

---

## 💻 Méthode 2 : Déploiement via CLI

### Installation de Netlify CLI

```bash
npm install -g netlify-cli
```

### Connexion à Netlify

```bash
netlify login
```

### Déploiement

```bash
cd frontend
npm run build
netlify deploy --prod
```

Suivez les instructions :
- Create & configure a new site? **Yes**
- Team: **Votre équipe**
- Site name: **kineverse** (ou autre nom)
- Publish directory: **./dist**

---

## 🔧 Configuration post-déploiement

### 1. Activer les déploiements automatiques

✅ Déjà activé si vous avez utilisé la Méthode 1  
À chaque `git push`, Netlify redéploie automatiquement

### 2. Configurer les notifications

**Site settings** → **Build & deploy** → **Deploy notifications**
- Email de notification
- Webhook Slack (optionnel)

### 3. Activer HTTPS

✅ Activé automatiquement par Netlify  
Certificat SSL Let's Encrypt gratuit

### 4. Configuration des formulaires (pour ContactForm)

Si vous utilisez Netlify Forms, ajoutez `netlify` à votre formulaire :

```jsx
<form name="contact" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="contact" />
  {/* Vos champs */}
</form>
```

---

## 🧪 Tester le déploiement

### Vérifications essentielles :

- [ ] Page d'accueil charge correctement
- [ ] Animations 3D fonctionnent
- [ ] Audio de bienvenue fonctionne
- [ ] Switch FR/AR fonctionne
- [ ] Login/Register se connectent au backend
- [ ] Images et modèles 3D chargent
- [ ] Console sans erreurs

### URLs à tester :

```
https://votre-site.netlify.app/
https://votre-site.netlify.app/services
https://votre-site.netlify.app/login
https://votre-site.netlify.app/register
```

---

## ⚠️ Problèmes courants

### 1. "Page Not Found" sur rafraîchissement

**Cause**: React Router ne fonctionne pas  
**Solution**: ✅ Déjà résolu avec `netlify.toml` redirects

### 2. Backend API non accessible

**Cause**: Variable `VITE_API_URL` mal configurée  
**Solution**: 
- Vérifiez dans Netlify → Environment variables
- Pas de `/` à la fin
- Redéployer après modification

### 3. Modèles 3D ne chargent pas

**Cause**: Fichiers GLB trop gros ou CORS  
**Solution**: 
- Vérifiez la taille des fichiers
- Activez CORS sur le backend

### 4. Build échoue

**Cause**: Dépendances manquantes  
**Solution**: 
```bash
cd frontend
npm install
npm run build  # Tester localement d'abord
```

---

## 📊 Limites du plan gratuit Netlify

| Ressource | Limite gratuite |
|-----------|-----------------|
| Bande passante | 100 GB/mois |
| Build minutes | 300 min/mois |
| Sites | Illimités |
| Membres d'équipe | 1 |
| Déploiements | Illimités |

**Votre projet** : ~24 MB par déploiement  
Estimation : **Largement suffisant** pour un MVP

---

## 🎯 Commandes utiles après déploiement

```bash
# Voir les logs de build
netlify logs

# Voir les infos du site
netlify status

# Ouvrir le site dans le navigateur
netlify open

# Voir les variables d'environnement
netlify env:list

# Rollback vers un déploiement précédent
netlify rollback
```

---

## 🔗 Prochaine étape : Déployer le Backend

Une fois le frontend déployé, vous aurez besoin de déployer le backend sur :
- **Render** (gratuit avec limitations)
- **Railway** (gratuit 5$/mois de crédit)
- **Heroku** (payant)

Voulez-vous un guide de déploiement backend également ?

---

## ✅ Checklist finale

Avant de mettre en production :

- [ ] Backend déployé et accessible
- [ ] Variable `VITE_API_URL` configurée
- [ ] Site testé sur mobile et desktop
- [ ] Certificat SSL actif (HTTPS)
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] Analytics configuré (Google Analytics, optionnel)
- [ ] SEO : meta tags, favicon
- [ ] Tests de tous les parcours utilisateurs

---

## 🎉 Félicitations !

Votre frontend sera accessible 24/7 avec :
- ⚡ CDN mondial ultra-rapide
- 🔒 HTTPS automatique
- 🔄 Déploiements automatiques à chaque push
- 📊 Analytics intégrés
