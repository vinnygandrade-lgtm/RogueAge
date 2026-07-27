# RogueAge Discord bot — interactive setup (Windows)
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== RogueAge Discord Bot Setup ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Voce precisa de 2 valores do Discord Developer Portal:" -ForegroundColor Yellow
Write-Host "  1. Bot Token        (Bot -> Reset Token)"
Write-Host "  2. Application ID   (General Information)"
Write-Host ""
Write-Host "Opcional (recomendado):"
Write-Host "  3. Server ID        (direito no nome do servidor -> Copy Server ID)"
Write-Host "  4. Welcome channel  (direito no canal -> Copy Channel ID)"
Write-Host ""
Write-Host "IMPORTANTE: nunca partilhe o Bot Token publicamente." -ForegroundColor Red
Write-Host ""

$token = Read-Host "Bot Token"
$clientId = Read-Host "Application ID (Client ID)"
$guildId = Read-Host "Server ID (Enter para pular)"
$welcomeChannelId = Read-Host "Welcome Channel ID (Enter para pular)"
$gameUrl = Read-Host "Game URL [https://rogueage.vercel.app]"
if (-not $gameUrl) { $gameUrl = "https://rogueage.vercel.app" }

if (-not $token -or -not $clientId) {
  Write-Host "Token e Application ID sao obrigatorios." -ForegroundColor Red
  exit 1
}

$envContent = @"
DISCORD_TOKEN=$token
DISCORD_CLIENT_ID=$clientId
DISCORD_GUILD_ID=$guildId
WELCOME_CHANNEL_ID=$welcomeChannelId
STAFF_ROLE_IDS=
GAME_URL=$gameUrl
"@

Set-Content -Path ".env" -Value $envContent -Encoding UTF8
Write-Host ""
Write-Host ".env criado com sucesso." -ForegroundColor Green

Write-Host ""
Write-Host "A registar comandos slash..." -ForegroundColor Cyan
npm run register-commands
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Setup concluido. Para ligar o bot:" -ForegroundColor Green
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Depois teste no Discord: /ping" -ForegroundColor Yellow
