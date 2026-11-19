@echo off
chcp 65001 >nul
title Living Pixel Diorama - Wallpaper Engine Paketi Derleyici
echo ===============================================================================
echo   LIVING PIXEL DIORAMA - WALLPAPER ENGINE DERLEME ARACI
echo ===============================================================================
echo.

set "NODE_EXE="
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 set "NODE_EXE=node"
if "%NODE_EXE%"=="" if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if "%NODE_EXE%"=="" if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles(x86)%\nodejs\node.exe"
if "%NODE_EXE%"=="" if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "NODE_EXE=%LOCALAPPDATA%\Programs\nodejs\node.exe"

if "%NODE_EXE%"=="" (
    echo [HATA] Node.js bulunamadi!
    pause
    exit /b 1
)

"%NODE_EXE%" "%~dp0scripts\build-css.mjs"
"%NODE_EXE%" "%~dp0scripts\build-wallpaper.mjs"

echo.
echo [TAMAMLANDI] dist-wallpaper\project.json dosyasini Wallpaper Engine icinden acabilirsiniz!
pause
