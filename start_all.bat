@echo off
title StudyMate Bot - All-in-One Launcher
echo ========================================================
echo   Dang khoi dong he thong StudyMate Bot...
echo ========================================================

start "StudyMate Backend" cmd /k "call "%~dp0run_backend.bat""
timeout /t 2 /nobreak >nul
start "StudyMate Frontend" cmd /k "call "%~dp0run_frontend.bat""

echo.
echo ========================================================
echo   Ca 2 server Backend (8000) va Frontend (5173) da chay!
echo   Hay mo trinh duyet truy cap: http://localhost:5173
echo ========================================================
pause
