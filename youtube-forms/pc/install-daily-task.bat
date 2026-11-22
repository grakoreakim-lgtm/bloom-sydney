@echo off
REM One-time setup: run link-shorts.bat every day at 09:30 and when you log on (catches up after the PC was off).
set BAT=%~dp0link-shorts.bat
schtasks /Create /F /TN "FollowDone Link Shorts" /TR "\"%BAT%\"" /SC DAILY /ST 09:30
schtasks /Create /F /TN "FollowDone Link Shorts (logon)" /TR "\"%BAT%\"" /SC ONLOGON /DELAY 0005:00
echo Done. Tasks "FollowDone Link Shorts" are installed.
pause
