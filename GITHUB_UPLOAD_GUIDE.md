# 🚀 Guide de nettoyage et upload sur GitHub

## ✅ Checklist avant upload

### 1. Fichiers sensibles à NE JAMAIS commiter

- [ ] ❌ `backend/.env`
- [ ] ❌ `frontend/.env`
- [ ] ❌ `node_modules/`
- [ ] ❌ Fichiers avec clés API/secrets

### 2. Fichiers à supprimer (développement uniquement)

- [ ] `backend/test-cloudinary.js`
- [ ] `frontend/convert-audio.bat`
- [ ] `frontend/generate-lipsync*.bat`
- [ ] `frontend/Rhubarb-Lip-Sync-1.14.0-Windows/`
- [ ] `frontend/LIPSYNC_*.md`
- [ ] `frontend/AUDIO_MULTI_SEGMENTS.md`

### 3. Documentation à organiser

- [ ] Déplacer tous les `.md` vers `docs/`
- [ ] Garder uniquement `README.md` et `QUICKSTART.md` à la racine

---

## 🛠️ Méthode 1 : Utiliser le script automatique (RECOMMANDÉ)

### Windows
```bash
cleanup.bat
```

### Linux/Mac
```bash
chmod +x cleanup.sh
./cleanup.sh
```

---

## 🛠️ Méthode 2 : Nettoyage manuel

### Étape 1 : Supprimer les fichiers de développement

```bash
# Backend
rm backend/test-cloudinary.js

# Frontend
rm frontend/convert-audio.bat
rm frontend/generate-lipsync.bat
rm frontend/generate-lipsync-all.bat
rm -rf frontend/Rhubarb-Lip-Sync-1.14.0-Windows
rm frontend/AUDIO_MULTI_SEGMENTS.md
rm frontend/LIPSYNC_*.md
```

### Étape 2 : Organiser la documentation

```bash
mkdir -p docs
mv AUTH_IMPROVEMENTS.md docs/
mv BUILD_SUMMARY.md docs/
mv DASHBOARD_IMPROVEMENTS.md docs/
mv RBAC_IMPLEMENTATION_SUMMARY.md docs/
mv RBAC_SYSTEM.md docs/
mv UPLOAD_IMPLEMENTATION.md docs/
mv UPLOAD_TESTING_GUIDE.md docs/
```

### Étape 3 : Vérifier le .gitignore

Assurez-vous que `.gitignore` contient :

```
# Environment variables (NEVER COMMIT)
.env
.env.local
*.env

# Dependencies
node_modules/

# Build
dist/
build/

# Logs
*.log
```

---

## 🔐 Sécurité - Vérification finale

### Avant de commiter, vérifiez :

```bash
# Voir les fichiers qui seront committés
git status

# Vérifier qu'aucun .env n'apparaît
git status | grep ".env"

# Si .env apparaît, l'ajouter à .gitignore
echo ".env" >> .gitignore
git rm --cached backend/.env frontend/.env
```

---

## 📤 Upload sur GitHub

### Initialiser Git (si pas déjà fait)

```bash
git init
git add .
git commit -m "Initial commit - MVP Centre Imane"
```

### Créer un repository sur GitHub

1. Aller sur https://github.com/new
2. Nom : `centre-imane-kine` ou `kineverse-mvp`
3. Visibilité : **Private** (recommandé pour un projet client)
4. Ne pas initialiser avec README (déjà existant)

### Lier et pousser

```bash
git remote add origin https://github.com/VOTRE_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

---

## 🔒 Configuration des secrets sur GitHub

Si vous utilisez GitHub Actions, ajoutez les secrets :

1. Repository → Settings → Secrets and variables → Actions
2. Ajouter :
   - `MONGODB_URI`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `EMAIL_PASSWORD`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

---

## 📊 Taille du repository

Après nettoyage, votre repository devrait faire environ :

- Sans `node_modules/` : **~5-10 MB**
- Sans fichiers LipSync : **-150 MB**
- Total optimisé : **< 10 MB** ✅

---

## ✅ Vérification post-upload

Sur GitHub, vérifiez que ces fichiers sont ABSENTS :

- ❌ `.env`
- ❌ `node_modules/`
- ❌ Fichiers de test
- ❌ Outils de développement (Rhubarb)

Et que ces fichiers sont PRÉSENTS :

- ✅ `README.md`
- ✅ `.gitignore`
- ✅ `.env.example` (backend et frontend)
- ✅ `package.json` (backend et frontend)
- ✅ Code source (`src/`, `routes/`, `models/`, etc.)

---

## 🎉 Félicitations !

Votre projet est maintenant propre et prêt pour GitHub !

### Prochaines étapes possibles :

1. Configurer CI/CD avec GitHub Actions
2. Déployer sur Vercel (frontend) + Render/Railway (backend)
3. Configurer les branch protections
4. Ajouter des collaborateurs si nécessaire
