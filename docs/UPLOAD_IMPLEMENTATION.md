# 📋 Implémentation de l'Upload de Certificats Médicaux avec Cloudinary

## ✅ Ce qui a été fait

### 1. **Backend - Configuration Cloudinary**

#### Packages installés :
```bash
npm install cloudinary multer
```

#### Fichiers créés/modifiés :

**`backend/config/cloudinary.js`** - Configuration Cloudinary
- Configuration de Cloudinary avec variables d'environnement
- Middleware multer pour gérer les uploads
- Validation des fichiers (type et taille)
- Fonction helper `uploadToCloudinary` pour uploader vers Cloudinary

**`backend/models/Appointment.js`** - Modèle mis à jour
```javascript
attachment: {
  url: String,        // URL Cloudinary du fichier
  publicId: String,   // ID public Cloudinary (pour suppression)
  uploadedAt: Date    // Date d'upload
}
```

**`backend/routes/appointments.js`** - Routes mises à jour
- Nouvelle route `POST /api/appointments/upload-certificate` pour uploader les fichiers
- Route `POST /api/appointments` modifiée pour accepter le champ `attachment`

**`backend/.env`** - Variables d'environnement ajoutées
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. **Frontend - Modification du formulaire**

**`frontend/src/pages/AppointmentForm.jsx`** - Mis à jour
- Utilise maintenant `attachment` au lieu de `medicalCertificate` dans les données envoyées
- Upload vers `/api/appointments/upload-certificate`
- Stocke le résultat (`url` et `publicId`) dans `attachment`

### 3. **Documentation**

- **`backend/CLOUDINARY_SETUP.md`** - Guide de configuration Cloudinary
- **`backend/test-cloudinary.js`** - Script de test de connexion

## 🔧 Comment configurer

### Étape 1 : Créer un compte Cloudinary

1. Allez sur https://cloudinary.com
2. Créez un compte gratuit
3. Accédez à votre Dashboard

### Étape 2 : Récupérer les identifiants

Dans votre Dashboard Cloudinary, copiez :
- Cloud Name
- API Key  
- API Secret

### Étape 3 : Configurer les variables d'environnement

Éditez `backend/.env` et ajoutez :

```env
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

### Étape 4 : Tester la configuration

```bash
cd backend
node test-cloudinary.js
```

Si tout est correct, vous verrez :
```
✅ Configuration loaded
✅ Cloudinary API connection successful!
🎉 Cloudinary is ready to use!
```

### Étape 5 : Redémarrer le serveur

```bash
npm run dev
```

## 📝 Formats acceptés

- **Images** : JPG, JPEG, PNG
- **Documents** : PDF
- **Taille max** : 5 MB

## 🔄 Flux de l'upload

```
1. Patient sélectionne un fichier (photo/PDF)
   ↓
2. Frontend valide le fichier (type, taille)
   ↓
3. Frontend envoie vers /api/appointments/upload-certificate
   ↓
4. Backend multer reçoit le fichier en mémoire
   ↓
5. Backend upload vers Cloudinary
   ↓
6. Cloudinary retourne URL et publicId
   ↓
7. Frontend inclut attachment dans création de rendez-vous
   ↓
8. Backend enregistre appointment avec attachment
```

## 📂 Structure de stockage Cloudinary

```
kineverse/
└── medical-certificates/
    ├── certificate_1699999999999.jpg
    ├── certificate_1700000000000.pdf
    └── certificate_1700000000001.png
```

## 🎯 Utilisation

### Dans le formulaire de rendez-vous (Step 4)

Le patient peut :
1. **Prendre une photo** avec la caméra du téléphone
2. **Uploader un fichier** depuis l'appareil
3. **Voir un aperçu** de l'image uploadée
4. **Supprimer** le fichier avant de soumettre

### Traitement

- **Images** : Redimensionnées automatiquement (max 1500x1500px)
- **PDF** : Stockés tels quels
- **Sécurité** : Validation côté client ET serveur

## 🔐 Sécurité

✅ Validation du type MIME côté serveur
✅ Limite de taille 5MB
✅ Seuls JPG, PNG, PDF acceptés
✅ Fichiers stockés dans un dossier dédié
✅ URL sécurisées Cloudinary

## 🛠️ Maintenance

### Voir les fichiers uploadés

Connectez-vous à votre Dashboard Cloudinary :
- Media Library → kineverse/medical-certificates

### Supprimer un fichier (si besoin)

```javascript
import { cloudinary } from '../config/cloudinary.js';

await cloudinary.uploader.destroy(publicId, { 
  resource_type: 'image' // ou 'raw' pour PDF
});
```

### Limites du plan gratuit

- Stockage : 25 GB
- Bande passante : 25 GB/mois
- Transformations : 25 000/mois

*Largement suffisant pour un MVP*

## 🐛 Dépannage

### Erreur : "Upload failed"

**Solution** :
1. Vérifiez les variables d'environnement dans `.env`
2. Redémarrez le serveur backend
3. Testez avec `node test-cloudinary.js`

### Erreur : "File too large"

**Solution** : Le fichier dépasse 5 MB. Demandez au patient de :
- Compresser l'image
- Réduire la qualité de la photo
- Scanner en basse résolution

### Erreur : "Invalid file type"

**Solution** : Seuls JPG, PNG et PDF sont acceptés

## ✨ Fonctionnalités

✅ Upload de photos (caméra mobile)
✅ Upload de fichiers (galerie)
✅ Upload de PDF
✅ Prévisualisation des images
✅ Validation de la taille (5MB)
✅ Validation du type (JPG, PNG, PDF)
✅ Stockage cloud Cloudinary
✅ Messages d'erreur bilingues (FR/AR)
✅ Champ optionnel (pas obligatoire)

## 📱 Expérience utilisateur

### Mobile
- Bouton "Appareil photo" pour prendre une photo directement
- Bouton "Fichier" pour choisir depuis la galerie
- Prévisualisation immédiate
- Possibilité de supprimer et ré-uploader

### Desktop
- Zone de glisser-déposer (drag & drop)
- Sélection de fichier classique
- Prévisualisation
- Messages clairs en cas d'erreur

## 🎨 Interface

L'upload est intégré dans **Step 4** du formulaire de rendez-vous :

```
Step 1: Informations personnelles
Step 2: Choix du service
Step 3: Choix de la date
Step 4: Choix de l'heure + Upload certificat ← ICI
```

Le certificat est **optionnel** - le patient peut créer un rendez-vous sans certificat.

## 🚀 Prêt à utiliser !

Tout est configuré et prêt. Il vous suffit de :

1. Ajouter vos identifiants Cloudinary dans `.env`
2. Tester avec `node test-cloudinary.js`
3. Démarrer le serveur
4. Tester l'upload dans le formulaire de rendez-vous

---

**Questions ?** Consultez `CLOUDINARY_SETUP.md` pour plus de détails.
