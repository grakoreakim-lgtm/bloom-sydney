#!/usr/bin/env node
// Explore the live SG Arrival Card wizard with FICTIONAL sample data, to map the real controls.
// Fills page 1, presses Next (never Submit), maps page 2. Screenshots + a text map go to out/explore/sgac/.
//   node upload/explore-live.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const OUT = path.join(__dirname, '..', 'out', 'explore', 'sgac'); fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => { const s = a.join(' '); console.log(s); fs.appendFileSync(path.join(OUT, 'map.txt'), s + '\n'); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let shot = 0;
const snap = async (page, name) => { const f = path.join(OUT, `${String(++shot).padStart(2, '0')}-${name}.png`); await page.screenshot({ path: f, fullPage: true }); log(`  [shot] ${path.basename(f)}`); };

async function describe(page, label) {
  log(`\n=== ${label} — ${page.url()}`);
  const items = await page.$$eval('input, select, textarea, mat-select, [role="combobox"], [role="radiogroup"], mat-checkbox, button', (els) => els.map((e) => {
    const r = e.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return null;
    const box = e.closest('[id^="traveller-"], mat-form-field, .mat-mdc-form-field, fieldset');
    const lab = (e.id && document.querySelector(`label[for="${e.id}"]`)?.innerText) || e.closest('label')?.innerText || e.getAttribute('aria-label') || e.getAttribute('placeholder') || '';
    const head = box?.closest('div')?.querySelector('label, .label, h3, h4, mat-label')?.innerText || '';
    return `${e.tagName.toLowerCase()}${e.type ? '[' + e.type + ']' : ''}${e.getAttribute('role') ? '{' + e.getAttribute('role') + '}' : ''} id="${e.id}" name="${e.getAttribute('name') || ''}" fc="${e.getAttribute('formcontrolname') || ''}" label="${lab.trim().replace(/\s+/g, ' ').slice(0, 70)}" box="${box?.id || ''}" head="${head.trim().replace(/\s+/g, ' ').slice(0, 50)}"`;
  }).filter(Boolean));
  items.forEach((i) => log('  ' + i));
  const groups = await page.$$eval('mat-radio-group, [role="radiogroup"]', (gs) => gs.map((g) => {
    const q = g.closest('div')?.parentElement?.innerText?.split('\n')[0] || '';
    return `${g.id}: q="${q.slice(0, 120)}" options=[${[...g.querySelectorAll('label, .mdc-label')].map((l) => l.innerText.trim()).filter(Boolean).join(' | ')}]`;
  }));
  groups.forEach((g) => log('  radio ' + g));
  const errs = await page.$$eval('mat-error, .mat-mdc-form-field-error, .error, [role="alert"]', (es) => es.map((e) => e.innerText.trim()).filter(Boolean));
  if (errs.length) log('  errors: ' + errs.join(' / '));
}

async function auto(page, sel, typed, want) {
  try {
    const el = page.locator(sel).first();
    await el.click({ timeout: 8000 }); await el.fill(''); await el.type(typed, { delay: 60 }); await sleep(1200);
    const opts = await page.$$eval('mat-option, [role="option"]', (os) => os.map((o) => o.innerText.trim()).filter(Boolean));
    log(`  auto ${sel} "${typed}" → options: ${opts.slice(0, 12).join(' | ')}`);
    const pick = opts.find((o) => want.test(o)) || opts[0];
    if (pick) { await page.locator('mat-option, [role="option"]', { hasText: pick }).first().click(); log(`    picked "${pick}"`); }
    await sleep(500);
  } catch (e) { log(`  auto ${sel} FAILED: ${e.message.split('\n')[0]}`); }
}

async function date(page, box, d, m, y) {
  try {
    const html = await page.locator(box).first().evaluate((e) => [...e.querySelectorAll('input, select, mat-select, [role="combobox"]')].map((x) => `${x.tagName.toLowerCase()}#${x.id}[${x.type || x.getAttribute('role') || ''}] ph=${x.getAttribute('placeholder') || ''}`).join(', '));
    log(`  date ${box}: ${html}`);
    const parts = page.locator(`${box} input, ${box} mat-select, ${box} [role="combobox"]`);
    const n = await parts.count();
    const vals = [d, m, y];
    for (let i = 0; i < Math.min(n, 3); i++) {
      const p = parts.nth(i); const tag = await p.evaluate((e) => e.tagName.toLowerCase());
      if (tag === 'input') { await p.click(); await p.fill(''); await p.type(vals[i], { delay: 50 }); await sleep(600);
        const opts = await page.$$eval('mat-option, [role="option"]', (os) => os.map((o) => o.innerText.trim()).filter(Boolean));
        if (opts.length) { log(`    part ${i} options: ${opts.slice(0, 8).join(' | ')}`); const o = page.locator('mat-option, [role="option"]', { hasText: vals[i] }).first(); if (await o.count()) await o.click(); else await page.keyboard.press('Enter'); }
      } else { await p.click(); await sleep(500); const o = page.locator('mat-option, [role="option"]', { hasText: vals[i] }).first(); if (await o.count()) await o.click(); }
      await sleep(300);
    }
  } catch (e) { log(`  date ${box} FAILED: ${e.message.split('\n')[0]}`); }
}

(async () => {
  fs.writeFileSync(path.join(OUT, 'map.txt'), '');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'en-US' });
  await page.goto('https://eservices.ica.gov.sg/arrivalcard/sgac', { waitUntil: 'networkidle', timeout: 60000 }); await sleep(2500);
  await page.locator('text="Fill in Manually"').nth(1).click(); await page.waitForLoadState('networkidle').catch(() => {}); await sleep(2500);
  await describe(page, 'PAGE 1 (empty)'); await snap(page, 'page1-empty');

  // ---- fill page 1 with fictional sample data ----
  try { const r = page.locator('mat-radio-group').first().locator('label, .mdc-label'); log(`  arrival options: ${(await r.allInnerTexts()).join(' | ')}`); await r.nth(1).click(); } catch (e) { log('  arrival FAILED ' + e.message.split('\n')[0]); }
  await page.locator('#traveller-0-input-fullName').fill('GILDONG HONG');
  await page.locator('#traveller-0-input-passportNumber').fill('M12345678');
  await date(page, '#traveller-0-input-dateOfPassportExpiry', '31', '12', '2031');
  try { await page.locator('label', { hasText: /^\s*MALE\s*$/ }).first().click(); } catch (e) { log('  sex FAILED ' + e.message.split('\n')[0]); }
  await date(page, '#traveller-0-input-dateOfBirth', '15', '05', '1990');
  await auto(page, '#traveller-0-input-nationality', 'KOREA', /KOREA.*(SOUTH|REPUBLIC)|SOUTH KOREA/i);
  await auto(page, '#traveller-0-input-placeOfBirth', 'KOREA', /KOREA.*(SOUTH|REPUBLIC)|SOUTH KOREA/i);
  await auto(page, '#traveller-0-input-placeOfResidence', 'SEOUL', /SEOUL/i);
  await page.locator('#traveller-0-input-emailAddress').fill('sample.traveller@example.com');
  await auto(page, '#traveller-0-input-countryCode', '82', /\+?82/);
  await page.locator('#traveller-0-input-mobileNumber').fill('1012345678');
  await auto(page, '#traveller-0-input-lastCity', 'SEOUL', /SEOUL|INCHEON/i);
  await auto(page, '#traveller-0-input-purposeOfTravel', 'HOLIDAY', /HOLIDAY|LEISURE|SIGHT/i);
  const dep = new Date(Date.now() + 6 * 864e5);
  await date(page, '#traveller-0-input-dateOfDeparture', String(dep.getDate()).padStart(2, '0'), String(dep.getMonth() + 1).padStart(2, '0'), String(dep.getFullYear()));
  try { await page.locator('text=/Same as Last City/i').first().click(); } catch (e) { log('  sameAsLast FAILED ' + e.message.split('\n')[0]); }
  for (const g of ['mat-radio-group-2', 'mat-radio-group-3']) {
    try { await page.locator(`#${g} label`, { hasText: /^\s*NO\s*$/i }).first().click(); } catch (e) { log(`  ${g} NO FAILED ` + e.message.split('\n')[0]); }
  }
  await sleep(800);
  await describe(page, 'PAGE 1 (filled)'); await snap(page, 'page1-filled');

  // ---- Next (never Submit) ----
  const next = page.locator('button', { hasText: /^\s*Next\s*$/i }).first();
  log(`\nNext button found: ${await next.count()}`);
  if (await next.count()) { await next.click(); await page.waitForLoadState('networkidle').catch(() => {}); await sleep(3000); }
  await describe(page, 'PAGE 2'); await snap(page, 'page2');
  const btns = await page.$$eval('button', (bs) => bs.map((b) => b.innerText.trim()).filter(Boolean));
  log(`  buttons: ${btns.join(' | ')}`);
  const text = (await page.locator('body').innerText()).replace(/\n{2,}/g, '\n').slice(0, 3000);
  log('\n--- page 2 text ---\n' + text);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
