// VJW — Visit Japan Web (Digital Agency, Japan): immigration (disembarkation card) + customs declaration → QR code
// Official (free) site: https://services.digital.go.jp/en/visit-japan-web/  (the app itself runs at vjw-lp.digital.go.jp)
//
// Facts used in the script (checked 2026-11, see the hand-off report for sources):
//  - Since 25 Jan 2024 (03:00 JST) immigration + customs share ONE QR code per traveller; codes made before that stopped working.
//  - Integrated "joint KIOSKs" (QR + IC passport read once for immigration and customs) started Apr 2025 at Haneda T2/T3,
//    Kansai T1 and Narita; other airports still scan at immigration and again at the customs e-Gate / terminal.
//  - Family members are added under the user's family details and then selected for the trip; each person still needs
//    their own immigration + customs registration and gets their own QR code (customs: every passenger scans at the gate).
//  - Code-share flights: enter the operating carrier's flight (official manual). Phone in Japan: digits only, no hyphens.
//  - Customs questions mirror Customs Form C No.5360 (prohibited/restricted, over allowance, commercial goods, items for
//    others; cash over JPY 1 million; unaccompanied baggage). Allowance for other goods: JPY 200,000 total.
//  - Registration is recommended at least ~6 hours before arrival; the QR can be shown offline / as a screenshot.
//
// ⚠ "live" selectors are best-effort guesses and MUST be verified against the real page before a live
//    recording (upload/verify-live.js captures the page and reports which selectors match). The real site needs a
//    signed-in account and is a multi-screen flow, so a live recording also needs livePre steps.
//    The "mock" target is ../mock/vjw-form.html, which mirrors the field set on one phone-width page.

const path = require('path');

// Sample traveller — obviously fake. Never use real personal data on camera.
const S = {
  surname: 'HONG',
  givenName: 'GILDONG',
  passport: 'M12345678',
  nationality: 'KOR',
  dob: '1990/05/15',
  passportExpiry: '2031/12/31',
  email: 'sample.traveller@example.com',
  arrival: '2026/12/20',
  airline: 'KE',
  flight: '703',
  hotel: 'SAMPLE HOTEL TOKYO',
  address: '1-1-1 NISHI-SHINJUKU, SHINJUKU-KU, TOKYO',
  phone: '0312345678',
  purpose: 'TOURISM',
};

const route = { from: 'ICN', fromCity: 'SEOUL', to: 'NRT', toCity: 'TOKYO' };

module.exports = {
  id: 'vjw',
  pack: 'arrival-card',
  country: { ko: '일본', en: 'Japan' }, flag: '🇯🇵',
  fee: '무료', when: '출국 전 (6시간 전까지 권장)', captcha: false,
  title: { ko: '일본 입국 비짓 재팬 웹 (Visit Japan Web)', en: 'Visit Japan Web (Japan arrival QR code)' },
  shortTitle: { ko: '비짓 재팬 웹', en: 'Visit Japan Web' },   // Shorts headline / title
  videoTitle: { ko: '비짓재팬웹 등록 방법 {year} | 일본 입국 QR 코드 7분 따라하기', en: 'Visit Japan Web Registration {year} | Japan Arrival QR Code | Copy My Screen' },

  url: {
    mock: 'file://' + path.join(__dirname, '..', 'mock', 'vjw-form.html'),
    live: 'https://services.digital.go.jp/en/visit-japan-web/',
  },

  selectors: {
    mock: {
      surname: '#surname', givenName: '#givenName', passport: '#passport', nationality: '#nationality', dob: '#dob', passportExpiry: '#passportExpiry',
      arrival: '#arrival', airline: '#airline', flight: '#flight', companion: '#companion', famRow: '#famRow',
      hotel: '#hotel', address: '#address', phone: '#phone', purpose: '#purpose',
      imm1No: '#imm1No', imm1Row: '#imm1Row', imm2No: '#imm2No', imm2Row: '#imm2Row', imm3No: '#imm3No', imm3Row: '#imm3Row',
      cus1No: '#cus1No', cus1Row: '#cus1Row', cus2No: '#cus2No', cus2Row: '#cus2Row', cus3No: '#cus3No', cus3Row: '#cus3Row',
      cus4No: '#cus4No', cus4Row: '#cus4Row', cashNo: '#cashNo', cashRow: '#cashRow', sepNo: '#sepNo', sepRow: '#sepRow',
      showQr: '#showQr',
    },
    // TODO verify on the real page before a live recording (node upload/verify-live.js vjw). The real flow is split
    //      over several screens behind a login (user info → planned entry → immigration → customs → QR), so one
    //      selector map will not match a single page; expect to add livePre navigation per section.
    live: {
      surname: 'input[name*="surname" i], input[name*="lastName" i]', givenName: 'input[name*="given" i], input[name*="firstName" i]',
      passport: 'input[name*="passport" i]', nationality: 'select[name*="national" i]', dob: 'input[name*="birth" i]',
      passportExpiry: 'input[name*="expir" i]', arrival: 'input[name*="arriv" i]', airline: 'select[name*="airline" i]',
      flight: 'input[name*="flight" i]', companion: 'input[type="checkbox"][name*="family" i]', famRow: 'fieldset:has(input[name*="family" i])',
      hotel: 'input[name*="hotel" i], input[name*="accommodation" i]', address: 'input[name*="address" i]', phone: 'input[type="tel"], input[name*="phone" i]',
      purpose: 'select[name*="purpose" i]',
      imm1Row: 'fieldset >> nth=0', imm1No: 'fieldset >> nth=0 >> input[type="radio"] >> nth=1',
      imm2Row: 'fieldset >> nth=1', imm2No: 'fieldset >> nth=1 >> input[type="radio"] >> nth=1',
      imm3Row: 'fieldset >> nth=2', imm3No: 'fieldset >> nth=2 >> input[type="radio"] >> nth=1',
      cus1Row: 'fieldset >> nth=0', cus1No: 'fieldset >> nth=0 >> input[type="radio"] >> nth=1',
      cus2Row: 'fieldset >> nth=1', cus2No: 'fieldset >> nth=1 >> input[type="radio"] >> nth=1',
      cus3Row: 'fieldset >> nth=2', cus3No: 'fieldset >> nth=2 >> input[type="radio"] >> nth=1',
      cus4Row: 'fieldset >> nth=3', cus4No: 'fieldset >> nth=3 >> input[type="radio"] >> nth=1',
      cashRow: 'fieldset >> nth=4', cashNo: 'fieldset >> nth=4 >> input[type="radio"] >> nth=1',
      sepRow: 'fieldset >> nth=5', sepNo: 'fieldset >> nth=5 >> input[type="radio"] >> nth=1',
      showQr: 'button:has-text("QR")',
    },
  },

  strings: {
    ko: { easyPill: '👀 화면 그대로 따라만 하세요', mistakeTitle: '⚠ 많이 틀리는 곳', pause: '⏸ 여기까지 입력하세요', pauseSub: '다 치고 나서 재생' },
    en: { easyPill: '👀 Just copy the screen', mistakeTitle: '⚠ Common mistake', pause: '⏸ Type this, then press play', pauseSub: '' },
  },

  steps: [
    // ---------- INTRO (ticket) ----------
    { type: 'card', hold: 4500, card: {
      ko: { id: 'intro', speech: '일본 가시죠? 비행기에서 종이 입국카드 쓰는 대신, 비짓 재팬 웹에 미리 등록하면 큐알 코드 하나로 입국 심사랑 세관을 지나갈 수 있어요. 무료고, 칠 분이면 끝나요. 화면 그대로 따라 치시면 되고, 많이 틀리는 곳에서는 제가 잠깐 멈출게요.',
            route, title: '비짓 재팬 웹,\n**화면 그대로 따라 하면 끝**', subtitle: '입국 심사 + 세관 신고를 미리 등록하고 QR 코드 받기. 틀리기 쉬운 곳에서 멈춥니다.',
            meta: [{ k: '소요', v: '7분' }, { k: '비용', v: '무료' }, { k: '등록', v: '출국 전' }, { k: '기준', v: '2026' }], stamp: '따라\n하면\n끝', flag: '🇯🇵',
            rightTitle: 'Visit Japan Web', rightText: '준비물: 여권 · 항공편 · 숙소 주소와 전화번호\n돈 내라는 사이트는 전부 가짜', brand: '▶ 따라하면 끝 · 입국신고서·비자' },
      en: { id: 'intro', speech: 'Flying to Japan? Instead of the paper card on the plane, you can register on Visit Japan Web before you go, and one QR code takes you through immigration and customs. It is free, and it takes about seven minutes. Copy what I type, and I will pause at the spots people usually get wrong.',
            route, title: 'Visit Japan Web,\n**copy the screen and you are done**', subtitle: 'Register immigration + customs in advance and get your QR code. We stop where people slip up.',
            meta: [{ k: 'TIME', v: '7 min' }, { k: 'FEE', v: 'Free' }, { k: 'WHEN', v: 'Before you fly' }, { k: 'YEAR', v: '2026' }], stamp: 'COPY\nMY\nSCREEN', flag: '🇯🇵',
            rightTitle: 'Visit Japan Web', rightText: 'Need: passport · flight · hotel address & phone\nAny site asking for money is fake', brand: '▶ Copy My Screen · Arrival Cards & Visas' },
    }},

    // ---------- 1. ACCOUNT + YOUR DETAILS ----------
    { type: 'card', hold: 3200, card: {
      ko: { id: 'account', speech: '먼저 계정이에요. 이메일이랑 비밀번호를 넣으면, 메일로 인증 코드가 와요. 그 코드를 넣으면 계정이 만들어져요. 그다음 내 정보, 그러니까 여권 정보를 넣어요. 카메라로 여권을 읽을 수도 있는데, 오늘은 직접 쳐 볼게요.',
            route, title: '1. 계정 만들고 **내 여권 정보**', subtitle: '이메일 → 인증 코드 → 여권 정보 등록', flag: '🛂', rightTitle: '1 / 4', rightText: '성 · 이름 · 여권번호\n국적 · 생년월일 · 만료일' },
      en: { id: 'account', speech: 'First, the account. Enter an email and a password, and a verification code arrives by email. Enter it, and your account is ready. Then your details, which means your passport. You can scan the passport with the camera, but today we will type it.',
            route, title: '1. Account and **your passport details**', subtitle: 'Email → verification code → passport details', flag: '🛂', rightTitle: '1 / 4', rightText: 'Surname · given name · passport no.\nnationality · birth date · expiry' },
    }},
    { type: 'type', field: 'surname', value: S.surname, text: {
      ko: { label: '성 (Surname)', speech: { tip: '성이에요. 비짓 재팬 웹은 성이랑 이름 칸이 따로 있어요. 성 칸에는 홍, 여권 영문 그대로요.', mistake: '여기서 많이 틀려요. 성 칸에 이름까지 다 넣거나, 성이랑 이름을 바꿔 넣는 경우요. 그리고 여권이랑 철자가 한 글자라도 다르면, 공항 기계에서 여권이랑 안 맞아서 결국 줄을 다시 서야 해요. 여권 사진면을 옆에 두고 똑같이 쳐 주세요.' },
            tip: '성 칸에는 **성만**, 여권 영문 그대로', mistake: '성·이름을 바꾸거나 한 칸에 몰아 쓰면 공항에서 **여권과 불일치**. 철자도 여권 그대로.', bad: 'HONG GILDONG (한 칸에)', good: 'HONG' },
      en: { label: 'Surname', speech: { tip: 'Surname. Visit Japan Web has separate boxes for surname and given name. Surname only, exactly as in your passport.', mistake: 'People slip here. They put the full name in one box, or swap surname and given name. If even one letter differs from your passport, the airport machine will not match it and you end up queuing again. Keep your passport photo page next to you.' },
            tip: '**Surname only**, exactly as in your passport', mistake: 'Swapped or merged names will **not match your passport** at the airport.', bad: 'HONG GILDONG (one box)', good: 'HONG' },
    }},
    { type: 'type', field: 'givenName', value: S.givenName, text: {
      ko: { label: '이름 (Given name)', speech: { tip: '이름 칸에는 길동. 여권에 띄어쓰기가 있으면 띄어쓰기도 그대로요.' }, tip: '여권 영문 이름 **그대로**' },
      en: { label: 'Given name', speech: { tip: 'Given name. If your passport has a space or a hyphen, keep it.' }, tip: 'Exactly as in your **passport**' },
    }},
    { type: 'type', field: 'passport', value: S.passport, text: {
      ko: { label: '여권번호', speech: { tip: '여권번호예요. 띄어쓰기 없이요.', mistake: '숫자 영이랑 영문 오, 숫자 일이랑 영문 아이가 헷갈려요. 그리고 여권을 새로 만드셨으면, 예전 여권번호가 남아 있지 않은지 꼭 확인하세요. 공항에서는 지금 들고 있는 여권이랑 맞아야 해요.' },
            tip: '**띄어쓰기 없이** 영문·숫자만', mistake: '0과 O, 1과 I 혼동. 여권을 새로 만들었다면 **새 여권번호**로 수정하세요.', bad: 'M 1234 5678', good: 'M12345678' },
      en: { label: 'Passport number', speech: { tip: 'Passport number, no spaces.', mistake: 'Zero and O, one and I, are easy to mix up. And if you renewed your passport, make sure the old number is not still saved. It has to match the passport you carry.' },
            tip: '**No spaces**', mistake: 'Zero vs O, one vs I. Renewed your passport? Update to the **new number**.', bad: 'M 1234 5678', good: 'M12345678' },
    }},
    { type: 'select', field: 'nationality', value: S.nationality, text: {
      ko: { label: '국적', speech: { tip: '국적은 여권을 발급한 나라예요. 한국 여권이면 코리아를 고르세요.' }, tip: '여권 **발급 국가**' },
      en: { label: 'Nationality', speech: { tip: 'Nationality is the country that issued your passport.' }, tip: 'The country that **issued your passport**' },
    }},
    { type: 'type', field: 'dob', value: S.dob, text: {
      ko: { label: '생년월일', speech: { tip: '생년월일이에요. 일본식으로 년, 월, 일 순서예요.' }, tip: '**년/월/일** 순서' },
      en: { label: 'Date of birth', speech: { tip: 'Date of birth. Japanese order, year, month, day.' }, tip: '**Year / month / day**' },
    }},
    { type: 'type', field: 'passportExpiry', value: S.passportExpiry, text: {
      ko: { label: '여권 만료일', speech: { tip: '여권 만료일이에요. 발급일 말고, 데이트 오브 익스파이어리, 만료일이요.' }, tip: '발급일 말고 **만료일**' },
      en: { label: 'Passport expiry', speech: { tip: 'Passport expiry. The date of expiry, not the issue date.' }, tip: 'The **expiry** date, not the issue date' },
    }},

    // ---------- 2. PLANNED ENTRY ----------
    { type: 'card', hold: 2800, card: {
      ko: { id: 'trip', speech: '이제 입국 예정 등록이에요. 언제, 어떤 비행기로, 어디서 묵는지요. 항공권이랑 숙소 예약서를 옆에 켜 두세요.', route, title: '2. 입국 예정 등록', subtitle: '항공권·숙소 예약 확인서를 옆에 두고 입력하세요', flag: '✈️', rightTitle: '2 / 4', rightText: '도착일 · 항공사 · 편명\n동반가족 · 숙소 · 전화번호' },
      en: { id: 'trip', speech: 'Now the planned entry. When, which flight, and where you stay. Keep your flight and hotel bookings open next to you.', route, title: '2. Planned entry', subtitle: 'Keep your flight and hotel bookings next to you', flag: '✈️', rightTitle: '2 / 4', rightText: 'Arrival · airline · flight\nfamily · stay · phone' },
    }},
    { type: 'type', field: 'arrival', value: S.arrival, text: {
      ko: { label: '일본 도착 예정일', speech: { tip: '일본에 내리는 날짜예요. 밤 비행기면 출발일 말고 도착일이요.' }, tip: '일본에 **내리는 날짜**' },
      en: { label: 'Arrival date in Japan', speech: { tip: 'The date you land in Japan. For an overnight flight, the arrival date.' }, tip: 'The date you **land in Japan**' },
    }},
    { type: 'select', field: 'airline', value: S.airline, text: {
      ko: { label: '항공사', speech: { tip: '항공사를 목록에서 골라요. 대한항공이면 케이이.' }, tip: '목록에서 **항공사** 선택' },
      en: { label: 'Airline', speech: { tip: 'Pick the airline from the list.' }, tip: 'Pick the **airline**' },
    }},
    { type: 'type', field: 'flight', value: S.flight, text: {
      ko: { label: '편명', speech: { tip: '편명이에요. 항공사는 위에서 골랐으니까, 여기는 번호만 칠공삼.', mistake: '공동운항편이 헷갈려요. 예약한 항공사 번호 말고, 실제로 비행기를 띄우는 항공사, 운항사 편명을 넣어야 해요. 예약서에 오퍼레이티드 바이라고 적힌 쪽이에요.' },
            tip: '항공사는 위에서 골랐으니 **번호만**', mistake: '공동운항편은 **실제 운항사**(Operated by) 편명을 넣습니다.', bad: '판매사 편명', good: 'Operated by 편명' },
      en: { label: 'Flight number', speech: { tip: 'Flight number. You already picked the airline, so just the number.', mistake: 'Code-share flights confuse people. Use the flight of the airline that actually operates it, the one after operated by on your booking.' },
            tip: 'Airline picked above, so **number only**', mistake: 'Code-share: use the **operating carrier**\'s flight.', bad: 'marketing flight no.', good: '"Operated by" flight no.' },
    }},
    { type: 'check', field: 'companion', hl: 'famRow', text: {
      ko: { label: '동반 가족', speech: { tip: '가족이랑 같이 가시면, 미리 등록해 둔 가족을 여기서 체크해요.', mistake: '여기서 많이 놓쳐요. 체크만 한다고 끝이 아니에요. 가족도 한 명씩, 입국 심사랑 세관 정보를 다 등록해야 하고, 큐알 코드도 사람마다 따로 나와요. 공항에서는 각자 자기 큐알을 보여줘야 해요. 아이 것도요.' },
            tip: '미리 등록한 **가족**을 체크', mistake: '체크만으로 끝이 아닙니다. 가족도 **한 명씩** 입국·세관 등록, QR도 **각자** 따로.', bad: '대표 1명 QR로 가족 전체', good: '가족 각자 QR' },
      en: { label: 'Family members', speech: { tip: 'Travelling with family? Tick the family members you registered in advance.', mistake: 'People miss this. Ticking the box is not the end. Each family member still needs their own immigration and customs details, and each gets their own QR code. At the airport, everyone shows their own code, kids too.' },
            tip: 'Tick your registered **family**', mistake: 'Ticking is not enough: each person needs **their own** registration and QR code.', bad: 'one QR for the whole family', good: 'one QR per person' },
    }},
    { type: 'type', field: 'hotel', value: S.hotel, text: {
      ko: { label: '숙소 이름', speech: { tip: '첫날 묵는 숙소 이름이에요. 예약서에 있는 영문 이름 그대로요.' }, tip: '첫날 숙소, 예약서의 **영문 이름**' },
      en: { label: 'Accommodation name', speech: { tip: 'Where you stay on the first night, as named on your booking.' }, tip: 'First night, as on your **booking**' },
    }},
    { type: 'type', field: 'address', value: S.address, text: {
      ko: { label: '숙소 주소', speech: { tip: '주소도 예약서에 있는 영문 주소를 그대로 옮겨 주세요. 도쿄라고만 쓰지 말고요.' }, tip: '예약서의 **영문 주소** 그대로' },
      en: { label: 'Address', speech: { tip: 'The address from your booking. Not just Tokyo, the full address.' }, tip: 'The **full address** from your booking' },
    }},
    { type: 'type', field: 'phone', value: S.phone, text: {
      ko: { label: '숙소 전화번호', speech: { tip: '숙소 전화번호예요. 하이픈 없이 숫자만, 공삼 일이삼사 오륙칠팔, 이렇게요.' }, tip: '하이픈 없이 **숫자만**' },
      en: { label: 'Phone number', speech: { tip: 'The hotel phone number, digits only, no hyphens.' }, tip: '**Digits only**, no hyphens' },
    }},

    // ---------- 3. IMMIGRATION (disembarkation card) ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'immigration', speech: '다음은 입국 심사 정보, 종이 입국카드에 쓰던 내용이에요. 질문은 세 개고, 사실대로 답하면 돼요.', route, title: '3. 입국 심사 정보', subtitle: '외국인 입국 기록 (종이 입국카드와 같은 내용)', flag: '🛬', rightTitle: '3 / 4', rightText: '방문 목적\n예 / 아니요 질문 3개' },
      en: { id: 'immigration', speech: 'Next, the immigration details, the same things as the paper disembarkation card. Three questions, answer them truthfully.', route, title: '3. Immigration', subtitle: 'Disembarkation card for foreigner', flag: '🛬', rightTitle: '3 / 4', rightText: 'Purpose of visit\n3 yes / no questions' },
    }},
    { type: 'select', field: 'purpose', value: S.purpose, text: {
      ko: { label: '방문 목적', speech: { tip: '방문 목적이에요. 여행이면 투어리즘.' }, tip: '여행이면 **TOURISM**' },
      en: { label: 'Purpose of visit', speech: { tip: 'Purpose of visit. Tourism for a holiday.' }, tip: '**TOURISM** for a holiday' },
    }},
    { type: 'radio', field: 'imm1No', hl: 'imm1Row', text: {
      ko: { label: '입국 질문 ①', speech: { tip: '일본에서 강제퇴거되거나, 입국을 거부당한 적이 있는지예요. 없으면 아니요.' }, tip: '강제퇴거·입국 거부 이력, **사실대로**' },
      en: { label: 'Immigration ①', speech: { tip: 'Have you ever been deported from Japan or denied entry? If not, no.' }, tip: 'Deportation or refusal history, **truthfully**' },
    }},
    { type: 'radio', field: 'imm2No', hl: 'imm2Row', text: {
      ko: { label: '입국 질문 ②', speech: { tip: '유죄 판결을 받은 적이 있는지예요. 일본만이 아니라 다른 나라 포함이에요.' }, tip: '유죄 판결 이력 (**일본 외 포함**)' },
      en: { label: 'Immigration ②', speech: { tip: 'Any criminal conviction, in any country, not only Japan.' }, tip: 'Convictions, **any country**' },
    }},
    { type: 'radio', field: 'imm3No', hl: 'imm3Row', text: {
      ko: { label: '입국 질문 ③', speech: { tip: '지금 마약, 총, 도검, 화약 같은 걸 갖고 있는지예요.' }, tip: '마약·총포·도검·화약 **소지 여부**' },
      en: { label: 'Immigration ③', speech: { tip: 'Are you carrying drugs, firearms, swords or explosives right now?' }, tip: 'Drugs, firearms, swords, explosives' },
    }},

    // ---------- 4. CUSTOMS ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'customs', speech: '마지막으로 세관 신고예요. 일본에 가지고 들어가는 물건 질문이에요. 대충 아니요만 누르지 말고, 하나씩 읽어 주세요.', route, title: '4. 세관 신고', subtitle: '질문을 하나씩 읽고 답하세요', flag: '🧳', rightTitle: '4 / 4', rightText: '금지 물품 · 면세 범위 · 상업용\n부탁받은 짐 · 현금 · 별송품' },
      en: { id: 'customs', speech: 'Last, the customs declaration. Questions about what you bring into Japan. Do not just tap no, read each one.', route, title: '4. Customs declaration', subtitle: 'Read each question before you answer', flag: '🧳', rightTitle: '4 / 4', rightText: 'Prohibited · allowance · commercial\nfor others · cash · sent separately' },
    }},
    { type: 'radio', field: 'cus1No', hl: 'cus1Row', text: {
      ko: { label: '세관 ① 금지·제한 물품', speech: { tip: '반입 금지나 제한 물품이에요. 마약, 총, 짝퉁 물건, 그리고 육포나 소시지 같은 고기 제품, 과일 같은 것도 여기 들어가요.' }, tip: '육포·소시지·과일 등 **축산물·식물**도 해당' },
      en: { label: 'Customs ① Prohibited', speech: { tip: 'Prohibited or restricted items. Drugs, guns, fake brand goods, and also meat products like jerky or sausage, and fresh fruit.' }, tip: 'Includes **meat products and plants**' },
    }},
    { type: 'radio', field: 'cus2No', hl: 'cus2Row', text: {
      ko: { label: '세관 ② 면세 범위 초과', speech: { tip: '면세 범위를 넘는 물건이 있는지예요.', mistake: '여기서 그냥 아니요 누르는 분이 많아요. 술, 담배, 향수는 따로 한도가 있고, 그 밖의 물건은 다 합쳐서 이십만 엔까지예요. 면세점에서 산 것, 선물도 포함이에요. 넘으면 예를 고르고 공항에서 세금을 내면 돼요. 그게 아니라고 했다가 걸리면 훨씬 곤란해요.' },
            tip: '술·담배·향수, 그 외 **합계 20만 엔**', mistake: '면세점 구매·선물도 **포함**. 넘으면 "예"로 신고하고 세금을 내면 됩니다.', bad: '읽지 않고 "아니요"', good: '한도 확인 후 답변' },
      en: { label: 'Customs ② Allowance', speech: { tip: 'Anything over the duty-free allowance?', mistake: 'Many people tap no without reading. Alcohol, tobacco and perfume have their own limits, and everything else adds up to two hundred thousand yen. Duty-free shopping and gifts count. If you are over, answer yes and pay the duty. Saying no and getting caught is far worse.' },
            tip: 'Alcohol, tobacco, perfume, others **JPY 200,000 total**', mistake: 'Duty-free buys and gifts **count**. Over? Answer yes and pay the duty.', bad: '"No" without reading', good: 'check the limits first' },
    }},
    { type: 'radio', field: 'cus3No', hl: 'cus3Row', text: {
      ko: { label: '세관 ③ 상업용 물품', speech: { tip: '팔려고 가져가는 물건이나 샘플이 있는지예요.' }, tip: '판매용 물건·**상품 샘플**' },
      en: { label: 'Customs ③ Commercial', speech: { tip: 'Commercial goods or samples you plan to sell.' }, tip: 'Goods for sale, **samples**' },
    }},
    { type: 'radio', field: 'cus4No', hl: 'cus4Row', text: {
      ko: { label: '세관 ④ 부탁받은 짐', speech: { tip: '남이 들어 달라고 부탁한 물건이 있는지예요. 내용물을 모르는 짐은 받지 마세요.' }, tip: '남이 맡긴 짐, **내용물 모르면 받지 않기**' },
      en: { label: 'Customs ④ For others', speech: { tip: 'Anything someone asked you to carry? Never carry a bag you have not checked.' }, tip: 'Items carried **for someone else**' },
    }},
    { type: 'radio', field: 'cashNo', hl: 'cashRow', text: {
      ko: { label: '현금 1백만 엔 초과', speech: { tip: '현금이나 수표가 백만 엔 넘게 있는지예요. 원화, 달러 다 합쳐서 계산해요.' }, tip: '현금·수표 등 **100만 엔 상당** 초과 여부' },
      en: { label: 'Cash over JPY 1 million', speech: { tip: 'Cash or cheques worth more than one million yen, all currencies added up.' }, tip: 'Cash etc. **over JPY 1 million**, all currencies' },
    }},
    { type: 'radio', field: 'sepNo', hl: 'sepRow', text: {
      ko: { label: '별송품', speech: { tip: '택배나 배로 따로 보낸 짐이 있는지예요. 없으면 아니요.' }, tip: '따로 부친 짐(**별송품**)이 있는지' },
      en: { label: 'Unaccompanied baggage', speech: { tip: 'Any baggage shipped separately to arrive later? If not, no.' }, tip: 'Bags **sent separately**' },
    }},

    // ---------- QR ----------
    { type: 'stop', field: 'showQr', tipHold: 3200, text: {
      ko: { label: 'QR 코드 표시', speech: { tip: '다 됐어요. 여기서 큐알 코드 표시를 누르면 큐알이 나와요. 입국 심사랑 세관, 큐알 하나로 같이 써요.', mistake: '공항 도착해서 와이파이로 하려는 분이 정말 많아요. 연결이 느리고, 줄은 길어지고요. 늦어도 도착 여섯 시간 전에는 끝내 두시고, 큐알은 캡처해 두세요. 정보를 고치면 큐알이 바뀌니까, 고친 다음에 다시 캡처하세요.' },
            tip: '입국 심사 + 세관 **QR 하나**로', mistake: '공항 와이파이로 막판 등록 금지. **6시간 전까지** 끝내고 QR은 **캡처**. 수정하면 다시 캡처.', bad: '도착 후 공항에서 등록', good: '출국 전 등록 + 캡처' },
      en: { label: 'Display QR code', speech: { tip: 'All done. Tap display QR code and your code appears. One QR code covers both immigration and customs.', mistake: 'So many people try this on airport wifi after landing. It is slow, and the queue grows. Finish at least six hours before you land, and screenshot the code. If you edit anything, take a fresh screenshot.' },
            tip: 'One QR for **immigration + customs**', mistake: 'Not on airport wifi at the last minute. Finish **6+ hours ahead** and **screenshot** it.', bad: 'register after landing', good: 'register early + screenshot' },
    }},

    // ---------- OUTRO (ticket) ----------
    { type: 'card', hold: 5000, card: {
      ko: { id: 'outro', speech: '끝났어요. 공항에 내리면 입국 심사에서 큐알이랑 여권을 보여주고, 세관에서도 같은 큐알을 찍으면 돼요. 하네다, 나리타, 간사이 같은 큰 공항은 키오스크에서 한 번에 찍는 곳도 있어요. 다음은 일본 이심 개통이랑 스이카 만들기예요. 설명란에 링크 있습니다.',
            route, title: '끝. **QR 캡처만 해 두세요**', subtitle: '입국 심사 + 세관, 같은 QR 하나. 가족은 각자 QR.',
            meta: [{ k: '설명란 1줄', v: '공식 사이트' }, { k: '설명란 2줄', v: 'eSIM' }, { k: '설명란 3줄', v: '교통카드' }], stamp: '등록\n완료', flag: '🇯🇵',
            rightTitle: '다음 영상', rightText: '', next: ['📱 일본 eSIM 5분 개통', '🚆 모바일 스이카 만들기', '🔔 서식 바뀌면 최신판 알림'], brand: '▶ 따라하면 끝 · 입국신고서·비자' },
      en: { id: 'outro', speech: 'Done. When you land, show the QR code and your passport at immigration, then scan the same code at customs. Big airports like Haneda, Narita and Kansai have kiosks that do both in one go. Next up: a Japan eSIM, and a mobile Suica card. Links are in the description.',
            route, title: 'Done. **Just screenshot your QR**', subtitle: 'One QR for immigration + customs. Every family member has their own.',
            meta: [{ k: 'LINE 1', v: 'Official site' }, { k: 'LINE 2', v: 'eSIM' }, { k: 'LINE 3', v: 'Transit card' }], stamp: 'QR\nREADY', flag: '🇯🇵',
            rightTitle: 'Up next', rightText: '', next: ['📱 Japan eSIM in 5 min', '🚆 Mobile Suica setup', '🔔 Subscribe for updates'], brand: '▶ Copy My Screen' },
    }},
  ],
};
