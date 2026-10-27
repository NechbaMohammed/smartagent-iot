# ==============================================================================
# Demarrage global de SmartAgent-IoT  (Windows PowerShell 5.1+)
#   Usage :  powershell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1
# Ouvre 3 fenetres (agents RMI, simulateur, coordinateur). Les journaux sont aussi
# ecrits dans le dossier logs\ (ignore par Git) pour diagnostiquer un echec.
# NB : fichier volontairement en ASCII (PowerShell 5.1 lit mal l'UTF-8 sans BOM).
# ==============================================================================
$ErrorActionPreference = "Stop"
$rootDir = (Resolve-Path "$PSScriptRoot\..").Path
Set-Location $rootDir
$logDir = Join-Path $rootDir "logs"
New-Item -ItemType Directory -Force $logDir | Out-Null

function Say($msg, $color = "Cyan") { Write-Host $msg -ForegroundColor $color }
function Fail($msg) { Write-Host "ERREUR : $msg" -ForegroundColor Red; exit 1 }

Say "=== Demarrage de la plateforme SmartAgent-IoT ==="
Say "Projet : $rootDir" "DarkGray"

# --- 0. Pre-requis : Java 21 + Maven --------------------------------------------
$jdkDefault   = "C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"
$mavenDefault = "C:\Users\hp\maven\apache-maven-3.9.6\bin"
if (-not $env:JAVA_HOME -or -not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    if (Test-Path "$jdkDefault\bin\java.exe") { $env:JAVA_HOME = $jdkDefault }
}
if ($env:JAVA_HOME) { $env:Path = "$env:JAVA_HOME\bin;$env:Path" }
if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) {
    if (Test-Path "$mavenDefault\mvn.cmd") { $env:Path = "$mavenDefault;$env:Path" }
}
if (-not (Get-Command java -ErrorAction SilentlyContinue)) { Fail "Java introuvable (installer JDK 21 ou definir JAVA_HOME)." }
if (-not (Get-Command mvn  -ErrorAction SilentlyContinue)) { Fail "Maven introuvable (ajouter mvn au PATH)." }

# --- 1. Broker Mosquitto (1883 + WebSocket 9001) --------------------------------
$mosquittoExe = "mosquitto"
if (Test-Path "C:\Users\hp\mosquitto\mosquitto.exe") { $mosquittoExe = "C:\Users\hp\mosquitto\mosquitto.exe" }
elseif (-not (Get-Command mosquitto -ErrorAction SilentlyContinue)) { Fail "mosquitto.exe introuvable." }
$mosquittoDir = Split-Path -Parent (Resolve-Path $mosquittoExe).Path

function Test-Port($port) {
    try {
        $c = New-Object System.Net.Sockets.TcpClient
        $iar = $c.BeginConnect("127.0.0.1", $port, $null, $null)
        $ok = $iar.AsyncWaitHandle.WaitOne(600, $false)
        if ($ok -and $c.Connected) {
            $c.EndConnect($iar)
            $c.Close()
            return $true
        }
        $c.Close()
        return $false
    } catch {
        return $false
    }
}

$running = Get-Process mosquitto -ErrorAction SilentlyContinue
if ($running -and -not (Test-Port 9001)) {
    Say "[1/4] Un Mosquitto sans WebSocket tourne deja : redemarrage avec scripts\mosquitto.conf" "Yellow"
    $running | Stop-Process -Force
    Start-Sleep -Seconds 1
    $running = $null
}
if (-not $running) {
    Say "[1/4] Demarrage de Mosquitto (1883 + WebSocket 9001)..." "Yellow"
    # S'assurer que le mosquitto.conf de son dossier contient les listeners 1883 + 9001
    Copy-Item (Join-Path $PSScriptRoot "mosquitto.conf") (Join-Path $mosquittoDir "mosquitto.conf") -Force -ErrorAction SilentlyContinue
    Start-Process $mosquittoExe -ArgumentList "-c", "mosquitto.conf", "-v" -WorkingDirectory $mosquittoDir -WindowStyle Minimized
    # Attendre que les ports 1883 et 9001 soient actifs
    for ($i = 0; $i -lt 15 -and -not (Test-Port 1883); $i++) { Start-Sleep -Milliseconds 500 }
} else {
    Say "[1/4] Mosquitto deja en cours d'execution (WebSocket 9001 OK)." "Green"
}
if (-not (Test-Port 1883)) { Fail "Le broker n'ecoute pas sur 1883. Lancez manuellement : mosquitto -c scripts\mosquitto.conf -v" }

# --- prep. Compilation : installe common-api dans le depot Maven local -----------
Say "[prep] mvn install -DskipTests (une fois, ~30 s)..." "Yellow"
mvn -q -B install -DskipTests
if ($LASTEXITCODE -ne 0) { Fail "'mvn install' a echoue (voir messages ci-dessus)." }

# --- Lanceur d'une fenetre enfant (commande encodee : aucun probleme de guillemets) ---
function Start-Module($title, $module, $mainClass, $logName) {
    $log = Join-Path $logDir $logName
    $cmd = @"
`$Host.UI.RawUI.WindowTitle = '$title'
`$env:JAVA_HOME = '$env:JAVA_HOME'
`$env:Path = '$env:Path'
Set-Location '$rootDir'
Remove-Item '$log' -ErrorAction SilentlyContinue
mvn -B -pl $module exec:java '-Dexec.mainClass=$mainClass' 2>&1 | ForEach-Object { `$_; `$_ | Out-File -FilePath '$log' -Append -Encoding utf8 }
"@
    $enc = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($cmd))
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-EncodedCommand", $enc
}

Say "[2/4] Agents RMI (registre 2199)..." "Yellow"
Start-Module "SmartAgent - Agents RMI" "agent-piece" "ca.usherbrooke.smartagent.agent.AgentPieceMain" "agents.log"
for ($i = 0; $i -lt 30 -and -not (Test-Port 2199); $i++) { Start-Sleep -Seconds 1 }
if (-not (Test-Port 2199)) { Fail "Le registre RMI (2199) ne repond pas. Voir logs\agents.log" }

Say "[3/4] Simulateur de capteurs MQTT (toutes les 5 s)..." "Yellow"
Start-Module "SmartAgent - Simulateur" "sensor-simulator" "ca.usherbrooke.smartagent.sensor.SimulateurMain" "simulateur.log"
Start-Sleep -Seconds 3

Say "[4/4] Coordinateur central RMI..." "Yellow"
Start-Module "SmartAgent - Coordinateur" "coordinateur" "ca.usherbrooke.smartagent.coordinator.CoordinateurMain" "coordinateur.log"

Say "`nPlateforme demarree : MQTT 1883, WebSocket 9001, RMI 2199." "Green"
Say "Journaux : $logDir" "DarkGray"
Say "`nTableau de bord React :  cd dashboard-ui ; npm install ; npm run dev   ->   http://localhost:5173/" "Magenta"
Say "Arret : powershell -ExecutionPolicy Bypass -File .\scripts\stop-all.ps1`n" "Magenta"
