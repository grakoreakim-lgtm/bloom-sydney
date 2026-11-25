// UK ETA — Electronic Travel Authorisation (UK Home Office), applied online on GOV.UK (web form; the official
// "UK ETA" app also exists — the video uses the website).
// Official: https://www.gov.uk/eta  ·  apply: https://www.gov.uk/eta/apply
//
// Sources (checked 2026-11-25 via web search — www.gov.uk itself was not reachable from the build sandbox):
//   - GOV.UK "Get an electronic travel authorisation (ETA) to visit the UK" (gov.uk/eta, gov.uk/eta/apply):
//     fee £20 from 8 April 2026 (was £16), no refund after applying; valid 2 years or until the passport expires,
//     whichever is sooner; travel as many times as you want; need the passport you travel with, an email address,
//     a credit/debit card or Apple Pay / Google Pay, a photo of your face meeting the digital photo rules; online
//     you upload a photo of the passport and of the face; decision usually quick, allow up to 3 working days.
//   - GOV.UK "Check if you can get an ETA" + Home Office ETA factsheets (homeofficemedia.blog.gov.uk, 2025/2026):
//     non-European non-visa nationals (incl. South Korea, USA, Australia, Canada, Japan) need one for travel on or
//     after 8 January 2025; EU (except Ireland) / EEA / Swiss nationals for travel on or after 2 April 2025;
//     British and Irish citizens do not need one; every traveller, including children and babies, needs their own.
//   - GOV.UK news "UK enforces digital permission to travel": no ETA, no boarding, from 25 February 2026.
//   - Immigration Rules, Appendix ETA: visitors may seek entry for up to 6 months on each occasion.
//   - GOV.UK "Using the UK ETA app": new passport = new ETA; questions on address, job, other nationalities and
//     criminal convictions; other application services may charge more than the UK Government.
//
// NOT confirmed (kept out of the narration or phrased cautiously):
//   - The exact screen order and wording of the GOV.UK web form. The mock page is a best-effort reconstruction
//     from GOV.UK guidance and third-party walkthroughs; re-check against the live service before any live recording.
//   - Whether the web form still sends a 6-digit email code (third-party guides say so; narration just says "a code").
//   - Exact wording of the suitability questions beyond "criminal convictions" (mock shows two summarised questions).
//   - Airside-transit rules for ETA (changed during roll-out) — not mentioned in the video.
//   - Fee after 2026-11-25: re-check gov.uk/eta/apply before every upload.
//   - "Usually within minutes" decision (factsheet, app route) — narration says "often quick, up to 3 working days".
//
// The mock target is ../mock/uk-eta-form.html. The recording never uploads a real passport or photo, never pays.

const path = require('path');

// Sample traveller — obviously fake. Never use real personal data on camera.
const S = {
  email: 'sample.traveller@example.com',
  familyName: 'HONG',
  givenName: 'GILDONG',
  nationality: 'KOR',
  dob: '15 05 1990',
  passport: 'M12345678',
  passportExpiry: '31 12 2031',
  homeAddress: '123 SAMPLE-RO, JUNG-GU, SEOUL, KOREA',
  phone: '+82 10 1234 5678',
  jobTitle: 'OFFICE WORKER',
};

const route = { from: 'ICN', fromCity: 'SEOUL', to: 'LHR', toCity: 'LONDON' };

module.exports = {
  id: 'uk-eta',
  pack: 'eta',
  country: { ko: '영국', en: 'UK' }, flag: '🇬🇧',
  fee: '20파운드 (GBP, 2026.4.8~)', when: '출국 3영업일 전까지 권장', captcha: false,
  title: { ko: '영국 전자여행허가 (UK ETA)', en: 'UK Electronic Travel Authorisation (ETA)' },
  shortTitle: { ko: '영국 ETA', en: 'UK ETA' },
  videoTitle: { ko: '영국 ETA 신청 방법 {year} | GOV.UK 공식 사이트 화면 그대로 따라하기', en: 'How to Apply for a UK ETA {year} | Official GOV.UK Step-by-Step | Copy My Screen' },

  url: {
    mock: 'file://' + path.join(__dirname, '..', 'mock', 'uk-eta-form.html'),
    live: 'https://www.gov.uk/eta/apply',
  },

  selectors: {
    mock: {
      beforeBox: '#beforeBox', applyingForMe: '#applyingForMe', applyingForRow: '#applyingForRow',
      email: '#email', code: '#code', codeRow: '#codeRow', passportUpload: '#passportUpload',
      familyName: '#familyName', givenName: '#givenName', nationality: '#nationality', dob: '#dob',
      passport: '#passport', passportExpiry: '#passportExpiry', photoUpload: '#photoUpload',
      homeAddress: '#homeAddress', phone: '#phone', otherNatNo: '#otherNatNo', otherNatRow: '#otherNatRow',
      jobTitle: '#jobTitle', crimeNo: '#crimeNo', crimeRow: '#crimeRow', terrorNo: '#terrorNo', terrorRow: '#terrorRow',
      declaration: '#declaration', declBox: '#declBox', payNow: '#payNow',
    },
    // live selectors not written yet: the real GOV.UK service is one question per page (needs 'next' steps).
  },

  strings: {
    ko: { easyPill: '👀 화면 그대로 따라만 하세요', mistakeTitle: '⚠ 많이 틀리는 곳', pause: '⏸ 여기까지 입력하세요', pauseSub: '다 치고 나서 재생' },
    en: { easyPill: '👀 Just copy the screen', mistakeTitle: '⚠ Common mistake', pause: '⏸ Type this, then press play', pauseSub: '' },
  },

  steps: [
    // ---------- INTRO (ticket) ----------
    { type: 'card', hold: 5000, card: {
      ko: { id: 'intro', speech: '영국 가시죠? 이제 한국 여권도, 영국에 가려면 이티에이라는 전자여행허가가 있어야 비행기를 탈 수 있어요. 공식 비용은 한 사람에 이십 파운드예요. 그런데 검색하면, 더 비싸게 받는 대행 사이트가 먼저 나와요. 오늘은 거브 점 유케이 공식 신청 화면 그대로, 결제 직전까지 같이 가 볼게요.',
            route, title: '영국 ETA,\n**화면 그대로 따라 하면 끝**', subtitle: 'GOV.UK 공식 신청 화면 그대로. 틀리기 쉬운 곳에서 멈춥니다.',
            meta: [{ k: '소요', v: '15분' }, { k: '비용', v: '£20' }, { k: '유효', v: '2년' }, { k: '기준', v: '2026' }], stamp: '따라\n하면\n끝', flag: '🇬🇧',
            rightTitle: 'UK ETA', rightText: '준비물: 여권 · 이메일 · 얼굴 사진 · 결제 카드\n공식 신청은 GOV.UK(또는 공식 UK ETA 앱)뿐', brand: '▶ 따라하면 끝 · 입국신고서·비자' },
      en: { id: 'intro', speech: 'Flying to the UK without a visa? You now need an ETA, an electronic travel authorisation, before you can board. The official fee is twenty pounds per person, but search results are full of agency sites charging more. Today we go through the official GOV.UK form, screen by screen, right up to the payment page.',
            route, title: 'UK ETA,\n**copy the screen and you are done**', subtitle: 'The official GOV.UK application, step by step. We stop where people slip up.',
            meta: [{ k: 'TIME', v: '15 min' }, { k: 'FEE', v: '£20' }, { k: 'VALID', v: '2 years' }, { k: 'YEAR', v: '2026' }], stamp: 'COPY\nMY\nSCREEN', flag: '🇬🇧',
            rightTitle: 'UK ETA', rightText: 'Need: passport · email · face photo · card\nApply only on GOV.UK (or the official UK ETA app)', brand: '▶ Copy My Screen · Arrival Cards & Visas' },
    }},

    // ---------- START ----------
    { type: 'radio', field: 'applyingForMe', hl: 'applyingForRow', text: {
      ko: { label: '공식 사이트 · 신청 대상', speech: { tip: '첫 화면이에요. 본인 신청이면 마이셀프를 고르세요. 가족 것도 여기서 따로 할 수 있는데, 아기까지 한 사람에 하나씩 필요해요.', mistake: '여기서 제일 많이 당해요. 주소창을 꼭 보세요. 거브 점 유케이, 이게 공식 사이트예요. 비슷한 이름의 대행 사이트는 이십 파운드보다 훨씬 많이 받아요. 공식 앱 말고는, 거브 점 유케이에서만 신청하세요.' },
            tip: '본인 신청 = **Myself**. 가족은 한 명씩 따로 (아기 포함)', mistake: '공식 신청은 **GOV.UK**(또는 공식 UK ETA 앱)뿐. 대행 사이트는 £20보다 훨씬 비싸게 받습니다.', bad: 'uk-eta-○○○.com (대행)', good: 'www.gov.uk/eta' },
      en: { label: 'Official site · who it is for', speech: { tip: 'The first screen. Applying for yourself? Choose myself. You can do family members too, but every person needs their own ETA, babies included.', mistake: 'This is where most people overpay. Check the address bar. gov dot uk is the official site. Look-alike agency sites charge much more than twenty pounds. Apart from the official app, apply only on gov dot uk.' },
            tip: 'For yourself = **Myself**. One ETA per person, babies too', mistake: 'Apply only on **GOV.UK** (or the official UK ETA app). Agency sites charge far more than £20.', bad: 'uk-eta-something.com', good: 'www.gov.uk/eta' },
    }},
    { type: 'type', field: 'email', value: S.email, text: {
      ko: { label: '이메일', speech: { tip: '이메일이에요. 여기로 확인 코드가 오고, 나중에 승인 결과도 와요. 지금 바로 열어볼 수 있는 메일로 적어 주세요.' }, tip: '코드와 결과가 옵니다. **바로 열 수 있는 메일**로' },
      en: { label: 'Email', speech: { tip: 'Your email. A security code comes here, and later your decision. Use an inbox you can open right now.' }, tip: 'Code and decision come here. Use an inbox you can **open now**' },
    }},
    { type: 'manual', field: 'code', hl: 'codeRow', tipHold: 3000, text: {
      ko: { label: '확인 코드', speech: { tip: '메일로 온 코드를 넣어요. 안 보이면 스팸함도 확인하세요. 영상에서는 넘어갈게요.' }, tip: '메일로 온 **코드** 입력. 안 오면 스팸함 확인' },
      en: { label: 'Security code', speech: { tip: 'Type the code from your email. Not there? Check your spam folder. I will skip it here.' }, tip: 'Enter the **code** from your email. Check spam' },
    }},
    { type: 'manual', field: 'passportUpload', tipHold: 3200, text: {
      ko: { label: '여권 사진면 업로드', speech: { tip: '여권 사진이 있는 면을 찍어서 올려요. 사진에서 여권 정보를 읽어 줘요. 빛 반사 없이, 사진면 전체가 흐리지 않게 찍으세요. 영상에서는 업로드하지 않을게요.' }, tip: '여권 **사진면 전체**, 흐림·빛 반사 없이' },
      en: { label: 'Upload passport', speech: { tip: 'Upload a photo of your passport photo page. Your details are read from it. The whole page, sharp, no glare. I will not upload one on camera.' }, tip: 'The **whole photo page**, sharp, no glare' },
    }},

    // ---------- PASSPORT ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'passport', speech: '이제 여권 정보예요. 자동으로 읽혔어도, 한 칸씩 여권이랑 꼭 대조하세요. 틀리면 늦어지거나 거절될 수 있어요.', route, title: '여권 정보 확인', subtitle: '자동으로 읽혀도 여권과 한 칸씩 대조하세요', flag: '🛂', rightTitle: '1 / 3', rightText: '성 · 이름 · 국적 · 생년월일\n여권번호 · 만료일 · 얼굴 사진' },
      en: { id: 'passport', speech: 'Now your passport details. Even if they were read automatically, check every box against your passport. A mismatch can delay or sink the application.', route, title: 'Check your passport details', subtitle: 'Even if read automatically, check each box against your passport', flag: '🛂', rightTitle: '1 / 3', rightText: 'Names · nationality · birth date\npassport no. · expiry · face photo' },
    }},
    { type: 'type', field: 'familyName', value: S.familyName, text: {
      ko: { label: '성 (Surname)', speech: { tip: '서네임, 성이에요. 홍길동이면 홍.', mistake: '성이랑 이름 칸을 바꿔 쓰는 분이 정말 많아요. 서네임이 성, 기븐 네임이 이름이에요. 여권 영문 철자 그대로 쓰세요.' },
            tip: 'Surname = **성**', mistake: '성·이름 칸을 바꿔 쓰는 실수가 가장 흔합니다. 철자는 여권 영문 그대로.', bad: 'Surname: GILDONG', good: 'Surname: HONG' },
      en: { label: 'Surname', speech: { tip: 'Surname, your family name.', mistake: 'Swapping surname and given names is the most common slip. Copy the spelling exactly from your passport.' },
            tip: 'Surname = **family name**', mistake: 'Swapping surname and given names is the most common slip. Spell it exactly as in the passport.', bad: 'Surname: GILDONG', good: 'Surname: HONG' },
    }},
    { type: 'type', field: 'givenName', value: S.givenName, text: {
      ko: { label: '이름 (Given names)', speech: { tip: '기븐 네임, 이름이에요. 길동. 여권에 붙어 있으면 붙여서, 띄어져 있으면 띄워서요.' }, tip: '여권에 적힌 **그대로** (붙임·띄움까지)' },
      en: { label: 'Given names', speech: { tip: 'Given names, exactly as printed in the passport.' }, tip: 'Exactly as **printed in the passport**' },
    }},
    { type: 'select', field: 'nationality', value: S.nationality, text: {
      ko: { label: '국적', speech: { tip: '여권에 적힌 국적이에요. 한국 여권이면 코리아, 사우스.', mistake: '목록에 코리아가 두 개 있어요. 알파벳 순서라 북한이 먼저 나와요. 노스를 고르면 안 돼요. 꼭 코리아, 사우스예요.' },
            tip: '한국 여권 = **Korea (South)**', mistake: '알파벳 순서라 북한(North)이 먼저 나옵니다. 꼭 South.', bad: 'Korea (North)', good: 'Korea (South)' },
      en: { label: 'Nationality', speech: { tip: 'The nationality on your passport.', mistake: 'Watch look-alike entries. For example, there are two Koreas, and North comes first. A South Korean passport is Korea, South.' },
            tip: 'The nationality **on your passport**', mistake: 'Watch look-alikes: Korea (North) is listed before Korea (South).', bad: 'Korea (North)', good: 'Korea (South)' },
    }},
    { type: 'type', field: 'dob', value: S.dob, text: {
      ko: { label: '생년월일', speech: { tip: '생년월일은 일, 월, 년 순서예요. 숫자로, 오월 십오일이면 일오, 공오.' }, tip: '**일 → 월 → 년** 순서 (숫자)' },
      en: { label: 'Date of birth', speech: { tip: 'Date of birth, day, month, year, in numbers.' }, tip: '**Day → month → year**' },
    }},
    { type: 'type', field: 'passport', value: S.passport, text: {
      ko: { label: '여권번호', speech: { tip: '여권번호예요. 띄어쓰기 없이요. 숫자 영이랑 영문 오가 헷갈리니까, 한 글자씩 확인하세요.' }, tip: '**띄어쓰기 없이**. 0과 O, 1과 I 주의' },
      en: { label: 'Passport number', speech: { tip: 'Passport number, no spaces. Zero and O are easy to mix up, so check each character.' }, tip: '**No spaces**. Watch 0 vs O, 1 vs I' },
    }},
    { type: 'type', field: 'passportExpiry', value: S.passportExpiry, text: {
      ko: { label: '여권 만료일', speech: { tip: '여권 만료일이에요. 발급일 말고요.', mistake: '이티에이는 이 년 동안 유효한데, 여권이 먼저 끝나면 그날 같이 끝나요. 그리고 여권을 새로 받으면, 이티에이도 새로 받아야 해요. 영국 갈 때는 신청한 그 여권을 꼭 가져가세요.' },
            tip: '발급일 말고 **만료일**', mistake: 'ETA는 **2년 또는 여권 만료일 중 빠른 날**까지. 새 여권 = 새 ETA. 신청한 여권으로 출국.', bad: '여권 갱신 후 기존 ETA 사용', good: '새 여권 = 새 ETA' },
      en: { label: 'Passport expiry', speech: { tip: 'Passport expiry date, not the issue date.', mistake: 'An ETA lasts two years, or until your passport expires, whichever is sooner. Get a new passport and you need a new ETA. Travel with the same passport you applied with.' },
            tip: 'The **expiry** date, not the issue date', mistake: 'Valid **2 years or until the passport expires**, whichever is sooner. New passport = new ETA.', bad: 'old ETA with new passport', good: 'new passport = new ETA' },
    }},
    { type: 'manual', field: 'photoUpload', tipHold: 3200, text: {
      ko: { label: '얼굴 사진', speech: { tip: '다음은 얼굴 사진이에요. 밝고 단색인 배경에서, 정면을 보고 찍으세요. 영상에서는 올리지 않을게요.', mistake: '사진이 디지털 사진 규칙에 안 맞으면, 신청이 늦어지거나 거절될 수 있어요. 모자, 선글라스, 필터는 빼고, 그림자 없이 찍으세요.' },
            tip: '단색 배경 · **정면** 얼굴 사진', mistake: '규칙에 안 맞는 사진은 **지연·거절** 사유. 모자·선글라스·필터·그림자 없이.', bad: '셀카 필터 · 모자', good: '단색 배경 · 정면' },
      en: { label: 'Photo of your face', speech: { tip: 'Next, a photo of your face. Plain, light background, looking straight at the camera. I will not upload one here.', mistake: 'A photo that breaks the digital photo rules can delay or get your application refused. No hat, sunglasses, filters or shadows.' },
            tip: 'Plain background, **facing the camera**', mistake: 'A photo that breaks the rules can **delay or sink** it. No hat, sunglasses, filters or shadows.', bad: 'filtered selfie, cap', good: 'plain background, front-on' },
    }},

    // ---------- CONTACT · JOB ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'contact', speech: '이제 연락처랑 직업이에요. 사실 그대로만 쓰면 돼요.', route, title: '연락처 · 국적 · 직업', subtitle: '사실 그대로, 영문으로', flag: '🏠', rightTitle: '2 / 3', rightText: '집 주소 · 전화번호\n다른 국적 · 직업' },
      en: { id: 'contact', speech: 'Now your contact details and job. Just write the facts.', route, title: 'Contact, nationality & job', subtitle: 'Just the facts', flag: '🏠', rightTitle: '2 / 3', rightText: 'Home address · phone\nother nationalities · job' },
    }},
    { type: 'type', field: 'homeAddress', value: S.homeAddress, text: {
      ko: { label: '집 주소', speech: { tip: '지금 사는 집 주소를 영문으로 써요. 영국 숙소 주소가 아니에요.' }, tip: '영국 숙소 말고 **지금 사는 집** (영문)' },
      en: { label: 'Home address', speech: { tip: 'Your home address, where you live now. Not your UK hotel.' }, tip: 'Where you **live now**, not your UK hotel' },
    }},
    { type: 'type', field: 'phone', value: S.phone, text: {
      ko: { label: '전화번호', speech: { tip: '전화번호는 국가번호부터요. 한국은 플러스 팔십이, 그 다음 맨 앞 영을 빼고 일공으로 시작해요.' }, tip: '+82 다음 맨 앞 **0 빼고**' },
      en: { label: 'Phone number', speech: { tip: 'Phone number with your country code, and drop the leading zero.' }, tip: 'Country code, then drop the **leading 0**' },
    }},
    { type: 'radio', field: 'otherNatNo', hl: 'otherNatRow', text: {
      ko: { label: '다른 국적', speech: { tip: '다른 나라 국적이 있는지 묻는 거예요. 없으면 노. 있으면 예를 고르고 사실대로 적으세요. 참고로 영국이나 아일랜드 국적이 있으면 이티에이 대상이 아니에요.' }, tip: '다른 국적 없으면 **No**. 있으면 사실대로' },
      en: { label: 'Other nationalities', speech: { tip: 'Any other nationality or citizenship? If not, no. If yes, say so and fill it in truthfully. If one of them is British or Irish, you do not use an ETA at all.' }, tip: 'None → **No**. Otherwise answer truthfully' },
    }},
    { type: 'type', field: 'jobTitle', value: S.jobTitle, text: {
      ko: { label: '직업', speech: { tip: '직업을 영어로 간단히 써요. 회사원이면 오피스 워커처럼요. 학생이나 은퇴하셨으면 그대로 쓰면 돼요.' }, tip: '간단히 영어로 (예: OFFICE WORKER, STUDENT)' },
      en: { label: 'Job', speech: { tip: 'Your job title, in a few words. Student or retired is fine too.' }, tip: 'A few words, e.g. OFFICE WORKER, STUDENT' },
    }},

    // ---------- QUESTIONS ----------
    { type: 'card', hold: 3000, card: {
      ko: { id: 'questions', speech: '이제 범죄 경력 같은 질문이에요. 대충 넘기면 안 돼요. 끝까지 읽고, 사실대로 답하세요.', route, title: '범죄 경력 등 질문', subtitle: '끝까지 읽고, 사실대로 답하세요', flag: '❓', rightTitle: '3 / 3', rightText: '범죄 경력 · 테러·전쟁범죄 관련\n서약' },
      en: { id: 'questions', speech: 'Now the questions about criminal convictions and similar. Do not rush these. Read each one to the end and answer truthfully.', route, title: 'Convictions & other questions', subtitle: 'Read each to the end and answer truthfully', flag: '❓', rightTitle: '3 / 3', rightText: 'Criminal convictions · terrorism, war crimes\ndeclaration' },
    }},
    { type: 'radio', field: 'crimeNo', hl: 'crimeRow', text: {
      ko: { label: '범죄 경력', speech: { tip: '어느 나라에서든 범죄로 유죄 판결을 받은 적이 있는지 묻는 거예요. 없으면 노.', mistake: '있는데 숨기면, 거짓 정보로 거절될 수 있어요. 있으면 예를 고르고, 죄명이랑 날짜를 최대한 자세히 적으세요. 잘 모르겠으면 공식 안내를 먼저 확인하세요.' },
            tip: '어느 나라든 **유죄 판결** 여부. 없으면 No', mistake: '숨기면 **거짓 정보 → 거절** 위험. 있으면 Yes, 죄명·날짜를 자세히.', bad: '경력 숨기기', good: '사실대로, 자세히' },
      en: { label: 'Criminal convictions', speech: { tip: 'Have you been convicted of a crime in any country? If not, no.', mistake: 'Hiding one can get you refused for giving false information. If you have one, answer yes and give the offence and date in as much detail as you can.' },
            tip: 'A conviction in **any country**? None → No', mistake: 'Hiding it risks a **refusal for false information**. If yes, give offence and date in detail.', bad: 'hiding a conviction', good: 'truthful, detailed' },
    }},
    { type: 'radio', field: 'terrorNo', hl: 'terrorRow', text: {
      ko: { label: '테러·전쟁범죄 관련', speech: { tip: '테러나 전쟁범죄 같은 일에 관여한 적이 있는지 묻는 거예요. 끝까지 읽고, 해당 없으면 노. 실수로 예를 누르지 않게 한 번 더 보세요.' }, tip: '끝까지 읽고 해당 없으면 **No**. 잘못 누르지 않게 재확인' },
      en: { label: 'Terrorism & war crimes', speech: { tip: 'Have you been involved in terrorism, war crimes or similar? Read it to the end. If not, no. Double-check you did not click yes by accident.' }, tip: 'Read to the end. None → **No**. Re-check your click' },
    }},

    // ---------- DECLARATION · PAY ----------
    { type: 'check', field: 'declaration', hl: 'declBox', text: {
      ko: { label: '서약', speech: { tip: '마지막 서약이에요. 입력한 내용이 사실이고, 거짓이면 거절될 수 있다는 내용이에요. 읽고 체크하세요.' }, tip: '내용 확인 후 **체크**' },
      en: { label: 'Declaration', speech: { tip: 'The declaration. Your answers are true, and false information can lead to a refusal. Read it and tick the box.' }, tip: 'Read it, then **tick the box**' },
    }},
    { type: 'stop', field: 'payNow', tipHold: 3400, text: {
      ko: { label: '결제', speech: { tip: '이제 결제로 넘어가요. 카드나 애플페이, 구글페이로 할 수 있어요. 영상은 여기서 멈출게요.', mistake: '금액이 한 사람에 이십 파운드인지 보세요. 원화로 보일 수도 있어요. 훨씬 비싸면 공식 사이트가 아니에요. 그리고 신청 후에는 환불이 안 돼요. 결과는 보통 금방 오지만, 최대 삼 영업일까지 걸릴 수 있으니 미리 신청하세요.' },
            tip: '결제해야 **신청 완료**. 카드·Apple Pay·Google Pay', mistake: '공식 금액은 1인 **£20**, 신청 후 환불 불가. 더 비싸면 공식 사이트 아님. 결과는 최대 3영업일.', bad: '£20보다 비싼 결제 화면', good: '£20 (GOV.UK)' },
      en: { label: 'Payment', speech: { tip: 'Next is payment, by card, Apple Pay or Google Pay. The video stops here.', mistake: 'Check the amount: twenty pounds per person. It may show in your local currency. Much more than that means you are not on the official site. There is no refund once you apply. Decisions are often quick, but allow up to three working days.' },
            tip: 'Pay to **finish the application**. Card, Apple Pay, Google Pay', mistake: 'The official fee is **£20** per person, no refund. More = not the official site. Allow up to 3 working days.', bad: 'more than £20', good: '£20 on GOV.UK' },
    }},

    // ---------- OUTRO (ticket) ----------
    { type: 'card', hold: 5000, card: {
      ko: { id: 'outro', speech: '끝났어요. 신청은 꼭 거브 점 유케이나 공식 앱에서만 하세요. 승인되면 이메일이 와요. 이 년 동안, 여권이 바뀌기 전까지 여러 번 쓸 수 있고, 한 번에 최대 육 개월까지 관광으로 머물 수 있어요. 다음 영상은 해외여행 이심 개통이에요. 설명란에 공식 링크 있습니다.',
            route, title: '끝. **신청은 GOV.UK에서만**', subtitle: '공식: gov.uk/eta · 1인 £20 · 유효 2년(여권 만료 시 함께 종료)',
            meta: [{ k: '설명란 1줄', v: '공식 사이트' }, { k: '설명란 2줄', v: 'eSIM' }, { k: '설명란 3줄', v: '공항 이동' }], stamp: '결제\n직전\n까지', flag: '🇬🇧',
            rightTitle: '다음 영상', rightText: '', next: ['📱 해외여행 eSIM 5분 개통', '🇺🇸 미국 ESTA 신청', '🔔 서식 바뀌면 최신판 알림'], brand: '▶ 따라하면 끝 · 입국신고서·비자' },
      en: { id: 'outro', speech: 'Done. Apply only on gov dot uk or the official app. When it is approved, you get an email. It works for two years, or until your passport changes, for as many trips as you like, with visits of up to six months each. Up next: a travel eSIM in five minutes. The official link is in the description.',
            route, title: 'Done. **Apply on GOV.UK only**', subtitle: 'Official: gov.uk/eta · £20 per person · valid 2 years (or until passport expiry)',
            meta: [{ k: 'LINE 1', v: 'Official site' }, { k: 'LINE 2', v: 'eSIM' }, { k: 'LINE 3', v: 'Transfer' }], stamp: 'STOP\nBEFORE\nPAYING', flag: '🇬🇧',
            rightTitle: 'Up next', rightText: '', next: ['📱 Travel eSIM in 5 min', '🇺🇸 US ESTA step by step', '🔔 Subscribe for updates'], brand: '▶ Copy My Screen' },
    }},
  ],
};
