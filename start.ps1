# ShopNest One-Click Runner for PowerShell
Set-Location -Path $PSScriptRoot

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "             Starting ShopNest E-Commerce             " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Ensuring PostgreSQL container is running..." -ForegroundColor Yellow
docker start energy_postgres 2>$null
if ($LASTEXITCODE -ne 0) {
    docker-compose up -d postgres 2>$null
}

Write-Host "[2/3] Opening browser..." -ForegroundColor Yellow
Start-Process "http://localhost:3002"

Write-Host "[3/3] Starting Next.js development server..." -ForegroundColor Yellow
Write-Host "Webpage live at: http://localhost:3002" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Gray
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

npm run dev

