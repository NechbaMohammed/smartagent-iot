# ==============================================================================
# Script de démarrage global pour SmartAgent-IoT
# ==============================================================================
$rootDir = (Resolve-Path "$PSScriptRoot\..").Path
Set-Location $rootDir

Write-Host "=== Démarrage de la plateforme SmartAgent-IoT ===" -ForegroundColor Cyan
Write-Host "Répertoire du projet : $rootDir" -ForegroundColor DarkGray

# 1. Vérification / Démarrage du Broker Mosquitto
$mosquittoProc = Get-Process mosquitto -ErrorAction SilentlyContinue
if (-not $mosquittoProc) {
    Write-Host "[1/4] Démarrage du Broker Mosquitto (port 1883)..." -ForegroundColor Yellow
    Start-Process "mosquitto" -ArgumentList "-v" -WindowStyle Minimized -ErrorAction SilentlyContinue
} else {
    Write-Host "[1/4] Broker Mosquitto déjà en cours d'exécution." -ForegroundColor Green
}

Start-Sleep -Seconds 2

# 2. Démarrage des Agents RMI (Serveurs)
Write-Host "[2/4] Démarrage des serveurs RMI AgentPiece (Port 2199)..." -ForegroundColor Yellow
Start-Process "powershell" -WorkingDirectory $rootDir -ArgumentList "-NoExit", "-Command", "mvn -pl agent-piece exec:java -Dexec.mainClass=ca.usherbrooke.smartagent.agent.AgentPieceMain"

Start-Sleep -Seconds 3

# 3. Démarrage du Simulateur de Capteurs
Write-Host "[3/4] Démarrage du simulateur de capteurs MQTT (5s)..." -ForegroundColor Yellow
Start-Process "powershell" -WorkingDirectory $rootDir -ArgumentList "-NoExit", "-Command", "mvn -pl sensor-simulator exec:java -Dexec.mainClass=ca.usherbrooke.smartagent.sensor.SimulateurMain"

Start-Sleep -Seconds 2

# 4. Démarrage du Coordinateur Central
Write-Host "[4/4] Démarrage du Coordinateur central RMI..." -ForegroundColor Yellow
Start-Process "powershell" -WorkingDirectory $rootDir -ArgumentList "-NoExit", "-Command", "mvn -pl coordinateur exec:java -Dexec.mainClass=ca.usherbrooke.smartagent.coordinator.CoordinateurMain"

Write-Host "`nTous les modules ont été lancés avec succès !" -ForegroundColor Green
Write-Host "Consultez les fenêtres PowerShell pour observer les flux MQTT et les appels RMI.`n" -ForegroundColor Cyan
