@echo off
setlocal
cd /d "%~dp0"
echo SENTINEL - Starting your local website
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or is not on PATH.
  echo Install Node.js LTS from https://nodejs.org and reopen this file.
  pause
  exit /b 1
)
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm is not available. Reinstall Node.js LTS and try again.
  pause
  exit /b 1
)
if not exist "node_modules\.binite.cmd" (
  echo Installing dependencies. Internet access is required for this first step.
  call npm.cmd ci
  if errorlevel 1 (
    echo Installation failed. Keep this window open and capture the error above.
    pause
    exit /b 1
  )
)
echo Your browser will open automatically. Keep this window open while using SENTINEL.
call npm.cmd run dev
pause
