# ==============================================================================
# Script de démarrage global pour SmartAgent-IoT
# ==============================================================================
$rootDir = (Resolve-Path "$PSScriptRoot\..").Path
Set-Location $rootDir

Write-Host "=== Démarrage de la plateforme SmartAgent-IoT ===" -ForegroundColor Cyan
Write-Host "Répertoire du projet : $rootDir" -ForegroundColor DarkGray

# 1. Vérification / Démarrage du Broker Mosquitto
$mosquittoExe = if (Test-Path "C:\Users\hp\mosquitto\mosquitto.exe") { "C:\Users\hp\mosquitto\mosquitto.exe" } else { "mosquitto" }
$mosquittoConf = if (Test-Path "C:\Users\hp\mosquitto\mosquitto.conf") { "C:\Users\hp\mosquitto\mosquitto.conf" } else { $null }

$mosquittoProc = Get-Process mosquitto -ErrorAction SilentlyContinue
if (-not $mosquittoProc) {
    Write-Host "[1/4] Démarrage du Broker Mosquitto (port 1883)..." -ForegroundColor Yellow
    if ($mosquittoConf) {
        Start-Process $mosquittoExe -ArgumentList "-c `"$mosquittoConf`" -v" -WindowStyle Minimized -ErrorAction SilentlyContinue
    } else {
        Start-Process $mosquittoExe -ArgumentList "-v" -WindowStyle Minimized -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "[1/4] Broker Mosquitto déjà en cours d'exécution." -ForegroundColor Green
}

Start-Sleep -Seconds 2

# Configuration environnement pour les terminaux enfants
$envInit = "`$env:JAVA_HOME = 'C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot'; `$env:Path = 'C:\Users\hp\maven\apache-maven-3.9.6\bin;C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot\bin;C:\Users\hp\mosquitto;' + `$env:Path;"

# 2. Démarrage des Agents RMI (Serveurs)
Write-Host "[2/4] Démarrage des serveurs RMI AgentPiece (Port 2199)..." -ForegroundColor Yellow
$cmdAgent = "$envInit mvn -pl agent-piece exec:java -Dexec.mainClass=ca.usherbrooke.smartagent.agent.AgentPieceMain"
Start-Process "powershell" -WorkingDirectory $rootDir -ArgumentList "-NoExit", "-Command", $cmdAgent

Start-Sleep -Seconds 3

# 3. Démarrage du Simulateur de Capteurs
Write-Host "[3/4] Démarrage du simulateur de capteurs MQTT (5s)..." -ForegroundColor Yellow
$cmdSim = "$envInit mvn -pl sensor-simulator exec:java -Dexec.mainClass=ca.usherbrooke.smartagent.sensor.SimulateurMain"
Start-Process "powershell" -WorkingDirectory $rootDir -ArgumentList "-NoExit", "-Command", $cmdSim

Start-Sleep -Seconds 2

# 4. Démarrage du Coordinateur Central
Write-Host "[4/4] Démarrage du Coordinateur central RMI..." -ForegroundColor Yellow
$cmdCoord = "$envInit mvn -pl coordinateur exec:java -Dexec.mainClass=ca.usherbrooke.smartagent.coordinator.CoordinateurMain"
Start-Process "powershell" -WorkingDirectory $rootDir -ArgumentList "-NoExit", "-Command", $cmdCoord

Write-Host "`nTous les modules ont été lancés avec succès !" -ForegroundColor Green
Write-Host "Consultez les fenêtres PowerShell pour observer les flux MQTT et les appels RMI.`n" -ForegroundColor Cyan
