@echo off
echo.
echo ====================================================
echo Dragon Ball Giveaway - Git Initialization
echo ====================================================
echo.

echo [1/4] Verifying project structure...
if not exist "package.json" (
    echo ERROR: package.json not found!
    pause
    exit /b 1
)
if not exist "server\server.js" (
    echo ERROR: server/server.js not found!
    pause
    exit /b 1
)
if not exist "Procfile" (
    echo ERROR: Procfile not found!
    pause
    exit /b 1
)
echo OK: All required files present

echo.
echo [2/4] Initialize Git...
git init
echo OK: Git initialized

echo.
echo [3/4] Adding files...
git add .
echo OK: Files added

echo.
echo [4/4] Creating initial commit...
git commit -m "Initial commit: Dragon Ball Giveaway - Interactive giveaway with DBZ effects"
if errorlevel 1 (
    echo ERROR: Commit failed
    pause
    exit /b 1
)
echo OK: Initial commit created

echo.
echo ====================================================
echo NEXT STEPS:
echo ====================================================
echo.
echo 1. Create a repository on GitHub:
echo    - Go to https://github.com/new
echo    - Name: dragon-ball-giveaway
echo    - Description: Dragon Ball Legend Giveaway
echo    - DO NOT initialize with README/gitignore/license
echo.
echo 2. Add remote and push:
echo    git remote add origin https://github.com/YOUR_USERNAME/dragon-ball-giveaway.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3. Configure Railway:
echo    - Go to https://railway.app
echo    - Create new project from GitHub
echo    - Select dragon-ball-giveaway
echo    - Add environment variables (see .env.example)
echo.
echo ====================================================
echo.
pause
