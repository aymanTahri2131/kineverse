# 🧪 Guide de Test - Upload de Certificats Médicaux

## 📋 Prérequis

Avant de tester :

1. ✅ Compte Cloudinary créé
2. ✅ Variables d'environnement configurées dans `backend/.env`
3. ✅ Packages installés (`npm install` dans backend)
4. ✅ Serveur backend démarré

## 🔧 Test 1 : Configuration Cloudinary

```bash
cd backend
node test-cloudinary.js
```

**Résultat attendu** :
```
🧪 Testing Cloudinary connection...

✅ Configuration loaded:
   Cloud Name: votre_cloud_name
   API Key: ✓ Set
   API Secret: ✓ Set

✅ Cloudinary API connection successful!
   Status: ok

🎉 Cloudinary is ready to use!
```

**Si erreur** :
- Vérifiez les variables dans `.env`
- Redémarrez le terminal

## 🧪 Test 2 : Upload via API (avec Postman/Insomnia)

### Endpoint : Upload Certificate

**URL** : `POST http://localhost:5000/api/appointments/upload-certificate`

**Headers** :
```
Content-Type: multipart/form-data
```

**Body (form-data)** :
- Key: `certificate`
- Type: `File`
- Value: Sélectionnez une image JPG/PNG ou un PDF

**Réponse attendue (200)** :
```json
{
  "message": "Fichier uploadé avec succès",
  "url": "https://res.cloudinary.com/your-cloud/image/upload/v123456789/kineverse/medical-certificates/certificate_123456789.jpg",
  "publicId": "kineverse/medical-certificates/certificate_123456789"
}
```

**Erreurs possibles** :
- 400 : Fichier non fourni
- 400 : Type de fichier non autorisé
- 500 : Erreur Cloudinary (vérifiez les credentials)

## 🧪 Test 3 : Création de Rendez-vous avec Certificat

### Endpoint : Create Appointment

**URL** : `POST http://localhost:5000/api/appointments`

**Headers** :
```
Content-Type: application/json
```

**Body (JSON)** :
```json
{
  "service": {
    "fr": "Rééducation en traumatologie",
    "ar": "الترويض الطبي لامراض العضام و الكسور"
  },
  "date": "2025-11-10T10:00:00.000Z",
  "notes": "Test avec certificat",
  "attachment": {
    "url": "https://res.cloudinary.com/your-cloud/image/upload/v123456789/kineverse/medical-certificates/certificate_123456789.jpg",
    "publicId": "kineverse/medical-certificates/certificate_123456789"
  },
  "guestInfo": {
    "name": "Test Patient",
    "phone": "0612345678"
  }
}
```

**Réponse attendue (201)** :
```json
{
  "appointment": {
    "_id": "...",
    "service": {...},
    "date": "2025-11-10T10:00:00.000Z",
    "attachment": {
      "url": "https://res.cloudinary.com/...",
      "publicId": "kineverse/medical-certificates/...",
      "uploadedAt": "2025-11-04T..."
    },
    "guestInfo": {...},
    "status": "pending"
  }
}
```

## 🌐 Test 4 : Interface Utilisateur

### 1. Accéder au formulaire de rendez-vous

```
http://localhost:5173
```

Cliquez sur "Prendre rendez-vous"

### 2. Remplir le formulaire

**Step 1** : Informations personnelles
- Nom complet
- Téléphone

**Step 2** : Choix du service
- Sélectionnez un service

**Step 3** : Choix de la date
- Sélectionnez une date

**Step 4** : Choix de l'heure + Upload certificat
- Sélectionnez une heure
- Cliquez sur la zone d'upload
- Sélectionnez une image ou un PDF

### 3. Vérifier l'upload

✅ Le fichier doit s'afficher en prévisualisation
✅ Le nom du fichier et la taille doivent être visibles
✅ Un bouton "X" permet de supprimer

### 4. Soumettre

Cliquez sur "Confirmer le rendez-vous"

**Résultat attendu** :
- Message de succès
- Redirection vers la page d'accueil
- Toast de confirmation

## 🔍 Test 5 : Vérifier dans Cloudinary

1. Connectez-vous à votre Dashboard Cloudinary
2. Allez dans "Media Library"
3. Ouvrez le dossier `kineverse/medical-certificates`
4. Vous devriez voir votre fichier uploadé

## ❌ Tests d'erreurs

### Test : Fichier trop grand (> 5MB)

**Action** : Uploader un fichier de 6MB

**Résultat attendu** :
- Message d'erreur : "Le fichier ne doit pas dépasser 5 MB"
- Upload bloqué

### Test : Type de fichier invalide

**Action** : Uploader un fichier .txt ou .doc

**Résultat attendu** :
- Message d'erreur : "Type de fichier non autorisé"
- Upload bloqué

### Test : Pas de fichier

**Action** : Créer un rendez-vous sans uploader de certificat

**Résultat attendu** :
- Le rendez-vous est créé sans problème
- Le champ `attachment` est `null` ou absent

## 📊 Vérifier dans la base de données

### MongoDB

Connectez-vous à MongoDB et vérifiez :

```javascript
db.appointments.findOne({ 
  "attachment.url": { $exists: true } 
})
```

**Résultat attendu** :
```javascript
{
  "_id": ObjectId("..."),
  "attachment": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "kineverse/medical-certificates/certificate_...",
    "uploadedAt": ISODate("2025-11-04T...")
  },
  // autres champs...
}
```

## ✅ Checklist de validation

- [ ] Configuration Cloudinary testée avec `test-cloudinary.js`
- [ ] Upload d'une image JPG via API
- [ ] Upload d'une image PNG via API
- [ ] Upload d'un PDF via API
- [ ] Création de rendez-vous avec certificat
- [ ] Création de rendez-vous sans certificat
- [ ] Upload via interface utilisateur (mobile)
- [ ] Upload via interface utilisateur (desktop)
- [ ] Prévisualisation des images
- [ ] Suppression avant soumission
- [ ] Validation de la taille (> 5MB rejeté)
- [ ] Validation du type (.txt rejeté)
- [ ] Vérification dans Cloudinary Media Library
- [ ] Vérification dans MongoDB

## 🐛 Problèmes courants

### Problème : "CLOUDINARY_CLOUD_NAME is not defined"

**Solution** :
```bash
# Vérifiez le fichier .env
cat backend/.env | grep CLOUDINARY

# Redémarrez le serveur
cd backend
npm run dev
```

### Problème : "Cannot find module 'multer'"

**Solution** :
```bash
cd backend
npm install
```

### Problème : "Upload failed with status 401"

**Solution** : Credentials Cloudinary incorrects
- Vérifiez `CLOUDINARY_API_KEY` et `CLOUDINARY_API_SECRET`
- Copiez-collez depuis le Dashboard Cloudinary

### Problème : "Upload failed with status 500"

**Solution** : Erreur serveur
- Vérifiez les logs du serveur backend
- Vérifiez que le serveur est démarré
- Vérifiez la connexion internet

## 📝 Notes

- Le certificat est **optionnel** - ne pas bloquer la création de rendez-vous
- Les images sont automatiquement redimensionnées à 1500x1500px max
- Les PDF sont stockés tels quels
- Les fichiers restent dans Cloudinary même après suppression du rendez-vous
- Plan gratuit Cloudinary : 25GB de stockage (largement suffisant pour un MVP)

## 🎉 Félicitations !

Si tous les tests passent, l'implémentation est complète et fonctionnelle !
