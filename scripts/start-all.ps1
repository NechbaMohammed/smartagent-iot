# ==============================================================================
# Script de démarrage global pour SmartAgent-IoT
# ==============================================================================
Write-Host "=== Démarrage de la plateforme SmartAgent-IoT ===" -ForegroundColor Cyan

# 1. Vérification / Démarrage du Broker Mosquitto
$mosquittoProc = Get-Process mosquitto -ErrorAction SilentlyContinue
if (-not $mosquittoProc) {
    Write-Host "[1/4] Démarrage du Broker Mosquitto..." -ForegroundColor Yellow
    Start-Process "mosquitto" -ArgumentList "-v" -WindowStyle Minimized -ErrorAction SilentlyContinue
} else {
    Write-Host "[1/4] Broker Mosquitto déjà en cours d'exécution." -ForegroundColor Green
}

Start-Sleep -Seconds 2

# 2. Démarrage des Agents RMI (Serveurs)
Write-Host "[2/4] Démarrage des serveurs RMI AgentPiece (Port 2199)..." -ForegroundColor Yellow
Start-Process "powershell" -ArgumentList "-NoExit", "-Command", "mvn -pl agent-piece exec:java -Dexec.mainClass=ca.usherbrooke.smartagent.agent.AgentPieceMain"

Start-Sleep -Seconds 3

# 3. Démarrage du Simulateur de Capteurs
Write-Host "[3/4] Démarrage du simulateur de capteurs MQTT..." -ForegroundColor Yellow
Start-Process "powershell" -ArgumentList "-NoExit", "-Command", "mvn -pl sensor-simulator exec:java -Dexec.mainClass=ca.usherbrooke.smartagent.sensor.SimulateurMain"

Start-Sleep -Seconds 2

# 4. Démarrage du Coordinateur
Write-Host "[4/4] Démarrage du Coordinateur central..." -ForegroundColor Yellow
Start-Process "powershell" -ArgumentList "-NoExit", "-Command", "mvn -pl coordinateur exec:java -Dexec.mainClass=ca.usherbrooke.smartagent.coordinator.CoordinateurMain"

Write-Host "Tous les modules ont été lancés !" -ForegroundColor Green
