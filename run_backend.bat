@echo off
title StudyMate Bot - Backend Server
echo ========================================================
echo   Dang khoi dong Backend Django (Port: 8000)...
echo ========================================================
cd /d "%~dp0backend"
call .\venv\Scripts\activate
python manage.py runserver 127.0.0.1:8000
pause
