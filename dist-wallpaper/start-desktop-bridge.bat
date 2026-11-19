@echo off
setlocal EnableExtensions
title Living Pixel Diorama - Yerel Masaustu Koprusu (127.0.0.1:47831)
echo ===============================================================================
echo   LIVING PIXEL DIORAMA - YEREL MASAUSTU KOPRUSU (127.0.0.1:47831)
echo ===============================================================================
echo.

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
    echo [HATA] Node.js bulunamadi.
    echo Lutfen https://nodejs.org adresinden LTS surumunu kurup tekrar deneyin.
    pause
    exit /b 1
)

echo [OK] Node.js bulundu: "%NODE_EXE%"
echo [OK] Masaustu koprusu baslatiliyor...
"%NODE_EXE%" "%BRIDGE_SCRIPT%"
