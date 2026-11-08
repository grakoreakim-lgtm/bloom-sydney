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
  title: { ko: '말레이시아 전자 입국신고서 (MDAC)', en: 'Malaysia Digital Arrival Card (MDAC)' },

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
    ko: { easyPill: '👀 보이는 대로 따라만 하세요', mistakeTitle: '여기서 많이 틀려요' },
    en: { easyPill: '👀 Just copy what you see', mistakeTitle: 'Common mistake here' },
  },

  steps: [
    // ---------- INTRO CARD ----------
    { type: 'card', hold: 4200, card: {
      ko: { id: 'intro', big: '5분', title: '말레이시아 입국신고서 MDAC', subtitle: '화면 그대로 따라 하면 끝납니다\n무료 · 도착 3일 전부터 · 공식 사이트만 사용',
            chips: ['📋 준비물: 여권 · 항공편 · 호텔 주소', '🆓 돈 내라는 사이트는 전부 가짜', '⏱ 도착 3일 이내 제출'] },
      en: { id: 'intro', big: '5 min', title: 'Malaysia Digital Arrival Card (MDAC)', subtitle: 'Just copy the screen — that is all\nFree · within 3 days of arrival · official site only',
            chips: ['📋 Need: passport · flight · hotel address', '🆓 Any site asking for money is fake', '⏱ Submit within 3 days of arrival'] },
    }},

    // ---------- PERSONAL ----------
    { type: 'type', field: 'name', value: S.name, text: {
      ko: { label: '이름', tip: '여권 아래쪽 기계판독 줄(MRZ)에 있는 순서 그대로, 영문 대문자로 입력합니다.',
            mistake: '성과 이름 순서를 바꾸거나, 하이픈·마침표를 넣으면 입국 심사에서 불일치가 납니다.', bad: 'Gildong, Hong', good: 'HONG GILDONG' },
      en: { label: 'Full name', tip: 'Type it exactly as the machine-readable zone (MRZ) at the bottom of your passport, in CAPITALS.',
            mistake: 'Swapping surname/given name or adding hyphens and dots causes a mismatch at immigration.', bad: 'Gildong, Hong', good: 'HONG GILDONG' },
    }},
    { type: 'type', field: 'passport', value: S.passport, text: {
      ko: { label: '여권번호', tip: '띄어쓰기 없이 영문·숫자만 입력합니다.',
            mistake: '숫자 0과 영문 O를 혼동하기 쉽습니다. 여권 MRZ 줄을 확대해서 확인하세요.', bad: 'M 1234 5678', good: 'M12345678' },
      en: { label: 'Passport number', tip: 'Letters and digits only, no spaces.',
            mistake: 'Digit 0 and letter O are easy to mix up — zoom in on the MRZ line of your passport.', bad: 'M 1234 5678', good: 'M12345678' },
    }},
    { type: 'select', field: 'nationality', value: S.nationality, text: {
      ko: { label: '국적', tip: '여권 발행 국가를 고릅니다. (싱가포르 국적자는 MDAC 대상이 아닙니다)' },
      en: { label: 'Nationality', tip: 'Pick the country that issued your passport. (Singapore citizens do not need MDAC)' },
    }},
    { type: 'type', field: 'dob', value: S.dob, text: {
      ko: { label: '생년월일', tip: '일/월/년 순서입니다. 달력이 뜨면 달력에서 골라도 됩니다.',
            mistake: '월과 일 순서를 바꿔 넣는 실수가 가장 많습니다. 입력 후 화면에 표시된 날짜를 한 번 더 읽어보세요.', bad: '05/15/1990 (월/일)', good: '15/05/1990 (일/월/년)' },
      en: { label: 'Date of birth', tip: 'Day / month / year order. You can also pick from the calendar if one pops up.',
            mistake: 'The most common error is swapping day and month. Re-read the date shown on screen after typing.', bad: '05/15/1990 (MM/DD)', good: '15/05/1990 (DD/MM/YYYY)' },
    }},
    { type: 'select', field: 'sex', value: S.sex, text: {
      ko: { label: '성별', tip: '여권에 적힌 대로 선택합니다.' },
      en: { label: 'Sex', tip: 'Select as printed in your passport.' },
    }},
    { type: 'type', field: 'passportExpiry', value: S.passportExpiry, text: {
      ko: { label: '여권 만료일', tip: '여권 유효기간이 입국일 기준 6개월 이상 남아 있어야 합니다.',
            mistake: '발급일(Date of issue)을 넣는 분이 많습니다. 반드시 만료일(Date of expiry)입니다.', bad: 'Date of issue', good: 'Date of EXPIRY' },
      en: { label: 'Passport expiry', tip: 'Your passport must be valid for at least 6 months from the arrival date.',
            mistake: 'Many people enter the issue date. It must be the EXPIRY date.', bad: 'Date of issue', good: 'Date of EXPIRY' },
    }},

    // ---------- CONTACT ----------
    { type: 'type', field: 'email', value: S.email, text: {
      ko: { label: '이메일', tip: '제출 확인 PDF가 이 주소로 옵니다. 공항에서 열어볼 수 있는 이메일을 쓰세요.',
            mistake: '오타가 나면 확인증을 못 받습니다. 다음 칸에서 한 번 더 입력하게 되어 있으니 복사-붙여넣기 하지 말고 직접 치세요.' },
      en: { label: 'Email', tip: 'The confirmation PDF is sent here. Use an inbox you can open at the airport.',
            mistake: 'A typo means no confirmation. The next box asks you to type it again — do not paste, type it.' },
    }},
    { type: 'type', field: 'emailConfirm', value: S.email, text: {
      ko: { label: '이메일 확인', tip: '위와 똑같이 다시 입력합니다.' },
      en: { label: 'Confirm email', tip: 'Type it again, exactly the same.' },
    }},
    { type: 'type', field: 'phone', value: S.phone, text: {
      ko: { label: '휴대폰 번호', tip: '국가번호를 포함해 숫자만 입력합니다.',
            mistake: '+ 기호나 맨 앞의 0을 넣으면 오류가 납니다. 한국은 82 뒤에 0을 뺀 번호를 붙입니다.', bad: '+82-010-1234-5678', good: '821012345678' },
      en: { label: 'Mobile number', tip: 'Digits only, including country code.',
            mistake: 'A "+" sign or the leading 0 of your number causes an error. Country code, then the number without its leading 0.', bad: '+82-010-1234-5678', good: '821012345678' },
    }},

    // ---------- TRAVEL ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'travel', title: '여행 정보', subtitle: '항공권 예약 확인서를 옆에 두고 보면서 입력하세요' },
      en: { id: 'travel', title: 'Travel details', subtitle: 'Keep your flight confirmation next to you while you type' },
    }},
    { type: 'type', field: 'arrival', value: S.arrival, text: {
      ko: { label: '말레이시아 도착일', tip: '말레이시아 공항에 내리는 현지 날짜입니다.',
            mistake: '야간 비행이면 출발일이 아니라 도착일입니다. 도착일 기준 3일 이내에만 제출할 수 있습니다.', bad: '출발일', good: '현지 도착일' },
      en: { label: 'Arrival date', tip: 'The local date you land in Malaysia.',
            mistake: 'For overnight flights use the ARRIVAL date, not departure. You can only submit within 3 days before arrival.', bad: 'departure date', good: 'local arrival date' },
    }},
    { type: 'type', field: 'departure', value: S.departure, text: {
      ko: { label: '말레이시아 출국일', tip: '말레이시아를 떠나는 날짜입니다. 90일 무비자 범위 안이어야 합니다.' },
      en: { label: 'Departure date', tip: 'The date you leave Malaysia. Must be within your visa-free period.' },
    }},
    { type: 'select', field: 'mode', value: S.mode, text: {
      ko: { label: '교통수단', tip: '비행기는 AIR, 싱가포르에서 버스·차량으로 넘어오면 LAND입니다.' },
      en: { label: 'Mode of travel', tip: 'AIR for flights; LAND if you cross from Singapore by bus or car.' },
    }},
    { type: 'type', field: 'flight', value: S.flight, text: {
      ko: { label: '항공편명', tip: '항공사 코드 + 번호를 붙여서 씁니다.',
            mistake: '말레이시아에 "실제로 착륙하는" 마지막 구간 편명을 씁니다. 경유편이면 두 번째 편명입니다.', bad: 'MH 067 / KE 671→', good: 'MH067' },
      en: { label: 'Flight number', tip: 'Airline code + number, no space.',
            mistake: 'Use the flight that actually LANDS in Malaysia — for connections, that is the second leg.', bad: 'MH 067', good: 'MH067' },
    }},
    { type: 'select', field: 'lastPort', value: S.lastPort, text: {
      ko: { label: '마지막 출발지', tip: '말레이시아로 오는 비행기를 탄 공항입니다.',
            mistake: '경유했다면 집 근처 공항이 아니라 "환승한 공항"입니다. 싱가포르 환승이면 SIN.', bad: '인천(경유 시)', good: '마지막으로 탑승한 공항' },
      en: { label: 'Last port of embarkation', tip: 'The airport where you boarded the flight to Malaysia.',
            mistake: 'If you transited, it is the TRANSIT airport, not your home airport. Via Singapore → SIN.', bad: 'home airport (if transiting)', good: 'last airport you boarded at' },
    }},

    // ---------- ACCOMMODATION ----------
    { type: 'select', field: 'accommodation', value: S.accommodation, text: {
      ko: { label: '숙소 유형', tip: '호텔, 지인 집, 에어비앤비 등 중 선택합니다.' },
      en: { label: 'Accommodation type', tip: 'Hotel, friend/relative, Airbnb etc.' },
    }},
    { type: 'type', field: 'address', value: S.address, text: {
      ko: { label: '말레이시아 체류 주소', tip: '첫날 밤 묵는 숙소의 영문 주소를 넣습니다. 예약 확인서에 있는 것을 그대로 쓰세요.',
            mistake: '"Kuala Lumpur"만 쓰면 반려될 수 있습니다. 호텔 이름 + 도로명까지 넣으세요.', bad: 'Kuala Lumpur', good: 'SUNWAY PUTRA HOTEL, 100 JALAN PUTRA' },
      en: { label: 'Address in Malaysia', tip: 'Where you stay on the first night — copy it from your booking confirmation.',
            mistake: 'Just "Kuala Lumpur" can be rejected. Include the hotel name and street.', bad: 'Kuala Lumpur', good: 'SUNWAY PUTRA HOTEL, 100 JALAN PUTRA' },
    }},
    { type: 'select', field: 'state', value: S.state, text: {
      ko: { label: '주(State)', tip: '쿠알라룸푸르는 연방직할구라 KUALA LUMPUR를 고릅니다. 코타키나발루는 SABAH, 페낭은 PULAU PINANG.' },
      en: { label: 'State', tip: 'Kuala Lumpur is its own federal territory. Kota Kinabalu → SABAH, Penang → PULAU PINANG.' },
    }},
    { type: 'select', field: 'city', value: S.city, text: {
      ko: { label: '도시', tip: '주를 고르면 도시 목록이 바뀝니다.' },
      en: { label: 'City', tip: 'The list changes after you pick the state.' },
    }},
    { type: 'type', field: 'postcode', value: S.postcode, text: {
      ko: { label: '우편번호', tip: '말레이시아 우편번호는 5자리입니다. 호텔 주소에 없으면 호텔 이름으로 검색하면 바로 나옵니다.' },
      en: { label: 'Postcode', tip: 'Malaysian postcodes are 5 digits. If your booking has none, search the hotel name.' },
    }},

    // ---------- SUBMIT ----------
    { type: 'check', field: 'agree', text: {
      ko: { label: '약관 동의', tip: '체크합니다.' },
      en: { label: 'Declaration', tip: 'Tick the box.' },
    }},
    { type: 'manual', field: 'captcha', tipHold: 3000, text: {
      ko: { label: '보안문자', tip: '화면에 보이는 글자를 직접 입력합니다. 이 부분은 사람이 해야 합니다.' },
      en: { label: 'Security code', tip: 'Type the characters you see. This part has to be done by a person.' },
    }},
    { type: 'stop', field: 'submit', tipHold: 3200, text: {
      ko: { label: '제출', tip: '여기서 Submit을 누르면 끝입니다. 이메일로 PDF가 오면 저장해 두고, 공항에서는 여권만 제시하면 됩니다.',
            mistake: '제출 후 수정할 수 없습니다. 위에서 짚은 다섯 군데(이름 순서, 여권번호 0/O, 만료일, 도착일, 마지막 출발지)를 한 번 더 확인한 뒤 누르세요.' },
      en: { label: 'Submit', tip: 'Press Submit here and you are done. Save the PDF that arrives by email; at the airport you only show your passport.',
            mistake: 'You cannot edit after submitting. Re-check the five spots above (name order, 0/O in passport no., expiry date, arrival date, last port) first.' },
    }},

    // ---------- OUTRO ----------
    { type: 'card', hold: 4500, card: {
      ko: { id: 'outro', big: '끝', title: '이 다음은 이것만 준비하세요', subtitle: '📱 말레이시아 eSIM  ·  🚆 KLIA 익스프레스  ·  🏨 호텔\n링크는 설명란 맨 위에 있습니다',
            chips: ['공식 MDAC 사이트는 설명란 첫 줄', '구독하면 서식이 바뀔 때 최신판을 보내드립니다'] },
      en: { id: 'outro', big: 'Done', title: 'Next, you only need these', subtitle: '📱 Malaysia eSIM  ·  🚆 KLIA Ekspres  ·  🏨 Hotel\nLinks are at the top of the description',
            chips: ['Official MDAC link: first line of the description', 'Subscribe — we re-upload when the form changes'] },
    }},
  ],
};
