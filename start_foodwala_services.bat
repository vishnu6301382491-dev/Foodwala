@echo off
SETLOCAL EnableDelayedExpansion

REM Automatically resolve project root whether run from root or scripts/
if exist "%~dp0server\server.js" (
    cd /d "%~dp0"
) else if exist "%~dp0..\server\server.js" (
    cd /d "%~dp0\.."
)

if /i "%~1"=="--run-server" goto :worker_server
if /i "%~1"=="--run-tunnel" goto :worker_tunnel

TITLE FoodWala Services Launcher

echo ================================================================
echo           FoodWala AI ^& Backend Services Launcher
echo ================================================================
echo.

echo [*] Project Root: %CD%
if not exist "server\server.js" (
    echo [ERROR] server\server.js not found! Please run from the project root.
    pause
    exit /b 1
)

echo [*] Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    pause
    exit /b 1
)

echo [*] Terminating existing FoodWala worker windows...
for /f "usebackq" %%a in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'cmd.exe' -and $_.CommandLine -notmatch 'Win32_Process' -and ($_.CommandLine -match 'run-server' -or $_.CommandLine -match 'run-tunnel' -or $_.CommandLine -match 'FoodWala API Server' -or $_.CommandLine -match 'FoodWala Cloudflare Tunnel') } | Select-Object -ExpandProperty ProcessId" 2^>nul`) do (
    if %%a gtr 0 (
        echo   [-] Terminating worker window ^(PID: %%a^)...
        taskkill /F /T /PID %%a >nul 2>nul
    )
)

echo [*] Terminating dangling processes on port 5000...
for /f "usebackq" %%a in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique" 2^>nul`) do (
    if %%a gtr 0 (
        echo   [-] Terminating port 5000 process ^(PID: %%a^)...
        taskkill /F /PID %%a >nul 2>nul
    )
)

echo [*] Terminating dangling Cloudflare tunnel processes...
taskkill /F /IM cloudflared.exe >nul 2>nul

echo [*] Terminating dangling Node.js server and tunnel runners...
for /f "usebackq" %%a in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and ($_.CommandLine -match 'server\.js' -or $_.CommandLine -match 'tunnel\.js') } | Select-Object -ExpandProperty ProcessId" 2^>nul`) do (
    echo   [-] Terminating runner ^(PID: %%a^)...
    taskkill /F /PID %%a >nul 2>nul
)

REM Fallback netstat check
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5000"') do (
    if %%a gtr 0 (
        taskkill /F /PID %%a >nul 2>nul
    )
)

echo.
echo [*] Starting FoodWala Node.js API Server (Port 5000) with Auto-Restart Loop...
start "FoodWala API Server" cmd /k call "%~f0" --run-server

echo [*] Waiting for server to initialize on http://localhost:5000/api/whatsapp/health...
set HEALTHY=0
for /l %%i in (1,1,20) do (
    ping -n 2 127.0.0.1 >nul
    curl -s --max-time 5 -f http://localhost:5000/api/whatsapp/health 2>nul | findstr /i "\"success\":true" >nul
    if !ERRORLEVEL! equ 0 (
        set HEALTHY=1
        goto :server_ready
    )
)

:server_ready
if %HEALTHY% equ 1 (
    echo [OK] FoodWala API Server is healthy and listening on port 5000.
) else (
    echo [WARNING] Server health check timed out. Proceeding to tunnel launch...
)

echo.
echo [*] Starting Cloudflare Tunnel and Meta Webhook Synchronizer with Auto-Restart Loop...
start "FoodWala Cloudflare Tunnel" cmd /k call "%~f0" --run-tunnel

echo.
echo ================================================================
echo   All FoodWala services have been started successfully!
echo   1. API Server        : http://localhost:5000
echo   2. Health Check      : http://localhost:5000/api/whatsapp/health
echo   3. Cloudflare Tunnel : Auto-syncs Meta Webhook on startup
echo ================================================================
echo.
exit /b 0

:worker_server
TITLE FoodWala API Server
:server_loop
echo [*] Launching FoodWala API Server (node server\server.js)...
node server\server.js
echo.
echo [Restarting API Server in 3s...]
timeout /t 3 >nul
goto :server_loop

:worker_tunnel
TITLE FoodWala Cloudflare Tunnel
:tunnel_loop
echo [*] Launching Cloudflare Tunnel (node scripts\tunnel.js)...
node scripts\tunnel.js
echo.
echo [Restarting Cloudflare Tunnel in 3s...]
timeout /t 3 >nul
goto :tunnel_loop
