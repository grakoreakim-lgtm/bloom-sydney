# PC helper: link Shorts → full video ("Related video")

YouTube has no API for the Shorts "Related video" link, so this runs on your own PC in a browser
that stays signed in to your Google account (a separate profile in `%USERPROFILE%\.follow-done-studio`).

## One-time setup (Windows)
1. Install Node.js LTS and Git if missing.
2. In this repo folder: `cd youtube-forms`, then `npm install` and `npx playwright install chromium`.
3. First run, signed-in browser: `node upload/link-shorts-pc.js` → sign in to **grakorea.kim** in the window that opens.
4. Daily automatic run: double-click `pc\install-daily-task.bat` (runs every day 09:30 and at logon).

Log: `%USERPROFILE%\.follow-done-studio\link-shorts.log`. A failed Short leaves a screenshot `fail-<id>.png` there.
It only sets the related video and presses Save — nothing is deleted or published.
