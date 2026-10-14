# ==============================================================================
# Script d'arrêt pour SmartAgent-IoT
# ==============================================================================
Write-Host "Arrêt des composants SmartAgent-IoT..." -ForegroundColor Yellow

$procs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { 
    $_.Name -eq "java.exe" -and ($_.CommandLine -match "ca.usherbrooke.smartagent" -or $_.CommandLine -match "smartagent")
}

if ($procs) {
    foreach ($p in $procs) {
        try {
            Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
            Write-Host "Processus arrêté (PID: $($p.ProcessId))" -ForegroundColor DarkGray
        } catch {}
    }
    Write-Host "Tous les composants SmartAgent-IoT ont été arrêtés." -ForegroundColor Green
} else {
    Write-Host "Aucun processus SmartAgent-IoT en cours d'exécution." -ForegroundColor Cyan
}
