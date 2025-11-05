# KinéVerse 🌀

**Plateforme web moderne pour cabinet de kinésithérapie** avec réservation en ligne, gestion des rendez-vous, et notifications multi-canaux.

![Status](https://img.shields.io/badge/status-MVP-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🎯 Fonctionnalités

- ✅ **Réservation en ligne** - Invité ou connecté
- 👥 **Multi-rôles** - Patient, Kinésithérapeute, Admin
- 📧 **Notifications** - Email + SMS + WhatsApp (Twilio)
- 📅 **Gestion RDV** - Règle 48h pour modifications
- 💳 **Paiement cash** - Suivi des paiements en séance
- 🎨 **UI moderne** - Interface responsive avec Tailwind CSS
- 🔐 **Authentification** - JWT avec tokens refresh
- 🌐 **3D Ready** - Préparé pour animation R3F

## 🛠️ Stack Technique

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Nodemailer (Email)
- Twilio (SMS/WhatsApp)

### Frontend
- React 18 + Vite
- Tailwind CSS
- React Router v6
- Zustand (State)
- React Three Fiber (3D - à venir)
- Framer Motion (Animations)

## 🚀 Installation

### Prérequis

- Node.js 18+
- MongoDB
- Compte Twilio (pour SMS/WhatsApp)
- Compte email (Gmail ou autre)

### 1. Cloner le projet

```bash
git clone <repository-url>
cd mvp
```

### 2. Backend

```bash
cd backend
npm install

# Configuration
cp .env.example .env
# Éditer .env avec vos credentials

# Seed la base de données
npm run seed

# Démarrer le serveur
npm run dev
```

Le backend tourne sur `http://localhost:5000`

### 3. Frontend

```bash
cd frontend
npm install

# Configuration
cp .env.example .env
# Éditer si besoin

# Démarrer l'app
npm run dev
```

Le frontend tourne sur `http://localhost:5173`

## 👤 Comptes de Test

Après avoir exécuté `npm run seed` dans le backend :

**Admin:**
- Email: `admin@kineverse.com`
- Mot de passe: `Admin123!`

**Kinésithérapeute:**
- Email: `sarah@kineverse.com`
- Mot de passe: `Kine123!`

**Patient:**
- Email: `patient@test.com`
- Mot de passe: `Patient123!`

## 📁 Structure du Projet

```
mvp/
├── backend/
│   ├── config/          # Configuration DB
│   ├── models/          # Modèles Mongoose
│   ├── routes/          # Routes API
│   ├── middleware/      # Auth & validation
│   ├── services/        # Services (email, SMS)
│   ├── scripts/         # Scripts utilitaires
│   └── server.js        # Point d'entrée
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Composants réutilisables
│   │   ├── pages/       # Pages de l'app
│   │   ├── store/       # State management (Zustand)
│   │   ├── lib/         # Utilitaires
│   │   └── App.jsx      # App principale
│   └── public/          # Assets statiques
│
└── README.md            # Ce fichier
```

## 🔑 Variables d'Environnement

### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/kineverse

# JWT
JWT_ACCESS_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_key

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

## 📚 API Documentation

### Endpoints Principaux

#### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion

#### Rendez-vous
- `POST /api/appointments` - Créer RDV
- `GET /api/appointments/user/:id` - RDV d'un utilisateur
- `PUT /api/appointments/:id` - Modifier RDV
- `POST /api/appointments/:id/confirm` - Confirmer (kiné)
- `POST /api/appointments/:id/cancel` - Annuler
- `POST /api/appointments/:id/payment` - Marquer payé (kiné)

#### Services
- `GET /api/services` - Liste des services
- `POST /api/services` - Créer service (admin/kiné)

#### Utilisateurs
- `GET /api/users/kines` - Liste des kinés
- `PUT /api/users/:id` - Mettre à jour profil

## 🎨 Fonctionnalités à Venir

- [ ] Animation 3D sur page d'accueil (R3F + lipsync)
- [ ] Système de rappels automatiques 24h avant
- [ ] Calendrier interactif avec disponibilités
- [ ] Dashboard admin complet
- [ ] Statistiques et rapports
- [ ] Export PDF des factures
- [ ] Chat en temps réel
- [ ] Application mobile (React Native)

## 🚢 Déploiement

### Backend - Railway/Render

1. Créer nouveau projet
2. Connecter repository GitHub
3. Ajouter variables d'environnement
4. Déployer

### Frontend - Vercel

1. Importer projet depuis GitHub
2. Définir `VITE_API_URL`
3. Déployer

### Base de données - MongoDB Atlas

1. Créer cluster sur [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Obtenir connection string
3. Mettre à jour `MONGODB_URI`

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou un pull request.

## 📄 License

MIT

## 💬 Support

Pour toute question ou support :
- Email: contact@kineverse.com
- Téléphone: +212 6 00 00 00 00

---

**Développé avec ❤️ pour moderniser les cabinets de kinésithérapie**
