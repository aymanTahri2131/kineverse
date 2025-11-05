# Configuration Cloudinary pour l'Upload de Certificats Médicaux

## Présentation

L'application utilise **Cloudinary** pour stocker les certificats médicaux (photos et PDF) uploadés par les patients lors de la création d'un rendez-vous.

## Formats Acceptés

- **Images** : JPG, JPEG, PNG
- **Documents** : PDF
- **Taille maximale** : 5 MB

## Configuration

### 1. Créer un compte Cloudinary

1. Allez sur [cloudinary.com](https://cloudinary.com)
2. Créez un compte gratuit
3. Accédez à votre Dashboard

### 2. Récupérer vos identifiants

Dans votre Dashboard Cloudinary, vous trouverez :
- **Cloud Name** : Nom de votre cloud
- **API Key** : Clé API
- **API Secret** : Secret API

### 3. Configurer les variables d'environnement

Dans le fichier `backend/.env`, ajoutez :

```env
# Cloudinary (pour l'upload de certificats médicaux)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Remplacez `your_cloud_name`, `your_api_key` et `your_api_secret` par vos vraies valeurs.

## Structure de Stockage

Les fichiers sont organisés dans Cloudinary :

```
kineverse/
└── medical-certificates/
    ├── certificate_1699999999999.jpg
    ├── certificate_1700000000000.pdf
    └── ...
```

## Utilisation dans l'Application

### Backend

Le backend gère l'upload via :
- **Route** : `POST /api/appointments/upload-certificate`
- **Middleware** : multer pour gérer les fichiers
- **Storage** : Cloudinary pour stockage cloud

### Frontend

Le patient peut uploader un certificat médical dans l'étape 4 du formulaire de rendez-vous :
1. Cliquer sur la zone d'upload
2. Choisir un fichier (image ou PDF)
3. Le fichier est uploadé sur Cloudinary
4. Le lien est enregistré avec le rendez-vous

## Transformation d'Images

Les images sont automatiquement optimisées :
- **Taille maximale** : 1500x1500 pixels
- **Qualité** : Automatique
- **Format** : Original préservé

## Sécurité

- Les fichiers sont validés côté serveur (type MIME et taille)
- Seuls les types autorisés sont acceptés
- Limite de 5 MB par fichier
- Les fichiers sont stockés dans un dossier dédié

## Modèle de Données

Le champ `attachment` dans le modèle `Appointment` :

```javascript
attachment: {
  url: String,        // URL Cloudinary
  publicId: String,   // ID public pour suppression
  uploadedAt: Date    // Date d'upload
}
```

## Maintenance

### Supprimer un fichier

Si nécessaire, vous pouvez supprimer un fichier via l'API Cloudinary :

```javascript
import { cloudinary } from '../config/cloudinary.js';

// Supprimer par public_id
await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
```

### Limites du Plan Gratuit

Plan gratuit Cloudinary :
- **Stockage** : 25 GB
- **Bande passante** : 25 GB/mois
- **Transformations** : 25 000/mois

## Dépannage

### Erreur "Upload failed"

1. Vérifiez que les variables d'environnement sont correctes
2. Vérifiez que le fichier ne dépasse pas 5 MB
3. Vérifiez le format du fichier (JPG, PNG, PDF uniquement)

### Erreur "Invalid credentials"

1. Vérifiez votre `CLOUDINARY_CLOUD_NAME`
2. Vérifiez votre `CLOUDINARY_API_KEY`
3. Vérifiez votre `CLOUDINARY_API_SECRET`
4. Redémarrez le serveur backend après modification du `.env`

## Alternative Locale (Développement)

Si vous ne voulez pas utiliser Cloudinary en développement, vous pouvez :
1. Commenter la validation dans `AppointmentForm.jsx`
2. Rendre le champ `attachment` optionnel
3. Les rendez-vous seront créés sans certificat

## Ressources

- [Documentation Cloudinary](https://cloudinary.com/documentation)
- [Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Upload API](https://cloudinary.com/documentation/upload_images)
