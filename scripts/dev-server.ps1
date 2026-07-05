# Servidor de desenvolvimento — correr FORA do Cursor (Terminal Windows / PowerShell).
# Uso: .\scripts\dev-server.ps1
# Para parar: Ctrl+C

Set-Location (Split-Path $PSScriptRoot -Parent)
Write-Host "RogueAge — http://localhost:5173/" -ForegroundColor Cyan
Write-Host "Para parar: Ctrl+C" -ForegroundColor DarkGray
npm run dev
