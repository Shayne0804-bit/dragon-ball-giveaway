@echo off
REM Script pour démarrer le serveur en mode développement

cls
echo.
echo ==========================================
echo    🎁 GIVEAWAY APP - Démarrage
echo ==========================================
echo.

echo 📍 Vérification de MongoDB...
echo.

REM Vérifier que MongoDB est accessible
netstat -an | find ":27017" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  MongoDB ne semble pas être actif sur le port 27017
    echo.
    echo Options:
    echo 1. Démarrer MongoDB localement: mongod
    echo 2. Utiliser Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest
    echo 3. Utiliser MongoDB Atlas: https://www.mongodb.com/cloud/atlas
    echo.
    set /p CONTINUE="Continuer quand même? (o/n): "
    if /i not "%CONTINUE%"=="o" exit /b 1
)

echo.
echo 🚀 Démarrage du serveur...
echo.

npm run dev

pause
