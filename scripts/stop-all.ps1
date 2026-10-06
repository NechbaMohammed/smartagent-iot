# ==============================================================================
# Script d'arrêt pour SmartAgent-IoT
# ==============================================================================
Write-Host "Arrêt des composants SmartAgent-IoT..." -ForegroundColor Yellow

# Arrêt des processus Java (Simulateur, Agents, Coordinateur)
Get-Process -Name java -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -match "smartagent" -or $_.CommandLine -match "ca.usherbrooke.smartagent" } | Stop-Process -Force

Write-Host "Composants arrêtés." -ForegroundColor Green
