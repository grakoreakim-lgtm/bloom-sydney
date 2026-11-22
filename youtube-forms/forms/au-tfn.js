// AU-TFN — Australia: apply for a Tax File Number (TFN) online as a visa holder
// (the ATO's online form for foreign passport holders, permanent migrants and temporary visitors — "IAR",
// Individual Auto Registration). First definition for the English channel "Copy My Screen: Gov Edition".
//
// Recorded ONLY on the practice page ../mock/au-tfn.html: a neutral form with plain labels. No ATO logo,
// crest, colours or page design are copied. "live" points at the same practice page, so nothing is ever
// submitted to the ATO. The Submit button is a `stop` step and the security check is a `manual` step.
//
// Facts checked 2026-11 against ato.gov.au (re-check before each yearly refresh):
//  - Who can apply online: permanent migrants and temporary visitors with a foreign passport or travel document
//    and a valid visa with work rights from Home Affairs, linked to that passport, who are IN Australia.
//    Visa conditions 8101 / 8103 (no work) and 8116 are not eligible for the online form.
//    https://www.ato.gov.au/individuals-and-families/tax-file-number/apply-for-a-tfn/foreign-passport-holders-permanent-migrants-and-temporary-visitors-tfn-application
//  - It is free, and no documents are sent to the ATO. Visa details can be checked in VEVO.
//  - The TFN is posted to the Australian postal address on the application; this can take up to 28 days.
//    Do not lodge another application during those 28 days. After 28 days, contact the ATO with the receipt ID.
//  - Set the device to an Australian time zone before starting (another time zone can cause a submit error).
//  - Information to prepare: passport / travel document number and its country, names as printed on it, date of
//    birth, spouse details, any existing TFN / ABN / Centrelink CRN, home and postal address (postal must be in
//    Australia; home address cannot be a PO box and may be overseas for a temporary visitor).
//    https://www.ato.gov.au/forms-and-instructions/tfn-application-for-permanent-migrants-and-temporary-visitors
//    https://www.ato.gov.au/forms-and-instructions/individual-auto-registration-help
//  - At work: on the TFN declaration you can say you have applied for a TFN; you then have 28 days to give it to
//    the employer, who withholds at the standard rate meanwhile. After that (or with no declaration at all) the
//    employer must withhold the top rate: 47% for a resident, 45% for a foreign resident.
//    https://www.ato.gov.au/forms-and-instructions/tfn-declaration/payer-information-and-obligations
//  - Give the TFN to an employer only AFTER starting work, never in a job application or advert.
//    Quoting it to a bank or super fund is not compulsory, but without it more tax is taken.
//    https://www.ato.gov.au/online-services/scams-cyber-safety-and-identity-protection/how-to-stay-scam-safe
//  - NOT confirmed from an official page (ato.gov.au could not be opened directly from the build machine, so the
//    points above come from search-result extracts of the official pages): whether the live form shows a
//    picture-code security check, the exact field labels and order, the options in the Sex list, and the exact
//    spouse fields. The script words these conditionally ("if you see…", "the form may ask…").
//
// Unofficial guide. Not tax advice.

const path = require('path');

// Sample applicant — obviously fake. Never use real personal data, and never show a TFN, on camera.
const S = {
  passportNo: 'X0000000',
  passportCountry: 'GBR',
  familyName: 'Sample',
  givenName: 'Alex',
  dob: '01/01/1995',
  sex: 'X',
  postalLine: '1 Example Street',
  suburb: 'Sydney',
  state: 'NSW',
  postcode: '2000',
  email: 'alex.sample@example.com',
  mobile: '0400 000 000',
};

const route = { from: 'VISA', fromCity: 'YOU ARRIVE', to: 'TFN', toCity: 'BY POST' };
const BRAND = '▶ Copy My Screen: Gov Edition';

const MOCK_URL = 'file://' + path.join(__dirname, '..', 'mock', 'au-tfn.html');
const SELECTORS = {
  officialRow: '#officialRow', eligible: '#eligible', eligibleRow: '#eligibleRow',
  passportNo: '#passportNo', passportCountry: '#passportCountry', securityRow: '#securityRow',
  familyName: '#familyName', givenName: '#givenName', dob: '#dob', sex: '#sex',
  hadTfnNo: '#hadTfnNo', hadTfnRow: '#hadTfnRow',
  postalLine: '#postalLine', postalRow: '#postalRow', suburb: '#suburb', state: '#state', postcode: '#postcode',
  email: '#email', mobile: '#mobile',
  spouseNo: '#spouseNo', spouseRow: '#spouseRow',
  declare: '#declare', declareRow: '#declareRow', submit: '#submit',
  receiptRow: '#receiptRow', employerRow: '#employerRow', shareRow: '#shareRow',
};

module.exports = {
  id: 'au-tfn',
  pack: 'settle',
  channel: 'gov',
  country: { en: 'Australia' }, flag: '🇦🇺',
  fee: 'Free', when: 'After you arrive in Australia',
  captcha: true,   // not confirmed from an official page — see the note above; the step is worded "if you see one"
  title: { en: 'Australia: Apply for a Tax File Number (TFN) Online as a Visa Holder' },
  shortTitle: { en: 'TFN application' },   // Shorts headline / title
  videoTitle: { en: 'How to Apply for a TFN Online {year} | Australia Tax File Number for Visa Holders | Copy My Screen' },

  url: {
    mock: MOCK_URL,
    live: MOCK_URL,   // recorded on the practice page only — the real form is never opened or submitted
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
    { type: 'card', hold: 5000, card: {
      en: { id: 'intro', speech: 'You have arrived in Australia, and you want to work. First you need a tax file number, a T F N. If you hold a visa, you can apply online, and it is free. We go through the form field by field, on a practice screen. I will pause at the spots where people get stuck. One note before we start. This is an unofficial guide, and it is not tax advice. Apply only on the official website, A T O dot gov dot A U.',
            route, title: 'Tax file number,\n**apply online as a visa holder**', subtitle: 'Unofficial guide · not tax advice · apply only on ato.gov.au',
            meta: [{ k: 'TIME', v: '15 min' }, { k: 'COST', v: 'Free' }, { k: 'WHEN', v: 'After arrival' }, { k: 'YEAR', v: '2026' }], stamp: 'COPY\nMY\nSCREEN', flag: '🇦🇺',
            rightTitle: 'TFN · Australia', rightText: 'Need: passport · visa with work rights\nAustralian postal address', brand: BRAND },
    }},

    // ---------- BEFORE YOU START ----------
    { type: 'manual', field: 'officialRow', tipHold: 2800, mistakeHold: 4200, text: {
      en: { label: 'Official website', speech: { tip: 'Start on the official tax office website, A T O dot gov dot A U. Search there for T F N application, and pick the page for foreign passport holders. One small tip from the tax office: set your phone or laptop to an Australian time zone first. A different time zone can cause an error when you submit.', mistake: 'The first mistake costs money. Some websites look official and charge a fee to apply for you. You do not need them. Applying for a tax file number is free, and you do not send any documents. If a site asks you to pay, close it.' },
            tip: 'Go to **ato.gov.au** → TFN application for foreign passport holders. Set your device to an **Australian time zone**.', mistake: 'Applying is **free**. Sites that charge a fee are not the tax office.', bad: 'paying an "agent" site', good: 'ato.gov.au, free' },
    }},
    { type: 'check', field: 'eligible', hl: 'eligibleRow', mistakeHold: 4200, text: {
      en: { label: 'Who can apply online', speech: { tip: 'Next, check that the online form is for you. You need three things. A foreign passport or travel document. A valid visa that lets you work, linked to that passport. And you must be in Australia right now. This covers many working holiday makers, international students and permanent migrants. If your visa has a no work condition, the online form will not accept you.', mistake: 'A very common mistake is applying from your home country, before the flight. The form checks your visa and your arrival with the Department of Home Affairs. So it only works after you have entered Australia. Wait until you land, then apply.' },
            tip: 'Foreign passport · **visa with work rights** · you are **in Australia now**', mistake: 'The online form works only **after you arrive** in Australia.', bad: 'apply before the flight', good: 'apply after you land' },
    }},

    // ---------- TRAVEL DOCUMENT ----------
    { type: 'card', hold: 2600, card: {
      en: { id: 'passport', speech: 'Now the form itself. It starts with your passport. Keep the passport open next to you.', route, title: 'Travel document', subtitle: 'Your passport number is checked against your visa record', flag: '🛂', rightTitle: '1 / 4', rightText: 'Passport number · country\nSecurity check', brand: BRAND },
    }},
    { type: 'type', field: 'passportNo', value: S.passportNo, text: {
      en: { label: 'Passport number', speech: { tip: 'Type your passport or travel document number. Use the passport that your visa is linked to. If you renewed your passport after you got the visa, update it with Home Affairs first. The tax office checks this number against their records, so you do not upload anything.' },
            tip: 'Use the passport **your visa is linked to**. It is checked with Home Affairs.' },
    }},
    { type: 'select', field: 'passportCountry', value: S.passportCountry, text: {
      en: { label: 'Country of passport', speech: { tip: 'Then choose the country of your passport. That is the country that issued it, not the country you flew from. I will pick one as an example.' },
            tip: 'The country that **issued the passport**, not where you flew from' },
    }},
    { type: 'manual', field: 'securityRow', tipHold: 2600, text: {
      en: { label: 'Security check', speech: { tip: 'If you see a security check with a picture code, type the letters or numbers yourself. I will not do it here, because this is a practice page.' },
            tip: 'If a **picture code** appears, type it yourself' },
    }},

    // ---------- YOUR DETAILS ----------
    { type: 'card', hold: 2600, card: {
      en: { id: 'details', speech: 'Next, your personal details. Copy them from your passport, letter by letter.', route, title: 'Your details', subtitle: 'Name, date of birth and sex, as on your passport', flag: '🪪', rightTitle: '2 / 4', rightText: 'Family name · given names\nDate of birth · sex', brand: BRAND },
    }},
    { type: 'type', field: 'familyName', value: S.familyName, mistakeHold: 4200, text: {
      en: { label: 'Family name', speech: { tip: 'Type your family name. That is your surname.', mistake: 'This is where many applications fail. The name must match your passport exactly. Not a nickname. Not your English name. Not a different spelling. And do not swap the family name and the given name. If the name does not match the visa record, the form cannot confirm who you are.' },
            tip: 'Your surname, **exactly as printed** on the passport', mistake: 'The name must **match the passport**. No nickname, no English name, no swapped order.', bad: 'nickname or English name', good: 'same spelling as the passport' },
    }},
    { type: 'type', field: 'givenName', value: S.givenName, text: {
      en: { label: 'Given names', speech: { tip: 'Then your given names. If your passport shows a middle name, include it, the same way the passport does.' },
            tip: 'All given names, **as the passport shows them**' },
    }},
    { type: 'type', field: 'dob', value: S.dob, text: {
      en: { label: 'Date of birth', speech: { tip: 'Date of birth. Australia writes the day first, then the month, then the year. So the first of January is zero one, zero one.' },
            tip: 'Australian order: **day / month / year**' },
    }},
    { type: 'select', field: 'sex', value: S.sex, text: {
      en: { label: 'Sex', speech: { tip: 'Choose your sex, the same as on your passport. I am picking one here only as an example.' },
            tip: 'Same as **on your passport**' },
    }},
    { type: 'radio', field: 'hadTfnNo', hl: 'hadTfnRow', tipHold: 3000, text: {
      en: { label: 'Had a TFN before?', speech: { tip: 'The form asks if you have ever had a tax file number, or an Australian business number. A tax file number is yours for life. So if you worked in Australia on an earlier visa, you may already have one. Then choose yes. If this is your first time, choose no. And after you submit, do not apply a second time while you wait. The tax office says that causes delays.' },
            tip: 'A TFN is **yours for life**. First time? **No**. Had one before? **Yes**. Never apply twice.' },
    }},

    // ---------- ADDRESS + CONTACT ----------
    { type: 'card', hold: 2600, card: {
      en: { id: 'address', speech: 'Now the address. This part matters most, because your number arrives by post.', route, title: 'Address and contact', subtitle: 'Your TFN arrives by letter. It can take up to 28 days', flag: '📮', rightTitle: '3 / 4', rightText: 'Postal address in Australia\nEmail · phone · spouse', brand: BRAND },
    }},
    { type: 'type', field: 'postalLine', hl: 'postalRow', value: S.postalLine, mistakeHold: 4400, text: {
      en: { label: 'Postal address', speech: { tip: 'Type your postal address. It must be an address in Australia. The tax office posts a letter with your tax file number to this address. It can take up to twenty eight days.', mistake: 'Think about where you will be next month. If you use a hostel, and then you move out, the letter can get lost. Use an address where you will still get mail in four weeks. A friend or family member you trust is fine, if they agree. If nothing arrives after twenty eight days, contact the tax office, and have your receipt number ready.' },
            tip: 'Must be **in Australia**. The TFN letter comes here, in **up to 28 days**.', mistake: 'Use an address where you still get mail **in 4 weeks**.', bad: 'a hostel you leave next week', good: 'a stable address you trust' },
    }},
    { type: 'type', field: 'suburb', value: S.suburb, text: {
      en: { label: 'Suburb or town', speech: { tip: 'Then the suburb or town.' }, tip: 'Suburb or town of the **postal address**' },
    }},
    { type: 'select', field: 'state', value: S.state, text: {
      en: { label: 'State', speech: { tip: 'Choose the state or territory. New South Wales is N S W.' }, tip: 'State or territory, e.g. **NSW**, **VIC**, **QLD**' },
    }},
    { type: 'type', field: 'postcode', value: S.postcode, text: {
      en: { label: 'Postcode', speech: { tip: 'And the postcode. Australian postcodes have four digits. The real form also asks for your home address. That one cannot be a P O box. If you are a temporary visitor, it may be your address in your home country.' },
            tip: '**4 digits**. The real form also asks for a **home address** (no PO box).' },
    }},
    { type: 'type', field: 'email', value: S.email, text: {
      en: { label: 'Email', speech: { tip: 'Add your contact details. First an email address that you check often.' }, tip: 'An email **you check often**' },
    }},
    { type: 'type', field: 'mobile', value: S.mobile, text: {
      en: { label: 'Mobile number', speech: { tip: 'And a phone number. An Australian mobile number is best, so the tax office can reach you if there is a question.' }, tip: 'An **Australian mobile** number is best' },
    }},
    { type: 'radio', field: 'spouseNo', hl: 'spouseRow', text: {
      en: { label: 'Spouse details', speech: { tip: 'The form may ask about a spouse. That means a husband, a wife, or a de facto partner. If you have one, choose yes and enter their details. If not, choose no.' },
            tip: 'Married or de facto partner? **Yes**, then their details. Otherwise **No**.' },
    }},

    // ---------- DECLARE + SUBMIT ----------
    { type: 'card', hold: 2600, card: {
      en: { id: 'submit', speech: 'Almost done. Read everything once more, then the declaration and submit.', route, title: 'Declare and submit', subtitle: 'Check every field, then save your receipt ID', flag: '✅', rightTitle: '4 / 4', rightText: 'Declaration · submit\nReceipt ID', brand: BRAND },
    }},
    { type: 'check', field: 'declare', hl: 'declareRow', text: {
      en: { label: 'Declaration', speech: { tip: 'Tick the declaration. You are saying that everything you typed is true and correct. So scroll up first, and check the passport number, the name, and the address one more time.' },
            tip: 'Check **passport number, name, address** first, then tick' },
    }},
    { type: 'stop', field: 'submit', tipHold: 3200, text: {
      en: { label: 'Submit', speech: { tip: 'This is the submit button. I will not press it, because this is a practice page. On the real form, press it once, and wait for the next screen.' },
            tip: 'Press **once** on the real form (not pressed in this video)' },
    }},
    { type: 'manual', field: 'receiptRow', tipHold: 3200, text: {
      en: { label: 'Receipt ID', speech: { tip: 'After you submit, the real form shows a receipt I D. Write it down, or take a screenshot. You will need it if your letter does not arrive and you have to contact the tax office. The receipt is not your tax file number. The number itself comes in the letter.' },
            tip: 'Save the **receipt ID**. It is **not** your TFN; the TFN comes by letter.' },
    }},

    // ---------- AFTERWARDS ----------
    { type: 'manual', field: 'employerRow', tipHold: 3200, mistakeHold: 4600, text: {
      en: { label: 'Tell your employer', speech: { tip: 'When the letter arrives, give the number to your employer. You do that on a form called the T F N declaration, after you start the job.', mistake: 'Many people think they cannot start work until the letter comes. That is not what the tax office says. On the T F N declaration, you can say that you have applied. You then have twenty eight days to give your employer the number, and they take tax at the normal rate. But if you give them nothing, or the twenty eight days pass, they must take tax at the top rate. That is around forty five to forty seven percent of your pay.' },
            tip: 'Give your TFN on the **TFN declaration**, after you start the job', mistake: 'Applied but no number yet? Say so on the declaration. You have **28 days** before the **top tax rate** applies.', bad: 'leave the TFN part blank', good: 'tick "I have applied", give it within 28 days' },
    }},
    { type: 'manual', field: 'shareRow', tipHold: 3000, mistakeHold: 4400, text: {
      en: { label: 'Bank, super, and scams', speech: { tip: 'Give your number to your bank and to your super fund too. It is not compulsory, but without it they take more tax from your interest and your super.', mistake: 'Last one, and it is about safety. Your tax file number is a key to your identity. Never put it in a job application. Never send it to someone from a job ad or a chat group. Only give it to your employer after you start work, and to your bank, your super fund, and the government. If someone else asks for it, treat it as a scam.' },
            tip: 'Also give it to your **bank** and **super fund**, or more tax is taken', mistake: '**Never** share your TFN in a job application, a job ad or a chat group.', bad: 'TFN in a job application', good: 'employer, only after you start' },
    }},

    // ---------- OUTRO (ticket) ----------
    { type: 'card', hold: 5000, card: {
      en: { id: 'outro', speech: 'That is it. To recap. Apply after you arrive, and only on A T O dot gov dot A U, because it is free there. Copy your name from your passport. Use a postal address that still works next month. And keep your receipt I D. Remember, this is an unofficial guide and not tax advice, so check the official website for your own situation. If this helped, subscribe for the next government form.',
            route, title: 'Done. **Now wait for the letter**', subtitle: 'Unofficial guide · not tax advice · apply only on ato.gov.au',
            meta: [{ k: 'COST', v: 'Free' }, { k: 'LETTER', v: 'Up to 28 days' }, { k: 'KEEP', v: 'Receipt ID' }], stamp: 'ALL\nSET', flag: '🇦🇺',
            rightTitle: 'Up next', rightText: '', next: ['🏦 Open an Australian bank account', '🧾 The TFN declaration at your new job', '🔔 Subscribe for updates'], brand: BRAND },
    }},
  ],
};
