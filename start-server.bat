@echo off
cd /d "%~dp0"
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
  echo Using Node (recommended^)
  node "%~dp0serve.mjs"
  goto :eof
)
python -m http.server 8090
