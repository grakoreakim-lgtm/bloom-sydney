// Recorder: drives Playwright through a form definition and records the video.
// Node side. The overlay (lib/overlay.js) is injected into the page.

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const overlay = require('./overlay');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Recorder {
  /**
   * @param {object} form   form definition (see forms/mdac.js)
   * @param {object} opts   { target: 'mock'|'live', lang: 'ko'|'en', outDir, speed, size }
   */
  constructor(form, opts = {}) {
    this.form = form;
    this.target = opts.target || 'mock';
    this.lang = opts.lang || 'ko';
    this.speed = opts.speed ?? 1;            // 1 = normal, 0.5 = twice as fast
    this.size = opts.size || { width: 1280, height: 720 };
    this.outDir = opts.outDir || path.join(__dirname, '..', 'out');
    this.t = form.strings[this.lang];
    this.selectors = form.selectors[this.target];
    this.url = form.url[this.target];
    this.stepIndex = 0;
    this.totalSteps = form.steps.filter((s) => s.type !== 'card').length;
    this.shots = [];
  }

  wait(ms) { return sleep(ms * this.speed); }

  async start() {
    fs.mkdirSync(this.outDir, { recursive: true });
    this.browser = await chromium.launch({ headless: true });
    this.context = await this.browser.newContext({
      viewport: this.size,
      deviceScaleFactor: 1,
      recordVideo: { dir: this.outDir, size: this.size },
      locale: this.lang === 'ko' ? 'ko-KR' : 'en-US',
    });
    await this.context.addInitScript(overlay.bundle);
    this.page = await this.context.newPage();
    await this.page.goto(this.url, { waitUntil: 'domcontentloaded' });
    await this.page.evaluate(() => window.__ytOverlay.install());
  }

  // ---- overlay helpers --------------------------------------------------
  ov(fn, ...args) {
    return this.page.evaluate(([fn, args]) => window.__ytOverlay[fn](...args), [fn, args]);
  }

  async card(c, holdMs = 3000) {
    await this.ov('card', c);
    await this.shot(`card-${c.id || this.stepIndex}`);
    await this.wait(holdMs);
    await this.ov('hideCard');
  }

  async shot(name) {
    const file = path.join(this.outDir, `${String(this.shots.length + 1).padStart(2, '0')}-${name}.png`);
    await this.page.screenshot({ path: file });
    this.shots.push(file);
  }

  // ---- step runner ------------------------------------------------------
  async run() {
    await this.start();
    for (const step of this.form.steps) {
      if (step.type === 'card') { await this.card(step.card[this.lang], step.hold ?? 3000); continue; }
      this.stepIndex += 1;
      await this.runStep(step);
    }
    return this.finish();
  }

  async runStep(step) {
    const sel = this.selectors[step.field];
    const text = step.text[this.lang];
    if (!sel) throw new Error(`No selector for field "${step.field}" on target "${this.target}"`);

    await this.ov('setStep', this.stepIndex, this.totalSteps, text.label);
    await this.ov('setEasyPill', this.t.easyPill);
    await this.ov('moveCursor', sel);
    await this.ov('highlight', sel, true);
    await this.wait(700);

    // 1) explain the field (tip) before touching it
    if (text.tip) {
      await this.ov('callout', sel, { kind: 'tip', title: text.label, body: text.tip });
      await this.wait(step.tipHold ?? 2200);
    }

    // 2) do the action, slowly, so viewers can follow
    await this.ov('clickCursor');
    await this.act(step, sel);
    await this.wait(600);

    // 3) common mistake callout (if any) — shown AFTER the correct value is in
    if (text.mistake) {
      await this.ov('callout', sel, { kind: 'warn', title: this.t.mistakeTitle, body: text.mistake, bad: text.bad, good: text.good });
      await this.shot(`step${this.stepIndex}-${step.field}`);
      await this.wait(step.mistakeHold ?? 3800);
    } else {
      await this.shot(`step${this.stepIndex}-${step.field}`);
      await this.wait(400);
    }
    await this.ov('clearHighlight');
  }

  async act(step, sel) {
    const page = this.page;
    const loc = page.locator(sel).first();
    switch (step.type) {
      case 'type': {
        await loc.click();
        const inputType = await loc.evaluate((el) => (el.getAttribute('type') || 'text').toLowerCase());
        if (inputType === 'date') {
          // native date pickers cannot be typed into reliably; they need ISO yyyy-mm-dd
          const v = String(step.value);
          const iso = /^\d{2}\/\d{2}\/\d{4}$/.test(v) ? v.split('/').reverse().join('-') : v;
          await loc.fill(iso);
        } else {
          await loc.fill('');
          await loc.pressSequentially(String(step.value), { delay: 90 * this.speed });
        }
        break;
      }
      case 'select':
        await loc.click();
        await this.wait(400);
        await loc.selectOption(step.value);
        break;
      case 'radio':
      case 'check':
        await loc.check();
        break;
      case 'click':
        await loc.click();
        break;
      case 'manual':           // e.g. CAPTCHA — we do not automate it, we only point at it
        break;
      case 'stop':             // final "do not submit" step — point at the button, never click
        break;
      default:
        throw new Error(`Unknown step type ${step.type}`);
    }
  }

  async finish() {
    const video = this.page.video();
    await this.context.close();
    const webm = await video.path();
    await this.browser.close();

    const base = `${this.form.id}-${this.target}-${this.lang}`;
    const finalWebm = path.join(this.outDir, `${base}.webm`);
    fs.renameSync(webm, finalWebm);
    let mp4 = null;
    try {
      mp4 = path.join(this.outDir, `${base}.mp4`);
      execSync(`ffmpeg -y -loglevel error -i "${finalWebm}" -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart "${mp4}"`);
    } catch (e) { mp4 = null; }
    return { webm: finalWebm, mp4, shots: this.shots };
  }
}

module.exports = { Recorder };
