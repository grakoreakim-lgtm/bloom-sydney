// TDAC — Thailand Digital Arrival Card (Immigration Bureau, Royal Thai Police)
// Official (free) site: https://tdac.immigration.go.th/   (manual: https://tdac.immigration.go.th/manual/en/)
// Mandatory for foreign nationals entering Thailand since 1 May 2025 (replaced the paper TM6).
// Submit within 3 days before arrival. Free on the official site; paid look-alike sites exist.
//
// ⚠ "live" selectors are best-effort guesses and MUST be verified against the real page before a live
//    recording (upload/verify-live.js captures the page and reports which selectors match).
//    The "mock" target is ../mock/tdac-form.html, which mirrors the field set and English labels.
//    The recording never fills the human-verification check and never clicks Submit.

const path = require('path');

// Sample traveller — obviously fake. Never use real personal data on camera.
const S = {
  familyName: 'HONG',
  firstName: 'GILDONG',
  passport: 'M12345678',
  nationality: 'KOR',
  dob: '15/05/1990',
  occupation: 'OFFICE WORKER',
  gender: 'MALE',
  residence: 'KOR',
  city: 'SEOUL',
  phone: '1012345678',
  arrival: '20/12/2026',
  boarded: 'KOR',
  purpose: 'HOLIDAY',
  travelMode: 'AIR',
  flight: 'TG657',
  accType: 'HOTEL',
  province: 'BANGKOK',
  district: 'KHLONG TOEI',
  subDistrict: 'KHLONG TOEI NUEA',
  address: 'SAMPLE HOTEL BANGKOK, 99 SUKHUMVIT ROAD',   // fictional hotel
  health: ['KOR'],
  email: 'sample.traveller@example.com',
};

const route = { from: 'ICN', fromCity: 'SEOUL', to: 'BKK', toCity: 'BANGKOK' };

module.exports = {
  id: 'tdac',
  pack: 'arrival-card',
  country: { ko: '태국', en: 'Thailand' }, flag: '🇹🇭',
  fee: '무료', when: '도착 3일 전', captcha: true,   // the real site shows a "verify you are human" check
  title: { ko: '태국 디지털 입국카드 (TDAC)', en: 'Thailand Digital Arrival Card (TDAC)' },
  videoTitle: { ko: '태국 입국신고서 TDAC 작성법 {year} | 5분 따라하기', en: 'Thailand Digital Arrival Card (TDAC) Step-by-Step {year} | Copy My Screen' },

  url: {
    mock: 'file://' + path.join(__dirname, '..', 'mock', 'tdac-form.html'),
    live: 'https://tdac.immigration.go.th/',
  },
  // live only: clicks that lead from the landing page into the form — TODO verify (node upload/verify-live.js tdac)
  livePre: [{ click: 'text=/Arrival Card/i' }],

  selectors: {
    mock: {
      familyName: '#familyName', firstName: '#firstName', middleName: '#middleName', passport: '#passport', nationality: '#nationality',
      dob: '#dob', occupation: '#occupation', gender: '#gender', visa: '#visa', residence: '#residence', city: '#city',
      phoneCode: '#phoneCode', phone: '#phone',
      arrival: '#arrival', boarded: '#boarded', purpose: '#purpose', travelMode: '#travelMode', transportMode: '#transportMode',
      flight: '#flight', departure: '#departure', depFlight: '#depFlight', transit: '#transit',
      accType: '#accType', province: '#province', district: '#district', subDistrict: '#subDistrict', postcode: '#postcode', address: '#address',
      health: '#health', healthRow: '#healthRow', email: '#email', captcha: '#captcha', submit: '#submit',
    },
    // TODO verify on the real page before a live recording (node upload/verify-live.js tdac)
    live: {
      familyName: 'input[formcontrolname*="family" i], input[name*="family" i], input[id*="family" i]',
      firstName: 'input[formcontrolname*="first" i], input[name*="first" i], input[id*="first" i]',
      middleName: 'input[formcontrolname*="middle" i], input[name*="middle" i]',
      passport: 'input[formcontrolname*="passport" i], input[name*="passport" i]',
      nationality: '[formcontrolname*="national" i], [name*="national" i]',
      dob: 'input[formcontrolname*="birth" i], input[name*="birth" i], input[id*="dob" i]',
      occupation: 'input[formcontrolname*="occupation" i], input[name*="occupation" i]',
      gender: '[formcontrolname*="gender" i], [name*="gender" i]',
      visa: 'input[formcontrolname*="visa" i], input[name*="visa" i]',
      residence: '[formcontrolname*="countryResi" i], [name*="residence" i]',
      city: '[formcontrolname*="city" i], [name*="city" i]',
      phoneCode: '[formcontrolname*="phoneCode" i], [name*="code" i]',
      phone: 'input[formcontrolname*="phone" i], input[type="tel"]',
      arrival: 'input[formcontrolname*="arrDate" i], input[name*="arriv" i]',
      boarded: '[formcontrolname*="board" i], [name*="board" i]',
      purpose: '[formcontrolname*="purpose" i], [name*="purpose" i]',
      travelMode: '[formcontrolname*="travelMode" i], [name*="travelMode" i]',
      transportMode: '[formcontrolname*="transport" i], [name*="transport" i]',
      flight: 'input[formcontrolname*="flight" i], input[name*="flight" i]',
      departure: 'input[formcontrolname*="depDate" i], input[name*="depart" i]',
      depFlight: 'input[formcontrolname*="depFlight" i]',
      transit: 'input[type="checkbox"][formcontrolname*="transit" i]',
      accType: '[formcontrolname*="accom" i][formcontrolname*="type" i], [name*="accommodationType" i]',
      province: '[formcontrolname*="province" i], [name*="province" i]',
      district: '[formcontrolname*="district" i]:not([formcontrolname*="sub" i]), [name="district"]',
      subDistrict: '[formcontrolname*="subDistrict" i], [name*="subDistrict" i]',
      postcode: 'input[formcontrolname*="post" i], input[name*="post" i]',
      address: 'textarea[formcontrolname*="address" i], input[formcontrolname*="address" i], [name*="address" i]',
      health: '[formcontrolname*="countr" i][formcontrolname*="visit" i], [name*="visited" i]',
      healthRow: 'text=/two weeks before arrival/i >> xpath=..',
      email: 'input[type="email"], input[formcontrolname*="email" i]',
      captcha: '.cf-turnstile, iframe[src*="challenges.cloudflare"], .g-recaptcha',
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
      ko: { id: 'intro', speech: '태국 가시죠? 이제 종이 입국카드는 없어졌고요, 도착하기 사흘 전부터 온라인으로 티닥을 내야 해요. 공식 사이트에서는 완전 무료예요. 돈 내라는 사이트는 전부 대행이거나 가짜고요. 화면 그대로 따라 치시면 되고, 많이 틀리는 여섯 군데에서는 제가 잠깐 멈출게요.',
            route, title: '태국 입국카드 TDAC,\n**화면 그대로 따라 하면 끝**', subtitle: '실제 신청 화면 그대로. 틀리기 쉬운 6곳에서 멈춥니다.',
            meta: [{ k: '소요', v: '5분' }, { k: '비용', v: '무료' }, { k: '제출', v: '도착 3일 전' }, { k: '기준', v: '2026' }], stamp: '따라\n하면\n끝', flag: '🇹🇭',
            rightTitle: 'Thailand Digital Arrival Card', rightText: '준비물: 여권 · 항공편 · 첫날 숙소 주소\n공식: tdac.immigration.go.th (무료)', brand: '▶ 따라하면 끝 · 입국신고서·비자' },
      en: { id: 'intro', speech: 'Flying to Thailand? The paper arrival card is gone. Now you file the TDAC online, within three days before you land. On the official site it is completely free. Any site asking for money is an agent or a fake. Copy what I type, and I will pause at the six spots people usually get wrong.',
            route, title: 'Thailand Arrival Card (TDAC),\n**copy the screen and you are done**', subtitle: 'The real application page, step by step. We stop at the 6 spots people get wrong.',
            meta: [{ k: 'TIME', v: '5 min' }, { k: 'FEE', v: 'Free' }, { k: 'WHEN', v: '3 days before' }, { k: 'YEAR', v: '2026' }], stamp: 'COPY\nMY\nSCREEN', flag: '🇹🇭',
            rightTitle: 'Thailand Digital Arrival Card', rightText: 'Need: passport · flight · first-night address\nOfficial: tdac.immigration.go.th (free)', brand: '▶ Copy My Screen · Arrival Cards & Visas' },
    }},

    // ---------- PERSONAL ----------
    { type: 'type', field: 'familyName', value: S.familyName, text: {
      ko: { label: '성 (Family Name)', speech: { tip: '먼저 이름이에요. 티닥은 성, 이름, 미들 네임 칸이 따로 있어요. 첫 칸 패밀리 네임에는 성만 쳐요. 홍.', mistake: '여기서 정말 많이 틀려요. 성 칸에 홍길동을 통째로 넣거나, 성이랑 이름을 바꿔 넣는 거예요. 성 칸에는 홍, 이름 칸에는 길동. 미들 네임은 여권에 없으면 비워 두세요. 그리고 이름은 제출하고 나면 못 고쳐요. 틀리면 처음부터 다시 내야 해요.' },
            tip: '**성만** 입력 (여권 Surname 칸 그대로)', mistake: '성·이름을 한 칸에 몰아 쓰거나 순서를 바꾸면 안 됩니다. 이름은 **제출 후 수정 불가** → 새로 제출해야 합니다.', bad: 'HONG GILDONG (한 칸에)', good: 'HONG / GILDONG' },
      en: { label: 'Family name', speech: { tip: 'First, your name. The TDAC has separate boxes for family name, first name and middle name. The first box takes your family name only.', mistake: 'This is where people slip. Do not put your whole name in one box, and do not swap the two. Family name here, first name in the next box. Leave middle name empty unless your passport shows one. And your name cannot be edited after you submit. A mistake means filing a brand new card.' },
            tip: '**Family name only**, as in your passport', mistake: 'Do not put your full name in one box or swap the order. Names **cannot be edited** later; you would have to file again.', bad: 'HONG GILDONG (one box)', good: 'HONG / GILDONG' },
    }},
    { type: 'type', field: 'firstName', value: S.firstName, text: {
      ko: { label: '이름 (First Name)', speech: { tip: '퍼스트 네임에는 이름이요. 길동. 여권 영문 철자 그대로, 띄어쓰기 없이요.' }, tip: '이름(Given name)만, **여권 철자 그대로**' },
      en: { label: 'First name', speech: { tip: 'First name here, spelled exactly as in your passport.' }, tip: 'Given name, **exactly as in your passport**' },
    }},
    { type: 'type', field: 'passport', value: S.passport, text: {
      ko: { label: '여권번호', speech: { tip: '여권번호예요. 띄어쓰기 없이요. 숫자 영이랑 영문 오, 헷갈리지 않게 한 글자씩 보세요.' }, tip: '**띄어쓰기 없이**, 0과 O 구분' },
      en: { label: 'Passport number', speech: { tip: 'Passport number, no spaces. Watch out for zero versus the letter O.' }, tip: '**No spaces**, zero vs O' },
    }},
    { type: 'select', field: 'nationality', value: S.nationality, text: {
      ko: { label: '국적', speech: { tip: '국적은 여권 발급 국가예요. 한국은 코리아, 리퍼블릭 오브.' }, tip: '한국은 **KOREA, REPUBLIC OF**' },
      en: { label: 'Nationality', speech: { tip: 'Nationality is the country that issued your passport.' }, tip: 'The country that **issued your passport**' },
    }},
    { type: 'type', field: 'dob', value: S.dob, text: {
      ko: { label: '생년월일', speech: { tip: '생년월일은 여권대로요. 화면에 보이는 순서, 일, 월, 년으로 넣어 주세요. 실제 화면에서는 달력에서 골라도 돼요.' }, tip: '화면 순서 그대로 (**일/월/년**)' },
      en: { label: 'Date of birth', speech: { tip: 'Date of birth, as in your passport, in the order the box shows. On the real page you can also pick it from a calendar.' }, tip: 'In the order shown (**day / month / year**)' },
    }},
    { type: 'type', field: 'occupation', value: S.occupation, text: {
      ko: { label: '직업', speech: { tip: '직업은 영어로 짧게 쓰면 돼요. 회사원이면 오피스 워커, 학생이면 스튜던트, 주부면 하우스와이프요.' }, tip: '영어로 짧게: **OFFICE WORKER**, STUDENT…' },
      en: { label: 'Occupation', speech: { tip: 'Occupation, in English, kept short. Office worker, student, retired, that kind of thing.' }, tip: 'Short, in English: **OFFICE WORKER**, STUDENT…' },
    }},
    { type: 'select', field: 'gender', value: S.gender, text: {
      ko: { label: '성별', speech: { tip: '성별은 여권대로요.' }, tip: '여권에 적힌 대로' },
      en: { label: 'Gender', speech: { tip: 'Gender, as in your passport.' }, tip: 'As in your passport' },
    }},
    { type: 'select', field: 'residence', value: S.residence, text: {
      ko: { label: '거주 국가', speech: { tip: '거주 국가는 지금 사는 나라예요. 비자 번호 칸은 태국 비자가 있을 때만 쓰니까, 무비자면 비워 두세요.' }, tip: '지금 **사는 나라** · 비자 번호는 무비자면 비워 둠' },
      en: { label: 'Country of residence', speech: { tip: 'Country of residence is where you live now. The visa number box is only for people holding a Thai visa. Visa exempt, leave it empty.' }, tip: 'Where you **live now** · leave Visa No. empty if visa-exempt' },
    }},
    { type: 'select', field: 'city', value: S.city, text: {
      ko: { label: '거주 도시', speech: { tip: '사는 도시예요. 목록에 없으면 맨 아래 아더스를 고르고 직접 쓰시면 돼요.' }, tip: '목록에 없으면 **OTHERS** 고르고 직접 입력' },
      en: { label: 'City of residence', speech: { tip: 'Your city. If it is not in the list, pick others and type it in.' }, tip: 'Not listed? Pick **OTHERS** and type it' },
    }},
    { type: 'type', field: 'phone', value: S.phone, text: {
      ko: { label: '전화번호', speech: { tip: '전화번호예요. 국가번호 플러스 팔십이를 고르고, 번호는 맨 앞 영을 빼고 쳐요. 일공 일이삼사 오륙칠팔.' }, tip: '+82 고르고 맨 앞 **0 빼고**' },
      en: { label: 'Phone number', speech: { tip: 'Phone number. Pick your country code, then type the number without its leading zero.' }, tip: 'Country code, then drop the **leading 0**' },
    }},

    // ---------- TRIP ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'trip', speech: '이제 여행 정보예요. 항공권 예약 확인서를 옆에 켜 두세요.', route, title: '여행 정보', subtitle: '항공권 예약 확인서를 옆에 두고 입력하세요', flag: '✈️', rightTitle: '2 / 4', rightText: '도착일 · 탑승 국가 · 여행 목적\n교통수단 · 항공편' },
      en: { id: 'trip', speech: 'Now the trip details. Keep your flight booking open next to you.', route, title: 'Trip details', subtitle: 'Keep your flight booking next to you', flag: '✈️', rightTitle: '2 / 4', rightText: 'Arrival · boarded in · purpose\nmode of travel · flight' },
    }},
    { type: 'type', field: 'arrival', value: S.arrival, text: {
      ko: { label: '도착일', speech: { tip: '태국에 내리는 날짜예요. 밤 비행기면 출발일 말고, 현지에 도착하는 날짜요.', mistake: '티닥은 도착일 기준 사흘 전부터만 낼 수 있어요. 일주일 전에 미리 하려고 하면 날짜가 안 골라져요. 반대로 공항 가서 하면 정신없으니까, 도착 사흘 전에서 전날 사이에 꼭 해 두세요.' },
            tip: '태국에 **내리는 날짜** (출발일 아님)', mistake: '도착일 기준 **3일 전부터만** 제출 가능. 너무 이르면 날짜 선택이 안 됩니다.', bad: '1주일 전에 미리', good: '도착 3일 전 ~ 전날' },
      en: { label: 'Date of arrival', speech: { tip: 'The date you land in Thailand. For an overnight flight, that is the local arrival date.', mistake: 'You can only file within three days before you arrive. Try a week early and the date simply will not be accepted. Do it between three days before and the day before your flight.' },
            tip: 'The date you **land** (not departure)', mistake: 'Only within **3 days** before arrival. Too early and the date is not accepted.', bad: 'a week early', good: '3 days before → day before' },
    }},
    { type: 'select', field: 'boarded', value: S.boarded, text: {
      ko: { label: '탑승 국가', speech: { tip: '태국 가는 비행기를 탄 나라예요. 인천에서 바로 가시면 코리아. 베트남에서 갈아타셨으면 베트남이에요.' }, tip: '태국행 비행기를 **탄 나라** (경유 시 환승국)' },
      en: { label: 'Country where you boarded', speech: { tip: 'The country where you boarded the flight into Thailand. With a connection, that is the transit country.' }, tip: 'Where you **boarded** for Thailand (transit country if connecting)' },
    }},
    { type: 'select', field: 'purpose', value: S.purpose, text: {
      ko: { label: '여행 목적', speech: { tip: '여행 목적이에요. 관광이면 홀리데이를 고르세요.' }, tip: '관광은 **HOLIDAY**' },
      en: { label: 'Purpose of travel', speech: { tip: 'Purpose of travel. Holiday for tourism.' }, tip: '**HOLIDAY** for tourism' },
    }},
    { type: 'select', field: 'travelMode', value: S.travelMode, text: {
      ko: { label: '교통수단', speech: { tip: '비행기면 에어. 옆 칸 교통 종류는 일반 항공편이면 커머셜 플라이트예요. 라오스나 말레이시아에서 육로로 넘어오시면 랜드고요.' }, tip: '비행기 **AIR** → COMMERCIAL FLIGHT' },
      en: { label: 'Mode of travel', speech: { tip: 'Air for flights, and commercial flight in the next box. Land if you cross from Laos or Malaysia by road.' }, tip: '**AIR** → COMMERCIAL FLIGHT' },
    }},
    { type: 'type', field: 'flight', value: S.flight, text: {
      ko: { label: '항공편명', speech: { tip: '항공편명은 코드랑 번호를 붙여서요. 티지 육오칠. 경유하면 태국에 실제로 내리는 비행기 편명이에요. 출국 정보는 아직 모르면 비워 둬도 돼요.' }, tip: '코드+번호 **붙여서** · 태국에 내리는 편명' },
      en: { label: 'Flight number', speech: { tip: 'Airline code and number, no space. With a connection, use the flight that lands in Thailand. Departure details can stay empty if you do not know them yet.' }, tip: 'Code + number, **no space** · the flight that lands in Thailand' },
    }},

    // ---------- ACCOMMODATION ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'stay', speech: '다음은 숙소예요. 첫날 묵는 호텔 예약서를 열어 두세요.', route, title: '태국 숙소 정보', subtitle: '첫날 묵는 숙소 예약서를 옆에 두세요', flag: '🏨', rightTitle: '3 / 4', rightText: '숙소 유형 · 주(Province)\n구 · 동 · 주소' },
      en: { id: 'stay', speech: 'Next, where you stay. Open the booking for your first night.', route, title: 'Accommodation', subtitle: 'Keep your first-night booking next to you', flag: '🏨', rightTitle: '3 / 4', rightText: 'Type · province\ndistrict · sub-district · address' },
    }},
    { type: 'select', field: 'accType', value: S.accType, text: {
      ko: { label: '숙소 유형', speech: { tip: '숙소 유형이에요. 호텔이면 호텔. 에어비앤비 같은 데면 아파트먼트나 아더스를 고르세요.' }, tip: '호텔이면 **HOTEL**' },
      en: { label: 'Type of accommodation', speech: { tip: 'Type of accommodation. Hotel for hotels. For a rental, pick apartment or others.' }, tip: '**HOTEL** for hotels' },
    }},
    { type: 'select', field: 'province', value: S.province, text: {
      ko: { label: '주 (Province)', speech: { tip: '숙소가 있는 주예요. 방콕은 그냥 방콕이에요.', mistake: '여기서 많이 막혀요. 파타야는 목록에 없어요. 촌부리를 고르셔야 해요. 푸껫은 푸껫, 사무이 섬은 수랏타니예요. 그리고 다음 칸 구랑 동을 대충 고르면 안 맞아요. 예약서 주소에 적힌 구 이름을 찾아서 고르세요.' },
            tip: '숙소가 있는 **주(Province)**', mistake: '파타야 → **CHON BURI**, 사무이 → SURAT THANI. 구·동은 예약서 주소에서 찾아 고르세요.', bad: 'PATTAYA', good: 'CHON BURI' },
      en: { label: 'Province', speech: { tip: 'The province your hotel is in. Bangkok is simply Bangkok.', mistake: 'People get stuck here. Pattaya is not a province, so pick Chon Buri. Koh Samui is Surat Thani. And do not guess the district below. Find it in the address on your booking.' },
            tip: 'The **province** of your hotel', mistake: 'Pattaya → **CHON BURI**, Koh Samui → SURAT THANI. Take the district from your booking address.', bad: 'PATTAYA', good: 'CHON BURI' },
    }},
    { type: 'select', field: 'district', value: S.district, text: {
      ko: { label: '구 (District)', speech: { tip: '주를 고르면 구 목록이 나와요. 예약서 주소에서 크롱토이처럼 구 이름을 찾아서 고르세요.' }, tip: '예약서 주소의 **구(Khet)** 이름' },
      en: { label: 'District', speech: { tip: 'Once the province is set, the district list appears. Pick the district from your booking address.' }, tip: 'The **district** from your booking' },
    }},
    { type: 'select', field: 'subDistrict', value: S.subDistrict, text: {
      ko: { label: '동 (Sub-District)', speech: { tip: '동을 고르면 우편번호는 자동으로 채워져요. 일공일일공, 이렇게 나오죠.' }, tip: '고르면 **우편번호 자동 입력**' },
      en: { label: 'Sub-district', speech: { tip: 'Pick the sub-district, and the post code fills in by itself.' }, tip: 'Post code **fills in automatically**' },
    }},
    { type: 'type', field: 'address', value: S.address, text: {
      ko: { label: '주소', speech: { tip: '주소는 호텔 이름이랑 도로명까지, 예약서 영문 주소 그대로 쓰세요. 방콕이라고만 쓰면 안 돼요.' }, tip: '**호텔 이름 + 도로명**, 예약서 영문 주소 그대로' },
      en: { label: 'Address', speech: { tip: 'Hotel name and street, copied from your booking. Not just Bangkok.' }, tip: '**Hotel name + street**, from your booking' },
    }},

    // ---------- HEALTH ----------
    { type: 'select', field: 'health', value: S.health, hl: 'healthRow', tipHold: 2600, text: {
      ko: { label: '건강 신고', speech: { tip: '건강 신고예요. 태국 도착 전 이 주 동안 머문 나라를 전부 골라요. 한국에서 바로 가시면 코리아 하나요.', mistake: '이거 비워 두거나 빠뜨리는 분이 많아요. 출발하는 나라도 꼭 넣고요, 여행 중에 다른 나라를 거쳤으면 그 나라도 다 넣어야 해요. 아프리카나 남미의 황열병 위험 국가를 다녀오셨으면, 예방접종 증명서를 따로 요구할 수 있어요.' },
            tip: '도착 전 **2주 동안 머문 나라 전부**', mistake: '출발 국가도 포함, 경유·여행한 나라도 모두. 황열병 위험국 방문 시 **접종 증명서** 요구 가능.', bad: '비워 둠', good: 'KOREA + 들른 나라 전부' },
      en: { label: 'Health declaration', speech: { tip: 'Health declaration. Pick every country where you stayed in the two weeks before arrival. Straight from Korea, that is just Korea.', mistake: 'People leave this out or forget countries. Include the country you depart from, plus every country you passed through. If you were in a yellow fever risk country in Africa or South America, you may be asked for a vaccination certificate.' },
            tip: 'Every country you stayed in, **past 2 weeks**', mistake: 'Include your departure country and every country on your trip. Yellow fever countries may need a **vaccination certificate**.', bad: 'left empty', good: 'KOREA + every country visited' },
    }},

    // ---------- REVIEW & SUBMIT ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'review', speech: '거의 다 왔어요. 다음 화면에서 입력한 내용을 한 번 쭉 보여줘요. 이름, 여권번호, 생년월일은 나중에 못 고치니까, 여기서 꼭 확인하세요.', route, title: '확인하고 제출', subtitle: '이름·여권번호·국적·생년월일은 제출 후 수정 불가', flag: '✅', rightTitle: '4 / 4', rightText: '미리보기 · 이메일\n보안 확인 · 제출' },
      en: { id: 'review', speech: 'Almost there. The next screen shows a preview of everything. Your name, passport number and date of birth cannot be changed later, so check them here.', route, title: 'Review and submit', subtitle: 'Name, passport no., nationality and date of birth cannot be edited later', flag: '✅', rightTitle: '4 / 4', rightText: 'Preview · email\nsecurity check · submit' },
    }},
    { type: 'type', field: 'email', value: S.email, text: {
      ko: { label: '이메일', speech: { tip: '이메일이에요. 티닥 번호랑 큐알 코드가 담긴 확인서가 여기로 와요.', mistake: '혹시 이 단계에서 카드 결제를 하라고 나오면, 공식 사이트가 아니에요. 진짜 티닥은 돈을 한 푼도 안 받아요. 주소창이 티닥 점 이미그레이션 점 고 점 티에이치인지 꼭 보세요.' },
            tip: 'TDAC 번호·QR 확인서가 **여기로** 옵니다', mistake: '결제를 요구하면 **공식 사이트가 아닙니다**. 주소창이 tdac.immigration.go.th 인지 확인.', bad: '결제 요구 사이트', good: 'tdac.immigration.go.th (무료)' },
      en: { label: 'Email', speech: { tip: 'Email. Your confirmation, with the TDAC number and a QR code, comes here.', mistake: 'If any page asks you to pay at this point, you are not on the official site. The real TDAC is free. Check the address bar says tdac dot immigration dot go dot th.' },
            tip: 'Your TDAC number and QR code are **sent here**', mistake: 'Asked to pay? It is **not the official site**. Check for tdac.immigration.go.th.', bad: 'site asking for payment', good: 'tdac.immigration.go.th (free)' },
    }},
    { type: 'manual', field: 'captcha', tipHold: 3000, text: {
      ko: { label: '보안 확인', speech: { tip: '사람인지 확인하는 체크가 나오면 직접 눌러 주세요. 이건 사람이 해야 돼요. 브이피엔이나 번역 기능을 켜 두면 잘 안 넘어갈 수 있어요.' }, tip: '직접 체크하세요. 안 넘어가면 **VPN·번역 끄기**' },
      en: { label: 'Security check', speech: { tip: 'If a verify you are human check appears, tick it yourself. A person has to do this part. A VPN or page translation can make it fail.' }, tip: 'Tick it yourself. Stuck? **Turn off VPN / translation**' },
    }},
    { type: 'stop', field: 'submit', tipHold: 3200, text: {
      ko: { label: '제출', speech: { tip: '여기서 제출을 누르면 끝이에요. 일행이 있으면 다음 화면에서 같은 여정으로 추가할 수 있어요.', mistake: '제출하면 확인 화면이 바로 떠요. 이 화면을 꼭 캡처하거나 피디에프로 받아 두세요. 이메일이 늦게 오거나 스팸함에 들어가는 경우가 있거든요. 공항에서 큐알 코드를 보여 달라고 할 수 있어요.' },
            tip: 'Submit 누르면 **끝** · 일행은 같은 여정으로 추가 가능', mistake: '확인 화면은 **캡처 또는 PDF 저장**. 이메일이 늦거나 스팸함에 갈 수 있습니다.', bad: '그냥 창 닫기', good: '캡처 + PDF 저장' },
      en: { label: 'Submit', speech: { tip: 'Press submit here and you are done. Travelling with others? You can add them on the next screen with the same trip details.', mistake: 'A confirmation screen appears right away. Take a screenshot or download the PDF. The email can be late or land in spam, and immigration may ask to see the QR code.' },
            tip: 'Press Submit, **done** · add companions with the same trip', mistake: '**Screenshot or save the PDF** of the confirmation. The email can be late or go to spam.', bad: 'just closing the tab', good: 'screenshot + PDF' },
    }},

    // ---------- OUTRO (ticket) ----------
    { type: 'card', hold: 5000, card: {
      ko: { id: 'outro', speech: '끝났어요. 확인서랑 큐알 코드는 휴대폰에 저장해 두세요. 방콕 수완나품이나 돈므앙 입국 심사에서 보여 달라고 하면 바로 꺼내시면 돼요. 다음은 태국 이심 개통이랑 말레이시아 입국신고서예요. 설명란에 링크 있습니다.',
            route, title: '끝. **이제 이것만 준비하세요**', subtitle: 'TDAC 확인서(QR)는 휴대폰에 저장. 입국 심사에서 요청하면 제시.',
            meta: [{ k: '설명란 1줄', v: '공식 사이트' }, { k: '설명란 2줄', v: 'eSIM' }, { k: '설명란 3줄', v: '공항 이동' }], stamp: '제출\n완료', flag: '🇹🇭',
            rightTitle: '다음 영상', rightText: '', next: ['📱 태국 eSIM 5분 개통', '🇲🇾 말레이시아 입국신고서 MDAC', '🔔 서식 바뀌면 최신판 알림'], brand: '▶ 따라하면 끝 · 입국신고서·비자' },
      en: { id: 'outro', speech: 'Done. Keep the confirmation and QR code on your phone, and show it at immigration in Bangkok if asked. Up next: a Thailand eSIM in five minutes, and the Malaysia arrival card. Links are in the description.',
            route, title: 'Done. **Only these left**', subtitle: 'Keep the TDAC confirmation (QR) on your phone and show it if asked.',
            meta: [{ k: 'LINE 1', v: 'Official site' }, { k: 'LINE 2', v: 'eSIM' }, { k: 'LINE 3', v: 'Transfer' }], stamp: 'SUB\nMITTED', flag: '🇹🇭',
            rightTitle: 'Up next', rightText: '', next: ['📱 Thailand eSIM in 5 min', '🇲🇾 Malaysia Arrival Card (MDAC)', '🔔 Subscribe for updates'], brand: '▶ Copy My Screen' },
    }},
  ],
};
