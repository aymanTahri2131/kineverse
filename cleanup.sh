#!/bin/bash

echo "========================================"
echo "   Nettoyage du projet pour GitHub"
echo "========================================"
echo ""

echo "[1/5] Suppression des fichiers de test..."
rm -f backend/test-cloudinary.js

echo "[2/5] Suppression des fichiers LipSync..."
rm -f frontend/convert-audio.bat
rm -f frontend/generate-lipsync.bat
rm -f frontend/generate-lipsync-all.bat
rm -f frontend/AUDIO_MULTI_SEGMENTS.md
rm -f frontend/LIPSYNC_QUICKSTART.md
rm -f frontend/LIPSYNC_README.md
rm -rf frontend/Rhubarb-Lip-Sync-1.14.0-Windows

echo "[3/5] Organisation de la documentation..."
mkdir -p docs
mv -f AUTH_IMPROVEMENTS.md docs/ 2>/dev/null
mv -f BUILD_SUMMARY.md docs/ 2>/dev/null
mv -f DASHBOARD_IMPROVEMENTS.md docs/ 2>/dev/null
mv -f RBAC_IMPLEMENTATION_SUMMARY.md docs/ 2>/dev/null
mv -f RBAC_SYSTEM.md docs/ 2>/dev/null
mv -f UPLOAD_IMPLEMENTATION.md docs/ 2>/dev/null
mv -f UPLOAD_TESTING_GUIDE.md docs/ 2>/dev/null

echo "[4/5] Vérification des fichiers sensibles..."
echo ""
echo "ATTENTION: Vérifiez que ces fichiers ne contiennent PAS de secrets:"
if [ -f backend/.env ]; then
    echo "  - backend/.env (NE PAS COMMITER)"
fi
if [ -f frontend/.env ]; then
    echo "  - frontend/.env (NE PAS COMMITER)"
fi

echo ""
echo "[5/5] Fichier .gitignore mis à jour..."
echo "Fait!"

echo ""
echo "========================================"
echo "   Nettoyage terminé avec succès!"
echo "========================================"
echo ""
echo "Prochaines étapes:"
echo "  1. Vérifiez que .env n'est PAS dans Git: git status"
echo "  2. Ajoutez les fichiers: git add ."
echo "  3. Committez: git commit -m \"Initial commit - Clean version\""
echo "  4. Poussez sur GitHub: git push origin main"
echo ""
