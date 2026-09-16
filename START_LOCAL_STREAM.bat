@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "ISOTOPE Local Stream" /min cmd /c "py -m http.server 8765 --bind 127.0.0.1"
) else (
  start "ISOTOPE Local Stream" /min cmd /c "python -m http.server 8765 --bind 127.0.0.1"
)
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:8765/index.html?local=1"
endlocal
