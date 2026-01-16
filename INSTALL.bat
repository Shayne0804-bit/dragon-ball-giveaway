@echo off
REM Script de démarrage pour le projet Giveaway

cls
echo.
echo ==========================================
echo    🎁 GIVEAWAY APP - Installation
echo ==========================================
echo.

REM Vérifier si npm est installé
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm n'est pas installé!
    echo Veuillez installer Node.js depuis: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ npm détecté
echo.
echo Installation des dépendances...
echo.

REM Installer les dépendances
npm install

if errorlevel 1 (
    echo.
    echo ❌ Erreur lors de l'installation des dépendances
    pause
    exit /b 1
)

echo.
echo ==========================================
echo    ✅ Installation réussie!
echo ==========================================
echo.
echo 📝 Prochaines étapes:
echo.
echo 1. Assurez-vous que MongoDB est démarré:
echo    mongod
echo.
echo 2. Ou utilisez MongoDB avec Docker:
echo    docker run -d -p 27017:27017 --name mongodb mongo:latest
echo.
echo 3. Démarrer le serveur:
echo    npm run dev
echo.
echo 4. Ouvrir votre navigateur:
echo    http://localhost:5000
echo.
pause
