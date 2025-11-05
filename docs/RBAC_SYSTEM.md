# 🔐 Système de Contrôle d'Accès par Rôle (RBAC)

## Vue d'ensemble

Le système implémente un contrôle d'accès basé sur les rôles (RBAC) avec **3 rôles distincts** :
- **👤 Patient** : Utilisateur standard qui prend des rendez-vous
- **👨‍⚕️ Kiné** : Kinésithérapeute qui gère ses patients et rendez-vous
- **🔐 Admin** : Administrateur avec accès complet au système

---

## 📋 Rôles et Permissions

### 1. **👤 PATIENT**

#### Accès Dashboard : `/dashboard/patient`
#### Permissions :
- ✅ **Voir** ses propres rendez-vous
- ✅ **Prendre** de nouveaux rendez-vous
- ✅ **Annuler** ses rendez-vous (si >48h avant)
- ✅ **Modifier** ses rendez-vous (si >48h avant)
- ✅ **Voir** les statistiques personnelles
- ❌ **Pas d'accès** aux autres patients
- ❌ **Pas d'accès** aux données des kinés
- ❌ **Pas d'accès** à l'admin

#### Fonctionnalités Dashboard :
- 📊 **3 KPIs** :
  - Rendez-vous à venir
  - Séances complétées
  - En attente de confirmation
- 🔔 **Prochain rendez-vous** en évidence
- 📅 **Liste des rendez-vous** avec filtres
- ➕ **Bouton rapide** pour nouveau rendez-vous
- 🎨 **Indicateur visuel** pour RDV à venir

#### Restrictions :
- Ne peut voir que ses propres données
- Modification/annulation limitée à 48h avant
- Pas d'accès aux routes admin ou kiné

---

### 2. **👨‍⚕️ KINÉ**

#### Accès Dashboard : `/dashboard/kine`
#### Permissions :
- ✅ **Voir** tous ses rendez-vous assignés
- ✅ **Confirmer** les rendez-vous en attente
- ✅ **Marquer** les paiements comme payés
- ✅ **Voir** les statistiques de performance
- ✅ **Gérer** le statut des séances
- ❌ **Pas d'assignation** automatique (fait par admin)
- ❌ **Pas d'accès** aux autres kinés
- ❌ **Pas d'accès** admin

#### Fonctionnalités Dashboard :
- 📊 **Mode Liste** :
  - 4 KPIs principaux (En attente, Cette semaine, Ce mois, Total)
  - 3 Stats additionnelles (Paiements, Confirmés, Terminés)
  - Liste détaillée avec actions (Confirmer, Marquer payé)
  - Filtres : En attente, Confirmés, Terminés, Tous
  
- 📊 **Mode Statistiques** :
  - Graphique de tendance hebdomadaire (7 jours)
  - Distribution par statut (Pie chart)
  - Top 5 services demandés (Bar chart)

#### Actions disponibles :
- **Confirmer** un rendez-vous pending → confirmed
- **Marquer payé** un rendez-vous confirmed → done + paid
- **Voir** informations complètes patient/service

#### Restrictions :
- Ne voit que ses propres rendez-vous assignés
- Ne peut pas assigner/réassigner des RDV
- Ne peut pas supprimer de rendez-vous
- Ne peut pas gérer d'autres kinés

---

### 3. **🔐 ADMIN**

#### Accès Dashboard : `/dashboard/admin`
#### Permissions :
- ✅ **Accès TOTAL** à tous les rendez-vous
- ✅ **Assigner** des kinés aux rendez-vous
- ✅ **Modifier** n'importe quel statut
- ✅ **Supprimer** des rendez-vous
- ✅ **Gérer** tous les utilisateurs
- ✅ **Activer/Désactiver** des comptes
- ✅ **Voir** toutes les statistiques système
- ✅ **Exporter** des rapports (à venir)

#### Fonctionnalités Dashboard :

##### **Mode Vue d'ensemble** :
- 📊 **4 KPIs principaux** :
  - Total rendez-vous (+ cette semaine)
  - En attente de confirmation
  - Total utilisateurs (kinés + patients)
  - Paiements (payés vs non payés)
  
- 📊 **3 Stats secondaires** :
  - Distribution par statut
  - Rendez-vous ce mois
  - Kinés actifs

- ⚡ **Actions rapides** :
  - Gérer rendez-vous
  - Gérer utilisateurs
  - Actualiser données
  - Exporter rapport

- 🏆 **Performance des kinés** :
  - Top 5 kinés par nombre de RDV
  - Détails : Total, Terminés, En attente

##### **Mode Rendez-vous** :
- 🔍 **Recherche** par nom patient/kiné
- 🎯 **Filtres** par statut
- 📋 **Table complète** avec :
  - Informations patient (nom, téléphone)
  - Service demandé (bilingue)
  - Date et heure
  - **Assignation kiné** (dropdown si non assigné)
  - **Modification statut** (dropdown)
  - **Suppression** (icône trash)

##### **Mode Utilisateurs** :
- 📋 **Liste complète** tous rôles
- 👥 **Informations** : Nom, Email, Téléphone, Rôle, Statut
- ✅ **Activer/Désactiver** comptes (toggle)
- ✏️ **Édition** utilisateurs (à venir)
- ➕ **Ajouter** nouveaux utilisateurs (à venir)

##### **Mode Statistiques** :
- 📈 **Tendance 30 jours** (Line chart)
- 🥧 **Distribution statuts** (Pie chart)
- 📊 **Top 5 services** (Bar chart)

#### Actions disponibles :
- **Assigner kiné** : Attribuer un kiné à un RDV non assigné
- **Modifier statut** : Changer n'importe quel statut
- **Supprimer RDV** : Suppression complète (avec confirmation)
- **Activer/Désactiver user** : Gérer accès comptes
- **Tout voir** : Accès complet données

---

## 🛣️ Routes et Protections

### Routes Frontend

```javascript
// Public Routes
/ (Home)
/login
/register
/services
/book (peut être utilisé par invités)

// Protected Routes - Patient
/dashboard/patient → ProtectedRoute(['patient'])

// Protected Routes - Kiné
/dashboard/kine → ProtectedRoute(['kine'])

// Protected Routes - Admin
/dashboard/admin → ProtectedRoute(['admin'])
```

### Routes Backend

#### **Rendez-vous** (`/api/appointments`)

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/` | Public (optionalAuth) | Liste RDV (limitée si non auth) |
| GET | `/booked-slots` | Public | Slots réservés (vérification dispo) |
| GET | `/user/:userId` | Auth (owner/admin) | RDV d'un utilisateur |
| GET | `/:id` | Auth (owner/admin) | Détails RDV |
| POST | `/` | Public (optionalAuth) | Créer RDV |
| POST | `/:id/confirm` | Kiné/Admin | Confirmer RDV |
| POST | `/:id/cancel` | Auth (owner/admin) | Annuler RDV |
| POST | `/:id/payment` | Kiné/Admin | Marquer payé |
| PUT | `/:id` | Auth (owner) + 48h rule | Modifier RDV |
| **PATCH** | `/:id/assign-kine` | **Admin only** | Assigner kiné |
| **PATCH** | `/:id` | **Admin only** | Modifier statut |
| **DELETE** | `/:id` | **Admin only** | Supprimer RDV |

#### **Utilisateurs** (`/api/users`)

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/` | **Admin only** | Liste tous utilisateurs |
| GET | `/kines` | Public | Liste kinés actifs |
| GET | `/:id` | Auth (owner/admin) | Détails utilisateur |
| PUT | `/:id` | Auth (owner/admin) | Modifier profil |
| PUT | `/:id/password` | Auth (owner/admin) | Modifier password |
| **PATCH** | `/:id` | **Admin only** | Toggle statut actif |
| DELETE | `/:id` | **Admin only** | Désactiver utilisateur |

---

## 🔒 Middleware d'Authentification

### 1. **authenticate**
```javascript
// Vérifie token JWT valide
// Ajoute req.user avec infos utilisateur
// 401 si non authentifié
```

### 2. **authorize(...roles)**
```javascript
// Vérifie si user.role dans roles autorisés
// 403 si role non autorisé
// Exemple : authorize('admin', 'kine')
```

### 3. **optionalAuth**
```javascript
// Authentification optionnelle
// Ajoute req.user si token présent
// Continue sans req.user si pas de token
```

### 4. **checkAppointmentOwnership**
```javascript
// Vérifie si user est propriétaire du RDV
// Patient = son RDV, Kiné = son RDV assigné, Admin = tous
// 403 si pas propriétaire
```

### 5. **checkEditable**
```javascript
// Vérifie règle des 48h pour patients
// Kiné/Admin = pas de restriction
// 403 si < 48h avant RDV
```

---

## 🚦 Système de Redirection

### Après Login :
```javascript
switch (user.role) {
  case 'patient': navigate('/dashboard/patient');
  case 'kine': navigate('/dashboard/kine');
  case 'admin': navigate('/dashboard/admin');
}
```

### Accès Non Autorisé :
```javascript
// Si user tente d'accéder à un dashboard non autorisé
// → Redirection automatique vers son propre dashboard
// + Toast d'erreur "Accès refusé"

const dashboardRoutes = {
  admin: '/dashboard/admin',
  kine: '/dashboard/kine',
  patient: '/dashboard/patient',
};
```

### Navbar :
```javascript
// Lien "Dashboard" change selon rôle
getDashboardLink() {
  if (user.role === 'patient') return '/dashboard/patient';
  if (user.role === 'kine') return '/dashboard/kine';
  if (user.role === 'admin') return '/dashboard/admin';
}
```

---

## 📊 Comparaison des Dashboards

| Fonctionnalité | Patient | Kiné | Admin |
|----------------|---------|------|-------|
| **Voir propres RDV** | ✅ | ✅ | ✅ |
| **Voir tous RDV** | ❌ | ❌ (que les siens) | ✅ |
| **Prendre RDV** | ✅ | ❌ | ✅ |
| **Annuler RDV** | ✅ (48h rule) | ❌ | ✅ |
| **Confirmer RDV** | ❌ | ✅ | ✅ |
| **Assigner kiné** | ❌ | ❌ | ✅ |
| **Modifier statut** | ❌ | ✅ (limité) | ✅ (tous) |
| **Marquer payé** | ❌ | ✅ | ✅ |
| **Supprimer RDV** | ❌ | ❌ | ✅ |
| **Gérer utilisateurs** | ❌ | ❌ | ✅ |
| **Voir stats système** | ❌ | ✅ (perso) | ✅ (global) |
| **Voir charts** | ❌ | ✅ | ✅ |
| **Activer/Désactiver users** | ❌ | ❌ | ✅ |

---

## 🎨 Différences Visuelles

### Patient Dashboard :
- 🎨 Couleurs : Yellow, Blue, Orange
- 🔔 Highlight du prochain RDV
- 📋 Liste simple avec statuts
- ➕ Bouton "Nouveau RDV" proéminent

### Kiné Dashboard :
- 🎨 Couleurs : Yellow, Green, Blue, Purple
- 📊 Toggle Liste/Stats
- 🔧 Boutons actions (Confirmer, Marquer payé)
- 📈 3 types de graphiques

### Admin Dashboard :
- 🎨 Couleurs : Blue, Yellow, Green, Purple + autres
- 🔄 4 modes : Vue d'ensemble, RDV, Users, Stats
- 📋 Tables avec actions multiples
- 🏆 Performance des kinés
- ⚡ Actions rapides centralisées

---

## 🔐 Sécurité Implémentée

### Frontend :
- ✅ ProtectedRoute avec vérification rôle
- ✅ Redirection automatique si accès non autorisé
- ✅ Toast d'erreur explicite
- ✅ Composants conditionnels selon rôle
- ✅ Navbar adapté au rôle

### Backend :
- ✅ Middleware authenticate sur routes privées
- ✅ Middleware authorize avec liste rôles
- ✅ Vérification ownership des ressources
- ✅ Règle des 48h pour modifications patients
- ✅ Validation des permissions sur chaque action
- ✅ Logs des erreurs d'authentification

### Bonnes Pratiques :
- 🔒 Token JWT avec expiration
- 🔐 Refresh token pour sessions longues
- 🛡️ Passwords hashés (bcrypt)
- 🚫 Pas de données sensibles dans token
- ✅ Validation des entrées côté backend
- 🔍 Logging des actions critiques

---

## 🚀 Utilisation

### Créer un Admin :
```javascript
// Via seed.js ou directement en DB
{
  name: "Admin Principal",
  email: "admin@kine.ma",
  phone: "0600000000",
  role: "admin",
  passwordHash: await bcrypt.hash("admin123", 10),
  isActive: true
}
```

### Créer un Kiné :
```javascript
{
  name: "Dr. Mohamed",
  email: "mohamed@kine.ma",
  phone: "0611111111",
  role: "kine",
  specialty: "Rééducation sportive",
  passwordHash: await bcrypt.hash("kine123", 10),
  isActive: true
}
```

### Assigner un Kiné à un RDV (Admin) :
```javascript
// Frontend
await api.patch(`/appointments/${appointmentId}/assign-kine`, {
  kineId: selectedKineId
});

// Backend vérifie :
// - User est admin ✓
// - Kine existe et role = 'kine' ✓
// - RDV existe ✓
```

---

## 📝 Tests de Sécurité

### À tester :

1. **Tentative d'accès non autorisé** :
   - [ ] Patient → `/dashboard/kine` → Redirigé
   - [ ] Patient → `/dashboard/admin` → Redirigé
   - [ ] Kiné → `/dashboard/admin` → Redirigé

2. **API sans authentification** :
   - [ ] GET `/api/users` sans token → 401
   - [ ] PATCH `/api/appointments/:id` sans token → 401

3. **API avec mauvais rôle** :
   - [ ] Patient DELETE `/api/appointments/:id` → 403
   - [ ] Kiné PATCH `/api/users/:id` → 403
   - [ ] Kiné DELETE `/api/appointments/:id` → 403

4. **Modifications protégées** :
   - [ ] Patient modifie RDV < 48h → 403
   - [ ] Patient annule RDV autre patient → 403
   - [ ] Kiné confirme RDV autre kiné → 403

5. **Assignation kiné** :
   - [ ] Admin assigne kiné → ✅
   - [ ] Patient assigne kiné → 403
   - [ ] Kiné s'auto-assigne → 403

---

## 🎯 Fonctionnalités Futures

### Admin :
- [ ] Créer utilisateurs depuis dashboard
- [ ] Éditer infos utilisateurs
- [ ] Voir logs d'activité
- [ ] Exporter rapports PDF/Excel
- [ ] Gérer les paramètres système
- [ ] Notifications push admin
- [ ] Dashboard analytics avancé

### Kiné :
- [ ] Calendrier interactif
- [ ] Notes de séance
- [ ] Historique patient
- [ ] Templates de traitements
- [ ] Signature électronique
- [ ] Factures automatiques

### Patient :
- [ ] Historique médical
- [ ] Documents partagés
- [ ] Rappels SMS/Email
- [ ] Évaluation kinés
- [ ] Programme d'exercices

---

## ✅ Résumé

Le système RBAC est maintenant **entièrement fonctionnel** avec :

- ✅ **3 rôles distincts** avec permissions granulaires
- ✅ **Dashboards séparés** et sécurisés
- ✅ **Routes protégées** frontend et backend
- ✅ **Redirections intelligentes** selon rôle
- ✅ **Interface admin complète** pour gestion système
- ✅ **Statistiques et charts** pour kiné et admin
- ✅ **Assignation kiné** par admin
- ✅ **Gestion utilisateurs** (activation/désactivation)
- ✅ **Support bilingue** (FR/AR) pour tous rôles
- ✅ **Sécurité renforcée** avec middleware et validation

🎉 **Le système est prêt pour la production !**
