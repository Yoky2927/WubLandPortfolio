@echo off
echo ============================================
echo   Ngrok Transaction Service
echo   Port: 5006
echo   Start Time: %date% %time%
echo ============================================

REM Make sure we're in the right directory
cd /d "%~dp0"

REM Check if ngrok exists
where ngrok >nul 2>&1
if errorlevel 1 (
    echo ERROR: ngrok.exe not found!
    echo Please install ngrok: npm install -g ngrok
    pause
    exit /b 1
)

echo ? Ngrok found. Starting service...
echo ?? Web Interface: http://localhost:4040
echo.

:main
echo [%date% %time%] Starting: ngrok http 5006
ngrok http 5006
echo [%date% %time%] Ngrok stopped with code: %errorlevel%
echo ?? Restarting in 10 seconds...
timeout /t 10 /nobreak > nul
goto main
