// China Online Arrival Card (外国人入境卡网上填报) — National Immigration Administration (NIA, 国家移民管理局)
// Official (free) site: https://s.nia.gov.cn/ArrivalCardFillingPC/
//   other official channels: NIA website, the "NIA 12367" (移民局12367) app, WeChat / Alipay mini-programs.
//
// Sources (Nov 2026; official pages could not be opened from the build sandbox, facts taken from search results
// quoting these official notices):
//   - NIA notice on online arrival card filling for foreigners, effective 20 Nov 2025, as re-posted by Chinese
//     embassies/consulates (e.g. us.china-embassy.gov.cn …/t20251203_11765336.htm,
//     ni.china-embassy.gov.cn …/t20251128_11762194.htm, kz.china-embassy.gov.cn …/t20251127_11761861.htm,
//     chicago.china-consulate.gov.cn …/t20251204_11767048.htm, penang.china-consulate.gov.cn …/t20251127_11761828.htm)
//   - NIA warning "Beware of Fraudulent Websites for Arrival Card Filling" (en.nia.gov.cn …/c191530/content.html):
//     the service is free of charge; use only the official URL or official QR code.
//   - NIA article (nia.gov.cn …/c1785474/content.html): after filing, the system makes a unique electronic QR code;
//     at the border check officers get the card data automatically or by scanning the QR code.
// Confirmed (official): free; applies to foreigners entering at all open ports since 20 Nov 2025; can be filed before
//   travel online; if not filed, it can be done at the port (scan a QR code / on-site machines) or on a paper card;
//   7 exempt groups (e.g. Foreign Permanent Resident ID holders, group visa / group visa-free, 24-hour direct transit
//   without leaving the port area, cruise passengers returning on the same ship, fast-track lanes, transport crew).
//
// NOT confirmed (kept out of the narration or said cautiously):
//   - the filing window (how many hours before arrival). Travel guides say "up to 72 hours" or "24 hours"; no official
//     notice found states a limit. The calendar row says "도착 72시간 전" — not repeated in the narration.
//   - the exact English field labels and their order on the real page (this practice page follows travel-guide
//     descriptions: name, gender, date of birth, citizenship, ID type/number, visa, entry date, flight, purpose,
//     address in China). A passport-scan (OCR) option is reported by some guides — not shown here.
//   - whether the real page has a declaration tick box and a text verification code (shown here as typical; the
//     recording never fills the code and never presses Submit).
//   - the exact "visa" field form (yes/no vs list) and whether Korean passport holders are visa-free on a given date.
//
// ⚠ "live" selectors are placeholders and MUST be verified against the real page before a live recording
//    (upload/verify-live.js). The "mock" target is ../mock/china-arrival-form.html.

const path = require('path');

// Sample traveller — obviously fake. Never use real personal data on camera.
const S = {
  lastName: 'HONG',
  firstName: 'GILDONG',
  gender: 'MALE',
  dob: '1990-05-15',
  nationality: 'KOR',
  docType: 'PASSPORT',
  passport: 'M12345678',
  visaType: 'VISA-FREE',
  entryDate: '2026-12-20',
  flight: 'MU1234',                      // sample flight number
  purpose: 'TOURISM',
  province: 'SHANGHAI',
  city: 'HUANGPU DISTRICT',
  address: 'SAMPLE HOTEL SHANGHAI, 88 SAMPLE ROAD',   // fictional hotel
};

const route = { from: 'ICN', fromCity: 'SEOUL', to: 'PVG', toCity: 'SHANGHAI' };

module.exports = {
  id: 'china-arrival',
  pack: 'arrival-card',
  country: { ko: '중국', en: 'China' }, flag: '🇨🇳',
  fee: '무료', when: '입국 전 (출발 전 권장)', captcha: true,
  title: { ko: '중국 온라인 입국신고서', en: 'China Online Arrival Card' },
  shortTitle: { ko: '중국 입국신고서', en: 'China Arrival Card' },
  videoTitle: { ko: '중국 온라인 입국신고서 작성법 {year} | 화면 그대로 따라하기', en: 'China Online Arrival Card Step-by-Step {year} | Copy My Screen' },

  url: {
    mock: 'file://' + path.join(__dirname, '..', 'mock', 'china-arrival-form.html'),
    live: 'https://s.nia.gov.cn/ArrivalCardFillingPC/',
  },

  selectors: {
    mock: {
      lastName: '#lastName', firstName: '#firstName', gender: '#gender', dob: '#dob', nationality: '#nationality',
      docType: '#docType', passport: '#passport', visaType: '#visaType', visaNo: '#visaNo',
      entryDate: '#entryDate', flight: '#flight', purpose: '#purpose',
      province: '#province', city: '#city', address: '#address',
      declare: '#declare', declareRow: '#declareRow', captcha: '#captcha', submit: '#submit',
    },
    // TODO verify on the real page before a live recording — placeholders only
    live: {
      lastName: 'input[name*="surname" i], input[name*="last" i]',
      firstName: 'input[name*="given" i], input[name*="first" i]',
      gender: '[name*="gender" i], [name*="sex" i]',
      dob: 'input[name*="birth" i]',
      nationality: '[name*="national" i], [name*="country" i]',
      docType: '[name*="docType" i], [name*="certType" i]',
      passport: 'input[name*="passport" i], input[name*="certNo" i]',
      visaType: '[name*="visa" i]',
      visaNo: 'input[name*="visaNo" i]',
      entryDate: 'input[name*="entry" i][name*="date" i], input[name*="arriv" i]',
      flight: 'input[name*="flight" i]',
      purpose: '[name*="purpose" i], [name*="reason" i]',
      province: '[name*="province" i]',
      city: '[name*="city" i]',
      address: 'input[name*="address" i], textarea[name*="address" i]',
      declare: 'input[type="checkbox"]',
      declareRow: 'input[type="checkbox"] >> xpath=..',
      captcha: 'img[src*="captcha" i] >> xpath=..',
      submit: 'button[type="submit"], button:has-text("Submit")',
    },
  },

  strings: {
    ko: { easyPill: '👀 화면 그대로 따라만 하세요', mistakeTitle: '⚠ 많이 틀리는 곳', pause: '⏸ 여기까지 입력하세요', pauseSub: '다 치고 나서 재생' },
    en: { easyPill: '👀 Just copy the screen', mistakeTitle: '⚠ Common mistake', pause: '⏸ Type this, then press play', pauseSub: '' },
  },

  steps: [
    // ---------- INTRO (ticket) ----------
    { type: 'card', hold: 4500, card: {
      ko: { id: 'intro', speech: '중국 가시죠? 이제 입국신고서는 비행기 타기 전에 휴대폰으로 미리 내고, 공항에서는 큐알 코드만 보여 주면 돼요. 공식 사이트는 무료니까, 화면 그대로 따라 치세요. 돈 내라는 사이트는 공식이 아니에요. 많이 틀리는 곳에서는 제가 잠깐 멈출게요.',
            route, title: '중국 입국신고서,\n**화면 그대로 따라 하면 끝**', subtitle: '온라인 입국카드 순서 그대로. 틀리기 쉬운 곳에서 멈춥니다.',
            meta: [{ k: '소요', v: '5분' }, { k: '비용', v: '무료' }, { k: '제출', v: '출발 전 미리' }, { k: '기준', v: '2026' }], stamp: '따라\n하면\n끝', flag: '🇨🇳',
            rightTitle: 'China Online Arrival Card', rightText: '준비물: 여권 · 항공편 · 첫날 숙소 주소\n공식: s.nia.gov.cn (무료)', brand: '▶ 따라하면 끝 · 입국신고서·비자' },
      en: { id: 'intro', speech: 'Flying to China? You can now file your arrival card online before you fly, and at the airport you just show the QR code. The official site is free, so copy what I type. Any site asking for money is not the official one. I will pause at the spots people usually get wrong.',
            route, title: 'China Arrival Card,\n**copy the screen and you are done**', subtitle: 'The online arrival card, in order. We stop at the spots people get wrong.',
            meta: [{ k: 'TIME', v: '5 min' }, { k: 'FEE', v: 'Free' }, { k: 'WHEN', v: 'Before you fly' }, { k: 'YEAR', v: '2026' }], stamp: 'COPY\nMY\nSCREEN', flag: '🇨🇳',
            rightTitle: 'China Online Arrival Card', rightText: 'Need: passport · flight · first-night address\nOfficial: s.nia.gov.cn (free)', brand: '▶ Copy My Screen · Arrival Cards & Visas' },
    }},

    // ---------- PERSONAL ----------
    { type: 'type', field: 'lastName', value: S.lastName, text: {
      ko: { label: '성 (Last Name)', speech: { tip: '먼저 이름이에요. 성이랑 이름 칸이 따로 있어요. 첫 칸 라스트 네임에는 성만 쳐요. 홍.', mistake: '여기서 많이 틀려요. 성 칸에 홍길동을 통째로 넣거나, 성이랑 이름을 바꿔 넣는 거예요. 성 칸에는 홍, 이름 칸에는 길동. 여권 영문 철자 그대로 쳐야 공항에서 안 막혀요.' },
            tip: '**성만** 입력 (여권 Surname 그대로)', mistake: '성·이름을 한 칸에 몰아 쓰거나 순서를 바꾸면 안 됩니다. **여권 철자 그대로.**', bad: 'HONG GILDONG (한 칸에)', good: 'HONG / GILDONG' },
      en: { label: 'Last name', speech: { tip: 'First, your name. There are separate boxes for last name and first name. The first box takes your last name only.', mistake: 'This is where people slip. Do not put your whole name in one box, and do not swap the two. Last name here, first name in the next box, spelled exactly as in your passport.' },
            tip: '**Last name only**, as in your passport', mistake: 'Do not put your full name in one box or swap the order. **Spell it exactly as in your passport.**', bad: 'HONG GILDONG (one box)', good: 'HONG / GILDONG' },
    }},
    { type: 'type', field: 'firstName', value: S.firstName, text: {
      ko: { label: '이름 (First Name)', speech: { tip: '퍼스트 네임에는 이름이요. 길동. 여권 영문 철자 그대로, 띄어쓰기 없이요.' }, tip: '이름(Given names)만, **여권 철자 그대로**' },
      en: { label: 'First name', speech: { tip: 'First name here, spelled exactly as in your passport.' }, tip: 'Given names, **exactly as in your passport**' },
    }},
    { type: 'select', field: 'gender', value: S.gender, text: {
      ko: { label: '성별', speech: { tip: '성별은 여권대로 고르세요.' }, tip: '여권에 적힌 대로' },
      en: { label: 'Gender', speech: { tip: 'Gender, as in your passport.' }, tip: 'As in your passport' },
    }},
    { type: 'type', field: 'dob', value: S.dob, text: {
      ko: { label: '생년월일', speech: { tip: '생년월일이에요. 년, 월, 일 순서로 넣어요. 천구백구십 년 오월 십오일이면 이렇게요.', mistake: '점이나 빗금 말고 하이픈으로 나누고, 월이랑 일은 꼭 두 자리로 쓰세요. 오월이면 영오. 실제 화면에서는 달력에서 고르는 경우도 있어요.' },
            tip: '**년-월-일** 순서 (YYYY-MM-DD)', mistake: '월·일은 **두 자리**로. 점(.)이나 빗금(/) 대신 하이픈(-).', bad: '1990.5.15', good: '1990-05-15' },
      en: { label: 'Date of birth', speech: { tip: 'Date of birth, year first, then month, then day.', mistake: 'Many people type day first out of habit. This box wants year, month, day, with two digits for month and day. On the real page you may pick it from a calendar instead.' },
            tip: '**Year-month-day** (YYYY-MM-DD)', mistake: 'Year first, and **two digits** for month and day.', bad: '15/05/1990', good: '1990-05-15' },
    }},
    { type: 'select', field: 'nationality', value: S.nationality, text: {
      ko: { label: '국적', speech: { tip: '국적은 여권을 발급한 나라예요. 한국은 코리아, 리퍼블릭 오브.' }, tip: '한국은 **KOREA, REPUBLIC OF**' },
      en: { label: 'Citizenship', speech: { tip: 'Citizenship is the country that issued your passport.' }, tip: 'The country that **issued your passport**' },
    }},
    { type: 'select', field: 'docType', value: S.docType, text: {
      ko: { label: '신분증 종류', speech: { tip: '신분증 종류는 여권, 패스포트를 고르세요.' }, tip: '**PASSPORT** 선택' },
      en: { label: 'Type of ID document', speech: { tip: 'Type of ID document. Pick passport.' }, tip: 'Pick **PASSPORT**' },
    }},
    { type: 'type', field: 'passport', value: S.passport, text: {
      ko: { label: '여권번호', speech: { tip: '아이디 넘버 칸에 여권번호를 띄어쓰기 없이 쳐요.', mistake: '숫자 영이랑 영문 오를 헷갈리는 분이 많아요. 그리고 여권을 새로 만들었으면 옛날 번호 말고, 이번에 들고 가는 여권 번호를 넣으세요. 공항에서 찍는 여권이랑 번호가 달라지면 안 돼요.' },
            tip: '**띄어쓰기 없이** 여권번호', mistake: '0과 O 구분. 여권을 새로 만들었다면 **들고 가는 여권** 번호로.', bad: 'M 1234 5678 / 옛 여권', good: 'M12345678' },
      en: { label: 'ID number', speech: { tip: 'In the ID number box, type your passport number with no spaces.', mistake: 'Watch zero versus the letter O. And if you renewed your passport, use the number of the passport you will actually carry, not the old one.' },
            tip: 'Passport number, **no spaces**', mistake: 'Zero vs O. Renewed passport? Use **the one you will carry**.', bad: 'M 1234 5678 / old passport', good: 'M12345678' },
    }},

    // ---------- VISA ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'visa', speech: '다음은 비자 정보예요.', route, title: '비자 정보', subtitle: '무비자인지, 비자가 있는지 고릅니다', flag: '🛂', rightTitle: '2 / 5', rightText: '비자 / 무비자\n비자 번호' },
      en: { id: 'visa', speech: 'Next, your visa details.', route, title: 'Visa details', subtitle: 'Visa-free, or a Chinese visa', flag: '🛂', rightTitle: '2 / 5', rightText: 'Visa / visa-free\nvisa number' },
    }},
    { type: 'select', field: 'visaType', value: S.visaType, text: {
      ko: { label: '비자 / 무비자', speech: { tip: '무비자로 들어가면 무비자 항목을 고르고, 비자 번호 칸은 비워 둬요. 중국 비자가 있으면 비자를 고르고 비자에 적힌 번호를 넣으세요.', mistake: '무비자 대상인지, 머무는 기간이 허용 범위 안인지는 이 서식이 대신 알려 주지 않아요. 무비자 조건은 바뀔 수 있으니까, 출발 전에 중국 대사관 안내로 꼭 확인하세요.' },
            tip: '무비자면 **VISA-FREE**, 비자 번호는 비워 둠', mistake: '무비자 조건(대상·기간)은 바뀔 수 있음 → **출발 전 중국 대사관 안내 확인**', bad: '조건 확인 없이 무비자 선택', good: '대사관 안내 확인 후 선택' },
      en: { label: 'Visa / entry permit', speech: { tip: 'Entering visa-free? Pick visa-free entry and leave the visa number empty. With a Chinese visa, pick visa and type the number printed on it.', mistake: 'This form does not check whether you really qualify for visa-free entry, or for how long. The rules depend on your passport and can change, so check the Chinese embassy notice before you fly.' },
            tip: 'Visa-free? Pick **VISA-FREE**, leave the number empty', mistake: 'Visa-free rules depend on your passport and can change: **check the embassy notice** first.', bad: 'guessing you are visa-free', good: 'checked the embassy notice' },
    }},

    // ---------- TRIP ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'trip', speech: '이제 여행 정보예요. 항공권 예약 확인서를 옆에 켜 두세요.', route, title: '여행 정보', subtitle: '항공권 예약 확인서를 옆에 두고 입력하세요', flag: '✈️', rightTitle: '3 / 5', rightText: '입국일 · 항공편\n방문 목적' },
      en: { id: 'trip', speech: 'Now the trip details. Keep your flight booking open next to you.', route, title: 'Trip details', subtitle: 'Keep your flight booking next to you', flag: '✈️', rightTitle: '3 / 5', rightText: 'Entry date · flight\npurpose of visit' },
    }},
    { type: 'type', field: 'entryDate', value: S.entryDate, text: {
      ko: { label: '입국일', speech: { tip: '중국에 내리는 날짜예요. 밤 비행기면 출발일 말고, 현지에 도착하는 날짜로 넣으세요.' }, tip: '중국에 **내리는 날짜** (출발일 아님)' },
      en: { label: 'Date of entry', speech: { tip: 'The date you land in China. For an overnight flight, use the local arrival date, not the departure date.' }, tip: 'The date you **land** (not departure)' },
    }},
    { type: 'type', field: 'flight', value: S.flight, text: {
      ko: { label: '항공편명', speech: { tip: '항공편명은 항공사 코드랑 번호를 붙여서요. 엠유 일이삼사.', mistake: '경유하면 여기서 많이 틀려요. 처음 탄 비행기 말고, 중국에 실제로 내리는 비행기 편명을 넣어야 해요. 예약 번호를 넣는 분도 있는데, 예약 번호가 아니라 편명이에요.' },
            tip: '코드+번호 **붙여서**', mistake: '경유 시 **중국에 내리는 편명**. 예약번호(PNR) 아님.', bad: '첫 구간 편명 / 예약번호', good: '중국 도착 편명 (MU1234)' },
      en: { label: 'Arrival flight number', speech: { tip: 'Airline code and number, no space.', mistake: 'With a connection, people often type the first flight. Use the flight that actually lands in China. And it is the flight number, not your booking reference.' },
            tip: 'Code + number, **no space**', mistake: 'Connecting? Use **the flight that lands in China**. Not your booking code.', bad: 'first leg / booking code', good: 'flight into China (MU1234)' },
    }},
    { type: 'select', field: 'purpose', value: S.purpose, text: {
      ko: { label: '방문 목적', speech: { tip: '방문 목적이에요. 관광이면 투어리즘을 고르세요.' }, tip: '관광은 **TOURISM**' },
      en: { label: 'Purpose of visit', speech: { tip: 'Purpose of visit. Tourism for a holiday.' }, tip: '**TOURISM** for a holiday' },
    }},

    // ---------- ADDRESS ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'stay', speech: '다음은 중국 숙소 주소예요. 첫날 묵는 호텔 예약서를 열어 두세요.', route, title: '중국 숙소 주소', subtitle: '첫날 묵는 숙소 예약서를 옆에 두세요', flag: '🏨', rightTitle: '4 / 5', rightText: '성(Province) · 도시/구\n상세 주소' },
      en: { id: 'stay', speech: 'Next, your address in China. Open the booking for your first night.', route, title: 'Address in China', subtitle: 'Keep your first-night booking next to you', flag: '🏨', rightTitle: '4 / 5', rightText: 'Province · city/district\ndetailed address' },
    }},
    { type: 'select', field: 'province', value: S.province, text: {
      ko: { label: '성 (Province)', speech: { tip: '숙소가 있는 지역이에요. 상하이나 베이징은 목록에 그 이름 그대로 있어요.' }, tip: '숙소가 있는 **성·직할시**' },
      en: { label: 'Province', speech: { tip: 'The province your hotel is in. Shanghai and Beijing are listed under their own names.' }, tip: 'The **province** of your hotel' },
    }},
    { type: 'select', field: 'city', value: S.city, text: {
      ko: { label: '도시 / 구', speech: { tip: '지역을 고르면 도시랑 구 목록이 나와요. 예약서 주소에 적힌 구 이름을 찾아서 고르세요. 황푸구, 이렇게요.' }, tip: '예약서 주소의 **구(District)** 이름' },
      en: { label: 'City / district', speech: { tip: 'Once the province is set, the city and district list appears. Pick the one in your booking address.' }, tip: 'The **district** from your booking' },
    }},
    { type: 'type', field: 'address', value: S.address, text: {
      ko: { label: '상세 주소', speech: { tip: '상세 주소는 호텔 이름이랑 도로명, 번지까지 예약서 영문 주소 그대로 쓰세요.', mistake: '호텔 이름만 쓰거나 상하이라고만 쓰면 안 돼요. 도로명이랑 번지까지 넣어야 해요. 예약서에 중국어 주소가 있으면 휴대폰에 캡처해 두세요. 택시 탈 때도 써요.' },
            tip: '**호텔 이름 + 도로명·번지**, 예약서 주소 그대로', mistake: '호텔 이름만, 도시 이름만 쓰면 안 됩니다. **도로명·번지까지.**', bad: 'SHANGHAI', good: 'SAMPLE HOTEL, 88 SAMPLE ROAD' },
      en: { label: 'Detailed address', speech: { tip: 'Hotel name, street and number, copied from your booking.', mistake: 'Not just the hotel name, and not just Shanghai. Include the street and number. If your booking shows the address in Chinese, screenshot it too. It helps with taxis.' },
            tip: '**Hotel name + street and number**, from your booking', mistake: 'Not just the hotel or city name. **Include street and number.**', bad: 'SHANGHAI', good: 'SAMPLE HOTEL, 88 SAMPLE ROAD' },
    }},

    // ---------- CONFIRM & SUBMIT ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'review', speech: '거의 다 왔어요. 제출하기 전에 이름, 여권번호, 생년월일을 여권이랑 한 번 더 맞춰 보세요.', route, title: '확인하고 제출', subtitle: '이름·여권번호·생년월일을 여권과 한 번 더 비교', flag: '✅', rightTitle: '5 / 5', rightText: '확인 체크 · 보안 문자\n제출 → QR 코드' },
      en: { id: 'review', speech: 'Almost there. Before you submit, compare your name, passport number and date of birth with your passport once more.', route, title: 'Review and submit', subtitle: 'Compare name, passport no. and date of birth with your passport', flag: '✅', rightTitle: '5 / 5', rightText: 'Declaration · code\nsubmit → QR code' },
    }},
    { type: 'check', field: 'declare', hl: 'declareRow', text: {
      ko: { label: '내용 확인', speech: { tip: '입력한 내용이 사실이라는 확인 칸이에요. 체크하세요.', mistake: '혹시 이 단계에서 결제를 하라고 나오면, 공식 사이트가 아니에요. 중국 국가이민관리국은 입국신고서가 무료라고 안내하고, 가짜 사이트를 조심하라고 해요. 주소가 에스 점 엔아이에이 점 고브 점 씨엔인지 꼭 보세요.' },
            tip: '내용이 맞으면 **체크**', mistake: '결제를 요구하면 **공식 사이트가 아닙니다**. 주소 s.nia.gov.cn 확인.', bad: '수수료 받는 사이트', good: 's.nia.gov.cn (무료)' },
      en: { label: 'Declaration', speech: { tip: 'Tick the box to confirm the details are true.', mistake: 'If any page asks you to pay at this point, you are not on the official site. China\'s National Immigration Administration says the arrival card is free and warns about fake sites. Check the address is s dot n i a dot gov dot c n.' },
            tip: 'Tick it if everything is **correct**', mistake: 'Asked to pay? It is **not the official site**. Check for s.nia.gov.cn.', bad: 'site charging a fee', good: 's.nia.gov.cn (free)' },
    }},
    { type: 'manual', field: 'captcha', tipHold: 3000, text: {
      ko: { label: '보안 문자', speech: { tip: '보안 문자가 나오면 화면에 보이는 글자를 직접 쳐 주세요. 이건 사람이 해야 돼요. 안 읽히면 그림을 눌러서 새로 받으면 돼요.' }, tip: '보이는 글자를 **직접** 입력' },
      en: { label: 'Verification code', speech: { tip: 'If a verification code appears, type the characters yourself. A person has to do this part. If you cannot read it, tap the image for a new one.' }, tip: 'Type the code **yourself**' },
    }},
    { type: 'stop', field: 'submit', tipHold: 3200, text: {
      ko: { label: '제출', speech: { tip: '여기서 제출을 누르면 끝이에요. 그러면 내 입국신고서 큐알 코드가 만들어져요.', mistake: '큐알 코드 화면은 꼭 캡처해 두세요. 입국 심사에서 큐알 코드를 찍어서 내용을 확인해요. 혹시 미리 못 냈어도, 공항 입국 심사장에서 큐알을 스캔하거나 기계, 종이 신고서로 낼 수 있어요.' },
            tip: 'Submit 누르면 **끝** → QR 코드 생성', mistake: 'QR 화면은 **캡처해서 저장**. 입국 심사에서 이 QR로 확인합니다.', bad: '그냥 창 닫기', good: 'QR 캡처 저장' },
      en: { label: 'Submit', speech: { tip: 'Press submit here and you are done. Your arrival card QR code is created.', mistake: 'Screenshot the QR code screen. At the border check, officers scan it to see your card. If you could not file in advance, you can still do it at the airport, by scanning a QR code, on a machine, or on a paper card.' },
            tip: 'Press Submit, **done** → you get a QR code', mistake: '**Screenshot the QR code**. Immigration scans it at the border.', bad: 'just closing the tab', good: 'QR screenshot saved' },
    }},

    // ---------- OUTRO (ticket) ----------
    { type: 'card', hold: 5000, card: {
      ko: { id: 'outro', speech: '끝났어요. 큐알 코드 캡처는 휴대폰에 저장해 두고, 입국 심사에서 여권이랑 같이 준비하세요. 다음은 중국 무비자 입국 조건이랑 해외여행 이심 개통이에요. 설명란에 링크 있습니다.',
            route, title: '끝. **이제 이것만 준비하세요**', subtitle: '입국신고서 QR은 휴대폰에 저장. 입국 심사에서 여권과 함께.',
            meta: [{ k: '설명란 1줄', v: '공식 사이트' }, { k: '설명란 2줄', v: 'eSIM' }, { k: '설명란 3줄', v: '공항 이동' }], stamp: '제출\n완료', flag: '🇨🇳',
            rightTitle: '다음 영상', rightText: '', next: ['🇨🇳 중국 무비자 입국 조건', '📱 해외여행 eSIM 5분 개통', '🔔 서식 바뀌면 최신판 알림'], brand: '▶ 따라하면 끝 · 입국신고서·비자' },
      en: { id: 'outro', speech: 'Done. Keep the QR code screenshot on your phone and have it ready with your passport at immigration. Up next: China visa-free entry rules, and a travel eSIM in five minutes. Links are in the description.',
            route, title: 'Done. **Only these left**', subtitle: 'Keep the arrival card QR on your phone, ready with your passport.',
            meta: [{ k: 'LINE 1', v: 'Official site' }, { k: 'LINE 2', v: 'eSIM' }, { k: 'LINE 3', v: 'Transfer' }], stamp: 'SUB\nMITTED', flag: '🇨🇳',
            rightTitle: 'Up next', rightText: '', next: ['🇨🇳 China visa-free entry', '📱 Travel eSIM in 5 min', '🔔 Subscribe for updates'], brand: '▶ Copy My Screen' },
    }},
  ],
};
