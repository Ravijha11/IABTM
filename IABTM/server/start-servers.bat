@echo off
echo ========================================
echo Starting IABTM Audio Chat Servers
echo ========================================

echo.
echo Starting LiveKit Server...
start "LiveKit Server" node livekit-server.js
if %errorlevel% neq 0 (
    echo ❌ Failed to start LiveKit Server
    pause
    exit /b 1
)

echo ✅ LiveKit Server started successfully
echo Waiting 3 seconds for LiveKit Server to initialize...
timeout /t 3 /nobreak > nul

echo.
echo Starting Backend Server...
start "Backend Server" npm run dev
if %errorlevel% neq 0 (
    echo ❌ Failed to start Backend Server
    pause
    exit /b 1
)

echo ✅ Backend Server started successfully
echo.
echo ========================================
echo Both servers started successfully!
echo ========================================
echo.
echo LiveKit Server: http://localhost:7880
echo Backend Server: http://localhost:8000
echo.
echo Press any key to close this window...
pause > nul 