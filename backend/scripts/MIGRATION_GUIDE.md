# 🔄 Migration des Noms de Services

## 📋 Problème

Les anciens rendez-vous stockés dans la base de données ont des noms de services en format **texte simple** (string) :
```javascript
{
  service: "Kinésithérapie du sport"  // ❌ Ancien format
}
```

Les nouveaux rendez-vous utilisent un format **bilingue** (objet) :
```javascript
{
  service: {
    fr: "Kinésithérapie du sport",
    ar: "العلاج الطبيعي الرياضي"
  }  // ✅ Nouveau format
}
```

Cette différence cause des problèmes d'affichage dans les graphiques et tableaux.

---

## 🛠️ Solution : Script de Migration

### **Étape 1 : Arrêter le serveur backend**

```bash
# Arrêtez le serveur si il tourne (Ctrl+C dans le terminal backend)
```

### **Étape 2 : Exécuter le script de migration**

```bash
cd backend
npm run migrate:services
```

### **Ce que fait le script :**

1. ✅ **Connexion** à MongoDB
2. ✅ **Récupération** de tous les rendez-vous
3. ✅ **Vérification** du format de chaque service
4. ✅ **Migration** des services en format string → objet {fr, ar}
5. ✅ **Sauvegarde** des modifications
6. ✅ **Rapport** détaillé des changements

---

## 📊 Résultat Attendu

```
🔄 Starting service names migration...

✅ Connected to MongoDB

📋 Found 15 appointments to check

✅ Migrated: "Kinésithérapie du sport" → {fr: "Kinésithérapie du sport", ar: "العلاج الطبيعي الرياضي"}
✅ Migrated: "Massage thérapeutique" → {fr: "Massage thérapeutique", ar: "التدليك العلاجي"}
⏭️  Appointment 673abc123... - Already migrated
⏭️  Appointment 673def456... - Already migrated
...

================================================================================
📊 MIGRATION SUMMARY
================================================================================
✅ Successfully migrated: 8 appointments
⏭️  Already migrated: 7 appointments
⚠️  Not found in mapping: 0 appointments
📋 Total appointments: 15
================================================================================

🎉 Migration completed successfully!
```

---

## 🗺️ Services Mappés

Le script gère automatiquement tous les services et sous-services :

### **Services Principaux**
- Kinésithérapie du sport
- Kinésithérapie orthopédique
- Kinésithérapie respiratoire
- Massage thérapeutique
- Rééducation neurologique
- Kinésithérapie pédiatrique

### **Sous-services**
Tous les sous-services de chaque catégorie sont également mappés (total : 30+ mappings)

---

## ⚠️ Cas Particuliers

### **Service non trouvé dans le mapping**

Si le script affiche :
```
⚠️  Warning: No mapping found for "Nom Service Inconnu" (Appointment ID: 673...)
```

**Action requise** :
1. Ouvrir `backend/scripts/migrateServiceNames.js`
2. Ajouter le mapping manquant dans `serviceNameMapping`
3. Relancer le script

Exemple :
```javascript
const serviceNameMapping = {
  // ... autres mappings
  'Nom Service Inconnu': {
    fr: 'Nom Service Inconnu',
    ar: 'اسم الخدمة غير المعروف'
  }
};
```

---

## 🔍 Vérification Manuelle (Optionnel)

### **Avant la migration**
```javascript
// Dans MongoDB Compass ou mongosh
db.appointments.find({ "service": { $type: "string" } })
// Affiche tous les rendez-vous avec service en string
```

### **Après la migration**
```javascript
db.appointments.find({ "service": { $type: "string" } })
// Devrait retourner 0 résultats

db.appointments.find({ "service.fr": { $exists: true } })
// Affiche tous les rendez-vous avec service en format objet
```

---

## 📝 Modifications du Modèle

Le modèle `Appointment.js` a été mis à jour pour accepter **les deux formats** :

```javascript
// Avant (strict)
service: {
  fr: { type: String, required: true },
  ar: { type: String, required: true }
}

// Après (flexible)
service: {
  type: mongoose.Schema.Types.Mixed, // Accepte string OU objet
  required: true
}
```

Cela permet :
- ✅ Compatibilité avec les anciens rendez-vous (string)
- ✅ Support des nouveaux rendez-vous (objet)
- ✅ Migration progressive sans erreurs

---

## 🚀 Après la Migration

### **1. Redémarrer le backend**
```bash
npm run dev
```

### **2. Tester les graphiques**
- Accédez au Dashboard Kiné ou Admin
- Vérifiez que le graphique "Services les plus demandés" affiche correctement tous les services
- Les noms doivent être en français si la langue FR est active, en arabe si AR est active

### **3. Vérifier les rendez-vous**
- Tous les rendez-vous doivent afficher le nom du service correctement
- Aucun "undefined" ou "[object Object]" ne doit apparaître

---

## 🔄 Réexécution du Script

Le script est **idempotent** (safe à réexécuter) :
- ✅ Les rendez-vous déjà migrés sont détectés et ignorés
- ✅ Seuls les nouveaux rendez-vous en format string sont migrés
- ✅ Aucun risque de duplication ou corruption

Vous pouvez le relancer à tout moment :
```bash
npm run migrate:services
```

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que MongoDB est accessible
2. Vérifiez que `.env` contient `MONGODB_URI`
3. Vérifiez les logs du script pour identifier le problème
4. Ajoutez les mappings manquants si nécessaire

---

## ✅ Checklist de Migration

- [ ] Backend arrêté
- [ ] Script exécuté : `npm run migrate:services`
- [ ] Résumé affiché sans erreurs
- [ ] Tous les services migrés ou déjà au bon format
- [ ] Backend redémarré
- [ ] Graphiques testés dans Dashboard
- [ ] Rendez-vous affichés correctement

---

**🎉 Une fois la migration complète, vos graphiques afficheront correctement tous les services !**
