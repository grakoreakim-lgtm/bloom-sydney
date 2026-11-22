@echo off
REM Links new Shorts to their full tutorials in YouTube Studio (runs daily via Windows Task Scheduler).
cd /d "%~dp0\.."
git pull --quiet
call npm install --no-audit --no-fund --silent
node upload\link-shorts-pc.js --headless >> "%USERPROFILE%\.follow-done-studio\link-shorts.log" 2>&1
