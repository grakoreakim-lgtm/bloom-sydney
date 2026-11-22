// AU-MYGOV — Australia: create a myGov account and link the ATO, Medicare and Centrelink
// First definition for the English channel "Copy My Screen: Gov Edition" (newcomers: migrants, international
// students, working-holiday makers). ENGLISH ONLY: every text object has just an `en` key.
//
// The real flow sits behind sign-in and asks for personal identity details, so nothing is recorded on the
// real site. Both targets point at the practice page ../mock/au-mygov.html (neutral layout, plain labels that
// match the real field names; no government logo, crest or visual design). The recording never submits:
// passwords, codes and secret answers are `manual` steps, and the last step is a `stop`.
//
// Facts checked 2026-11 through web search of official pages (my.gov.au, servicesaustralia.gov.au, ato.gov.au,
// scamwatch.gov.au). The pages themselves could not be opened from the build machine, so wording comes from
// search extracts. Re-check before each yearly refresh.
//  - Create with email, in the official order: Create account → Continue with email → Get started → accept the
//    terms of use and privacy notice (two checkboxes) → email → emailed code → mobile number (optional: choose
//    No to skip, notifications then go to email) → password → multifactor option → secret questions.
//    my.gov.au "Detailed steps on how to create a myGov account using an email address".
//  - Email must be a personal address only you can access; one email cannot be used for two myGov accounts.
//  - Password: 10 to 64 characters, at least one letter and one number, no repeated or sequential characters.
//  - Sign-in options now: Digital ID (myID is the only one myGov accepts), a passkey, or username + password
//    plus a code (SMS, or an authenticator app). The myGov Code Generator app is no longer in the app stores
//    and retires on 28 February 2027.
//  - Secret questions: three; answers are not case sensitive; for new accounts they are used for recovery.
//    If you are locked out and cannot recover, you create a new account and link every service again.
//  - Scams: "The ATO and myGov will never send you an SMS or email with a link to access online services"
//    (ATO scam alerts). myGov notifications "will not contain links" (my.gov.au "How to spot a myGov scam").
//  - Linking code: a single-use code for linking Centrelink, Medicare or Child Support, given by phone or at
//    a service centre (my.gov.au "Use a linking code").
//  - ATO: confirm personal details, then answer questions from records the ATO already holds (bank account,
//    super account, notice of assessment, PAYG payment summary, dividend statement…). Skipping every question
//    counts as a failed attempt. Help line 13 28 61.
//    NOT confirmed on an official page: that the ATO phone line issues a "linking code" (only ATO Community
//    staff replies say so), so the script says "they can help you link, sometimes with a linking code".
//  - Medicare: card number + Individual Reference Number (the number next to your name), then questions such
//    as claiming history or bank details; the myGov name must match the Medicare record.
//  - Centrelink: CRN + linking code, or prove identity online with identity documents. A CRN is only needed
//    if you claim Centrelink payments or services; the myGov name must match the Centrelink record.
//
// Sample data is obviously fictional. No TFN or CRN is ever shown.

const path = require('path');

const S = {
  email: 'alex.sample@example.com',
  mobile: '0400 000 000',
  secretQ: 'q-street',
  atoProof: 'super',
  medicare: '0000000000',
  irn: '1',
};

const BRAND = '▶ Copy My Screen: Gov Edition';
const route = { from: 'NEW', fromCity: 'JUST ARRIVED', to: 'GOV', toCity: 'MY.GOV.AU' };

const mockUrl = 'file://' + path.join(__dirname, '..', 'mock', 'au-mygov.html');

const selectors = {
  address: '#address', addressRow: '#addressRow',
  createAccount: '#createAccount', startBox: '#startBox',
  withEmail: '#withEmail', withEmailRow: '#withEmailRow',
  termsUse: '#termsUse', termsUseRow: '#termsUseRow', termsPrivacy: '#termsPrivacy', termsPrivacyRow: '#termsPrivacyRow',
  email: '#email', emailCode: '#emailCode', emailCodeRow: '#emailCodeRow',
  mobile: '#mobile', mobileRow: '#mobileRow',
  password: '#password', passwordRow: '#passwordRow',
  mfaSms: '#mfaSms', mfaBox: '#mfaBox',
  secretQ1: '#secretQ1', secretA1: '#secretA1', secretRow: '#secretRow',
  linkServices: '#linkServices',
  linkAto: '#linkAto', atoCard: '#atoCard', atoProof: '#atoProof', atoProofRow: '#atoProofRow',
  medicareCard: '#medicareCard', medicareRow: '#medicareBox', irn: '#irn', irnRow: '#irnRow',
  clOnline: '#clOnline', clBox: '#clBox',
  linkBtn: '#linkBtn',
};

module.exports = {
  id: 'au-mygov',
  pack: 'settle',
  channel: 'gov',
  country: { en: 'Australia' }, flag: '🇦🇺',
  fee: 'Free', when: 'First week after arriving', captcha: false,
  title: { en: 'Australia: Create a myGov Account and Link the ATO, Medicare and Centrelink' },
  shortTitle: { en: 'myGov setup' },
  videoTitle: { en: 'How to Create a myGov Account {year} | Link the ATO, Medicare and Centrelink, Step by Step | Copy My Screen' },

  url: {
    mock: mockUrl,
    // the real flow is behind sign-in and asks for identity details → "live" is the same practice page
    live: mockUrl,
  },

  selectors: {
    mock: selectors,
    live: { ...selectors },
  },

  strings: {
    en: { easyPill: '👀 Just copy the screen', mistakeTitle: '⚠ Common mistake', pause: '⏸ Do this, then press play', pauseSub: '' },
  },

  steps: [
    // ---------- INTRO (ticket) ----------
    { type: 'card', hold: 5000, card: {
      en: { id: 'intro', speech: 'Just arrived in Australia? One of the first things to set up is myGov. It is one free account for your tax, your Medicare, and Centrelink. Today we create the account, then link those three services. I will pause at the spots where newcomers get stuck. One thing before we start. This is an unofficial guide. It is not legal or tax advice. And only ever use the official site, my dot gov dot A U.',
            route, title: 'myGov,\n**set it up in your first week**', subtitle: 'Create the account → link the ATO, Medicare and Centrelink. We stop where people slip up.',
            meta: [{ k: 'TIME', v: '15 min' }, { k: 'COST', v: 'Free' }, { k: 'WHEN', v: 'First week' }, { k: 'YEAR', v: '2026' }], stamp: 'COPY\nMY\nSCREEN', flag: '🇦🇺',
            rightTitle: 'Unofficial guide', rightText: 'Not legal or tax advice.\nOnly ever use the official site: my.gov.au', brand: BRAND },
    }},

    // ---------- PART 1: CREATE THE ACCOUNT ----------
    { type: 'manual', field: 'address', hl: 'addressRow', tipHold: 2800, mistakeHold: 4200, text: {
      en: { label: 'Open the official site', speech: { tip: 'Open your browser and type the address yourself. My dot gov dot A U. That is the whole address. This screen is only a practice page, so you can follow along safely.', mistake: 'This is the big one. Scammers send texts and emails that look like myGov, with a link to a fake sign in page. The official warning is clear. myGov will never send you a text or an email with a link to sign in. So never tap a link. Always type the address yourself, or use the official myGov app.' },
            tip: 'Type **my.gov.au** yourself. Do not search for it, do not tap a link',
            mistake: 'myGov will **never** send an SMS or email with a **link to sign in**. Links in messages are scams.', bad: 'tap the link in a text', good: 'type my.gov.au yourself' },
    }},
    { type: 'click', field: 'createAccount', mistakeHold: 4200, text: {
      en: { label: 'Create account', speech: { tip: 'On the sign in page, choose Create account.', mistake: 'Careful here. People make a second account by accident, because they forgot they already had one. A new account starts empty, with no services linked, and one email address only works for one account. If you have ever had a myGov account, sign in to that one instead.' },
            tip: 'Choose **Create account**',
            mistake: 'Already had a myGov account? **Sign in to it.** A second account starts empty, and one email works for one account only.', bad: 'make a new account each time', good: 'one person, one account' },
    }},
    { type: 'radio', field: 'withEmail', hl: 'withEmailRow', text: {
      en: { label: 'Continue with email', speech: { tip: 'You get two choices. Continue with a Digital I D, or continue with email. The Digital I D that works here is called myID, and you may not have it yet. So today we continue with email, then choose Get started.' },
            tip: '**Continue with email** → Get started. (The other choice is a Digital ID: myID)' },
    }},
    { type: 'check', field: 'termsUse', hl: 'termsUseRow', text: {
      en: { label: 'Terms of use', speech: { tip: 'Next come the terms of use. Read them, then tick the first box.' },
            tip: 'Read the **terms of use**, then tick' },
    }},
    { type: 'check', field: 'termsPrivacy', hl: 'termsPrivacyRow', text: {
      en: { label: 'Privacy notice', speech: { tip: 'Then the privacy notice. Tick the second box too. You need both boxes ticked before you can go on.' },
            tip: 'Tick **both boxes**, then Next' },
    }},
    { type: 'type', field: 'email', value: S.email, mistakeHold: 4200, text: {
      en: { label: 'Email address', speech: { tip: 'Now your email address. I am using a sample one. A code is sent to this address, and your account messages go here too.', mistake: 'A very common mistake is using a work email, or a university email. When you change jobs or finish your course, that inbox is gone, and so is your way back into myGov. Use a personal email that only you can open, and that you will keep for years.' },
            tip: 'A **personal email only you can open**. One email, one account',
            mistake: 'Do not use a **work or uni email**. When you lose that inbox, you lose your way back in.', bad: 'name@your-employer or uni', good: 'your own personal email' },
    }},
    { type: 'manual', field: 'emailCode', hl: 'emailCodeRow', tipHold: 2600, text: {
      en: { label: 'Code from your email', speech: { tip: 'Check your inbox. myGov emails you a code. Type that code here yourself. If it does not arrive, look in your junk folder before you ask for a new one.' },
            tip: 'Type the **code from your email**. Check the junk folder too' },
    }},
    { type: 'type', field: 'mobile', value: S.mobile, hl: 'mobileRow', text: {
      en: { label: 'Mobile number (optional)', speech: { tip: 'Next, a mobile number. This step is optional. If you have an Australian mobile, add it, and type the code they send by text. No Australian number yet? Choose No and go on. Your notifications will go to your email instead.' },
            tip: 'Optional. **No mobile yet? Choose No** and notices go to your email' },
    }},
    { type: 'manual', field: 'password', hl: 'passwordRow', tipHold: 2800, text: {
      en: { label: 'Password', speech: { tip: 'Now make your password. Type your own, I will not show one. It needs at least ten characters, with at least one letter and one number. It cannot repeat the same character, or use a run like one two three four.' },
            tip: 'Type your own: **10+ characters**, a letter and a number, no 1234 or aaaa' },
    }},
    { type: 'radio', field: 'mfaSms', hl: 'mfaBox', text: {
      en: { label: 'Sign-in option', speech: { tip: 'Then choose how you prove it is you each time you sign in. There are three choices now. A passkey, which uses your fingerprint, your face, or your screen lock. An authenticator app. Or a code by text message. I will pick the text code for this example. If you travel a lot or change SIM cards, a passkey or an authenticator app is safer. And the old myGov Code Generator app is being retired, so do not go looking for it.' },
            tip: '**Passkey**, **authenticator app**, or **code by SMS**. The old Code Generator app is retiring' },
    }},
    { type: 'select', field: 'secretQ1', value: S.secretQ, text: {
      en: { label: 'Secret question', speech: { tip: 'Last part of the account. Secret questions. You set up three of them. Pick a question from the list, or write your own.' },
            tip: 'Set up **three** secret questions' },
    }},
    { type: 'manual', field: 'secretA1', hl: 'secretRow', tipHold: 2400, mistakeHold: 4200, text: {
      en: { label: 'Secret answer', speech: { tip: 'Then type your own answer. Capital letters do not matter, but the spelling does.', mistake: 'So many people forget these answers. They are how you get back in when something goes wrong. If you are locked out and cannot recover the account, you have to make a new one and link every service again. So save your three answers somewhere safe today, like a password manager.' },
            tip: 'Type your own answer. **Spelling matters**, capitals do not',
            mistake: 'Forgotten answers can mean **a new account and linking everything again**. Save all three answers now.', bad: 'trust your memory', good: 'save them in a password manager' },
    }},

    // ---------- PART 2: LINK SERVICES ----------
    { type: 'card', hold: 3200, card: {
      en: { id: 'link', speech: 'Your account is ready, but it is empty. Now we link services to it. Linking just means proving that your myGov account and your record at that agency belong to the same person. Sometimes you do that with a linking code. That is a single use code the agency gives you by phone, or at a service centre.',
            route, title: 'Now **link your services**', subtitle: 'ATO for tax · Medicare for health · Centrelink for payments', flag: '🔗',
            rightTitle: '2 / 2', rightText: 'Linking code = a single-use code\nfrom the agency, by phone or in person', brand: BRAND },
    }},
    { type: 'click', field: 'linkServices', text: {
      en: { label: 'View and link services', speech: { tip: 'Once you are signed in, find View and link services. You get a list of government services, each with a Link button.' },
            tip: 'Sign in → **View and link services**' },
    }},
    { type: 'click', field: 'linkAto', hl: 'atoCard', text: {
      en: { label: 'Link the ATO', speech: { tip: 'Start with the Australian Taxation Office, the ATO. This is where you lodge your tax return and see your super. Choose Link. First it asks you to confirm your personal details, including your tax file number. Type your own, never share it on camera.' },
            tip: '**Australian Taxation Office** → Link. You need your own TFN' },
    }},
    { type: 'select', field: 'atoProof', value: S.atoProof, hl: 'atoProofRow', mistakeHold: 4500, text: {
      en: { label: 'ATO identity questions', speech: { tip: 'Then the ATO asks questions from records it already holds about you. For example your bank account, your super account, or a notice of assessment from an old tax return. Pick the ones you have in front of you. Do not skip them all, because that counts as a failed try.', mistake: 'Here is where newcomers get stuck. If you have no tax file number yet, or you only just got one, the ATO has almost nothing on record to ask you about. So the link fails. Get your TFN first, and wait until you have a payslip or a super account. If you still cannot answer, phone the ATO on thirteen, twenty eight, sixty one. Once they confirm who you are, they can help you link, sometimes with a linking code.' },
            tip: 'Answer from **your own records**: bank account, super, notice of assessment',
            mistake: 'No TFN or no ATO record yet? **The link fails.** Get your TFN first, then try. Stuck: phone the ATO on 13 28 61.', bad: 'link the ATO on day one', good: 'TFN first, then link' },
    }},
    { type: 'type', field: 'medicareCard', value: S.medicare, hl: 'medicareRow', mistakeHold: 4500, text: {
      en: { label: 'Medicare card number', speech: { tip: 'Next, Medicare. You can only do this if you are enrolled and have a Medicare card. Type the card number. This one is a sample, all zeros. On the real page, type the digits with no spaces.', mistake: 'This catches a lot of people. Your name and date of birth in myGov must match the record at Medicare, and at Centrelink, exactly. A missing middle name, or first and last name the wrong way round, is enough to block the link. Check your myGov profile first. If the agency has it wrong, ask the agency to fix it.' },
            tip: 'The number on **your Medicare card**. Real page: digits, no spaces',
            mistake: 'Name and date of birth must **match each service exactly**. A missing middle name can block the link.', bad: 'Alex S. in one, Alex Sample in another', good: 'same name and birth date everywhere' },
    }},
    { type: 'select', field: 'irn', value: S.irn, hl: 'irnRow', text: {
      en: { label: 'Individual reference number', speech: { tip: 'Then your individual reference number. That is the small number printed next to your name on the card. After that, Medicare asks a few questions only you would know, such as a past claim or your bank details.' },
            tip: 'The **number next to your name** on the card' },
    }},
    { type: 'radio', field: 'clOnline', hl: 'clBox', text: {
      en: { label: 'Link Centrelink', speech: { tip: 'Last one, Centrelink. You only need this if you are going to claim a payment or a service. There are two ways in. If you already have a customer reference number, a CRN, you enter it with a linking code from Centrelink. If you do not have one, choose to prove who you are online, with your identity documents. I will choose that one.' },
            tip: 'Have a **CRN**? Use it with a linking code. No CRN? **Prove your identity online**' },
    }},
    { type: 'stop', field: 'linkBtn', tipHold: 3200, text: {
      en: { label: 'Link', speech: { tip: 'Then you press Link, and the service shows up under your linked services. I will not press it, because this is only a practice page. On the real site, you will see each service appear on your myGov home page once it is linked.' },
            tip: 'Press **Link** on the real site (not pressed in this video)' },
    }},

    // ---------- OUTRO (ticket) ----------
    { type: 'card', hold: 5500, card: {
      en: { id: 'outro', speech: 'That is it. To recap. Use a personal email you will keep. Save your three secret answers. Get your tax file number before you link the ATO. And never tap a link in a text or an email. Remember, this is an unofficial guide. It is not legal or tax advice, and the screens can change. Only ever use the official site, my dot gov dot A U. Next up, how to apply for your tax file number. Links are in the description.',
            route, title: 'Done. **Remember these four**', subtitle: 'Personal email · save your secret answers · TFN before the ATO · never tap a link',
            meta: [{ k: 'EMAIL', v: 'Personal' }, { k: 'ATO', v: 'TFN first' }, { k: 'LINKS', v: 'Never tap' }], stamp: 'ALL\nSET', flag: '🇦🇺',
            rightTitle: 'Unofficial guide', rightText: 'Not legal or tax advice.\nOnly ever use my.gov.au',
            next: ['🧾 Apply for a tax file number (TFN)', '🔔 Subscribe for updates'], brand: BRAND },
    }},
  ],
};
