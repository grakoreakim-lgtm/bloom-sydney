// SG Arrival Card — steps for the REAL site (eservices.ica.gov.sg), mapped 2026-11-22 with upload/explore-live.js.
// Page 1 Traveller Details → Next → page 2 Visit Details → Next → page 3 Review (point at Submit, never click).
// Fictional sample traveller only. Dates are computed at recording time (the site only offers arrival today..+2).

const pad = (n) => String(n).padStart(2, '0');
const day = (offset) => { const d = new Date(Date.now() + offset * 864e5); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; };

// selectors on the real page (overlay accepts "css@@n", "a || b", "btn:Text")
const live = {
  arrival: '#traveller-0-input-dateOfArrival',
  name: '#traveller-0-input-fullName',
  passport: '#traveller-0-input-passportNumber',
  passportExpiry: '#traveller-0-input-day@@0 || #traveller-0-input-year@@0',
  sex: '#traveller-0-input-sex',
  dob: '#traveller-0-input-day@@1 || #traveller-0-input-year@@1',
  nationality: '#traveller-0-input-nationality',
  placeOfBirth: '#traveller-0-input-placeOfBirth',
  residence: '#traveller-0-input-placeOfResidence',
  email: '#traveller-0-input-emailAddress',
  phoneCode: '#traveller-0-input-countryCode',
  phone: '#traveller-0-input-mobileNumber',
  lastCity: '#traveller-0-input-lastCity',
  purpose: '#traveller-0-input-purposeOfTravel',
  departure: '#traveller-0-input-day@@2 || #traveller-0-input-year@@2',
  sameAsLast: '#mat-mdc-checkbox-2',
  nextCity: '#traveller-0-input-nextCity',
  diffPassport: '#traveller-0-input-haveUsedDiffPassportName',
  fever: '#traveller-0-input-8',
  yellowFever: '#traveller-0-input-9',
  next: 'btn:Next',
  mode: '#traveller-0-input-modeOfTravel',
  transport: '#traveller-0-input-airTransport',
  flightCode: '#traveller-0-input-flightCode',
  flightNumber: '#traveller-0-input-flightNumber',
  accommodation: '#traveller-0-input-typeOfAccommodation',
  hotel: '#traveller-0-input-nameOfHotel',
  submit: 'btn:Submit',
};

const T = (ko, en) => ({ ko, en });

const steps = (route) => [
  { type: 'card', hold: 4500, card: {
    ko: { id: 'intro', speech: '싱가포르 가시죠? 도착하기 사흘 전부터 입국카드를 온라인으로 내야 해요. 에스지 어라이벌 카드라고 하는데, 무료고, 오 분이면 끝나요. 오늘은 실제 이민국 사이트 화면 그대로 보여드릴게요. 똑같이 따라 치시면 되고, 많이 틀리는 곳에서는 잠깐 멈출게요.',
          route, title: '싱가포르 입국카드,\n**실제 화면 그대로 따라 하면 끝**', subtitle: '싱가포르 이민국(ICA) 공식 사이트 실제 화면. 제출 직전까지 보여드립니다.',
          meta: [{ k: '소요', v: '5분' }, { k: '비용', v: '무료' }, { k: '제출', v: '도착 3일 전' }, { k: '화면', v: '실제 사이트' }], stamp: '따라\n하면\n끝', flag: '🇸🇬',
          rightTitle: 'SG Arrival Card', rightText: '준비물: 여권 · 항공권 · 호텔 이름\n돈 내라는 사이트는 전부 가짜', brand: '▶ 따라하면 끝 · 입국신고서·비자' },
    en: { id: 'intro', speech: 'Flying to Singapore? Within three days before you land, you need to file the SG Arrival Card online. It is free and takes about five minutes. Today I will use the real immigration website. Copy what I type, and I will pause where people usually slip up.',
          route, title: 'SG Arrival Card,\n**the real site, step by step**', subtitle: 'The official ICA website, right up to the Submit button.',
          meta: [{ k: 'TIME', v: '5 min' }, { k: 'FEE', v: 'Free' }, { k: 'WHEN', v: '3 days before' }, { k: 'SCREEN', v: 'Real site' }], stamp: 'COPY\nMY\nSCREEN', flag: '🇸🇬',
          rightTitle: 'SG Arrival Card', rightText: 'Need: passport · flight · hotel name\nAny site asking for money is fake', brand: '▶ Copy My Screen · Arrival Cards & Visas' },
  }},

  // ---------- PAGE 1: traveller details ----------
  { type: 'choose', field: 'arrival', value: 1, noPause: true, text: T(
    { label: '도착일', speech: { tip: '맨 위는 도착일이에요. 오늘, 내일, 모레, 이렇게 세 날짜만 나와요. 싱가포르에 내리는 날을 고르세요.', mistake: '고를 수 있는 날짜가 사흘뿐이에요. 도착일이 목록에 없으면 아직 낼 때가 아닌 거예요. 그리고 밤 비행기면 출발일 말고 도착일이에요.' },
      tip: '싱가포르에 **내리는 날짜**', mistake: '도착 **3일 전부터만** 날짜가 보입니다.', bad: '출발일', good: '현지 도착일' },
    { label: 'Date of arrival', speech: { tip: 'At the top, the arrival date. Only today and the next two days are offered. Pick the day you land.', mistake: 'You only see three dates. If your arrival date is not listed, it is too early to submit. For an overnight flight, pick the arrival date.' },
      tip: 'The day you **land**', mistake: 'Only the next **3 days** are listed.', bad: 'departure date', good: 'local arrival date' }) },
  { type: 'type', field: 'name', value: 'GILDONG HONG', text: T(
    { label: '이름', speech: { tip: '이름이에요. 칸 안에 기븐 네임 다음에 서네임, 그러니까 이름 먼저, 성 나중이라고 적혀 있죠.', mistake: '여기서 정말 많이 틀려요. 말레이시아 신고서는 성이 먼저였는데, 싱가포르는 반대예요. 홍길동이면 길동, 띄어쓰기, 홍.' },
      tip: '**이름 먼저, 성 나중** (Given name → Surname)', mistake: '말레이시아(MDAC)와 순서가 반대입니다.', bad: 'HONG GILDONG', good: 'GILDONG HONG' },
    { label: 'Full name', speech: { tip: 'Full name. The box says given name followed by surname.', mistake: 'This trips people up, especially after the Malaysia card, which wants the surname first. Given name, space, surname.' },
      tip: '**Given name first, then surname**', mistake: 'Opposite order to the Malaysia MDAC.', bad: 'HONG GILDONG', good: 'GILDONG HONG' }) },
  { type: 'type', field: 'passport', value: 'M12345678', noPause: true, text: T(
    { label: '여권번호', speech: { tip: '여권번호예요. 띄어쓰기 없이요. 숫자 영이랑 영문 오가 헷갈리니 한 글자씩 확인하세요.' }, tip: '**띄어쓰기 없이**, 0과 O 주의' },
    { label: 'Passport number', speech: { tip: 'Passport number, no spaces. Zero and the letter O look alike, so check each character.' }, tip: '**No spaces**, 0 vs O' }) },
  { type: 'date3', field: 'passportExpiry', n: 0, value: '31/12/2031', text: T(
    { label: '여권 만료일', speech: { tip: '여권 만료일이에요. 일, 월, 년 세 칸에 나눠서 쳐요.', mistake: '발급일을 넣는 분이 많아요. 데이트 오브 익스파이어리, 만료일이에요. 입국일 기준으로 여섯 달 이상 남아 있어야 해요.' },
      tip: '**일 / 월 / 년** 세 칸', mistake: '발급일이 아니라 **만료일**. 6개월 이상 남아야 합니다.', bad: 'Date of issue', good: 'Date of EXPIRY' },
    { label: 'Passport expiry', speech: { tip: 'Passport expiry, in three boxes: day, month, year.', mistake: 'People often type the issue date. You want the date of expiry, and it needs six months left from arrival.' },
      tip: '**Day / month / year** boxes', mistake: 'The **expiry** date, not the issue date.', bad: 'Date of issue', good: 'Date of EXPIRY' }) },
  { type: 'choose', field: 'sex', value: 'MALE', noPause: true, text: T(
    { label: '성별', speech: { tip: '성별은 여권에 적힌 대로 고르세요.' }, tip: '여권에 적힌 대로' },
    { label: 'Sex', speech: { tip: 'Sex, as printed in your passport.' }, tip: 'As in your passport' }) },
  { type: 'date3', field: 'dob', n: 1, value: '15/05/1990', text: T(
    { label: '생년월일', speech: { tip: '생년월일도 일, 월, 년 순서예요. 일이 먼저예요.' }, tip: '**일 / 월 / 년** 순서' },
    { label: 'Date of birth', speech: { tip: 'Date of birth, also day, month, year.' }, tip: '**Day / month / year**' }) },
  { type: 'auto', field: 'nationality', value: 'KOREA', pick: 'KOREAN, SOUTH', text: T(
    { label: '국적', speech: { tip: '국적이에요. 코리아까지 치면 목록이 떠요. 코리안, 사우스를 고르세요.', mistake: '바로 위에 북한이 먼저 떠요. 디모크라틱 피플스 리퍼블릭이 아니라, 코리안 사우스예요.' },
      tip: 'KOREA 입력 → **KOREAN, SOUTH**', mistake: '목록 첫 줄은 **북한**입니다. 두 번째를 고르세요.', bad: "DEMOCRATIC PEOPLE'S REPUBLIC", good: 'KOREAN, SOUTH' },
    { label: 'Nationality', speech: { tip: 'Nationality. Start typing and pick from the list.', mistake: 'For Koreans, North Korea appears first in the list. Pick KOREAN, SOUTH.' },
      tip: 'Type, then **pick from the list**', mistake: 'For Koreans: North Korea is listed first.', bad: "DEMOCRATIC PEOPLE'S REPUBLIC", good: 'KOREAN, SOUTH' }) },
  { type: 'auto', field: 'placeOfBirth', value: 'KOREA', pick: '^REPUBLIC OF KOREA', noPause: true, text: T(
    { label: '출생 국가', speech: { tip: '태어난 나라예요. 여기는 표기가 리퍼블릭 오브 코리아로 달라요.' }, tip: '**REPUBLIC OF KOREA**' },
    { label: 'Place of birth', speech: { tip: 'The country you were born in.' }, tip: 'Your **country of birth**' }) },
  { type: 'auto', field: 'residence', value: 'SEOUL', pick: 'SEOUL', text: T(
    { label: '거주지', speech: { tip: '본국 거주지예요. 사는 도시 이름을 치면 나라, 도시로 떠요.', mistake: '국적이 아니라 실제로 사는 곳이에요. 한국 여권이어도 호주에 사시면 호주 도시를 고르세요.' },
      tip: '사는 **도시**를 검색', mistake: '국적이 아니라 **실제 거주지**입니다.', bad: '국적 그대로', good: '실제로 사는 도시' },
    { label: 'Place of residence', speech: { tip: 'Where you live in your home country. Type your city.', mistake: 'It is where you actually live, which may differ from your nationality.' },
      tip: 'Search your **city**', mistake: 'Where you **actually live**.', bad: 'nationality by default', good: 'your real home city' }) },
  { type: 'type', field: 'email', value: 'sample.traveller@example.com', noPause: true, text: T(
    { label: '이메일', speech: { tip: '이메일이에요. 확인 메일이 여기로 오니까 공항에서 열 수 있는 메일로 쓰세요.' }, tip: '**공항에서 열 수 있는 메일**' },
    { label: 'Email', speech: { tip: 'Email. The confirmation comes here, so use an inbox you can open at the airport.' }, tip: 'An inbox you can **open at the airport**' }) },
  { type: 'auto', field: 'phoneCode', value: '82', pick: '^\\s*\\+?\\s*82\\s*$', noPause: true, text: T(
    { label: '국가번호', speech: { tip: '국가번호는 팔십이.' }, tip: '한국은 **82**' },
    { label: 'Country code', speech: { tip: 'Your country code.' }, tip: 'Your **country code**' }) },
  { type: 'type', field: 'phone', value: '1012345678', text: T(
    { label: '휴대폰 번호', speech: { tip: '번호는 맨 앞 영을 빼고 쳐요.', mistake: '공일공으로 시작하면 안 돼요. 국가번호를 따로 골랐으니까 일공으로 시작해요.' },
      tip: '맨 앞 **0 빼고**', mistake: '국가번호를 따로 골랐으니 앞의 0은 뺍니다.', bad: '01012345678', good: '1012345678' },
    { label: 'Mobile number', speech: { tip: 'Your number without the leading zero.', mistake: 'The country code is separate, so drop the first zero.' },
      tip: 'Drop the **leading 0**', mistake: 'Country code is separate — drop the first 0.', bad: '01012345678', good: '1012345678' }) },
  { type: 'auto', field: 'lastCity', value: 'SEOUL', pick: 'SEOUL', text: T(
    { label: '마지막 출발 도시', speech: { tip: '싱가포르행 비행기를 탄 도시예요.', mistake: '경유하셨으면 갈아탄 도시예요. 쿠알라룸푸르에서 갈아타셨으면 서울이 아니라 쿠알라룸푸르.' },
      tip: '싱가포르행 비행기를 **탄 도시**', mistake: '경유했다면 **환승 도시**입니다.', bad: '서울 (경유 시)', good: '마지막 탑승 도시' },
    { label: 'Last city of embarkation', speech: { tip: 'The city where you boarded the flight to Singapore.', mistake: 'If you connected, it is the transit city, not your home city.' },
      tip: 'Where you **boarded** for Singapore', mistake: 'With a connection, the **transit city**.', bad: 'home city (if transiting)', good: 'last city you boarded at' }) },
  { type: 'auto', field: 'purpose', value: 'HOLIDAY', pick: 'HOLIDAY', noPause: true, text: T(
    { label: '여행 목적', speech: { tip: '여행 목적이에요. 관광이면 홀리데이를 고르세요.' }, tip: '관광은 **HOLIDAY**' },
    { label: 'Purpose of travel', speech: { tip: 'Purpose of travel. Holiday for tourism.' }, tip: '**HOLIDAY** for tourism' }) },
  { type: 'date3', field: 'departure', n: 2, value: () => day(6), text: T(
    { label: '출국일', speech: { tip: '싱가포르를 떠나는 날짜예요. 역시 일, 월, 년.' }, tip: '싱가포르를 **떠나는 날짜**' },
    { label: 'Date of departure', speech: { tip: 'The date you leave Singapore, day, month, year.' }, tip: 'The date you **leave**' }) },
  { type: 'tick', field: 'sameAsLast', hl: 'nextCity', text: T(
    { label: '다음 도시', speech: { tip: '싱가포르 다음에 가는 도시예요. 한국으로 돌아가시면 같은 도시 체크를 누르면 자동으로 채워져요.', mistake: '싱가포르에서 말레이시아나 다른 나라로 넘어가시면 체크하지 말고 그 도시를 직접 고르세요.' },
      tip: '귀국이면 **Same as Last City** 체크', mistake: '다른 나라로 이동하면 그 도시를 직접 고르세요.' },
    { label: 'Next city', speech: { tip: 'Where you go after Singapore. Flying home? Tick same as last city.', mistake: 'If you continue to another country, untick it and pick that city.' },
      tip: 'Going home? Tick **Same as Last City**', mistake: 'Moving on elsewhere? Pick that city.' }) },
  { type: 'choose', field: 'diffPassport', value: 'NO', noPause: true, text: T(
    { label: '다른 이름 여권', speech: { tip: '다른 이름의 여권으로 싱가포르에 들어온 적이 있는지예요. 대부분 노.' }, tip: '대부분 **NO**' },
    { label: 'Different-name passport', speech: { tip: 'Have you entered Singapore on a passport with a different name? Usually no.' }, tip: 'Usually **NO**' }) },
  { type: 'choose', field: 'fever', value: 'NO', noPause: true, text: T(
    { label: '건강 신고 ①', speech: { tip: '지금 열이나 기침 같은 증상이 있는지예요. 사실대로 고르세요.' }, tip: '현재 증상, **사실대로**' },
    { label: 'Health ①', speech: { tip: 'Do you have fever, cough or similar symptoms right now? Answer truthfully.' }, tip: 'Symptoms now, **truthfully**' }) },
  { type: 'choose', field: 'yellowFever', value: 'NO', text: T(
    { label: '건강 신고 ②', speech: { tip: '방금 답하니까 질문이 하나 더 생겼죠? 최근 엿새 동안 아프리카나 남미의 황열병 위험 국가에 다녀왔는지예요.', mistake: '이 질문은 위 질문에 답해야 나타나서 그냥 넘어가는 분이 많아요. 안 고르면 다음으로 안 넘어가요. 아프리카나 남미를 거쳐 오셨으면 사실대로 예.' },
      tip: '답하면 **새로 나타나는 질문**', mistake: '놓치면 다음 페이지로 **안 넘어갑니다**.' },
    { label: 'Health ②', speech: { tip: 'Answering that made a new question appear: have you been to a yellow fever risk country in Africa or Latin America in the past six days?', mistake: 'It only appears after the question above, so people miss it, and the form will not continue. Answer truthfully.' },
      tip: 'A **new question appears**', mistake: 'Miss it and you **cannot continue**.' }) },
  { type: 'next', field: 'next', text: T(
    { label: '다음', speech: { tip: '1페이지 끝. 넥스트를 누르면 방문 정보로 넘어가요.' }, tip: '**Next** → 방문 정보' },
    { label: 'Next', speech: { tip: 'Page one done. Press next for the visit details.' }, tip: '**Next** → visit details' }) },

  // ---------- PAGE 2: visit details ----------
  { type: 'choose', field: 'mode', value: 'AIR', noPause: true, text: T(
    { label: '교통수단', speech: { tip: '비행기면 에어. 고르면 질문이 더 나와요.' }, tip: '비행기는 **AIR**' },
    { label: 'Mode of travel', speech: { tip: 'Air for flights. More questions appear once you pick.' }, tip: '**AIR** for flights' }) },
  { type: 'choose', field: 'transport', value: 'COMMERCIAL FLIGHT', noPause: true, text: T(
    { label: '운송 수단', speech: { tip: '일반 항공편이면 커머셜 플라이트.' }, tip: '**COMMERCIAL FLIGHT**' },
    { label: 'Mode of transport', speech: { tip: 'Commercial flight for a normal airline.' }, tip: '**COMMERCIAL FLIGHT**' }) },
  { type: 'auto', field: 'flightCode', value: 'SQ', pick: '\\(SQ\\)', text: T(
    { label: '항공사', speech: { tip: '항공사를 고르는 칸이에요. 편명 앞 두 글자, 에스큐를 치면 싱가포르 항공이 떠요.' }, tip: '편명 앞 두 글자로 **항공사 선택**' },
    { label: 'Flight code', speech: { tip: 'Pick the airline. Type the two letters of your flight, like SQ.' }, tip: 'Pick the **airline** by its code' }) },
  { type: 'type', field: 'flightNumber', value: '607', text: T(
    { label: '편명 숫자', speech: { tip: '편명은 숫자만 쳐요. 육공칠.', mistake: '여기서 에스큐 육공칠처럼 글자까지 치면 숫자만 넣으라고 오류가 나요. 항공사는 바로 위에서 이미 골랐어요.' },
      tip: '**숫자만**', mistake: '항공사 코드는 위에서 골랐으니 **숫자만** 칩니다.', bad: 'SQ607', good: '607' },
    { label: 'Flight number', speech: { tip: 'Digits only.', mistake: 'Type SQ607 here and you get an error saying digits only. The airline is already picked above.' },
      tip: '**Digits only**', mistake: 'The airline is picked above — **digits only** here.', bad: 'SQ607', good: '607' }) },
  { type: 'choose', field: 'accommodation', value: 'HOTEL', noPause: true, text: T(
    { label: '숙소 유형', speech: { tip: '숙소 유형이에요. 호텔이면 호텔.' }, tip: '호텔이면 **HOTEL**' },
    { label: 'Accommodation', speech: { tip: 'Type of accommodation. Hotel for a hotel.' }, tip: '**HOTEL** for hotels' }) },
  { type: 'auto', field: 'hotel', value: 'MARINA BAY SANDS', pick: 'MARINA BAY SANDS', text: T(
    { label: '호텔 이름', speech: { tip: '호텔 이름을 검색해서 목록에서 골라요. 주소나 우편번호는 안 물어봐요.', mistake: '호텔 이름 일부만 쳐도 목록이 떠요. 예약서의 영문 호텔명으로 검색하세요. 목록에 없으면 단어를 줄여서 다시 쳐 보세요.' },
      tip: '이름 검색 → **목록에서 선택**', mistake: '안 뜨면 **단어를 줄여서** 다시 검색하세요.' },
    { label: 'Hotel name', speech: { tip: 'Search the hotel name and pick it from the list. No address or postal code needed.', mistake: 'Use the English name from your booking. If it does not show, try fewer words.' },
      tip: 'Search, then **pick from the list**', mistake: 'Not listed? Try **fewer words**.' }) },
  { type: 'next', field: 'next', text: T(
    { label: '다음', speech: { tip: '넥스트를 누르면 마지막 확인 화면이에요.' }, tip: '**Next** → 확인' },
    { label: 'Next', speech: { tip: 'Next takes you to the review page.' }, tip: '**Next** → review' }) },

  // ---------- PAGE 3: review ----------
  { type: 'stop', field: 'submit', tipHold: 3200, text: T(
    { label: '확인 후 제출', speech: { tip: '마지막 확인 화면이에요. 이름 순서, 여권번호, 날짜를 한 번 더 보시고, 고칠 게 있으면 에딧을 누르세요. 아래 동의에 체크하고 서브밋을 누르면 끝이에요. 오늘은 예시라 여기서 멈출게요.', mistake: '일행이 있으면 한 명씩 각각 내야 해요. 제출하면 확인 메일이 오니까 휴대폰에 남겨 두세요.' },
      tip: '**Edit**로 수정 → 동의 체크 → **Submit**', mistake: '일행은 **한 명씩 각각** 제출합니다.' },
    { label: 'Review & submit', speech: { tip: 'The review page. Check the name order, passport number and dates, and press edit to fix anything. Then tick the declaration and press submit. This is a demo, so I stop here.', mistake: 'Every traveller needs their own card. Keep the confirmation email on your phone.' },
      tip: '**Edit** to fix → tick → **Submit**', mistake: 'Every traveller files **their own** card.' }) },
];

module.exports = { live, steps };
