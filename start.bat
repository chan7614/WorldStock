@echo off
chcp 65001 > nul
title 주식의 세계 (WorldStock)
echo ========================================================
echo    📈 [주식의 세계] 실시간 포트폴리오 웹서비스 시작 중...
echo ========================================================
echo.

set PYTHON_CMD=python
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if exist "%LOCALAPPDATA%\Python\bin\python.exe" (
        set PYTHON_CMD="%LOCALAPPDATA%\Python\bin\python.exe"
    )
)

echo [1/2] 웹서버를 구동합니다...
start "" http://localhost:5000
%PYTHON_CMD% app.py

pause
