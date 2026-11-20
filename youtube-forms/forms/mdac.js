// MDAC — Malaysia Digital Arrival Card
// Official (free) site: https://imigresen-online.imi.gov.my/mdac/main
//
// One file = one form. It holds: URLs, selectors per target, sample data,
// and the step script with per-language labels / tips / common mistakes.
//
// ⚠ "live" selectors are best-effort guesses and MUST be verified against the
//    real page (open DevTools → inspect the field) before recording from it.
//    The site changes without notice. The "mock" target is the local practice
//    form in ../mock/mdac-form.html, which mirrors the field set.

const path = require('path');

// Sample traveller — obviously fake. Never use real personal data on camera.
const S = {
  name: 'HONG GILDONG',
  passport: 'M12345678',
  nationality: 'KOR',
  dob: '15/05/1990',
  sex: 'M',
  passportExpiry: '31/12/2031',
  email: 'sample.traveller@example.com',
  phone: '821012345678',
  arrival: '20/11/2026',
  departure: '25/11/2026',
  mode: 'AIR',
  flight: 'MH067',
  lastPort: 'ICN',
  accommodation: 'HOTEL',
  address: 'SUNWAY PUTRA HOTEL, 100 JALAN PUTRA',
  state: 'KUALA LUMPUR',
  city: 'KUALA LUMPUR',
  postcode: '50350',
};

module.exports = {
  id: 'mdac',
  pack: 'arrival-card',                       // topic pack (see forms/_packs.js)
  country: { ko: '말레이시아', en: 'Malaysia' }, flag: '🇲🇾',
  fee: '무료', when: '도착 3일 전', captcha: true,
  title: { ko: '말레이시아 전자 입국신고서 (MDAC)', en: 'Malaysia Digital Arrival Card (MDAC)' },
  videoTitle: { ko: '말레이시아 입국신고서 MDAC 작성법 {year} | 5분 따라하기', en: 'Malaysia Digital Arrival Card (MDAC) Step-by-Step {year} | Copy My Screen' },

  url: {
    mock: 'file://' + path.join(__dirname, '..', 'mock', 'mdac-form.html'),
    live: 'https://imigresen-online.imi.gov.my/mdac/register',
  },

  selectors: {
    mock: {
      name: '#name', passport: '#passport', nationality: '#nationality', dob: '#dob', sex: '#sex',
      passportExpiry: '#passportExpiry', email: '#email', emailConfirm: '#emailConfirm', phone: '#phone',
      arrival: '#arrival', departure: '#departure', mode: '#mode', flight: '#flight', lastPort: '#lastPort',
      accommodation: '#accommodation', address: '#address', state: '#state', city: '#city', postcode: '#postcode',
      agree: '#agree', captcha: '#captcha', submit: '#submit',
    },
    // TODO verify on the real page before a live recording
    live: {
      name: 'input[name="name"]', passport: 'input[name="passNo"]', nationality: 'select[name="nationality"]',
      dob: 'input[name="dob"]', sex: 'select[name="sex"]', passportExpiry: 'input[name="passExpDte"]',
      email: 'input[name="email"]', emailConfirm: 'input[name="confirmEmail"]', phone: 'input[name="mobile"]',
      arrival: 'input[name="arrDt"]', departure: 'input[name="depDt"]', mode: 'select[name="trvlMode"]',
      flight: 'input[name="vesselNm"]', lastPort: 'select[name="embark"]', accommodation: 'select[name="accommodationStay"]',
      address: 'input[name="accommodationAddress1"]', state: 'select[name="accommodationState"]',
      city: 'select[name="accommodationCity"]', postcode: 'input[name="accommodationPostcode"]',
      agree: 'input[type="checkbox"]', captcha: '#captcha, .g-recaptcha', submit: 'button[type="submit"]',
    },
  },

  strings: {
    ko: { easyPill: '👀 화면 그대로 따라만 하세요', mistakeTitle: '⚠ 많이 틀리는 곳', pause: '⏸ 여기까지 입력하세요', pauseSub: '다 치고 나서 재생' },
    en: { easyPill: '👀 Just copy the screen', mistakeTitle: '⚠ Common mistake', pause: '⏸ Type this, then press play', pauseSub: '' },
  },

  steps: [
    // ---------- INTRO CARD (ticket) ----------
    { type: 'card', hold: 4500, card: {
      ko: { id: 'intro', speech: "말레이시아 가시죠? 비행기 타기 전에 입국신고서 하나만 내면 돼요. MDAC이라고 하는데, 무료고, 오 분이면 끝나요. 제가 화면 그대로 보여드릴 테니까, 똑같이 따라 치시면 됩니다. 중간에 많이들 틀리는 곳 다섯 군데에서는 제가 잠깐 멈출게요.", route: { from: 'ICN', fromCity: 'SEOUL', to: 'KUL', toCity: 'KUALA LUMPUR' }, title: '입국신고서 MDAC,\n**화면 그대로 따라 하면 끝**', subtitle: '실제 신청 화면 그대로. 틀리기 쉬운 5곳에서 멈춥니다.',
            meta: [{ k: '소요', v: '5분' }, { k: '비용', v: '무료' }, { k: '제출', v: '도착 3일 전' }, { k: '기준', v: '2026' }], stamp: '따라\n하면\n끝', flag: '🇲🇾', rightTitle: 'Malaysia Digital Arrival Card', rightText: '준비물: 여권 · 항공편 · 호텔 주소\n돈 내라는 사이트는 전부 가짜', brand: '▶ 따라하면 끝 · 입국신고서·비자' },
      en: { id: 'intro', speech: "Heading to Malaysia? Before you fly, there is one form to file: the MDAC. It is free, and it takes about five minutes. I will show you the real screen, and you just copy what I type. At the five spots where people usually slip up, I will pause for a second.", route: { from: 'ICN', fromCity: 'SEOUL', to: 'KUL', toCity: 'KUALA LUMPUR' }, title: 'Malaysia Arrival Card,\n**copy the screen and you are done**', subtitle: 'The real application page, step by step. We stop at the 5 spots people get wrong.',
            meta: [{ k: 'TIME', v: '5 min' }, { k: 'FEE', v: 'Free' }, { k: 'WHEN', v: '3 days before' }, { k: 'YEAR', v: '2026' }], stamp: 'COPY\nMY\nSCREEN', flag: '🇲🇾', rightTitle: 'Malaysia Digital Arrival Card', rightText: 'Need: passport · flight · hotel address\nAny site asking for money is fake', brand: '▶ Copy My Screen · Arrival Cards & Visas' },
    }},

    // ---------- PERSONAL ----------
    { type: 'type', field: 'name', value: S.name, text: {
      ko: { label: '이름', speech: {"tip":"이름이에요. 여권 맨 아래 줄 보이시죠? 거기 적힌 순서 그대로, 전부 대문자로 쳐 주세요.","mistake":"여기서 많이들 틀려요. 성이랑 이름 순서를 바꾸거나, 하이픈이나 마침표를 넣으면 입국 심사에서 안 맞는다고 나와요. 길동, 쉼표, 홍이 아니라, 홍 길동. 띄어쓰기 하나만요."}, tip: '여권 아래 줄 순서대로, **전부 대문자**로 입력하세요',
            mistake: '성과 이름 순서를 바꾸거나, 하이픈·마침표를 넣으면 입국 심사에서 불일치가 납니다.', bad: 'Gildong, Hong', good: 'HONG GILDONG' },
      en: { label: 'Full name', speech: {"tip":"First, your name. Look at the very bottom line of your passport. Type it in that exact order, all capitals.","mistake":"This is where people slip. If you swap the surname and given name, or add hyphens and dots, it will not match at immigration. Not Gildong comma Hong. Hong, space, Gildong."}, tip: 'Type it exactly as the machine-readable zone (MRZ) at the bottom of your passport, in CAPITALS.',
            mistake: 'Swapping surname/given name or adding hyphens and dots causes a mismatch at immigration.', bad: 'Gildong, Hong', good: 'HONG GILDONG' },
    }},
    { type: 'type', field: 'passport', value: S.passport, text: {
      ko: { label: '여권번호', speech: {"tip":"여권번호예요. 띄어쓰기 없이 영문이랑 숫자만요.","mistake":"숫자 영이랑 영문 오가 헷갈리기 쉬워요. 여권 맨 아래 줄을 확대해서 한 번 더 보세요."}, tip: '**띄어쓰기 없이** 영문·숫자만',
            mistake: '숫자 0과 영문 O를 혼동하기 쉽습니다. 여권 MRZ 줄을 확대해서 확인하세요.', bad: 'M 1234 5678', good: 'M12345678' },
      en: { label: 'Passport number', speech: {"tip":"Passport number. Letters and digits only, no spaces.","mistake":"The digit zero and the letter O look alike. Zoom in on the bottom line of your passport to be sure."}, tip: 'Letters and digits only, no spaces.',
            mistake: 'Digit 0 and letter O are easy to mix up — zoom in on the MRZ line of your passport.', bad: 'M 1234 5678', good: 'M12345678' },
    }},
    { type: 'select', field: 'nationality', value: S.nationality, text: {
      ko: { label: '국적', speech: {"tip":"국적은 여권을 발급한 나라예요. 코리아, 리퍼블릭 오브를 고르시면 돼요."}, tip: '여권 발행 국가를 고릅니다. (싱가포르 국적자는 MDAC 대상이 아닙니다)' },
      en: { label: 'Nationality', speech: {"tip":"Nationality is the country that issued your passport."}, tip: 'Pick the country that issued your passport. (Singapore citizens do not need MDAC)' },
    }},
    { type: 'type', field: 'dob', value: S.dob, text: {
      ko: { label: '생년월일', speech: {"tip":"생년월일은 일, 월, 년 순서예요.","mistake":"월이랑 일을 바꿔 넣는 분이 제일 많아요. 치고 나서 화면에 뜬 날짜를 한 번만 다시 읽어 보세요. 십오, 영오, 천구백구십. 일이 먼저예요."}, tip: '일/월/년 순서입니다. 달력이 뜨면 달력에서 골라도 됩니다.',
            mistake: '월과 일 순서를 바꿔 넣는 실수가 가장 많습니다. 입력 후 화면에 표시된 날짜를 한 번 더 읽어보세요.', bad: '05/15/1990 (월/일)', good: '15/05/1990 (일/월/년)' },
      en: { label: 'Date of birth', speech: {"tip":"Date of birth, in day, month, year order.","mistake":"Swapping the day and the month is the most common mistake here. After you type it, read the date back once. Day first."}, tip: 'Day / month / year order. You can also pick from the calendar if one pops up.',
            mistake: 'The most common error is swapping day and month. Re-read the date shown on screen after typing.', bad: '05/15/1990 (MM/DD)', good: '15/05/1990 (DD/MM/YYYY)' },
    }},
    { type: 'select', field: 'sex', value: S.sex, text: {
      ko: { label: '성별', speech: {"tip":"성별은 여권에 적힌 대로요."}, tip: '여권에 적힌 대로 선택합니다.' },
      en: { label: 'Sex', speech: {"tip":"Sex, as printed in your passport."}, tip: 'Select as printed in your passport.' },
    }},
    { type: 'type', field: 'passportExpiry', value: S.passportExpiry, text: {
      ko: { label: '여권 만료일', speech: {"tip":"여권 만료일이에요. 입국일 기준으로 여섯 달 이상 남아 있어야 해요.","mistake":"발급일을 넣는 분이 많아요. 여권에 데이트 오브 익스파이어리라고 적힌 날짜, 만료일이에요."}, tip: '여권 유효기간이 입국일 기준 6개월 이상 남아 있어야 합니다.',
            mistake: '발급일(Date of issue)을 넣는 분이 많습니다. 반드시 만료일(Date of expiry)입니다.', bad: 'Date of issue', good: 'Date of EXPIRY' },
      en: { label: 'Passport expiry', speech: {"tip":"Passport expiry date. It needs at least six months left from your arrival.","mistake":"People often type the issue date. You want the line that says date of expiry."}, tip: 'Your passport must be valid for at least 6 months from the arrival date.',
            mistake: 'Many people enter the issue date. It must be the EXPIRY date.', bad: 'Date of issue', good: 'Date of EXPIRY' },
    }},

    // ---------- CONTACT ----------
    { type: 'type', field: 'email', value: S.email, text: {
      ko: { label: '이메일', speech: {"tip":"이메일이에요. 확인 PDF가 여기로 오니까, 공항에서 열어볼 수 있는 메일로 적어 주세요.","mistake":"오타 나면 확인증을 못 받아요. 다음 칸에서 한 번 더 치게 되어 있으니까, 복사해서 붙이지 말고 직접 쳐 주세요."}, tip: '확인 PDF가 여기로 옵니다. **공항에서 열 수 있는 메일**로',
            mistake: '오타가 나면 확인증을 못 받습니다. 다음 칸에서 한 번 더 입력하게 되어 있으니 복사-붙여넣기 하지 말고 직접 치세요.' },
      en: { label: 'Email', speech: {"tip":"Email. The confirmation PDF comes here, so use an inbox you can open at the airport.","mistake":"A typo means no confirmation. The next box asks you to type it again, so do not paste it. Type it."}, tip: 'The confirmation PDF is sent here. Use an inbox you can open at the airport.',
            mistake: 'A typo means no confirmation. The next box asks you to type it again — do not paste, type it.' },
    }},
    { type: 'type', field: 'emailConfirm', value: S.email, text: {
      ko: { label: '이메일 확인', speech: {"tip":"같은 이메일을 한 번 더요."}, tip: '위와 똑같이 다시 입력합니다.' },
      en: { label: 'Confirm email', speech: {"tip":"The same email, once more."}, tip: 'Type it again, exactly the same.' },
    }},
    { type: 'type', field: 'phone', value: S.phone, text: {
      ko: { label: '휴대폰 번호', speech: {"tip":"휴대폰 번호예요. 국가번호까지 포함해서 숫자만요.","mistake":"플러스 기호나 맨 앞의 영을 넣으면 오류가 나요. 한국은 팔십이, 그다음에 영을 뺀 번호를 붙이세요. 팔이 일공 일이삼사 오륙칠팔, 이렇게요."}, tip: '국가번호 포함, **숫자만**',
            mistake: '+ 기호나 맨 앞의 0을 넣으면 오류가 납니다. 한국은 82 뒤에 0을 뺀 번호를 붙입니다.', bad: '+82-010-1234-5678', good: '821012345678' },
      en: { label: 'Mobile number', speech: {"tip":"Mobile number. Country code first, digits only.","mistake":"A plus sign or the leading zero will throw an error. Country code, then your number without its first zero."}, tip: 'Digits only, including country code.',
            mistake: 'A "+" sign or the leading 0 of your number causes an error. Country code, then the number without its leading 0.', bad: '+82-010-1234-5678', good: '821012345678' },
    }},

    // ---------- TRAVEL ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'travel', speech: "자, 이제 여행 정보예요. 항공권 예약 확인서를 옆에 켜 두시면 편해요.", route: { from: 'ICN', fromCity: 'SEOUL', to: 'KUL', toCity: 'KUALA LUMPUR' }, title: '여행 정보', subtitle: '항공권 예약 확인서를 옆에 두고 보면서 입력하세요', flag: '✈️', rightTitle: '2 / 4', rightText: '도착일 · 출국일 · 교통수단\n항공편 · 마지막 출발지' },
      en: { id: 'travel', speech: "Now the travel details. Keep your flight confirmation open next to you.", route: { from: 'ICN', fromCity: 'SEOUL', to: 'KUL', toCity: 'KUALA LUMPUR' }, title: 'Travel details', subtitle: 'Keep your flight confirmation next to you', flag: '✈️', rightTitle: '2 / 4', rightText: 'Arrival · departure · mode\nflight · last port' },
    }},
    { type: 'type', field: 'arrival', value: S.arrival, text: {
      ko: { label: '말레이시아 도착일', speech: {"tip":"말레이시아에 내리는 날짜예요.","mistake":"밤 비행기면 출발일이 아니라 도착일이에요. 그리고 이 신고서는 도착일 기준으로 사흘 전부터만 낼 수 있어요."}, tip: '말레이시아에 **내리는 날짜** (출발일 아님)',
            mistake: '야간 비행이면 출발일이 아니라 도착일입니다. 도착일 기준 3일 이내에만 제출할 수 있습니다.', bad: '출발일', good: '현지 도착일' },
      en: { label: 'Arrival date', speech: {"tip":"The date you land in Malaysia.","mistake":"For an overnight flight, that is the arrival date, not the departure date. And you can only submit within three days before you arrive."}, tip: 'The local date you land in Malaysia.',
            mistake: 'For overnight flights use the ARRIVAL date, not departure. You can only submit within 3 days before arrival.', bad: 'departure date', good: 'local arrival date' },
    }},
    { type: 'type', field: 'departure', value: S.departure, text: {
      ko: { label: '말레이시아 출국일', speech: {"tip":"말레이시아를 떠나는 날짜예요."}, tip: '말레이시아를 떠나는 날짜입니다. 90일 무비자 범위 안이어야 합니다.' },
      en: { label: 'Departure date', speech: {"tip":"The date you leave Malaysia."}, tip: 'The date you leave Malaysia. Must be within your visa-free period.' },
    }},
    { type: 'select', field: 'mode', value: S.mode, text: {
      ko: { label: '교통수단', speech: {"tip":"비행기면 에어, 싱가포르에서 버스나 차로 넘어오시면 랜드예요."}, tip: '비행기는 AIR, 싱가포르에서 버스·차량으로 넘어오면 LAND입니다.' },
      en: { label: 'Mode of travel', speech: {"tip":"Air for flights. Land if you cross from Singapore by bus or car."}, tip: 'AIR for flights; LAND if you cross from Singapore by bus or car.' },
    }},
    { type: 'type', field: 'flight', value: S.flight, text: {
      ko: { label: '항공편명', speech: {"tip":"항공편명이에요. 항공사 코드랑 번호를 띄어쓰기 없이 붙여서요.","mistake":"말레이시아에 실제로 내리는 마지막 비행기 편명이에요. 경유하시면 두 번째 비행기요."}, tip: '항공사 코드 + 번호, **띄어쓰기 없이**',
            mistake: '말레이시아에 "실제로 착륙하는" 마지막 구간 편명을 씁니다. 경유편이면 두 번째 편명입니다.', bad: 'MH 067 / KE 671→', good: 'MH067' },
      en: { label: 'Flight number', speech: {"tip":"Flight number. Airline code and number, no space.","mistake":"Use the flight that actually lands in Malaysia. If you connect somewhere, that is the second leg."}, tip: 'Airline code + number, no space.',
            mistake: 'Use the flight that actually LANDS in Malaysia — for connections, that is the second leg.', bad: 'MH 067', good: 'MH067' },
    }},
    { type: 'select', field: 'lastPort', value: S.lastPort, text: {
      ko: { label: '마지막 출발지', speech: {"tip":"말레이시아로 오는 비행기를 탄 공항이에요.","mistake":"경유하셨으면 집 근처 공항이 아니라 갈아탄 공항이에요. 싱가포르에서 갈아타셨으면 싱가포르, 에스 아이 엔."}, tip: '말레이시아로 오는 비행기를 탄 공항입니다.',
            mistake: '경유했다면 집 근처 공항이 아니라 "환승한 공항"입니다. 싱가포르 환승이면 SIN.', bad: '인천(경유 시)', good: '마지막으로 탑승한 공항' },
      en: { label: 'Last port of embarkation', speech: {"tip":"The airport where you boarded the flight to Malaysia.","mistake":"If you connected, it is the transit airport, not your home airport. Via Singapore means S I N."}, tip: 'The airport where you boarded the flight to Malaysia.',
            mistake: 'If you transited, it is the TRANSIT airport, not your home airport. Via Singapore → SIN.', bad: 'home airport (if transiting)', good: 'last airport you boarded at' },
    }},

    // ---------- ACCOMMODATION ----------
    { type: 'select', field: 'accommodation', value: S.accommodation, text: {
      ko: { label: '숙소 유형', speech: {"tip":"숙소 종류예요. 호텔이면 호텔."}, tip: '호텔, 지인 집, 에어비앤비 등 중 선택합니다.' },
      en: { label: 'Accommodation type', speech: {"tip":"Type of accommodation. Hotel, if it is a hotel."}, tip: 'Hotel, friend/relative, Airbnb etc.' },
    }},
    { type: 'type', field: 'address', value: S.address, text: {
      ko: { label: '말레이시아 체류 주소', speech: {"tip":"첫날 묵는 숙소 영문 주소예요. 예약 확인서에 있는 걸 그대로 쓰세요.","mistake":"쿠알라룸푸르라고만 쓰면 반려될 수 있어요. 호텔 이름이랑 도로명까지 넣어 주세요."}, tip: '첫날 묵는 숙소의 **영문 주소**를 예약 확인서에서 그대로',
            mistake: '"Kuala Lumpur"만 쓰면 반려될 수 있습니다. 호텔 이름 + 도로명까지 넣으세요.', bad: 'Kuala Lumpur', good: 'SUNWAY PUTRA HOTEL, 100 JALAN PUTRA' },
      en: { label: 'Address in Malaysia', speech: {"tip":"The address where you stay on the first night. Copy it from your booking.","mistake":"Just Kuala Lumpur can get rejected. Include the hotel name and the street."}, tip: 'Where you stay on the first night — copy it from your booking confirmation.',
            mistake: 'Just "Kuala Lumpur" can be rejected. Include the hotel name and street.', bad: 'Kuala Lumpur', good: 'SUNWAY PUTRA HOTEL, 100 JALAN PUTRA' },
    }},
    { type: 'select', field: 'state', value: S.state, text: {
      ko: { label: '주(State)', speech: {"tip":"주예요. 쿠알라룸푸르는 그냥 쿠알라룸푸르, 코타키나발루는 사바, 페낭은 풀라우 피낭이에요."}, tip: '쿠알라룸푸르는 연방직할구라 KUALA LUMPUR를 고릅니다. 코타키나발루는 SABAH, 페낭은 PULAU PINANG.' },
      en: { label: 'State', speech: {"tip":"The state. Kuala Lumpur is its own entry. Kota Kinabalu is Sabah, Penang is Pulau Pinang."}, tip: 'Kuala Lumpur is its own federal territory. Kota Kinabalu → SABAH, Penang → PULAU PINANG.' },
    }},
    { type: 'select', field: 'city', value: S.city, text: {
      ko: { label: '도시', speech: {"tip":"주를 고르면 도시 목록이 바뀌어요."}, tip: '주를 고르면 도시 목록이 바뀝니다.' },
      en: { label: 'City', speech: {"tip":"The city list changes once you pick the state."}, tip: 'The list changes after you pick the state.' },
    }},
    { type: 'type', field: 'postcode', value: S.postcode, text: {
      ko: { label: '우편번호', speech: {"tip":"우편번호는 다섯 자리예요. 예약서에 없으면 호텔 이름으로 검색하면 바로 나와요."}, tip: '말레이시아 우편번호는 5자리입니다. 호텔 주소에 없으면 호텔 이름으로 검색하면 바로 나옵니다.' },
      en: { label: 'Postcode', speech: {"tip":"Postcode, five digits. If your booking does not show it, search the hotel name."}, tip: 'Malaysian postcodes are 5 digits. If your booking has none, search the hotel name.' },
    }},

    // ---------- SUBMIT ----------
    { type: 'check', field: 'agree', text: {
      ko: { label: '약관 동의', speech: {"tip":"체크해 주세요."}, tip: '체크합니다.' },
      en: { label: 'Declaration', speech: {"tip":"Tick the box."}, tip: 'Tick the box.' },
    }},
    { type: 'manual', field: 'captcha', tipHold: 3000, text: {
      ko: { label: '보안문자', speech: {"tip":"보안문자는 화면에 보이는 글자를 직접 치시면 돼요. 이건 사람이 해야 돼요."}, tip: '화면에 보이는 글자를 직접 입력합니다. 이 부분은 사람이 해야 합니다.' },
      en: { label: 'Security code', speech: {"tip":"Type the characters you see. This part has to be done by a person."}, tip: 'Type the characters you see. This part has to be done by a person.' },
    }},
    { type: 'stop', field: 'submit', tipHold: 3200, text: {
      ko: { label: '제출', speech: {"tip":"여기서 제출을 누르면 끝이에요.","mistake":"제출하면 수정이 안 돼요. 아까 짚은 다섯 군데, 이름 순서, 여권번호 영과 오, 만료일, 도착일, 마지막 출발지. 한 번만 더 보고 누르세요."}, tip: '여기서 Submit을 누르면 끝입니다. 이메일로 PDF가 오면 저장해 두고, 공항에서는 여권만 제시하면 됩니다.',
            mistake: '제출 후 수정할 수 없습니다. 위에서 짚은 다섯 군데(이름 순서, 여권번호 0/O, 만료일, 도착일, 마지막 출발지)를 한 번 더 확인한 뒤 누르세요.' },
      en: { label: 'Submit', speech: {"tip":"Press submit here and you are done.","mistake":"You cannot edit after submitting. The five spots from before: name order, zero and O in the passport number, expiry date, arrival date, last port. Check once more, then press."}, tip: 'Press Submit here and you are done. Save the PDF that arrives by email; at the airport you only show your passport.',
            mistake: 'You cannot edit after submitting. Re-check the five spots above (name order, 0/O in passport no., expiry date, arrival date, last port) first.' },
    }},

    // ---------- OUTRO (ticket) ----------
    { type: 'card', hold: 5000, card: {
      ko: { id: 'outro', speech: "끝났어요. 제출하면 이메일로 확인 PDF가 오는데, 휴대폰에 저장해 두세요. 공항에서는 여권만 보여주면 됩니다. 다음은 말레이시아 이심 개통이랑 싱가포르 입국카드예요. 설명란에 링크 있습니다.", route: { from: 'ICN', fromCity: 'SEOUL', to: 'KUL', toCity: 'KUALA LUMPUR' }, title: '끝. **이제 이것만 준비하세요**', subtitle: '제출 확인 PDF는 휴대폰에 저장. 공항에서는 여권만 보여주면 됩니다.',
            meta: [{ k: '설명란 1줄', v: '공식 사이트' }, { k: '설명란 2줄', v: 'eSIM' }, { k: '설명란 3줄', v: '공항 픽업' }], stamp: '제출\n완료', flag: '🇲🇾', rightTitle: '다음 영상', rightText: '', next: ['📱 말레이시아 eSIM 5분 개통', '🇸🇬 싱가포르 입국카드 SGAC', '🔔 서식 바뀌면 최신판 알림'], brand: '▶ 따라하면 끝 · 입국신고서·비자' },
      en: { id: 'outro', speech: "And that is it. After you submit, a confirmation PDF arrives by email. Save it on your phone. At the airport you only show your passport. Up next: a Malaysia eSIM in five minutes, and the Singapore arrival card. Links are in the description.", route: { from: 'ICN', fromCity: 'SEOUL', to: 'KUL', toCity: 'KUALA LUMPUR' }, title: 'Done. **Only these left**', subtitle: 'Save the confirmation PDF on your phone. At the airport you only show your passport.',
            meta: [{ k: 'LINE 1', v: 'Official site' }, { k: 'LINE 2', v: 'eSIM' }, { k: 'LINE 3', v: 'Transfer' }], stamp: 'SUB\nMITTED', flag: '🇲🇾', rightTitle: 'Up next', rightText: '', next: ['📱 Malaysia eSIM in 5 min', '🇸🇬 Singapore Arrival Card', '🔔 Subscribe for updates'], brand: '▶ Copy My Screen' },
    }},
  ],
};
