@echo off
title BHARAT TERMINAL - Launcher
color 0A

echo.
echo   ============================================
echo      BHARAT TERMINAL - Starting All Servers
echo   ============================================
echo.

:: Start Node.js proxy server (port 3000) — hidden, no CMD window
echo   [1/2] Starting Node.js proxy server (port 3000)...
start /min "" cmd /c "cd /d %~dp0 && node server.js"

:: Small delay
timeout /t 2 /nobreak >nul

:: Start Python Flask backend (port 5000) — hidden, no CMD window
echo   [2/2] Starting Python backend server (port 5000)...
start /min "" cmd /c "cd /d %~dp0 && call venv\Scripts\activate && pip install -r requirements.txt --quiet && python app_server.py"

echo.
echo   ============================================
echo   All servers started in background!
echo.
echo     Node.js Proxy:    http://localhost:3000
echo     Python Backend:   http://localhost:5000
echo.
echo     Open http://localhost:3000 in your browser
echo.
echo     To stop: open Task Manager ^> End "node" and "python" tasks
echo   ============================================
echo.
