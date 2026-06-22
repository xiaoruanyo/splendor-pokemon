@echo off
cd /d "%~dp0splendor-pokemon"
echo ======================================
echo  璀璨宝石：宝可梦 Splendor Pokemon
echo ======================================
echo.
echo Starting game server...
echo PC: http://localhost:5173
echo Mobile: http://192.168.31.215:5173
echo.
echo Press Ctrl+C to stop
echo ======================================
call npm run dev -- --host 0.0.0.0
pause
