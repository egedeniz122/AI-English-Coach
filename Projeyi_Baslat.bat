@echo off
title AI English Coach

echo ===================================================
echo  AI English Coach - Proje Baslatiliyor...
echo ===================================================
echo.

:: Eski Python sunucularini kapat (varsa)
taskkill /F /IM python.exe >nul 2>&1
timeout /t 1 /nobreak >nul

:: 8000 portu musait mi kontrol et, degilse 8080 kullan
netstat -ano | findstr ":8000 " >nul 2>&1
if %errorlevel%==0 (
    echo Port 8000 mesgul, 8080 kullaniliyor...
    set PORT=8080
) else (
    set PORT=8000
)

echo Sunucu baslatiluyor: http://localhost:%PORT%
echo Bu siyah ekrani kapatirsaniz site kapanir!
echo.

:: 2 saniye bekleyip tarayiciyi ac
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:%PORT%/?nocache=%%RANDOM%%"

:: Python HTTP sunucusunu calistir (Cache iptal edilerek)
python server.py %PORT%

pause
