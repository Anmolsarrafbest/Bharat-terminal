@echo off
title BHARAT TERMINAL - Stopping Servers
color 0C

echo.
echo   ============================================
echo      BHARAT TERMINAL - Stopping All Servers
echo   ============================================
echo.

:: Kill Node.js server
echo   [1/2] Stopping Node.js server...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% == 0 (
    echo         Stopped.
) else (
    echo         Not running.
)

:: Kill Python server
echo   [2/2] Stopping Python server...
taskkill /F /IM python.exe >nul 2>&1
if %errorlevel% == 0 (
    echo         Stopped.
) else (
    echo         Not running.
)

echo.
echo   ============================================
echo   All servers stopped!
echo   ============================================
echo.
