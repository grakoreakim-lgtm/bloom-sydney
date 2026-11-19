#!/usr/bin/env node
// Check a form's LIVE selectors against the real website, without typing or submitting anything.
//   node upload/verify-live.js sgac [mdac …]
// For each form: opens url.live, waits, screenshots the page, then reports per field whether the
// selector matches exactly one visible element. Also dumps every input/select/textarea on the page
// (name, id, type, label text) so wrong selectors can be fixed quickly.
// Output: out/verify/<form>/{page.png, report.json, fields.json}
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ids = process.argv.slice(2);
if (!ids.length) { console.error('usage: node upload/verify-live.js <formId> [...]'); process.exit(1); }

(async () => {
  const browser = await chromium.launch();
  let bad = 0;
  for (const id of ids) {
    const form = require(path.join(__dirname, '..', 'forms', `${id}.js`));
    const dir = path.join(__dirname, '..', 'out', 'verify', id); fs.mkdirSync(dir, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'en-US' });
    const report = { form: id, url: form.url.live, ok: [], missing: [], ambiguous: [], error: null };
    try {
      await page.goto(form.url.live, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(2500);
      await page.screenshot({ path: path.join(dir, 'page.png'), fullPage: true });
      const fields = await page.$$eval('input, select, textarea, button', (els) => els.map((e) => {
        const lab = e.id && document.querySelector(`label[for="${e.id}"]`);
        const r = e.getBoundingClientRect();
        return { tag: e.tagName.toLowerCase(), type: e.type || '', name: e.name || '', id: e.id || '', placeholder: e.placeholder || '',
                 label: (lab?.innerText || e.closest('label')?.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 80), visible: r.width > 0 && r.height > 0 };
      }));
      fs.writeFileSync(path.join(dir, 'fields.json'), JSON.stringify(fields, null, 1));
      for (const [field, sel] of Object.entries(form.selectors.live || {})) {
        let n = 0; try { n = await page.locator(sel).count(); } catch { n = -1; }
        (n === 1 ? report.ok : n === 0 || n === -1 ? report.missing : report.ambiguous).push({ field, sel, count: n });
      }
      report.title = await page.title();
    } catch (e) { report.error = e.message; }
    fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(report, null, 1));
    bad += report.missing.length + report.ambiguous.length + (report.error ? 1 : 0);
    console.log(`\n■ ${id}  ${report.url}  "${report.title || ''}"`);
    if (report.error) console.log('  ✖ page error:', report.error);
    console.log(`  ✔ ${report.ok.length} ok   ✖ ${report.missing.length} missing   ⚠ ${report.ambiguous.length} ambiguous`);
    for (const m of report.missing) console.log(`    missing   ${m.field}: ${m.sel}`);
    for (const m of report.ambiguous) console.log(`    ambiguous ${m.field}: ${m.sel} (${m.count})`);
    await page.close();
  }
  await browser.close();
  console.log(bad ? `\n${bad} issue(s) — see out/verify/*/fields.json to fix selectors` : '\nall selectors matched');
})().catch((e) => { console.error(e); process.exit(1); });
