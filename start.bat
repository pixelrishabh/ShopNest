@echo off
title ShopNest Application
echo ======================================================
echo              Starting ShopNest E-Commerce
echo ======================================================
echo.

cd /d "%~dp0"

echo [1/3] Ensuring Database is running...
docker start energy_postgres >nul 2>&1 || docker-compose up -d postgres >nul 2>&1

echo [2/3] Launching web browser...
start "" http://localhost:3002

echo [3/3] Starting Next.js development server...
echo.
echo Webpage: http://localhost:3002
echo Press Ctrl+C in this window to stop the server.
echo ======================================================
echo.
npm run dev

