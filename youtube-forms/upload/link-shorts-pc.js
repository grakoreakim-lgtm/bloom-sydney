#!/usr/bin/env node
// Run on YOUR PC (not on GitHub): sets each Short's "Related video" to its full tutorial in YouTube Studio.
// YouTube has no API for this, so it drives Studio in a browser that stays signed in to your Google account.
//
//   cd youtube-forms
//   git pull                        (gets the latest plan/shorts.json)
//   node upload/link-shorts-pc.js            # first time: a browser opens → sign in to grakorea.kim once
//   node upload/link-shorts-pc.js --headless # afterwards (also what the daily Windows task runs)
//
// Reads plan/shorts.json  { "<shortId>": { "main": "<videoId>", "channel": "ko"|"en" } }
// Remembers what is done in ~/.follow-done-studio/linked.json, so each Short is handled once.
// It only sets the related video and saves — it never deletes, publishes or changes anything else.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const PROFILE = path.join(os.homedir(), '.follow-done-studio');
const DONE = path.join(PROFILE, 'linked.json');
const headless = process.argv.includes('--headless');
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.ci.json'), 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const T = { related: /관련 동영상|Related video|Related content/i, save: /^\s*(저장|Save)\s*$/i, done: /^\s*(완료|Done|선택|Select|확인|OK)\s*$/i, signin: /accounts\.google\.com/ };

async function titleOf(id) {
  try { const r = await fetch(`https://www.youtube.com/oembed?url=https://youtu.be/${id}&format=json`); if (r.ok) return (await r.json()).title; } catch {}
  return null;
}

(async () => {
  fs.mkdirSync(PROFILE, { recursive: true });
  const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'plan', 'shorts.json'), 'utf8'));
  const done = fs.existsSync(DONE) ? JSON.parse(fs.readFileSync(DONE, 'utf8')) : {};
  const todo = Object.entries(map).filter(([sid]) => !done[sid]);
  console.log(`Shorts to link: ${todo.length} (already linked: ${Object.keys(done).length})`);
  if (!todo.length) return;

  // a separate, persistent browser profile: you sign in once, it stays signed in
  const ctx = await chromium.launchPersistentContext(path.join(PROFILE, 'browser'), {
    headless, viewport: { width: 1400, height: 900 }, locale: 'ko-KR',
    ...(process.platform === 'win32' || process.platform === 'darwin' ? { channel: 'chrome' } : {}),
  }).catch(() => chromium.launchPersistentContext(path.join(PROFILE, 'browser'), { headless, viewport: { width: 1400, height: 900 }, locale: 'ko-KR' }));
  const page = ctx.pages()[0] || await ctx.newPage();

  await page.goto('https://studio.youtube.com', { waitUntil: 'domcontentloaded' });
  if (T.signin.test(page.url())) {
    if (headless) { console.log('✖ Not signed in. Run once without --headless and sign in to grakorea.kim.'); await ctx.close(); process.exit(2); }
    console.log('→ Sign in to grakorea.kim in the browser window (only needed once). Waiting up to 5 minutes…');
    await page.waitForURL(/studio\.youtube\.com/, { timeout: 300000 });
  }

  let ok = 0, fail = 0;
  for (const [sid, m] of todo) {
    const chId = cfg.channelIds?.[m.channel];
    const mainTitle = await titleOf(m.main);
    console.log(`\n● Short ${sid} → main ${m.main} (${mainTitle || 'title unknown'}) [${m.channel}]`);
    try {
      // open the Short's edit page as the owning channel
      if (chId) { await page.goto(`https://studio.youtube.com/channel/${chId}`, { waitUntil: 'domcontentloaded' }); await sleep(2500); }
      await page.goto(`https://studio.youtube.com/video/${sid}/edit`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {}); await sleep(3000);

      // 1) the "Related video" field
      const trigger = page.getByText(T.related).first();
      await trigger.scrollIntoViewIfNeeded({ timeout: 15000 }); await sleep(500);
      await trigger.click(); await sleep(2000);

      // 2) the picker: search (if there is a box) and choose the main video by its id or title
      const box = page.locator('ytcp-dialog input, tp-yt-paper-dialog input, [role="dialog"] input').first();
      if (mainTitle && await box.count()) { await box.fill(mainTitle.slice(0, 40)); await sleep(2500); }
      let pick = page.locator(`[role="dialog"] a[href*="${m.main}"], ytcp-dialog a[href*="${m.main}"], [role="dialog"] img[src*="${m.main}"], ytcp-dialog img[src*="${m.main}"]`).first();
      if (!(await pick.count()) && mainTitle) pick = page.locator('[role="dialog"], ytcp-dialog, tp-yt-paper-dialog').getByText(mainTitle.slice(0, 30), { exact: false }).first();
      await pick.click({ timeout: 15000 }); await sleep(1200);
      const confirm = page.locator('[role="dialog"] button, ytcp-dialog ytcp-button, tp-yt-paper-dialog ytcp-button').filter({ hasText: T.done }).first();
      if (await confirm.count()) { await confirm.click().catch(() => {}); await sleep(1200); }

      // 3) save the video details
      const save = page.locator('ytcp-button#save, #save, button').filter({ hasText: T.save }).first();
      await save.click({ timeout: 15000 }); await sleep(3500);

      done[sid] = { main: m.main, at: new Date().toISOString() };
      fs.writeFileSync(DONE, JSON.stringify(done, null, 1));
      ok++; console.log('  ✔ linked');
    } catch (e) {
      fail++;
      const shot = path.join(PROFILE, `fail-${sid}.png`);
      await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
      console.log(`  ✖ ${e.message.split('\n')[0]}  (screenshot: ${shot})`);
    }
  }
  console.log(`\ndone — ${ok} linked, ${fail} failed`);
  await ctx.close();
  if (fail) process.exitCode = 1;
})().catch((e) => { console.error(e); process.exit(1); });
