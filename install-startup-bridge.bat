@echo off
setlocal EnableExtensions
title Living Pixel Diorama - Windows Baslangicina Ekle
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_FILE=%STARTUP_DIR%\DioramaDesktopBridge.vbs"

set "BRIDGE_SCRIPT="
if exist "%~dp0scripts\desktop-bridge.mjs" set "BRIDGE_SCRIPT=%~dp0scripts\desktop-bridge.mjs"
if not defined BRIDGE_SCRIPT if exist "%~dp0..\scripts\desktop-bridge.mjs" set "BRIDGE_SCRIPT=%~dp0..\scripts\desktop-bridge.mjs"

if not defined BRIDGE_SCRIPT (
    echo [HATA] scripts\desktop-bridge.mjs bulunamadi. Lutfen proje klasorunu eksiksiz kopyalayin.
    pause
    exit /b 1
)

set "NODE_EXE="
for /f "delims=" %%I in ('where node 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%I"
if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE_EXE if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles(x86)%\nodejs\node.exe"
if not defined NODE_EXE if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "NODE_EXE=%LOCALAPPDATA%\Programs\nodejs\node.exe"

if not defined NODE_EXE (
    echo [HATA] Node.js bulunamadi. Lutfen https://nodejs.org adresinden Node.js kurun.
    pause
    exit /b 1
)

(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo WshShell.Run """" ^& "%NODE_EXE%" ^& """ """ ^& "%BRIDGE_SCRIPT%" ^& """", 0, False
) > "%VBS_FILE%"

echo ===============================================================================
echo [OK] Diorama Masaustu Koprusu Windows baslangicina eklendi!
echo Konum: %VBS_FILE%
echo Eski kopru servisi yenileniyor ve arka planda baslatiliyor...
echo ===============================================================================
powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -Command "Get-NetTCPConnection -LocalPort 47831 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
wscript.exe "%VBS_FILE%"
timeout /t 2 >nul
