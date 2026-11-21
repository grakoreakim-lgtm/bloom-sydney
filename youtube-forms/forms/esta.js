// ESTA — United States Electronic System for Travel Authorization (CBP / DHS)
// Official site: https://esta.cbp.dhs.gov/  (also the official "ESTA Mobile" app by CBP)
// Fee: USD 40 from 2025-09-30 (H.R.1), inflation-adjusted to USD 40.27 on 2026-01-01 and USD 40.62 on 2026-10-16.
//      Re-check the fee on the official site before every upload — it is adjusted every fiscal year.
//
// ⚠ "live" selectors are best-effort guesses and MUST be verified against the real page before a live
//    recording (upload/verify-live.js captures the page and reports which selectors match).
//    The "mock" target is ../mock/esta-form.html, which mirrors the field set.
//    The recording never uploads a real passport, never solves the CAPTCHA, never pays.

const path = require('path');

// Sample traveller — obviously fake. Never use real personal data on camera.
const S = {
  familyName: 'HONG',
  givenName: 'GILDONG',
  email: 'sample.traveller@example.com',
  sex: 'M',
  dob: '15 MAY 1990',
  cityOfBirth: 'SEOUL',
  passport: 'M12345678',
  issuingCountry: 'KOR',
  passportExpiry: '31 DEC 2031',
  phone: '821012345678',
  pocName: 'SAMPLE HOTEL NEW YORK',
  usAddress: '123 EXAMPLE AVENUE, NEW YORK, NY 10001',
};

const route = { from: 'ICN', fromCity: 'SEOUL', to: 'JFK', toCity: 'NEW YORK' };

module.exports = {
  id: 'esta',
  pack: 'eta',
  country: { ko: '미국', en: 'USA' }, flag: '🇺🇸',
  fee: '40.62달러 (USD, 2026.10.16~)', when: '출국 72시간 전까지 권장', captcha: true,
  title: { ko: '미국 전자여행허가 (ESTA)', en: 'US Electronic System for Travel Authorization (ESTA)' },
  shortTitle: { ko: '미국 ESTA', en: 'US ESTA' },   // Shorts headline / title
  videoTitle: { ko: '미국 ESTA 신청 방법 {year} | 공식 사이트 화면 그대로 따라하기', en: 'How to Apply for ESTA {year} | Official Site Step-by-Step | Copy My Screen' },

  url: {
    mock: 'file://' + path.join(__dirname, '..', 'mock', 'esta-form.html'),
    live: 'https://esta.cbp.dhs.gov/',
  },

  selectors: {
    mock: {
      disclaimer: '#disclaimer', disclaimerBox: '#disclaimerBox', email: '#email', passportUpload: '#passportUpload', photoUpload: '#photoUpload',
      familyName: '#familyName', givenName: '#givenName', sex: '#sex', dob: '#dob', cityOfBirth: '#cityOfBirth',
      passport: '#passport', issuingCountry: '#issuingCountry', passportExpiry: '#passportExpiry',
      otherCitizenNo: '#otherCitizenNo', otherCitizenRow: '#otherCitizenRow', phone: '#phone',
      transitNo: '#transitNo', transitRow: '#transitRow', pocName: '#pocName', usAddress: '#usAddress',
      q1No: '#q1No', q1Row: '#q1Row', q9No: '#q9No', q9Row: '#q9Row', waiver: '#waiver', waiverBox: '#waiverBox',
      captcha: '#captcha', payNow: '#payNow',
    },
    // TODO verify on the real page before a live recording (node upload/verify-live.js esta)
    live: {
      disclaimer: 'input[type="checkbox"] >> nth=0', disclaimerBox: '.disclaimer, section >> nth=0',
      email: 'input[type="email"], input[name*="email" i]',
      passportUpload: 'button:has-text("Upload Passport"), input[type="file"] >> nth=0', photoUpload: 'button:has-text("Photo"), input[type="file"] >> nth=1',
      familyName: 'input[name*="family" i], input[name*="surname" i], input[name*="last" i]', givenName: 'input[name*="given" i], input[name*="first" i]',
      sex: 'select[name*="gender" i], select[name*="sex" i]', dob: 'select[name*="birth" i], input[name*="birth" i]', cityOfBirth: 'input[name*="city" i][name*="birth" i]',
      passport: 'input[name*="passport" i][name*="num" i], input[name*="passport" i]', issuingCountry: 'select[name*="issu" i]',
      passportExpiry: 'select[name*="expir" i], input[name*="expir" i]',
      otherCitizenRow: 'fieldset:has-text("citizen") >> nth=0', otherCitizenNo: 'fieldset:has-text("citizen") >> input[type="radio"][value*="N" i] >> nth=0',
      phone: 'input[type="tel"], input[name*="phone" i]',
      transitRow: 'fieldset:has-text("transit")', transitNo: 'fieldset:has-text("transit") >> input[type="radio"][value*="N" i]',
      pocName: 'input[name*="contact" i][name*="name" i]', usAddress: 'input[name*="address" i] >> nth=1',
      q1Row: 'fieldset >> nth=0', q1No: 'input[type="radio"][value*="N" i] >> nth=0', q9Row: 'fieldset >> nth=8', q9No: 'input[type="radio"][value*="N" i] >> nth=8',
      waiverBox: 'section:has-text("Waiver")', waiver: 'input[type="checkbox"] >> nth=-1',
      captcha: '#captcha, .g-recaptcha, iframe[title*="captcha" i]', payNow: 'button:has-text("Pay")',
    },
  },

  strings: {
    ko: { easyPill: '👀 화면 그대로 따라만 하세요', mistakeTitle: '⚠ 많이 틀리는 곳', pause: '⏸ 여기까지 입력하세요', pauseSub: '다 치고 나서 재생' },
    en: { easyPill: '👀 Just copy the screen', mistakeTitle: '⚠ Common mistake', pause: '⏸ Type this, then press play', pauseSub: '' },
  },

  steps: [
    // ---------- INTRO (ticket) ----------
    { type: 'card', hold: 5000, card: {
      ko: { id: 'intro', speech: '미국 가시죠? 한국 여권이면 비자 대신, 에스타라는 전자여행허가를 미리 받아야 해요. 공식 수수료는 사십 달러 조금 넘어요. 그런데 검색하면, 두세 배 받는 대행 사이트가 먼저 나와요. 오늘은 공식 사이트 화면 그대로, 결제 직전까지 같이 가 볼게요. 많이 틀리는 곳에서는 제가 잠깐 멈출게요.',
            route, title: '미국 ESTA,\n**화면 그대로 따라 하면 끝**', subtitle: '공식 사이트 신청 화면 그대로. 틀리기 쉬운 6곳에서 멈춥니다.',
            meta: [{ k: '소요', v: '15분' }, { k: '비용', v: '$40.62' }, { k: '신청', v: '출국 72시간 전' }, { k: '기준', v: '2026' }], stamp: '따라\n하면\n끝', flag: '🇺🇸',
            rightTitle: 'ESTA', rightText: '준비물: 여권 · 이메일 · 결제 카드 · 숙소 주소\n공식 주소는 esta.cbp.dhs.gov 하나뿐', brand: '▶ 따라하면 끝 · 입국신고서·비자' },
      en: { id: 'intro', speech: 'Flying to the US on a visa waiver passport? You need an ESTA, an electronic travel authorization, before you board. The official fee is just over forty dollars, but search results are full of agency sites charging two or three times that. Today we go through the official site, screen by screen, right up to the payment page. I will pause at the six spots people usually get wrong.',
            route, title: 'US ESTA,\n**copy the screen and you are done**', subtitle: 'The official application, step by step. We stop at the 6 spots people get wrong.',
            meta: [{ k: 'TIME', v: '15 min' }, { k: 'FEE', v: '$40.62' }, { k: 'WHEN', v: '72 h before' }, { k: 'YEAR', v: '2026' }], stamp: 'COPY\nMY\nSCREEN', flag: '🇺🇸',
            rightTitle: 'ESTA', rightText: 'Need: passport · email · card · US address\nThe only official site: esta.cbp.dhs.gov', brand: '▶ Copy My Screen · Arrival Cards & Visas' },
    }},

    // ---------- START ----------
    { type: 'check', field: 'disclaimer', hl: 'disclaimerBox', text: {
      ko: { label: '공식 사이트 · 안내 동의', speech: { tip: '첫 화면은 안내문 동의예요. 읽어 보시고 체크하면 돼요. 승인되면 이 년 동안, 여러 번 쓸 수 있어요.', mistake: '여기서 제일 많이 당해요. 주소창을 꼭 보세요. 이에스티에이 점 씨비피 점 디에이치에스 점 거브, 이게 유일한 공식 사이트예요. 비슷한 이름의 대행 사이트는 팔십 달러, 백 달러씩 받고, 그 돈은 미국 정부도 환불해 주지 않아요.' },
            tip: '안내문 읽고 **체크**', mistake: '공식 주소는 **esta.cbp.dhs.gov** 하나뿐. 대행 사이트는 수수료를 2~3배 받고, 정부가 환불해 주지 않습니다.', bad: 'esta-○○○.com (대행)', good: 'esta.cbp.dhs.gov' },
      en: { label: 'Official site · disclaimer', speech: { tip: 'The first page is the disclaimer. Read it and tick the box. Once approved, an ESTA is good for multiple trips.', mistake: 'This is where most people lose money. Check the address bar. esta dot cbp dot dhs dot gov is the only official site. Look-alike agency sites charge eighty or a hundred dollars, and CBP cannot refund what you paid them.' },
            tip: 'Read it, then **tick the box**', mistake: 'The only official site is **esta.cbp.dhs.gov**. Agency sites charge 2–3× and CBP cannot refund them.', bad: 'esta-something.com', good: 'esta.cbp.dhs.gov' },
    }},
    { type: 'type', field: 'email', value: S.email, text: {
      ko: { label: '이메일', speech: { tip: '이메일이에요. 여기로 인증 코드가 오고, 나중에 승인 결과도 와요. 지금 바로 열어볼 수 있는 메일로 적어 주세요.' }, tip: '인증 코드가 옵니다. **바로 열 수 있는 메일**로' },
      en: { label: 'Email', speech: { tip: 'Your email. A verification code arrives here, and later your result. Use an inbox you can open right now.' }, tip: 'A code is sent here. Use an inbox you can **open now**' },
    }},
    { type: 'manual', field: 'passportUpload', tipHold: 3200, text: {
      ko: { label: '여권 사진면 업로드', speech: { tip: '여권 사진이 있는 면을 찍어서 올려요. 글자를 읽어서 아래 칸을 자동으로 채워 줘요. 빛 반사 없이, 네 모서리가 다 나오게 찍으세요. 영상에서는 업로드하지 않을게요.' }, tip: '여권 **사진면** 업로드 → 자동 입력. 빛 반사 없이, 네 모서리 다 나오게' },
      en: { label: 'Upload passport', speech: { tip: 'Upload a photo of your passport photo page. The site reads it and pre-fills the fields below. No glare, all four corners visible. I will not upload one on camera.' }, tip: 'Upload the **photo page** → fields pre-fill. No glare, all four corners' },
    }},
    { type: 'manual', field: 'photoUpload', tipHold: 3200, text: {
      ko: { label: '얼굴 사진', speech: { tip: '다음은 얼굴 사진이에요. 방금 찍은 정면 사진으로요. 모자랑 선글라스는 벗고, 필터는 쓰지 마세요.' }, tip: '방금 찍은 **정면 얼굴 사진**. 모자·선글라스·필터 없이' },
      en: { label: 'Photo of your face', speech: { tip: 'Next, a photo of your face. A fresh, front-facing photo. No hat, no sunglasses, no filters.' }, tip: 'A fresh **front-facing photo**. No hat, sunglasses or filters' },
    }},

    // ---------- APPLICANT / PASSPORT ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'applicant', speech: '이제 여권 정보예요. 자동으로 채워졌어도, 한 칸씩 여권이랑 꼭 대조하세요.', route, title: '신청자 · 여권 정보', subtitle: '자동 입력돼도 여권과 한 칸씩 대조하세요', flag: '🛂', rightTitle: '1 / 3', rightText: '성 · 이름 · 성별 · 생년월일\n여권번호 · 발급국 · 만료일 · 다른 국적' },
      en: { id: 'applicant', speech: 'Now your passport details. Even if they were pre-filled, check every box against your passport.', route, title: 'Applicant & passport', subtitle: 'Even if pre-filled, check each box against your passport', flag: '🛂', rightTitle: '1 / 3', rightText: 'Names · gender · birth date\npassport no. · issuing country · expiry · other citizenship' },
    }},
    { type: 'type', field: 'familyName', value: S.familyName, text: {
      ko: { label: '성 (Family Name)', speech: { tip: '패밀리 네임, 성이에요. 홍길동이면 홍.', mistake: '성이랑 이름 칸을 바꿔 쓰는 분이 정말 많아요. 패밀리 네임이 성, 퍼스트 네임이 이름이에요. 여권 영문 철자 그대로 쓰세요. 바뀌면 공항에서 문제가 될 수 있어요.' },
            tip: 'Family Name = **성**', mistake: '성·이름 칸을 바꿔 쓰는 실수가 가장 흔합니다. 철자는 여권 영문 그대로.', bad: 'Family: GILDONG', good: 'Family: HONG' },
      en: { label: 'Family name', speech: { tip: 'Family name, that is your surname.', mistake: 'Swapping the family name and first name boxes is the most common slip. Family name is the surname. Copy the spelling exactly from your passport.' },
            tip: 'Family name = **surname**', mistake: 'Swapping surname and given name is the most common slip. Spell it exactly as in the passport.', bad: 'Family: GILDONG', good: 'Family: HONG' },
    }},
    { type: 'type', field: 'givenName', value: S.givenName, text: {
      ko: { label: '이름 (Given Name)', speech: { tip: '퍼스트 네임, 이름이에요. 길동. 여권에 붙어 있으면 붙여서, 띄어져 있으면 띄워서요.' }, tip: '여권에 적힌 **그대로** (붙임·띄움까지)' },
      en: { label: 'First (given) name', speech: { tip: 'First name, your given name, exactly as printed in the passport.' }, tip: 'Exactly as **printed in the passport**' },
    }},
    { type: 'select', field: 'sex', value: S.sex, text: {
      ko: { label: '성별', speech: { tip: '성별은 여권대로요.' }, tip: '여권에 적힌 대로' },
      en: { label: 'Gender', speech: { tip: 'Gender, as in your passport.' }, tip: 'As in your passport' },
    }},
    { type: 'type', field: 'dob', value: S.dob, text: {
      ko: { label: '생년월일', speech: { tip: '생년월일은 일, 월, 년 순서예요. 월은 영어 세 글자로 나와요. 오월이면 메이.' }, tip: '**일 → 월 → 년** 순서 (월은 영문 3글자)' },
      en: { label: 'Date of birth', speech: { tip: 'Date of birth, day, month, year.' }, tip: '**Day → month → year**' },
    }},
    { type: 'type', field: 'cityOfBirth', value: S.cityOfBirth, text: {
      ko: { label: '출생 도시', speech: { tip: '태어난 도시를 영어로 써요. 그 아래 출생 국가도 같이 골라 주세요.' }, tip: '태어난 도시 **영문으로**, 출생 국가도 선택' },
      en: { label: 'City of birth', speech: { tip: 'The city you were born in. Pick the country of birth right next to it too.' }, tip: 'Your **city of birth**, then the country' },
    }},
    { type: 'type', field: 'passport', value: S.passport, text: {
      ko: { label: '여권번호', speech: { tip: '여권번호예요. 띄어쓰기 없이요. 숫자 영이랑 영문 오가 헷갈리니까, 한 글자씩 확인하세요.' }, tip: '**띄어쓰기 없이**. 0과 O, 1과 I 주의' },
      en: { label: 'Passport number', speech: { tip: 'Passport number, no spaces. Zero and O are easy to mix up, so check each character.' }, tip: '**No spaces**. Watch 0 vs O, 1 vs I' },
    }},
    { type: 'select', field: 'issuingCountry', value: S.issuingCountry, text: {
      ko: { label: '여권 발급 국가', speech: { tip: '여권을 발급한 나라예요. 한국 여권이면 코리아, 리퍼블릭 오브, 사우스.', mistake: '목록에 코리아가 두 개 있어요. 알파벳 순서라 북한이 먼저 나와요. 데모크라틱 피플스 리퍼블릭, 노스를 고르면 안 돼요. 꼭 리퍼블릭 오브 코리아, 사우스예요. 그리고 발급 국가는 사는 나라가 아니라, 여권을 만든 나라예요.' },
            tip: '한국 여권 = **KOREA, REPUBLIC OF (SOUTH)**', mistake: '알파벳 순서라 북한(NORTH)이 먼저 나옵니다. 발급 국가 = 여권을 만든 나라(거주국 아님).', bad: "KOREA, DEMOCRATIC PEOPLE'S REP. (NORTH)", good: 'KOREA, REPUBLIC OF (SOUTH)' },
      en: { label: 'Issuing country', speech: { tip: 'The country that issued your passport.', mistake: 'Pick the country that issued the passport, not where you live. And watch look-alike entries. For example, there are two Koreas, and North Korea comes first alphabetically. A South Korean passport is Korea, Republic of, South.' },
            tip: 'The country that **issued the passport**', mistake: 'Not your country of residence. Watch look-alikes: North Korea is listed before South Korea.', bad: 'country you live in', good: 'country that issued the passport' },
    }},
    { type: 'type', field: 'passportExpiry', value: S.passportExpiry, text: {
      ko: { label: '여권 만료일', speech: { tip: '여권 만료일이에요. 발급일 말고, 익스파이레이션 데이트요.', mistake: '에스타는 이 년 동안 유효한데, 여권이 먼저 끝나면 그날 같이 끝나요. 그리고 여권을 새로 받으면, 에스타도 새로 신청해야 해요. 만료가 얼마 안 남았으면, 여권부터 바꾸고 신청하세요.' },
            tip: '발급일 말고 **만료일**', mistake: 'ESTA는 **2년 또는 여권 만료일 중 빠른 날**까지. 여권을 새로 받으면 ESTA도 다시 신청해야 합니다.', bad: '여권 갱신 후 기존 ESTA 사용', good: '새 여권 = 새 ESTA' },
      en: { label: 'Passport expiry', speech: { tip: 'Passport expiration date, not the issue date.', mistake: 'An ESTA lasts two years, or until your passport expires, whichever comes first. Get a new passport and you need a new ESTA. If your passport is close to expiry, renew it first, then apply.' },
            tip: 'The **expiry** date, not the issue date', mistake: 'Valid **2 years or until the passport expires**, whichever is first. New passport = new ESTA.', bad: 'old ESTA with new passport', good: 'new passport = new ESTA' },
    }},
    { type: 'radio', field: 'otherCitizenNo', hl: 'otherCitizenRow', text: {
      ko: { label: '다른 국적', speech: { tip: '지금이든 예전이든, 다른 나라 국적이 있었는지 묻는 거예요. 없으면 아니요. 이중국적이었거나 국적을 바꾼 적이 있으면, 꼭 예를 고르고 사실대로 적으세요.' }, tip: '현재·과거 **다른 국적** 여부. 있으면 사실대로' },
      en: { label: 'Other citizenship', speech: { tip: 'Are you now, or have you ever been, a citizen of another country? If not, no. If you hold or held another citizenship, answer yes and fill it in truthfully.' }, tip: 'Any **other citizenship**, now or ever. Be truthful' },
    }},
    { type: 'type', field: 'phone', value: S.phone, text: {
      ko: { label: '전화번호', speech: { tip: '연락처는 국가번호부터요. 한국은 팔십이, 그 다음 맨 앞 영을 빼고 일공으로 시작해요.' }, tip: '국가번호 82 + 맨 앞 **0 빼고**' },
      en: { label: 'Phone number', speech: { tip: 'Phone number with your country code, and drop the leading zero.' }, tip: 'Country code, then drop the **leading 0**' },
    }},

    // ---------- TRAVEL ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'travel', speech: '이제 여행 정보예요. 숙소 예약 확인서를 옆에 켜 두세요.', route, title: '여행 정보', subtitle: '숙소 예약 확인서를 옆에 두고 입력하세요', flag: '✈️', rightTitle: '2 / 3', rightText: '경유 여부 · 미국 내 연락처\n미국 체류 주소' },
      en: { id: 'travel', speech: 'Now the travel details. Keep your hotel booking open next to you.', route, title: 'Travel information', subtitle: 'Keep your hotel booking next to you', flag: '✈️', rightTitle: '2 / 3', rightText: 'Transit · US point of contact\naddress while in the US' },
    }},
    { type: 'radio', field: 'transitNo', hl: 'transitRow', text: {
      ko: { label: '경유 여부', speech: { tip: '미국을 거쳐 다른 나라로 가는 경유 여행인지 묻는 거예요. 미국이 목적지면 아니요.' }, tip: '미국이 목적지면 **No**' },
      en: { label: 'Transit', speech: { tip: 'Is the US just a transit stop on the way to another country? If the US is your destination, no.' }, tip: 'US is your destination → **No**' },
    }},
    { type: 'type', field: 'pocName', value: S.pocName, text: {
      ko: { label: '미국 내 연락처', speech: { tip: '미국에서 연락할 수 있는 곳이에요. 아는 사람이 없으면, 묵는 호텔 이름을 쓰셔도 돼요.' }, tip: '지인이 없으면 **호텔 이름**' },
      en: { label: 'US point of contact', speech: { tip: 'Someone you can be reached through in the US. No friends there? Your hotel works.' }, tip: 'No contact? Use your **hotel**' },
    }},
    { type: 'type', field: 'usAddress', value: S.usAddress, text: {
      ko: { label: '미국 체류 주소', speech: { tip: '미국에서 묵는 곳 주소예요. 예약 확인서의 영문 주소를 그대로 옮기고, 도시랑 주도 골라 주세요.' }, tip: '예약서의 **영문 주소** 그대로, 도시·주 선택' },
      en: { label: 'Address while in the US', speech: { tip: 'Where you stay in the US. Copy the address from your booking, then pick the city and state.' }, tip: 'Copy it from your **booking**, then city and state' },
    }},

    // ---------- ELIGIBILITY ----------
    { type: 'card', hold: 3000, card: {
      ko: { id: 'eligibility', speech: '이제 자격 질문 아홉 개예요. 여기는 대충 넘기면 안 돼요. 하나씩 끝까지 읽고 답하세요.', route, title: '자격 질문 9개', subtitle: '하나씩 끝까지 읽고, 사실대로 답하세요', flag: '❓', rightTitle: '3 / 3', rightText: '건강 · 범죄 · 마약 · 테러\n비자 거절 · 체류 초과 · 특정 국가 방문' },
      en: { id: 'eligibility', speech: 'Now the nine eligibility questions. Do not rush these. Read each one to the end, and answer truthfully.', route, title: '9 eligibility questions', subtitle: 'Read each to the end and answer truthfully', flag: '❓', rightTitle: '3 / 3', rightText: 'Health · crime · drugs · terrorism\nvisa refusal · overstay · travel to listed countries' },
    }},
    { type: 'radio', field: 'q1No', hl: 'q1Row', text: {
      ko: { label: '자격 질문 ①', speech: { tip: '첫 번째는 건강 질문이에요. 질문이 길어요. 끝까지 읽고 해당이 없으면 아니요. 나머지 질문도 이렇게, 하나씩 직접 답하세요.' }, tip: '긴 질문은 **끝까지 읽고** 답하기. 9개 모두 직접' },
      en: { label: 'Eligibility ①', speech: { tip: 'The first one is about health, and it is long. Read it to the end. If none of it applies, no. Answer the rest the same way, one by one.' }, tip: '**Read to the end**, then answer. All 9 yourself' },
    }},
    { type: 'radio', field: 'q9No', hl: 'q9Row', text: {
      ko: { label: '자격 질문 ⑨', speech: { tip: '아홉 번째는 방문 국가 질문이에요. 이천십일 년 삼월 이후에 이란, 이라크, 북한 같은 나라에 갔거나, 이천이십일 년 일월 이후에 쿠바에 갔는지 묻는 거예요.', mistake: '쿠바 여행을 다녀오신 분들이 여기서 많이 놓쳐요. 갔으면 사실대로 예예요. 그러면 에스타는 안 되고, 대사관에서 비자를 받아야 해요. 그리고 실수로 예를 누르면 거절될 수 있어요. 아홉 개 전부, 누르기 전에 한 번 더 보세요.' },
            tip: '2011.3 이후 이란·이라크·북한 등, **2021.1.12 이후 쿠바** 방문 여부', mistake: '방문했다면 사실대로 Yes → ESTA 불가, 비자 신청. 실수로 Yes를 누르면 거절될 수 있으니 9개 모두 재확인.', bad: '쿠바 여행 숨기기 / 실수로 Yes', good: '사실대로, 한 번 더 확인' },
      en: { label: 'Eligibility ⑨', speech: { tip: 'Question nine is about travel. Have you been to Iran, Iraq, North Korea and the other listed countries since March twenty eleven, or to Cuba since January twelfth, twenty twenty one?', mistake: 'People who holidayed in Cuba often miss this. If you went, answer yes. You will then need a visa from the embassy instead. And a yes clicked by accident can get you refused, so re-check all nine before moving on.' },
            tip: 'Listed countries since **Mar 2011**, **Cuba since 12 Jan 2021**', mistake: 'If yes, answer yes: you will need a visa instead. An accidental "Yes" can get you refused, so re-check all 9.', bad: 'hiding a Cuba trip / misclicked Yes', good: 'truthful, double-checked' },
    }},

    // ---------- CERTIFY · REVIEW · PAY ----------
    { type: 'check', field: 'waiver', hl: 'waiverBox', text: {
      ko: { label: '서약 · 권리 포기', speech: { tip: '마지막 서약이에요. 입력한 내용이 사실이라는 것, 그리고 입국 심사 결정에 이의를 제기하지 않는다는 내용이에요. 읽고 체크하세요.' }, tip: '내용 확인 후 **체크**' },
      en: { label: 'Certification & waiver', speech: { tip: 'The final certification. Your answers are true, and you waive the right to appeal an admission decision. Read it and tick the box.' }, tip: 'Read it, then **tick the box**' },
    }},
    { type: 'manual', field: 'captcha', tipHold: 3000, text: {
      ko: { label: '보안 확인', speech: { tip: '보안 확인은 직접 하셔야 해요. 영상에서는 넘어갈게요.' }, tip: '보안 확인은 **직접** 입력합니다' },
      en: { label: 'Security check', speech: { tip: 'The security check has to be done by you. I will skip it here.' }, tip: 'Do the security check **yourself**' },
    }},
    { type: 'stop', field: 'payNow', tipHold: 3400, text: {
      ko: { label: '검토 · 결제', speech: { tip: '검토 화면에서 전체 내용을 다시 확인하고, 결제로 넘어가요. 영상은 여기서 멈출게요.', mistake: '결제 금액이 한 사람에 사십 달러 육십이 센트인지 보세요. 이게 공식 금액이에요. 팔십, 백 달러가 나오면 공식 사이트가 아니에요. 그리고 결제까지 해야 신청이 끝나요. 보통 금방 결과가 나오지만, 최대 칠십이 시간까지 걸릴 수 있어요.' },
            tip: '검토 후 결제 → 결제해야 **신청 완료**', mistake: '공식 금액은 1인 **USD 40.62**. 그보다 비싸면 공식 사이트가 아닙니다. 결과는 최대 72시간.', bad: '$80~$100 결제 화면', good: 'USD 40.62' },
      en: { label: 'Review & payment', speech: { tip: 'Review everything once more, then continue to payment. The video stops here.', mistake: 'Check the amount: forty dollars sixty two per person is the official fee. If it says eighty or a hundred, you are not on the official site. Your application only counts once it is paid. Most answers come quickly, but it can take up to seventy two hours.' },
            tip: 'Review, then pay. **Not submitted until paid**', mistake: 'The official fee is **USD 40.62** per person. More than that = not the official site. Decision within 72 h.', bad: '$80–$100 checkout', good: 'USD 40.62' },
    }},

    // ---------- OUTRO (ticket) ----------
    { type: 'card', hold: 5000, card: {
      ko: { id: 'outro', speech: '끝났어요. 결제는 꼭 공식 사이트, 이에스티에이 점 씨비피 점 디에이치에스 점 거브에서만 하세요. 승인되면 이메일이 오는데, 신청번호랑 같이 캡처해 두세요. 이 년 동안, 여권이 바뀌기 전까지 계속 쓸 수 있어요. 다음 영상은 미국 이심 개통이에요. 설명란에 공식 링크 있습니다.',
            route, title: '끝. **결제는 공식 사이트에서만**', subtitle: '공식: esta.cbp.dhs.gov · 1인 USD 40.62 · 유효 2년(여권 만료 시 함께 종료)',
            meta: [{ k: '설명란 1줄', v: '공식 사이트' }, { k: '설명란 2줄', v: 'eSIM' }, { k: '설명란 3줄', v: '공항 이동' }], stamp: '결제\n직전\n까지', flag: '🇺🇸',
            rightTitle: '다음 영상', rightText: '', next: ['📱 미국 eSIM 5분 개통', '🛂 ESTA 승인 확인·조회 방법', '🔔 서식 바뀌면 최신판 알림'], brand: '▶ 따라하면 끝 · 입국신고서·비자' },
      en: { id: 'outro', speech: 'Done. Pay only on the official site, esta dot cbp dot dhs dot gov. When it is approved, save the email and your application number. It is good for two years, or until your passport changes. Up next: a US eSIM in five minutes. The official link is in the description.',
            route, title: 'Done. **Pay on the official site only**', subtitle: 'Official: esta.cbp.dhs.gov · USD 40.62 per person · valid 2 years (or until passport expiry)',
            meta: [{ k: 'LINE 1', v: 'Official site' }, { k: 'LINE 2', v: 'eSIM' }, { k: 'LINE 3', v: 'Transfer' }], stamp: 'STOP\nBEFORE\nPAYING', flag: '🇺🇸',
            rightTitle: 'Up next', rightText: '', next: ['📱 US eSIM in 5 min', '🛂 Check your ESTA status', '🔔 Subscribe for updates'], brand: '▶ Copy My Screen' },
    }},
  ],
};
