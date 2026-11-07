@echo off
TITLE Stop FoodWala Services
SETLOCAL EnableDelayedExpansion

echo ================================================================
echo           FoodWala Services Graceful Shutdown
echo ================================================================
echo.

REM Automatically resolve project root whether run from root or scripts/
if exist "%~dp0server\server.js" (
    cd /d "%~dp0"
) else if exist "%~dp0..\server\server.js" (
    cd /d "%~dp0\.."
)

echo [*] Stopping port 5000 listeners...
for /f "usebackq" %%a in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique" 2^>nul`) do (
    if %%a gtr 0 (
        echo   [-] Terminating port 5000 process ^(PID: %%a^)...
        taskkill /F /PID %%a >nul 2>nul
    )
)

echo [*] Stopping Cloudflare tunnel processes (cloudflared.exe)...
taskkill /F /IM cloudflared.exe >nul 2>nul

echo [*] Stopping FoodWala Node.js server and tunnel runner scripts...
for /f "usebackq" %%a in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process 2^>nul | Where-Object { $_.Name -match 'node' -and ($_.CommandLine -match 'server\.js' -or $_.CommandLine -match 'tunnel\.js') } | Select-Object -ExpandProperty ProcessId" 2^>nul`) do (
    echo   [-] Terminating Node runner ^(PID: %%a^)...
    taskkill /F /PID %%a >nul 2>nul
)

REM Fallback netstat check
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5000"') do (
    if %%a gtr 0 (
        taskkill /F /PID %%a >nul 2>nul
    )
)

echo.
echo [*] Checking if port 5000 is released...
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue) { Write-Host '[-] Port 5000 still busy!' } else { Write-Host '[OK] Port 5000 is clean.' }"

echo.
echo ================================================================
echo   All FoodWala background services have been stopped.
echo ================================================================
echo.
