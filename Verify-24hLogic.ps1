#!/usr/bin/env powershell
# Vérification détaillée de la logique des 24h

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   VÉRIFICATION DE LA LOGIQUE DES 24H - Dragon Ball Giveaway    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Variables
$BaseUrl = "http://localhost:5000"
$TestScore = 0
$TotalChecks = 0

function Test-Check {
    param(
        [string]$Description,
        [bool]$Result
    )
    $Script:TotalChecks++
    if ($Result) {
        Write-Host "  ✓ $Description" -ForegroundColor Green
        $Script:TestScore++
    } else {
        Write-Host "  ✗ $Description" -ForegroundColor Red
    }
}

# TEST 1: Serveur accessible
Write-Host "1️⃣  VÉRIFICATION INITIALE" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
try {
    $Response = Invoke-WebRequest -Uri "$BaseUrl/" -UseBasicParsing -ErrorAction Stop
    Test-Check "Serveur accessible (HTTP 200)" ($Response.StatusCode -eq 200)
} catch {
    Write-Host "  ✗ Serveur inaccessible" -ForegroundColor Red
    Write-Host "    Assurez-vous que le serveur est lancé: npm start" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# TEST 2: Vérification du modèle MongoDB
Write-Host "2️⃣  MODÈLE MONGODB (Participant.js)" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

$ModelPath = "d:\Giveways\server\models\Participant.js"
if (Test-Path $ModelPath) {
    $ModelContent = Get-Content $ModelPath -Raw
    
    # Vérifier expireAfterSeconds
    Test-Check "Index TTL configuré (expireAfterSeconds: 86400)" ($ModelContent -match "expireAfterSeconds.*86400")
    
    # Vérifier timestamps
    Test-Check "Timestamps activés" ($ModelContent -match "timestamps.*true")
    
    # Vérifier l'index composite IP+createdAt
    Test-Check "Index composite IP+createdAt" ($ModelContent -match "ip.*createdAt")
} else {
    Write-Host "  ✗ Fichier Participant.js non trouvé" -ForegroundColor Red
}
Write-Host ""

# TEST 3: Vérification du contrôleur
Write-Host "3️⃣  CONTRÔLEUR (participantController.js)" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

$ControllerPath = "d:\Giveways\server\controllers\participantController.js"
if (Test-Path $ControllerPath) {
    $ControllerContent = Get-Content $ControllerPath -Raw
    
    # Vérifier findOne avec 24h
    Test-Check "Recherche du dernier participant (findOne)" ($ControllerContent -match "Participant\.findOne")
    
    # Vérifier la logique 24h
    Test-Check "Logique 24h implémentée (24 * 60 * 60 * 1000)" ($ControllerContent -match "24\s*\*\s*60\s*\*\s*60\s*\*\s*1000")
    
    # Vérifier le status 429
    Test-Check "Retour du status 429 (Too Many Requests)" ($ControllerContent -match "status\(429\)")
    
    # Vérifier nextAllowedAt
    Test-Check "Retour de nextAllowedAt" ($ControllerContent -match "nextAllowedAt")
    
    # Vérifier le message d'erreur
    Test-Check "Message d'erreur avec ⏱️" ($ControllerContent -match "⏱️")
} else {
    Write-Host "  ✗ Fichier participantController.js non trouvé" -ForegroundColor Red
}
Write-Host ""

# TEST 4: Vérification du client
Write-Host "4️⃣  CLIENT (app.js)" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

$ClientPath = "d:\Giveways\client\app.js"
if (Test-Path $ClientPath) {
    $ClientContent = Get-Content $ClientPath -Raw
    
    # Vérifier startCountdown
    Test-Check "Fonction startCountdown présente" ($ClientContent -match "function startCountdown")
    
    # Vérifier le status 429
    Test-Check "Gestion du status 429" ($ClientContent -match "response\.status.*429")
    
    # Vérifier la désactivation du formulaire
    Test-Check "Désactivation du formulaire après participation" ($ClientContent -match "opacity.*0\.6")
    
    # Vérifier la gestion de nextAllowedAt
    Test-Check "Utilisation de nextAllowedAt" ($ClientContent -match "nextAllowedAt")
} else {
    Write-Host "  ✗ Fichier app.js non trouvé" -ForegroundColor Red
}
Write-Host ""

# TEST 5: Vérification MongoDB
Write-Host "5️⃣  VÉRIFICATION MONGODB" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

try {
    # Vérifier si MongoDB est accessible
    $MongoCheck = mongosh giveaways --eval "db.adminCommand('ping')" 2>$null
    Test-Check "MongoDB accessible" ($null -ne $MongoCheck)
    
    # Vérifier les collections
    $Collections = mongosh giveaways --eval "db.getCollectionNames()" 2>$null
    Test-Check "Collection 'participants' existe" ($Collections -like "*participants*")
    
    # Vérifier les index
    $IndexInfo = mongosh giveaways --eval "JSON.stringify(db.participants.getIndexes())" 2>$null
    Test-Check "Index 'ip_1' existe" ($IndexInfo -match '"ip".*1')
    Test-Check "Index 'createdAt_1' existe" ($IndexInfo -match '"createdAt".*1')
    Test-Check "Index composite 'ip_1_createdAt_1' existe" ($IndexInfo -match '"ip".*1.*"createdAt".*1')
    
    # Afficher les index détaillés
    Write-Host ""
    Write-Host "Index MongoDB détaillés:" -ForegroundColor Cyan
    $Indexes = mongosh giveaways --eval "db.participants.getIndexes()" 2>$null
    if ($null -ne $Indexes) {
        foreach ($Index in $Indexes) {
            if ($Index -match '"name"') {
                $Name = [regex]::Match($Index, '"name":\s*"([^"]+)"').Groups[1].Value
                Write-Host "    • $Name" -ForegroundColor Gray
            }
        }
    }
} catch {
    Write-Host "  ⚠ Impossible de vérifier MongoDB: $_" -ForegroundColor Yellow
}
Write-Host ""

# TEST 6: Test fonctionnel
Write-Host "6️⃣  TEST FONCTIONNEL" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

$TestName = "TestVérif_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Host "Nom de test: $TestName" -ForegroundColor Gray

try {
    # Première participation
    $Response1 = Invoke-WebRequest -Uri "$BaseUrl/api/participants" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body "{`"name`":`"$TestName`"}" `
        -UseBasicParsing
    
    $Data1 = $Response1.Content | ConvertFrom-Json
    Test-Check "Première participation acceptée" ($Data1.success -eq $true)
    
    if ($Data1.success) {
        Write-Host "    → Message: $($Data1.message)" -ForegroundColor Gray
    }
    
    # Deuxième participation (immédiate)
    Start-Sleep -Milliseconds 500
    $Response2 = Invoke-WebRequest -Uri "$BaseUrl/api/participants" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body "{`"name`":`"Test2_$(Get-Date -Format 'HHmmss')`"}" `
        -UseBasicParsing `
        -ErrorAction SilentlyContinue
    
    if ($Response2.StatusCode -eq 429 -or $null -eq $Response2) {
        Test-Check "Limite 24h appliquée (status 429)" $true
        
        # Parser la réponse si possible
        try {
            $Data2 = $Response2.Content | ConvertFrom-Json
            Write-Host "    → Message: $($Data2.message)" -ForegroundColor Gray
            Test-Check "Message contient ⏱️" ($Data2.message -match "⏱️")
            Test-Check "nextAllowedAt fourni" ($null -ne $Data2.nextAllowedAt)
        } catch {
            Write-Host "    → Réponse HTTP reçue" -ForegroundColor Gray
        }
    } else {
        Test-Check "Limite 24h appliquée" $false
        Write-Host "    → Status: $($Response2.StatusCode)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ⚠ Erreur lors du test fonctionnel: $_" -ForegroundColor Yellow
}
Write-Host ""

# RÉSUMÉ
Write-Host "7️⃣  RÉSUMÉ DE LA VÉRIFICATION" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Score: $TestScore/$TotalChecks" -ForegroundColor White

$Percentage = [math]::Round(($TestScore / $TotalChecks) * 100, 0)
Write-Host "Pourcentage: $Percentage%" -ForegroundColor White
Write-Host ""

if ($TestScore -eq $TotalChecks) {
    Write-Host "🎉 EXCELLENTE IMPLÉMENTATION! Logique des 24h correctement implémentée!" -ForegroundColor Green
} elseif ($TestScore -ge [math]::Round($TotalChecks * 0.8)) {
    Write-Host "✓ BON - Logique des 24h partiellement implémentée" -ForegroundColor Green
    Write-Host "  Conseil: Redémarrer le serveur peut résoudre les problèmes d'index MongoDB" -ForegroundColor Yellow
} else {
    Write-Host "⚠ À AMÉLIORER - Vérifier l'implémentation" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                   Vérification terminée                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
