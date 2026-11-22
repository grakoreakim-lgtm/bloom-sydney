// AU-VEVO — Australia: check your visa conditions with VEVO and send proof to an employer
// First definition for the English channel "Copy My Screen: Gov Edition" (newcomers: migrants, international
// students, working-holiday makers). ENGLISH ONLY: every text object has just an `en` key.
//
// VEVO = Visa Entitlement Verification Online, the Department of Home Affairs' free visa-record check.
// This tutorial covers the "VEVO for visa holders" enquiry (no account needed), reading the result, and
// sending it by email / saving the PDF. It is recorded ONLY on the practice page ../mock/au-vevo.html:
// neutral styling, no crest or logo, sample data, result marked SAMPLE. The last step (Send email) is a `stop`.
//
// Facts checked 2026-11 (re-check before each yearly refresh). immi.homeaffairs.gov.au could not be opened
// directly from the build machine, so these come from search-engine extracts of the official pages plus
// official mirrors; items marked (!) are NOT confirmed on a live official page and are worded cautiously.
//  - Visa holders log in with ONE reference: Transaction Reference Number (TRN), Visa Grant Number, Visa
//    Evidence Number or password, plus date of birth and a travel document (passport / ImmiCard) number and
//    its country. Sources: Home Affairs "VEVO enquiry form" page; Australian embassy VEVO user guide (PDF).
//  - VEVO is free and needs no registration (Home Affairs leaflet "Update your address and passport details").
//  - VEVO shows the visa in effect: expiry date, "must not arrive after" date, period of stay, conditions
//    (Home Affairs "Check visa details and conditions" overview).
//  - New passport: update it in ImmiAccount (Update details → Change of passport details), or with the
//    New Passport Details web form / form 929. Home Affairs "passport details" page quotes about 72 hours via
//    ImmiAccount and 14 days via the web form. VEVO is how you confirm the update went through.
//  - Students: most student visa holders may work up to 48 hours a fortnight while the course is in session
//    and unlimited hours in scheduled course breaks (since 1 July 2023). A fortnight = 14 days starting on a
//    Monday. Source: Home Affairs FOI release fa-250601036, TEQSA, university international offices.
//    The condition NUMBER on a student's VEVO is not quoted in speech beyond "8105" as a common example.
//  - Working Holiday (417 / 462): condition 8547 = max 6 months' work with any one employer (exemptions and
//    a permission request exist); condition 8548 = max 4 months' study or training. Source: Home Affairs
//    "6 month work limitation" and WHM specified-work-conditions pages.
//  - Visa labels: Australia stopped issuing labels on 1 September 2015; the visa is an electronic record
//    linked to the passport (Australian embassy page reproducing departmental guidance).
//  - myVEVO: free Department of Home Affairs app, still listed in the App Store (v3.x). First use needs a
//    Visa Grant Number or TRN, date of birth and passport details; saves them behind a PIN; can email details.
//  - (!) Exact on-screen labels ("Document type", "Reference type", "Country of document", the terms and
//    conditions tick box, "View as PDF", "Send Email") come from third-party walkthroughs and memory of the
//    page, not from a live official page. The script says "a box like this" rather than quoting pixel-exact UI.
//  - (!) captcha: none reported in any walkthrough → captcha: false. Not confirmed on the live page.
//  - (!) Where the TRN is shown: grant letter and ImmiAccount application list — third-party guides only.
//
// Unofficial guide, not migration advice. Sample data is obviously fictional.

const path = require('path');

// Sample visa holder — obviously fake. Never use real personal data on camera.
const S = {
  docType: 'PASSPORT',
  refType: 'TRN',
  ref: 'EGO0000000',
  dob: '15 May 1998',
  passport: 'X0000000',
  country: 'UTO',                 // "Utopia", the specimen-passport country
  email: 'alex.sample@example.com',
};

const route = { from: 'VISA', fromCity: 'YOUR VISA RECORD', to: 'JOB', toCity: 'YOUR EMPLOYER' };

const MOCK_URL = 'file://' + path.join(__dirname, '..', 'mock', 'au-vevo.html');
const SELECTORS = {
  officialRow: '#officialRow',
  docType: '#docType', refType: '#refType', refNumber: '#refNumber', refRow: '#refRow', dob: '#dob',
  docNumber: '#docNumber', docRow: '#docRow', country: '#country', terms: '#terms', termsRow: '#termsRow', submit: '#submit',
  visaRow: '#visaRow', datesRow: '#datesRow', workRow: '#workRow', condRow: '#condRow', appRow: '#appRow',
  viewPdf: '#viewPdf', openEmail: '#openEmail', btnRow: '#btnRow', emailTo: '#emailTo', emailRow: '#emailRow', sendEmail: '#sendEmail',
};

const BRAND = '▶ Copy My Screen: Gov Edition';

module.exports = {
  id: 'au-vevo',
  pack: 'settle',
  channel: 'gov',
  country: { en: 'Australia' }, flag: '🇦🇺',
  fee: 'Free', when: 'Any time you hold a visa', captcha: false,
  title: { en: 'Australia: Check Your Visa Conditions with VEVO and Send Proof to an Employer' },
  shortTitle: { en: 'VEVO visa check' },   // Shorts headline / title
  videoTitle: { en: 'VEVO Check {year} | How to Check Your Australian Visa Conditions and Send Proof to an Employer | Copy My Screen' },

  url: {
    mock: MOCK_URL,
    live: MOCK_URL,   // recorded on the practice page only; the real enquiry needs a real visa record
  },

  selectors: {
    mock: SELECTORS,
    live: { ...SELECTORS },   // same practice page, so the live map is a copy of the mock map
  },

  strings: {
    en: { easyPill: '👀 Just copy the screen', mistakeTitle: '⚠ Common mistake', pause: '⏸ Do this, then press play', pauseSub: '' },
  },

  steps: [
    // ---------- INTRO (ticket) ----------
    { type: 'card', hold: 4500, card: {
      en: { id: 'intro', speech: 'New job in Australia, and the employer wants proof you can work? You get it from VEVO, the government\'s free visa check. In a few minutes you will see your visa conditions and email them to your employer. This is an unofficial guide, not migration advice. Only use the official Home Affairs website. I will stop at the places where people slip up.',
            route, title: 'VEVO: check your visa,\n**send proof to your job**', subtitle: 'Unofficial guide, not migration advice. Official Home Affairs site only.',
            meta: [{ k: 'TIME', v: '5 min' }, { k: 'COST', v: 'Free' }, { k: 'WHEN', v: 'Any time' }, { k: 'YEAR', v: '2026' }], stamp: 'COPY\nMY\nSCREEN', flag: '🇦🇺',
            rightTitle: 'VEVO', rightText: 'Need: grant letter (TRN or grant number)\npassport · date of birth', brand: BRAND },
    }},

    // ---------- START ----------
    { type: 'manual', field: 'officialRow', tipHold: 2800, text: {
      en: { label: 'Open the official site', speech: { tip: 'Start on the Home Affairs website. The address ends in dot gov dot A U. Search the site for VEVO, and choose the option for visa holders. You do not need an account.', mistake: 'Careful here. Some websites charge you money for a visa check. You do not need them. VEVO is free on the government website. If a page asks for a card number, you are in the wrong place.' },
            tip: 'Home Affairs site → **VEVO** → **for visa holders**. No account needed', mistake: 'VEVO is **free**. A site that asks you to pay for a visa check is not the official one.', bad: 'pay a "visa check" website', good: 'free on immi.homeaffairs.gov.au' },
    }},

    // ---------- ENQUIRY FORM ----------
    { type: 'select', field: 'docType', value: S.docType, text: {
      en: { label: 'Document type', speech: { tip: 'First, the document type. Most people choose passport. If you were given an ImmiCard instead, choose that.' },
            tip: 'Usually **Passport**. Choose ImmiCard only if you hold one' },
    }},
    { type: 'select', field: 'refType', value: S.refType, text: {
      en: { label: 'Reference type', speech: { tip: 'Next, the reference type. There are four. Transaction Reference Number, Visa Grant Number, Visa Evidence Number, or a password. You only need one. I will use the Transaction Reference Number, or T R N.' },
            tip: 'Pick **one**: TRN · Visa Grant Number · Visa Evidence Number · password' },
    }},
    { type: 'type', field: 'refNumber', value: S.ref, hl: 'refRow', text: {
      en: { label: 'Reference number', speech: { tip: 'Now type the number. Mine is a sample. Copy yours exactly, letters and digits.', mistake: 'Many people get stuck here, because they do not know where the number is. Open your visa grant letter. That is the email or PDF you got when the visa was granted. The grant number is on it. If you applied online, the T R N is also in your ImmiAccount, next to your application.' },
            tip: 'Copy it **exactly**, letters and digits', mistake: 'Look on your **visa grant letter**, or in **ImmiAccount** next to your application.', bad: 'guess, or use a booking number', good: 'TRN or grant number from the grant letter' },
    }},
    { type: 'type', field: 'dob', value: S.dob, text: {
      en: { label: 'Date of birth', speech: { tip: 'Enter your date of birth. Day, then month, then year. It has to match your passport.' },
            tip: '**Day, month, year**, the same as your passport' },
    }},
    { type: 'type', field: 'docNumber', value: S.passport, hl: 'docRow', text: {
      en: { label: 'Passport number', speech: { tip: 'Now the document number. For most people, this is the passport number.', mistake: 'This is the big one. Did you renew your passport after you got the visa? Then your visa is still linked to the old passport, and the check will fail. Tell Home Affairs about the new passport first. You can do that in ImmiAccount, under update details. It can take a few days. Then come back to VEVO.' },
            tip: 'The passport your visa is **linked to**', mistake: 'New passport? **Update your passport details** with Home Affairs first (ImmiAccount → Update details). Allow a few days.', bad: 'new passport, not updated', good: 'update details, then check VEVO' },
    }},
    { type: 'select', field: 'country', value: S.country, text: {
      en: { label: 'Country of document', speech: { tip: 'Choose the country that issued your passport. That is your passport country, not the country you live in. I am using a sample country.' },
            tip: 'The country that **issued the passport**, not where you live' },
    }},
    { type: 'check', field: 'terms', hl: 'termsRow', text: {
      en: { label: 'Terms and conditions', speech: { tip: 'Read the terms and conditions, then tick the box to accept them.' },
            tip: 'Read, then **tick to accept**' },
    }},
    { type: 'click', field: 'submit', text: {
      en: { label: 'Submit', speech: { tip: 'Check every box once more, then press submit. If you get an error, it is nearly always a typing mistake, or an old passport number.' },
            tip: 'Check for typos, then **Submit**. Error? Re-check the numbers' },
    }},

    // ---------- RESULT ----------
    { type: 'card', hold: 2600, card: {
      en: { id: 'result', speech: 'Here is the result. This one is a sample, for a Working Holiday visa. Yours will look different. Let us read it from top to bottom.', route, title: 'Read your result', subtitle: 'Visa type · dates · work · study · conditions', flag: '🔎', rightTitle: '2 / 3', rightText: 'Sample visa shown\nYours will be different', brand: BRAND },
    }},
    { type: 'manual', field: 'visaRow', tipHold: 2800, text: {
      en: { label: 'Visa class and subclass', speech: { tip: 'At the top you see your name, and the visa class and subclass. Here it is subclass four one seven, the Working Holiday visa. Status in effect means the visa is active right now.', mistake: 'Some people look for a sticker in their passport. Australia does not put visa labels in passports any more. Your visa is an electronic record, linked to your passport number. This VEVO page is your proof.' },
            tip: 'Your **subclass** and status. "In Effect" = active now', mistake: 'There is **no visa sticker**. Australian visas are electronic records linked to your passport.', bad: 'show a passport page', good: 'show your VEVO result' },
    }},
    { type: 'manual', field: 'datesRow', tipHold: 3000, text: {
      en: { label: 'Dates', speech: { tip: 'Next, the dates. Grant date is the day the visa was approved. Must not arrive after is the last day you can enter Australia. The expiry date is the day the visa ends. Put that one in your calendar.' },
            tip: '**Must not arrive after** = last day to enter. **Expiry** = the visa ends' },
    }},
    { type: 'manual', field: 'workRow', tipHold: 3000, text: {
      en: { label: 'Work and study entitlements', speech: { tip: 'This part is what your employer or school wants to see. Work entitlements says if you can work. Study entitlements says if you can study. If there is a limit, it is listed under conditions.', mistake: 'Student visa holders, watch this. The usual limit is forty-eight hours a fortnight while your course is in session. A fortnight is fourteen days, starting on a Monday. It is not forty-eight hours a week. In official course breaks, most students can work more. Always read the condition on your own result.' },
            tip: 'Can you **work**? Can you **study**? Limits are under conditions', mistake: 'Most students: **48 hours a fortnight** while the course is in session. A fortnight is 14 days from a Monday.', bad: '48 hours a week', good: '48 hours a fortnight (14 days)' },
    }},
    { type: 'manual', field: 'condRow', tipHold: 3200, text: {
      en: { label: 'Visa conditions', speech: { tip: 'Conditions are four digit codes. On this sample, eight five four seven means no more than six months of work with any one employer. Eight five four eight means no more than four months of study or training. Students often see eight one zero five. That is the work hours limit. Some conditions have exemptions, so read the full wording on the Home Affairs website.' },
            tip: '**8547** max 6 months with one employer · **8548** max 4 months study · **8105** student work hours' },
    }},
    { type: 'manual', field: 'appRow', tipHold: 2600, text: {
      en: { label: 'myVEVO app', speech: { tip: 'Prefer your phone? Home Affairs also has a free app called my VEVO. You enter the same details once, and save them with a PIN. It shows the same visa details, and it can email them too. If the app gives you trouble, the website does the same job.' },
            tip: 'Free **myVEVO** app: same details, saved with your PIN' },
    }},

    // ---------- SEND PROOF ----------
    { type: 'card', hold: 2600, card: {
      en: { id: 'send', speech: 'Now let us send proof to your employer. The same steps work for a landlord or a school. You have two choices. Save a PDF, or send an email straight from VEVO.', route, title: 'Send proof', subtitle: 'To an employer, a landlord or a school', flag: '✉️', rightTitle: '3 / 3', rightText: 'Save the PDF\nor send an email from VEVO', brand: BRAND },
    }},
    { type: 'click', field: 'viewPdf', text: {
      en: { label: 'Save as PDF', speech: { tip: 'Choice one. Press view as PDF. Your visa details open as a document. Save it, and you can attach it to a job application or upload it to a form.' },
            tip: '**View as PDF** → save it → attach or upload' },
    }},
    { type: 'click', field: 'openEmail', text: {
      en: { label: 'Send Email', speech: { tip: 'Choice two. Press send email. VEVO sends your visa details for you, with the PDF attached.', mistake: 'Do not just send a screenshot. A screenshot is easy to edit, and it gets out of date. Many employers will not accept one. Send the email from VEVO, or the PDF, on the day they ask. Your employer can also run their own VEVO check, if you give permission.' },
            tip: '**Send Email**: VEVO emails your details with the PDF', mistake: 'A screenshot **may not be accepted**. Send a fresh VEVO email or the PDF.', bad: 'old screenshot', good: 'VEVO email or PDF, sent today' },
    }},
    { type: 'type', field: 'emailTo', value: S.email, hl: 'emailRow', text: {
      en: { label: 'Email address', speech: { tip: 'Type the email address. Use the one your employer gave you. I am typing a sample address. A good trick: send it to yourself as well, so you keep a copy.' },
            tip: 'Your employer\'s address. **Send yourself a copy** too' },
    }},
    { type: 'stop', field: 'sendEmail', tipHold: 3200, text: {
      en: { label: 'Send email', speech: { tip: 'Last step. Check the address, then press send email. I will not press it, because this is a practice page. On the real site, the email usually arrives within a few minutes.' },
            tip: 'Check the address, then **Send email** (not pressed in this video)' },
    }},

    // ---------- OUTRO (ticket) ----------
    { type: 'card', hold: 5000, card: {
      en: { id: 'outro', speech: 'That is it. To recap. VEVO is free, on the official Home Affairs website. Use the passport your visa is linked to. Read your work and study conditions carefully. And send the VEVO email or the PDF, not a screenshot. Remember, this is an unofficial guide and not migration advice. If you are unsure about a condition, check with Home Affairs or a registered migration agent. See you in the next one.',
            route, title: 'Done. **Remember these four**', subtitle: 'Free on the official site · linked passport · read your conditions · send the email or PDF',
            meta: [{ k: 'COST', v: 'Free' }, { k: 'PROOF', v: 'Email / PDF' }, { k: 'SITE', v: 'Official only' }], stamp: 'ALL\nSET', flag: '🇦🇺',
            rightTitle: 'Please note', rightText: 'Unofficial guide · not migration advice\nUse only the official Home Affairs website', next: ['🇦🇺 More Australia how-to guides', '🔔 Subscribe for updates'], brand: BRAND },
    }},
  ],
};
