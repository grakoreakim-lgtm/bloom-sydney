// SGAC — Singapore SG Arrival Card (ICA)
// Official (free) site: https://eservices.ica.gov.sg/sgarrivalcard  (also the MyICA mobile app)
//
// ⚠ "live" selectors are best-effort guesses and MUST be verified against the real page before a live
//    recording (upload/verify-live.js captures the page and reports which selectors match).
//    The "mock" target is ../mock/sgac-form.html, which mirrors the field set.

const path = require('path');

// Sample traveller — obviously fake. Never use real personal data on camera.
const S = {
  name: 'GILDONG HONG',   // SGAC: given name followed by surname (unlike MDAC)
  passport: 'M12345678',
  nationality: 'KOR',
  dob: '15/05/1990',
  sex: 'M',
  passportExpiry: '31/12/2031',
  residence: 'KOR',
  email: 'sample.traveller@example.com',
  phoneCode: '82',
  phone: '1012345678',
  arrival: '20/12/2026',
  mode: 'AIR',
  flight: 'SQ601',
  lastCity: 'SEOUL',
  purpose: 'HOLIDAY',
  accommodation: 'HOTEL',
  postal: '018956',
  address: '10 BAYFRONT AVENUE',
  departure: '24/12/2026',
};

const route = { from: 'ICN', fromCity: 'SEOUL', to: 'SIN', toCity: 'SINGAPORE' };

module.exports = {
  id: 'sgac',
  pack: 'arrival-card',
  country: { ko: '싱가포르', en: 'Singapore' }, flag: '🇸🇬',
  fee: '무료', when: '도착 3일 전', captcha: false,
  title: { ko: '싱가포르 입국카드 (SG Arrival Card)', en: 'Singapore SG Arrival Card' },
  videoTitle: { ko: '싱가포르 입국카드 SG Arrival Card 작성법 {year} | 5분 따라하기', en: 'SG Arrival Card Step-by-Step {year} | Singapore | Copy My Screen' },

  url: {
    mock: 'file://' + path.join(__dirname, '..', 'mock', 'sgac-form.html'),
    live: 'https://eservices.ica.gov.sg/arrivalcard/sgac',
  },
  // live only: clicks that lead from the landing page into the form (verified 2026-11 via verify-live)
  livePre: [{ click: 'text="Fill in Manually" >> nth=1' }],

  selectors: {
    mock: {
      name: '#name', passport: '#passport', nationality: '#nationality', dob: '#dob', sex: '#sex', passportExpiry: '#passportExpiry',
      residence: '#residence', email: '#email', phoneCode: '#phoneCode', phone: '#phone',
      arrival: '#arrival', mode: '#mode', flight: '#flight', lastCity: '#lastCity', purpose: '#purpose', accommodation: '#accommodation',
      postal: '#postal', address: '#address', departure: '#departure', yfNo: '#yfNo', symNo: '#symNo', yfRow: '#yfRow', symRow: '#symRow', agree: '#agree', submit: '#submit',
    },
    // TODO verify on the real page before a live recording (node upload/verify-live.js sgac)
    live: {
      name: 'input[name*="name" i]', passport: 'input[name*="passport" i]', nationality: 'select[name*="national" i]',
      dob: 'input[name*="birth" i]', sex: 'select[name*="sex" i], select[name*="gender" i]', passportExpiry: 'input[name*="expir" i]',
      residence: 'select[name*="residen" i]', email: 'input[type="email"]', phoneCode: 'select[name*="code" i]', phone: 'input[name*="mobile" i], input[type="tel"]',
      arrival: 'input[name*="arriv" i]', mode: 'select[name*="mode" i]', flight: 'input[name*="flight" i], input[name*="vessel" i]',
      lastCity: 'select[name*="embark" i], input[name*="embark" i]', purpose: 'select[name*="purpose" i]', accommodation: 'select[name*="accommodation" i]',
      postal: 'input[name*="postal" i]', address: 'input[name*="address" i]', departure: 'input[name*="depart" i]',
      yfRow: 'fieldset >> nth=0', symRow: 'fieldset >> nth=1', yfNo: 'input[type="radio"][value="N"]', symNo: 'input[type="radio"][value="N"] >> nth=1', agree: 'input[type="checkbox"]', submit: 'button[type="submit"]',
    },
  },

  strings: {
    ko: { easyPill: '👀 화면 그대로 따라만 하세요', mistakeTitle: '⚠ 많이 틀리는 곳', pause: '⏸ 여기까지 입력하세요', pauseSub: '다 치고 나서 재생' },
    en: { easyPill: '👀 Just copy the screen', mistakeTitle: '⚠ Common mistake', pause: '⏸ Type this, then press play', pauseSub: '' },
  },

  steps: [
    // ---------- INTRO (ticket) ----------
    { type: 'card', hold: 4500, card: {
      ko: { id: 'intro', speech: '싱가포르 가시죠? 도착하기 사흘 전부터 입국카드를 온라인으로 내야 해요. 에스지 어라이벌 카드라고 하는데, 무료고, 오 분이면 끝나요. 화면 그대로 따라 치시면 되고, 많이 틀리는 곳에서는 제가 잠깐 멈출게요.',
            route, title: '싱가포르 입국카드,\n**화면 그대로 따라 하면 끝**', subtitle: '실제 신청 화면 그대로. 틀리기 쉬운 곳에서 멈춥니다.',
            meta: [{ k: '소요', v: '5분' }, { k: '비용', v: '무료' }, { k: '제출', v: '도착 3일 전' }, { k: '기준', v: '2026' }], stamp: '따라\n하면\n끝', flag: '🇸🇬',
            rightTitle: 'SG Arrival Card', rightText: '준비물: 여권 · 항공편 · 숙소 우편번호\n돈 내라는 사이트는 전부 가짜', brand: '▶ 따라하면 끝 · 입국신고서·비자' },
      en: { id: 'intro', speech: 'Flying to Singapore? Within three days before you land, you need to file the SG Arrival Card online. It is free, and it takes about five minutes. Copy what I type, and I will pause at the spots people usually get wrong.',
            route, title: 'SG Arrival Card,\n**copy the screen and you are done**', subtitle: 'The real application page, step by step. We stop where people slip up.',
            meta: [{ k: 'TIME', v: '5 min' }, { k: 'FEE', v: 'Free' }, { k: 'WHEN', v: '3 days before' }, { k: 'YEAR', v: '2026' }], stamp: 'COPY\nMY\nSCREEN', flag: '🇸🇬',
            rightTitle: 'SG Arrival Card', rightText: 'Need: passport · flight · hotel postal code\nAny site asking for money is fake', brand: '▶ Copy My Screen · Arrival Cards & Visas' },
    }},

    // ---------- PERSONAL ----------
    { type: 'type', field: 'name', value: S.name, text: {
      ko: { label: '이름', speech: { tip: '이름이에요. 싱가포르는 이름을 먼저, 성을 나중에 써요. 칸 안에도 기븐 네임 다음에 서네임이라고 적혀 있어요.', mistake: '여기서 정말 많이 틀려요. 말레이시아 신고서는 성이 먼저였는데, 싱가포르는 반대예요. 홍길동이면 길동, 띄어쓰기, 홍. 철자는 여권 영문 그대로요.' },
            tip: '**이름 먼저, 성 나중** (Given name → Surname)', mistake: '말레이시아(MDAC)와 순서가 반대입니다. 철자는 여권 영문 그대로.', bad: 'HONG GILDONG', good: 'GILDONG HONG' },
      en: { label: 'Full name', speech: { tip: 'Full name. Singapore asks for your given name first, then your surname. The box even says given name followed by surname.', mistake: 'This trips people up, especially if you just did the Malaysia card, which wants the surname first. Given name, space, surname, spelled exactly as in your passport.' },
            tip: '**Given name first, then surname**', mistake: 'Opposite order to the Malaysia MDAC. Spelling exactly as in your passport.', bad: 'HONG GILDONG', good: 'GILDONG HONG' },
    }},
    { type: 'type', field: 'passport', value: S.passport, text: {
      ko: { label: '여권번호', speech: { tip: '여권번호예요. 띄어쓰기 없이요.', mistake: '숫자 영이랑 영문 오, 숫자 일이랑 영문 아이가 헷갈려요. 여권을 확대해서 한 글자씩 확인하세요.' },
            tip: '**띄어쓰기 없이** 영문·숫자만', mistake: '0과 O, 1과 I를 헷갈리기 쉽습니다.', bad: 'M 1234 5678', good: 'M12345678' },
      en: { label: 'Passport number', speech: { tip: 'Passport number, no spaces.', mistake: 'Zero and O, one and I, are easy to mix up. Zoom in on your passport and check each character.' },
            tip: '**No spaces**', mistake: 'Zero vs O and one vs I are easy to mix up.', bad: 'M 1234 5678', good: 'M12345678' },
    }},
    { type: 'select', field: 'nationality', value: S.nationality, text: {
      ko: { label: '국적', speech: { tip: '국적은 여권 발급 국가예요. 한국은 코리아, 사우스로 되어 있어요.' }, tip: '한국은 **KOREA, SOUTH**' },
      en: { label: 'Nationality', speech: { tip: 'Nationality is the country that issued your passport.' }, tip: 'The country that **issued your passport**' },
    }},
    { type: 'type', field: 'dob', value: S.dob, text: {
      ko: { label: '생년월일', speech: { tip: '생년월일은 일, 월, 년 순서예요. 일이 먼저예요.' }, tip: '**일/월/년** 순서' },
      en: { label: 'Date of birth', speech: { tip: 'Date of birth, day, month, year.' }, tip: '**Day / month / year**' },
    }},
    { type: 'select', field: 'sex', value: S.sex, text: {
      ko: { label: '성별', speech: { tip: '성별은 여권대로요.' }, tip: '여권에 적힌 대로' },
      en: { label: 'Sex', speech: { tip: 'Sex, as in your passport.' }, tip: 'As in your passport' },
    }},
    { type: 'type', field: 'passportExpiry', value: S.passportExpiry, text: {
      ko: { label: '여권 만료일', speech: { tip: '여권 만료일이에요. 싱가포르는 입국일 기준 여섯 달 이상 남아 있어야 해요.', mistake: '발급일을 넣는 분이 많아요. 데이트 오브 익스파이어리, 만료일이에요.' },
            tip: '입국일 기준 **6개월 이상** 남아 있어야', mistake: '발급일(Date of issue)이 아니라 만료일입니다.', bad: 'Date of issue', good: 'Date of EXPIRY' },
      en: { label: 'Passport expiry', speech: { tip: 'Passport expiry date. Singapore needs at least six months left.', mistake: 'People often type the issue date. You want the date of expiry.' },
            tip: 'Needs **6+ months** left', mistake: 'It is the expiry date, not the issue date.', bad: 'Date of issue', good: 'Date of EXPIRY' },
    }},
    { type: 'select', field: 'residence', value: S.residence, text: {
      ko: { label: '거주 국가', speech: { tip: '거주 국가는 지금 사는 나라예요.', mistake: '국적이랑 헷갈리는 분이 있어요. 한국 여권인데 호주에 살고 계시면 호주를 고르셔야 해요.' },
            tip: '지금 **사는 나라**', mistake: '국적이 아니라 실제 거주 국가입니다.', bad: '국적을 그대로', good: '실제로 사는 나라' },
      en: { label: 'Country of residence', speech: { tip: 'Country of residence is where you live now.', mistake: 'This is not always your nationality. If you hold a Korean passport but live in Australia, choose Australia.' },
            tip: 'Where you **live now**', mistake: 'Residence is not always your nationality.', bad: 'nationality by default', good: 'where you actually live' },
    }},
    { type: 'type', field: 'email', value: S.email, text: {
      ko: { label: '이메일', speech: { tip: '이메일이에요. 제출 확인 메일이 여기로 와요. 공항에서 열어볼 수 있는 메일로 적어 주세요.' }, tip: '확인 메일이 옵니다. **공항에서 열 수 있는 메일**로' },
      en: { label: 'Email', speech: { tip: 'Email. The confirmation comes here, so use an inbox you can open at the airport.' }, tip: 'Use an inbox you can **open at the airport**' },
    }},
    { type: 'select', field: 'phoneCode', value: S.phoneCode, text: {
      ko: { label: '국가번호', speech: { tip: '휴대폰 국가번호예요. 한국은 플러스 팔십이.' }, tip: '한국은 **+82**' },
      en: { label: 'Country code', speech: { tip: 'Your mobile country code.' }, tip: 'Your **country code**' },
    }},
    { type: 'type', field: 'phone', value: S.phone, text: {
      ko: { label: '휴대폰 번호', speech: { tip: '번호는 맨 앞 영을 빼고 쳐 주세요.', mistake: '공일공으로 시작하면 안 돼요. 국가번호를 이미 골랐으니까, 일공 일이삼사 오륙칠팔, 이렇게요.' },
            tip: '맨 앞 **0 빼고**', mistake: '국가번호를 따로 골랐으니 앞의 0은 뺍니다.', bad: '01012345678', good: '1012345678' },
      en: { label: 'Mobile number', speech: { tip: 'Your number without the leading zero.', mistake: 'Since you already chose the country code, drop the first zero of your number.' },
            tip: 'Drop the **leading 0**', mistake: 'The country code is separate, so drop the first zero.', bad: '01012345678', good: '1012345678' },
    }},

    // ---------- TRIP ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'trip', speech: '이제 여행 정보예요. 항공권 예약 확인서랑 숙소 예약서를 옆에 켜 두세요.', route, title: '여행 정보', subtitle: '항공권·숙소 예약 확인서를 옆에 두고 입력하세요', flag: '✈️', rightTitle: '2 / 3', rightText: '도착일 · 항공편 · 출발 도시\n여행 목적 · 숙소 · 출국일' },
      en: { id: 'trip', speech: 'Now the trip details. Keep your flight and hotel bookings open next to you.', route, title: 'Trip details', subtitle: 'Keep your flight and hotel bookings next to you', flag: '✈️', rightTitle: '2 / 3', rightText: 'Arrival · flight · last city\npurpose · stay · departure' },
    }},
    { type: 'type', field: 'arrival', value: S.arrival, text: {
      ko: { label: '도착일', speech: { tip: '싱가포르에 내리는 날짜예요. 실제 화면에서는 오늘, 내일, 모레 세 날짜 중에서 고르게 되어 있어요.', mistake: '밤 비행기면 출발일 말고 도착일이에요. 그리고 고를 수 있는 날짜가 사흘뿐이라, 도착일이 목록에 없으면 아직 낼 때가 아닌 거예요. 너무 일찍 하려고 하지 마세요.' },
            tip: '싱가포르에 **내리는 날짜**', mistake: '도착일 기준 **3일 전부터만** 제출 가능합니다.', bad: '출발일', good: '현지 도착일' },
      en: { label: 'Date of arrival', speech: { tip: 'The date you land in Singapore.', mistake: 'For an overnight flight, use the arrival date. And you can only submit within three days before you arrive.' },
            tip: 'The date you **land**', mistake: 'Only within **3 days** before arrival.', bad: 'departure date', good: 'local arrival date' },
    }},
    { type: 'select', field: 'mode', value: S.mode, text: {
      ko: { label: '교통수단', speech: { tip: '비행기면 에어. 말레이시아에서 버스로 넘어오시면 랜드예요.' }, tip: '비행기 **AIR**, 육로 LAND' },
      en: { label: 'Mode of travel', speech: { tip: 'Air for flights. Land if you come in from Malaysia by bus.' }, tip: '**AIR**, or LAND by bus' },
    }},
    { type: 'type', field: 'flight', value: S.flight, text: {
      ko: { label: '항공편', speech: { tip: '항공편명은 항공사 코드랑 번호를 붙여서요.', mistake: '싱가포르에 실제로 내리는 비행기 편명이에요. 경유하면 두 번째 비행기요.' },
            tip: '코드+번호 **붙여서**', mistake: '싱가포르에 내리는 마지막 편명입니다.', bad: 'SQ 601', good: 'SQ601' },
      en: { label: 'Flight number', speech: { tip: 'Airline code and number, no space.', mistake: 'Use the flight that actually lands in Singapore. With a connection, that is the second leg.' },
            tip: 'Code + number, **no space**', mistake: 'The flight that lands in Singapore.', bad: 'SQ 601', good: 'SQ601' },
    }},
    { type: 'select', field: 'lastCity', value: S.lastCity, text: {
      ko: { label: '마지막 출발 도시', speech: { tip: '싱가포르로 오는 비행기를 탄 도시예요.', mistake: '경유하셨으면 갈아탄 도시예요. 쿠알라룸푸르에서 갈아타셨으면 서울이 아니라 쿠알라룸푸르.' },
            tip: '싱가포르행 비행기를 **탄 도시**', mistake: '경유했다면 환승 도시입니다.', bad: '서울(경유 시)', good: '마지막 탑승 도시' },
      en: { label: 'Last city of embarkation', speech: { tip: 'The city where you boarded the flight to Singapore.', mistake: 'If you connected, it is the transit city, not your home city.' },
            tip: 'Where you **boarded** for Singapore', mistake: 'With a connection, it is the transit city.', bad: 'home city (if transiting)', good: 'last city you boarded at' },
    }},
    { type: 'select', field: 'purpose', value: S.purpose, text: {
      ko: { label: '여행 목적', speech: { tip: '여행 목적은 실제 목적대로 고르세요. 관광이면 홀리데이.' }, tip: '**실제 목적**대로' },
      en: { label: 'Purpose of travel', speech: { tip: 'Pick your actual purpose. Holiday for tourism.' }, tip: 'Your **actual purpose**' },
    }},
    { type: 'select', field: 'accommodation', value: S.accommodation, text: {
      ko: { label: '숙소 유형', speech: { tip: '숙소 유형이에요. 호텔이면 호텔.' }, tip: '호텔이면 **HOTEL**' },
      en: { label: 'Accommodation', speech: { tip: 'Type of accommodation. Hotel if it is a hotel.' }, tip: '**HOTEL** for hotels' },
    }},
    { type: 'type', field: 'postal', value: S.postal, text: {
      ko: { label: '우편번호', speech: { tip: '숙소 우편번호예요. 싱가포르는 여섯 자리예요.', mistake: '여기서 많이 막혀요. 예약서에 우편번호가 없으면 호텔 이름 뒤에 싱가포르 포스탈 코드라고 검색하면 바로 나와요. 여섯 자리 숫자예요.' },
            tip: '싱가포르 우편번호는 **6자리**', mistake: '예약서에 없으면 "호텔명 Singapore postal code"로 검색하세요.', bad: '18956', good: '018956' },
      en: { label: 'Postal code', speech: { tip: 'Postal code of where you stay. Singapore uses six digits.', mistake: 'People get stuck here. If your booking does not show it, search the hotel name plus Singapore postal code. Six digits.' },
            tip: 'Singapore postcodes are **6 digits**', mistake: 'Not on your booking? Search "hotel name Singapore postal code".', bad: '18956', good: '018956' },
    }},
    { type: 'type', field: 'address', value: S.address, text: {
      ko: { label: '주소', speech: { tip: '주소는 예약서에 있는 영문 주소 그대로요.' }, tip: '예약서의 **영문 주소** 그대로' },
      en: { label: 'Address', speech: { tip: 'The address from your booking.' }, tip: 'As on your **booking**' },
    }},
    { type: 'type', field: 'departure', value: S.departure, text: {
      ko: { label: '출국일', speech: { tip: '싱가포르를 떠나는 날짜예요.' }, tip: '싱가포르를 **떠나는 날짜**' },
      en: { label: 'Date of departure', speech: { tip: 'The date you leave Singapore.' }, tip: 'The date you **leave**' },
    }},

    // ---------- HEALTH ----------
    { type: 'radio', field: 'yfNo', hl: 'yfRow', text: {
      ko: { label: '건강 신고 ①', speech: { tip: '건강 신고예요. 지난 엿새 동안 황열병 위험 국가에 다녀오셨는지 묻는 거예요. 한국에서 바로 오시면 아니요.', mistake: '아프리카나 남미를 거쳐 오셨으면 예를 고르셔야 해요. 거짓으로 답하면 안 돼요. 예라고 하면 접종 증명서를 요구할 수 있어요.' },
            tip: '최근 6일 **황열병 위험국** 방문 여부', mistake: '아프리카·남미 경유라면 사실대로 "예"를 고르세요.' },
      en: { label: 'Health ①', speech: { tip: 'Health declaration. Have you been to a yellow fever risk country in the past six days? Coming straight from Korea, that is no.', mistake: 'If you came through Africa or South America, answer yes. Answer truthfully. You may be asked for a vaccination certificate.' },
            tip: 'Yellow fever countries, **past 6 days**', mistake: 'Via Africa or South America? Answer yes, truthfully.' },
    }},
    { type: 'radio', field: 'symNo', hl: 'symRow', text: {
      ko: { label: '건강 신고 ②', speech: { tip: '지금 열, 기침, 숨가쁨, 발진이 있는지예요. 사실대로 고르세요.' }, tip: '현재 증상 **사실대로**' },
      en: { label: 'Health ②', speech: { tip: 'Do you have fever, cough, shortness of breath or a rash right now? Answer truthfully.' }, tip: 'Current symptoms, **truthfully**' },
    }},

    // ---------- SUBMIT ----------
    { type: 'check', field: 'agree', text: {
      ko: { label: '동의', speech: { tip: '체크해 주세요.' }, tip: '체크' },
      en: { label: 'Declaration', speech: { tip: 'Tick the box.' }, tip: 'Tick the box' },
    }},
    { type: 'stop', field: 'submit', tipHold: 3200, text: {
      ko: { label: '제출', speech: { tip: '여기서 제출을 누르면 끝이에요.', mistake: '제출하면 확인 메일이 와요. 공항에서는 보통 여권만 내면 되는데, 혹시 모르니 메일은 휴대폰에 남겨 두세요. 그리고 일행이 있으면 한 명씩 따로 내야 해요.' },
            tip: 'Submit 누르면 **끝**', mistake: '일행은 **한 명씩 각각** 제출해야 합니다.' },
      en: { label: 'Submit', speech: { tip: 'Press submit and you are done.', mistake: 'A confirmation email arrives. At the airport you usually only show your passport, but keep the email on your phone. And every traveller needs their own card.' },
            tip: 'Press submit, **done**', mistake: 'Every traveller files **their own** card.' },
    }},

    // ---------- OUTRO (ticket) ----------
    { type: 'card', hold: 5000, card: {
      ko: { id: 'outro', speech: '끝났어요. 확인 메일은 휴대폰에 저장해 두세요. 창이공항은 한국 여권이면 자동출입국 게이트로 바로 나갈 수 있어요. 다음은 싱가포르 이심 개통이랑 말레이시아 입국신고서예요. 설명란에 링크 있습니다.',
            route, title: '끝. **이제 이것만 준비하세요**', subtitle: '확인 메일은 휴대폰에 저장. 한국 여권은 창이공항 자동출입국 게이트 이용 가능.',
            meta: [{ k: '설명란 1줄', v: '공식 사이트' }, { k: '설명란 2줄', v: 'eSIM' }, { k: '설명란 3줄', v: '공항 이동' }], stamp: '제출\n완료', flag: '🇸🇬',
            rightTitle: '다음 영상', rightText: '', next: ['📱 싱가포르 eSIM 5분 개통', '🇲🇾 말레이시아 입국신고서 MDAC', '🔔 서식 바뀌면 최신판 알림'], brand: '▶ 따라하면 끝 · 입국신고서·비자' },
      en: { id: 'outro', speech: 'Done. Keep the confirmation email on your phone. Next up: a Singapore eSIM in five minutes, and the Malaysia arrival card. Links are in the description.',
            route, title: 'Done. **Only these left**', subtitle: 'Keep the confirmation email on your phone.',
            meta: [{ k: 'LINE 1', v: 'Official site' }, { k: 'LINE 2', v: 'eSIM' }, { k: 'LINE 3', v: 'Transfer' }], stamp: 'SUB\nMITTED', flag: '🇸🇬',
            rightTitle: 'Up next', rightText: '', next: ['📱 Singapore eSIM in 5 min', '🇲🇾 Malaysia Arrival Card (MDAC)', '🔔 Subscribe for updates'], brand: '▶ Copy My Screen' },
    }},
  ],
};
