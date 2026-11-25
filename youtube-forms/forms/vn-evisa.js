// Vietnam e-Visa — electronic visa for foreigners (Vietnam Immigration Department, Ministry of Public Security)
// Official portal: https://evisa.gov.vn/  (same portal also runs on https://thithucdientu.gov.vn)
//
// Sources (checked 2026-11-25 via web search; the .gov.vn sites themselves were not reachable from the sandbox):
//  - Immigration Department page evisa.immigration.gov.vn/trang-chu-ttdt — portal runs on thithucdientu.gov.vn and evisa.gov.vn
//  - Vietnam National Authority of Tourism, vietnam.travel (visa requirements, KO page /kr/node/71) — e-visa for all
//    nationalities, up to 90 days, single or multiple entry; evisa.gov.vn is the official site
//  - Government news portal en.baochinhphu.vn "Understanding Viet Nam's e-visa" (2025-02-18) and VnExpress
//    "Multiple-entry visa costs $50: immigration department" — fee USD 25 single entry / USD 50 multiple entry
//  - Vietnamese embassy pages (vnembassy-praha.mofa.gov.vn, vietnamembassydelhi.in) — same portal, same fees
//  - Korean citizens: 45-day visa exemption (Resolution 44/NQ-CP, reported valid to 2028-03-14) → e-visa for longer stays
//
// Facts I could NOT confirm on an official page (kept out of the narration or phrased cautiously):
//  - Exact processing time: "3 working days" is the commonly quoted official figure; narration says "about 3 working
//    days, can take longer".
//  - Exact photo size (4x6 cm is widely quoted) — narration only says recent, front-facing, white background, no glasses.
//  - Minimum passport validity (6 months is widely quoted) — narration only says "check that plenty of validity remains".
//  - Whether the fee is refunded after a refusal (third-party sources say no) — phrased as "may not be refunded".
//  - Whether you MUST enter through the border gate you chose — narration says "pick the airport you will really land at".
//  - Exact field labels/order on the live form (mock mirrors the commonly documented order; verify before a live recording).
//  - Fees and rules change: re-check evisa.gov.vn before every upload.
//
// ⚠ "live" selectors are best-effort guesses and MUST be verified against the real page before a live recording.
//    The "mock" target is ../mock/vn-evisa-form.html, which mirrors the field set.
//    The recording never uploads a real photo or passport, never solves the CAPTCHA, never pays.

const path = require('path');

// Sample traveller — obviously fake. Never use real personal data on camera.
const S = {
  surname: 'HONG',
  givenName: 'GILDONG',
  dob: '15/05/1990',
  sex: 'M',
  nationality: 'KOR',
  email: 'sample.traveller@example.com',
  entryType: 'single',
  validFrom: '10/03/2027',
  validTo: '30/04/2027',
  passport: 'M12345678',
  passportExpiry: '31/12/2031',
  purpose: 'tourism',
  entryDate: '10/03/2027',
  vnAddress: 'SAMPLE HOTEL, 123 EXAMPLE STREET, DA NANG',
  entryPort: 'DAD',
};

const route = { from: 'ICN', fromCity: 'SEOUL', to: 'DAD', toCity: 'DA NANG' };

module.exports = {
  id: 'vn-evisa',
  pack: 'evisa',
  country: { ko: '베트남', en: 'Vietnam' }, flag: '🇻🇳',
  fee: '25달러 (단수) / 50달러 (복수)', when: '입국 1주 전까지 권장 (처리 약 3영업일)', captcha: true,
  title: { ko: '베트남 전자비자 (e-Visa)', en: 'Vietnam e-Visa' },
  shortTitle: { ko: '베트남 e-Visa', en: 'Vietnam e-Visa' },
  videoTitle: { ko: '베트남 e-Visa 신청 방법 {year} | 공식 사이트 화면 그대로 따라하기', en: 'How to Apply for a Vietnam e-Visa {year} | Official Site Step-by-Step | Copy My Screen' },

  url: {
    mock: 'file://' + path.join(__dirname, '..', 'mock', 'vn-evisa-form.html'),
    live: 'https://evisa.gov.vn/',
  },

  selectors: {
    mock: {
      notice: '#notice', noticeBox: '#noticeBox', photoUpload: '#photoUpload', passportUpload: '#passportUpload',
      surname: '#surname', givenName: '#givenName', dob: '#dob', sex: '#sex', nationality: '#nationality', email: '#email',
      otherNatNo: '#otherNatNo', otherNatRow: '#otherNatRow',
      entryType: '#entryType', validFrom: '#validFrom', validTo: '#validTo',
      passport: '#passport', passportExpiry: '#passportExpiry',
      purpose: '#purpose', entryDate: '#entryDate', vnAddress: '#vnAddress', entryPort: '#entryPort',
      declare: '#declare', declareBox: '#declareBox', captcha: '#captcha', payNow: '#payNow',
    },
    // TODO verify on the real page before a live recording (node upload/verify-live.js vn-evisa)
    live: {
      notice: 'input[type="checkbox"] >> nth=0', noticeBox: '.ant-modal-body, section >> nth=0',
      photoUpload: 'input[type="file"] >> nth=0', passportUpload: 'input[type="file"] >> nth=1',
      surname: 'input[id*="surname" i], input[name*="surname" i]', givenName: 'input[id*="given" i], input[name*="given" i]',
      dob: 'input[id*="birth" i]', sex: 'select[id*="sex" i], [id*="gender" i]', nationality: '[id*="nationality" i] >> nth=0',
      email: 'input[type="email"] >> nth=0, input[id*="email" i] >> nth=0',
      otherNatRow: 'div:has-text("other nationality") >> nth=-1', otherNatNo: 'input[type="radio"][value*="N" i] >> nth=0',
      entryType: '[id*="visaType" i], [id*="entry" i] >> nth=0', validFrom: 'input[id*="from" i]', validTo: 'input[id*="to" i] >> nth=-1',
      passport: 'input[id*="passport" i][id*="num" i], input[id*="passport" i] >> nth=0', passportExpiry: 'input[id*="expir" i]',
      purpose: '[id*="purpose" i]', entryDate: 'input[id*="entryDate" i], input[id*="intended" i] >> nth=0',
      vnAddress: 'input[id*="address" i] >> nth=-1', entryPort: '[id*="entryGate" i], [id*="checkpoint" i] >> nth=0',
      declareBox: 'div:has-text("declare") >> nth=-1', declare: 'input[type="checkbox"] >> nth=-1',
      captcha: 'input[id*="captcha" i], img[src*="captcha" i]', payNow: 'button:has-text("Next")',
    },
  },

  strings: {
    ko: { easyPill: '👀 화면 그대로 따라만 하세요', mistakeTitle: '⚠ 많이 틀리는 곳', pause: '⏸ 여기까지 입력하세요', pauseSub: '다 치고 나서 재생' },
    en: { easyPill: '👀 Just copy the screen', mistakeTitle: '⚠ Common mistake', pause: '⏸ Type this, then press play', pauseSub: '' },
  },

  steps: [
    // ---------- INTRO (ticket) ----------
    { type: 'card', hold: 5000, card: {
      ko: { id: 'intro', speech: '베트남에 사십오 일 넘게 계실 거면, 무비자로는 안 되고 전자비자가 필요해요. 공식 사이트에서 직접 하면 이십오 달러인데, 검색하면 두세 배 받는 대행 사이트가 먼저 나와요. 오늘은 공식 사이트 화면 그대로, 결제 직전까지 같이 가 볼게요. 반려가 많이 나오는 곳에서는 제가 잠깐 멈출게요.',
            route, title: '베트남 e-Visa,\n**화면 그대로 따라 하면 끝**', subtitle: '공식 사이트 신청 화면 그대로. 반려되기 쉬운 곳마다 멈춥니다.',
            meta: [{ k: '소요', v: '15분' }, { k: '비용', v: '$25 / $50' }, { k: '체류', v: '최대 90일' }, { k: '기준', v: '2026' }], stamp: '따라\n하면\n끝', flag: '🇻🇳',
            rightTitle: 'e-Visa', rightText: '준비물: 여권 · 얼굴 사진 · 이메일 · 결제 카드 · 숙소 주소\n공식 주소는 evisa.gov.vn', brand: '▶ 따라하면 끝 · 입국신고서·비자' },
      en: { id: 'intro', speech: 'Going to Vietnam and need a visa? The official e-Visa costs twenty five dollars for a single entry, but search results are full of agency sites charging two or three times that. Today we go through the official site, screen by screen, right up to the payment page. I will pause at the spots where applications usually get rejected.',
            route, title: 'Vietnam e-Visa,\n**copy the screen and you are done**', subtitle: 'The official application, step by step. We stop where people get rejected.',
            meta: [{ k: 'TIME', v: '15 min' }, { k: 'FEE', v: '$25 / $50' }, { k: 'STAY', v: 'up to 90 days' }, { k: 'YEAR', v: '2026' }], stamp: 'COPY\nMY\nSCREEN', flag: '🇻🇳',
            rightTitle: 'e-Visa', rightText: 'Need: passport · photo · email · card · hotel address\nThe official site: evisa.gov.vn', brand: '▶ Copy My Screen · Arrival Cards & Visas' },
    }},

    // ---------- START ----------
    { type: 'check', field: 'notice', hl: 'noticeBox', text: {
      ko: { label: '공식 사이트 · 안내 동의', speech: { tip: '첫 화면은 안내문이에요. 읽어 보시고 체크하면 돼요. 전자비자는 최대 구십 일, 한 번 입국하는 단수나 여러 번 드나드는 복수로 받을 수 있어요.', mistake: '여기서 제일 많이 당해요. 주소창을 꼭 보세요. 이비자 점 거브 점 브이엔, 끝이 거브 점 브이엔인 정부 사이트가 공식이에요. 비슷한 이름의 대행 사이트는 같은 비자에 수수료를 두세 배 받아요.' },
            tip: '안내문 읽고 **체크**', mistake: '공식 주소는 **evisa.gov.vn** (끝이 .gov.vn). 대행 사이트는 같은 비자에 수수료를 2~3배 받습니다.', bad: 'vietnam-evisa-○○○.com (대행)', good: 'evisa.gov.vn' },
      en: { label: 'Official site · instructions', speech: { tip: 'The first page is the instructions. Read them and tick the box. An e-Visa is good for up to ninety days, as a single or a multiple entry visa.', mistake: 'This is where most people overpay. Check the address bar. e visa dot gov dot v n, a government site ending in gov dot v n, is the official one. Look-alike agency sites charge two or three times the fee for the same visa.' },
            tip: 'Read them, then **tick the box**', mistake: 'The official site is **evisa.gov.vn** (ends in .gov.vn). Agency sites charge 2–3× for the same visa.', bad: 'vietnam-evisa-something.com', good: 'evisa.gov.vn' },
    }},
    { type: 'manual', field: 'photoUpload', tipHold: 3200, text: {
      ko: { label: '얼굴 사진 업로드', speech: { tip: '얼굴 사진을 올려요. 최근에 찍은 정면 사진으로, 흰 배경에 안경은 벗고요. 영상에서는 업로드하지 않을게요.', mistake: '반려 이유 일 순위가 사진이에요. 셀카처럼 비스듬한 사진, 안경 쓴 사진, 배경이 복잡한 사진은 다시 내라고 할 수 있어요.' },
            tip: '최근 **정면 사진**, 흰 배경, 안경 없이', mistake: '비스듬한 셀카·안경·복잡한 배경은 **반려** 사유가 됩니다.', bad: '안경 쓴 셀카', good: '흰 배경 정면 사진' },
      en: { label: 'Upload portrait photo', speech: { tip: 'Upload a photo of your face. A recent, front-facing photo, white background, no glasses. I will not upload one on camera.', mistake: 'Photos are the number one reason for rejection. A tilted selfie, glasses, or a busy background can get it sent back.' },
            tip: 'Recent **front-facing photo**, white background, no glasses', mistake: 'Tilted selfies, glasses or busy backgrounds get **rejected**.', bad: 'selfie with glasses', good: 'straight, plain white background' },
    }},
    { type: 'manual', field: 'passportUpload', tipHold: 3200, text: {
      ko: { label: '여권 사진면 업로드', speech: { tip: '여권 사진이 있는 면을 찍어서 올려요. 영상에서는 업로드하지 않을게요.', mistake: '아래쪽 기계판독 줄, 꺾쇠가 있는 두 줄이 잘리면 안 돼요. 빛 반사 없이, 네 모서리가 다 나오게 찍으세요.' },
            tip: '여권 **사진면** 전체', mistake: '아래 **두 줄(<<<)**이 잘리거나 빛 반사가 있으면 반려될 수 있어요.', bad: '아래 줄 잘림 · 반사', good: '네 모서리 다 보이게' },
      en: { label: 'Upload passport page', speech: { tip: 'Upload a photo of your passport photo page. I will not upload one on camera.', mistake: 'Do not crop the two machine-readable lines at the bottom, the ones with the arrows. No glare, all four corners visible.' },
            tip: 'The whole **photo page**', mistake: 'Cropped **bottom lines (<<<)** or glare can get it rejected.', bad: 'cut-off bottom lines, glare', good: 'all four corners visible' },
    }},

    // ---------- PERSONAL ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'personal', speech: '이제 개인 정보예요. 여권을 펴 놓고, 한 칸씩 그대로 옮기세요.', route, title: '개인 정보', subtitle: '여권을 펴 놓고 한 칸씩 그대로', flag: '🛂', rightTitle: '1 / 4', rightText: '성 · 이름 · 생년월일 · 성별\n국적 · 이메일 · 다른 국적' },
      en: { id: 'personal', speech: 'Now your personal details. Keep your passport open and copy it box by box.', route, title: 'Personal information', subtitle: 'Copy it from your passport, box by box', flag: '🛂', rightTitle: '1 / 4', rightText: 'Surname · given name · birth date · sex\nnationality · email · other nationality' },
    }},
    { type: 'type', field: 'surname', value: S.surname, text: {
      ko: { label: '성 (Surname)', speech: { tip: '서네임, 성이에요. 홍길동이면 홍.', mistake: '성이랑 이름 칸을 바꿔 쓰는 분이 정말 많아요. 서네임이 성이에요. 여권 영문 철자 그대로 쓰세요. 한 글자만 달라도 공항에서 문제가 될 수 있어요.' },
            tip: 'Surname = **성**', mistake: '성·이름 칸을 바꿔 쓰는 실수가 가장 흔합니다. 철자는 여권 영문 그대로.', bad: 'Surname: GILDONG', good: 'Surname: HONG' },
      en: { label: 'Surname', speech: { tip: 'Surname, your family name.', mistake: 'Swapping the surname and given name boxes is the most common slip. Copy the spelling exactly from your passport. One letter off can cause trouble at the airport.' },
            tip: 'Surname = **family name**', mistake: 'Swapping surname and given name is the most common slip. Spell it exactly as in the passport.', bad: 'Surname: GILDONG', good: 'Surname: HONG' },
    }},
    { type: 'type', field: 'givenName', value: S.givenName, text: {
      ko: { label: '이름 (Given name)', speech: { tip: '미들 앤드 기븐 네임, 이름이에요. 길동.', mistake: '여권에 붙어 있으면 붙여서, 띄어져 있으면 띄워서요. 하이픈을 마음대로 넣거나 빼지 마세요.' },
            tip: '이름 칸. 여권에 적힌 **그대로**', mistake: '붙임·띄움·하이픈까지 여권과 같게.', bad: 'GIL-DONG (여권엔 GILDONG)', good: 'GILDONG' },
      en: { label: 'Middle and given name', speech: { tip: 'Middle and given name, exactly as printed in the passport.', mistake: 'Keep the spaces and hyphens exactly as in the passport. Do not add or drop any.' },
            tip: 'Exactly as **printed in the passport**', mistake: 'Same spaces and hyphens as the passport.', bad: 'GIL-DONG (passport: GILDONG)', good: 'GILDONG' },
    }},
    { type: 'type', field: 'dob', value: S.dob, text: {
      ko: { label: '생년월일', speech: { tip: '생년월일은 일, 월, 년 순서예요. 슬래시로 나눠요.', mistake: '한국식으로 년도부터 쓰면 틀려요. 일, 월, 년이에요. 오월 십오일이면 십오, 영오, 천구백구십.' },
            tip: '**일 / 월 / 년** 순서', mistake: '한국식 **년도 먼저**는 틀립니다.', bad: '1990/05/15', good: '15/05/1990' },
      en: { label: 'Date of birth', speech: { tip: 'Date of birth, day, month, year, with slashes.', mistake: 'Day comes first here. If you are used to month first, double-check it.' },
            tip: '**Day / month / year**', mistake: 'Day first. Month-first dates get swapped.', bad: '05/15/1990', good: '15/05/1990' },
    }},
    { type: 'select', field: 'sex', value: S.sex, text: {
      ko: { label: '성별', speech: { tip: '성별은 여권대로요.', mistake: '드롭다운이라 스크롤하다 다른 값이 눌리기 쉬워요. 고른 뒤 한 번 더 보세요.' },
            tip: '여권에 적힌 대로', mistake: '스크롤하다 **값이 바뀌기 쉬워요**. 고른 뒤 확인.', bad: '스크롤로 바뀐 값', good: '여권과 같은 값' },
      en: { label: 'Sex', speech: { tip: 'Sex, as in your passport.', mistake: 'Scrolling over a drop-down can change it. Check it after you pick.' },
            tip: 'As in your passport', mistake: 'Scrolling can **change the value**. Check after picking.', bad: 'value changed by scrolling', good: 'same as passport' },
    }},
    { type: 'select', field: 'nationality', value: S.nationality, text: {
      ko: { label: '국적', speech: { tip: '국적이에요. 한국 여권이면 코리아, 리퍼블릭 오브.', mistake: '목록에 코리아가 두 개 있어요. 북한, 데모크라틱 피플스 리퍼블릭이 먼저 나와요. 꼭 리퍼블릭 오브 코리아를 고르세요.' },
            tip: '한국 여권 = **Korea (Republic of)**', mistake: '북한(Democratic People\'s Republic)이 **먼저 나옵니다**.', bad: "Korea (Democratic People's Republic of)", good: 'Korea (Republic of)' },
      en: { label: 'Nationality', speech: { tip: 'Your nationality, the country on your passport.', mistake: 'Watch look-alike entries. For example, there are two Koreas, and North Korea is listed first. A South Korean passport is Korea, Republic of.' },
            tip: 'The country **on your passport**', mistake: 'Watch look-alikes: North Korea is listed before South Korea.', bad: "Korea (Democratic People's Rep.)", good: 'Korea (Republic of)' },
    }},
    { type: 'type', field: 'email', value: S.email, text: {
      ko: { label: '이메일', speech: { tip: '이메일이에요. 신청 코드랑 결과가 여기로 와요. 아래 칸에 한 번 더 똑같이 적어요.', mistake: '오타가 나면 결과 메일을 못 받아요. 지금 바로 열어볼 수 있는 메일로, 철자를 한 번 더 보세요.' },
            tip: '신청 코드·결과가 옵니다. 확인 칸에 **한 번 더**', mistake: '오타 나면 **결과 메일을 못 받아요**.', bad: 'gmial.com', good: 'gmail.com' },
      en: { label: 'Email', speech: { tip: 'Your email. Your registration code and result arrive here. Type it again in the confirm box.', mistake: 'One typo and you never get the result email. Use an inbox you can open now, and check the spelling.' },
            tip: 'Code and result arrive here. **Type it twice**', mistake: 'A typo means **no result email**.', bad: 'gmial.com', good: 'gmail.com' },
    }},
    { type: 'radio', field: 'otherNatNo', hl: 'otherNatRow', text: {
      ko: { label: '다른 국적', speech: { tip: '다른 나라 국적이 있는지 묻는 거예요. 없으면 아니요.', mistake: '이중국적이면 꼭 예를 고르고 사실대로 적으세요. 숨기면 거절될 수 있어요.' },
            tip: '다른 국적 없으면 **No**', mistake: '이중국적이면 **사실대로 Yes**. 숨기면 거절될 수 있어요.', bad: '이중국적 숨기기', good: '사실대로' },
      en: { label: 'Other nationality', speech: { tip: 'Do you hold any other nationality? If not, no.', mistake: 'If you are a dual citizen, answer yes and fill it in. Hiding it can get you refused.' },
            tip: 'No other nationality → **No**', mistake: 'Dual citizen? **Answer yes**. Hiding it can get you refused.', bad: 'hiding a second passport', good: 'truthful' },
    }},

    // ---------- REQUESTED ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'requested', speech: '이제 비자 종류랑 기간이에요. 항공권 날짜를 옆에 켜 두세요.', route, title: '비자 종류 · 기간', subtitle: '항공권 날짜를 옆에 두고 입력하세요', flag: '📅', rightTitle: '2 / 4', rightText: '단수 / 복수\n유효 시작일 · 종료일 (최대 90일)' },
      en: { id: 'requested', speech: 'Now the visa type and dates. Keep your flight booking open next to you.', route, title: 'Visa type & dates', subtitle: 'Keep your flight booking next to you', flag: '📅', rightTitle: '2 / 4', rightText: 'Single / multiple entry\nvalid from · valid to (up to 90 days)' },
    }},
    { type: 'select', field: 'entryType', value: S.entryType, text: {
      ko: { label: '비자 종류', speech: { tip: '한 번 들어갔다 나오면 단수, 이십오 달러예요. 여러 번 드나들면 복수, 오십 달러예요.', mistake: '캄보디아나 라오스에 갔다가 베트남으로 다시 들어올 계획이면, 단수로는 다시 못 들어와요. 그럴 땐 복수를 고르세요.' },
            tip: '단수 **$25** · 복수 **$50**', mistake: '중간에 나갔다가 **다시 들어오면 복수**가 필요합니다.', bad: '재입국 계획인데 단수', good: '재입국 = 복수' },
      en: { label: 'Type of visa', speech: { tip: 'Single entry is twenty five dollars. Multiple entry is fifty dollars.', mistake: 'If you will leave for Cambodia or Laos and come back into Vietnam, a single entry visa will not let you back in. Pick multiple entry.' },
            tip: 'Single **$25** · Multiple **$50**', mistake: 'Leaving and **coming back** needs multiple entry.', bad: 'single entry, then re-entry', good: 're-entry = multiple' },
    }},
    { type: 'type', field: 'validFrom', value: S.validFrom, text: {
      ko: { label: '유효 시작일', speech: { tip: '비자가 시작되는 날이에요. 보통 베트남 도착하는 날로 적어요.', mistake: '도착일보다 늦게 시작하면, 그날 입국할 수 없어요. 시작일은 도착일과 같거나 더 빨라야 해요.' },
            tip: '보통 **도착하는 날**', mistake: '시작일이 도착일보다 **늦으면 입국 불가**.', bad: '도착 다음 날부터', good: '도착일부터' },
      en: { label: 'Valid from', speech: { tip: 'The first day of the visa. Usually the day you land in Vietnam.', mistake: 'If it starts after your arrival day, you cannot enter that day. Start on or before the day you land.' },
            tip: 'Usually **the day you land**', mistake: 'Starting **after arrival** means no entry that day.', bad: 'starts the day after landing', good: 'starts on landing day' },
    }},
    { type: 'type', field: 'validTo', value: S.validTo, text: {
      ko: { label: '유효 종료일', speech: { tip: '비자가 끝나는 날이에요. 시작일부터 최대 구십 일까지 돼요.', mistake: '출국 날짜에 딱 맞추지 말고, 비행기가 밀릴 수 있으니 하루 이틀 여유를 두세요. 기간을 넘기면 벌금이 나올 수 있어요.' },
            tip: '시작일부터 **최대 90일**', mistake: '출국일에 딱 맞추지 말고 **하루 이틀 여유**.', bad: '출국일 = 종료일', good: '출국일 + 여유' },
      en: { label: 'Valid to', speech: { tip: 'The last day of the visa. Up to ninety days from the start.', mistake: 'Do not end it on your exact flight day. Flights get delayed, so leave a day or two spare. Overstaying can mean a fine.' },
            tip: '**Up to 90 days** from the start', mistake: 'Leave **a day or two spare** after your flight.', bad: 'ends on flight day', good: 'flight day + spare' },
    }},

    // ---------- PASSPORT ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'passport', speech: '이제 여권 정보예요. 숫자 하나도 틀리면 안 돼요.', route, title: '여권 정보', subtitle: '숫자 하나까지 여권과 대조하세요', flag: '📘', rightTitle: '3 / 4', rightText: '여권번호 · 발급기관 · 종류\n발급일 · 만료일' },
      en: { id: 'passport', speech: 'Now the passport details. Not a single digit can be wrong.', route, title: 'Passport information', subtitle: 'Check every digit against your passport', flag: '📘', rightTitle: '3 / 4', rightText: 'Number · issuing authority · type\nissue date · expiry date' },
    }},
    { type: 'type', field: 'passport', value: S.passport, text: {
      ko: { label: '여권번호', speech: { tip: '여권번호예요. 띄어쓰기 없이요.', mistake: '숫자 영이랑 영문 오, 숫자 일이랑 영문 아이가 헷갈려요. 여기가 틀리면 비자가 나와도 탑승을 못 할 수 있어요. 한 글자씩 확인하세요.' },
            tip: '**띄어쓰기 없이**', mistake: '0과 O, 1과 I 주의. 틀리면 **탑승을 못 할 수 있어요**.', bad: 'MI2345678', good: 'M12345678' },
      en: { label: 'Passport number', speech: { tip: 'Passport number, no spaces.', mistake: 'Zero and O, one and I are easy to mix up. Get this wrong and you may not be allowed to board, even with a visa. Check each character.' },
            tip: '**No spaces**', mistake: 'Watch 0 vs O, 1 vs I. A wrong number can **stop you boarding**.', bad: 'MI2345678', good: 'M12345678' },
    }},
    { type: 'type', field: 'passportExpiry', value: S.passportExpiry, text: {
      ko: { label: '여권 만료일', speech: { tip: '여권 만료일이에요. 발급일 말고, 데이트 오브 익스파이리요.', mistake: '전자비자는 신청한 여권에 연결돼요. 여행 전에 여권을 새로 받으면 다시 신청해야 할 수 있어요. 유효기간이 넉넉히 남았는지 먼저 확인하세요.' },
            tip: '발급일 말고 **만료일**', mistake: '여권을 새로 받으면 **다시 신청**해야 할 수 있어요. 유효기간 넉넉한지 먼저 확인.', bad: '만료 임박 여권', good: '유효기간 넉넉한 여권' },
      en: { label: 'Expiry date', speech: { tip: 'Passport expiry date, not the issue date.', mistake: 'The e-Visa is tied to this passport. Get a new passport before the trip and you may need to apply again. Make sure plenty of validity is left first.' },
            tip: 'The **expiry** date, not the issue date', mistake: 'New passport = you may need to **apply again**. Check validity first.', bad: 'passport about to expire', good: 'plenty of validity left' },
    }},

    // ---------- TRIP ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'trip', speech: '이제 여행 정보예요. 숙소 예약 확인서를 옆에 켜 두세요.', route, title: '여행 정보', subtitle: '숙소 예약 확인서를 옆에 두고 입력하세요', flag: '✈️', rightTitle: '4 / 4', rightText: '입국 목적 · 입국 예정일\n베트남 숙소 주소 · 입국 공항' },
      en: { id: 'trip', speech: 'Now the trip details. Keep your hotel booking open next to you.', route, title: 'Information about the trip', subtitle: 'Keep your hotel booking next to you', flag: '✈️', rightTitle: '4 / 4', rightText: 'Purpose · date of entry\naddress in Vietnam · entry airport' },
    }},
    { type: 'select', field: 'purpose', value: S.purpose, text: {
      ko: { label: '입국 목적', speech: { tip: '여행이면 투어리즘을 골라요.', mistake: '관광 비자로 일을 하면 안 돼요. 출장이나 취업이면 목적을 사실대로 고르세요.' },
            tip: '여행 = **Tourism**', mistake: '출장·취업이면 **사실대로**. 관광 비자로 일하면 안 됩니다.', bad: '출장인데 Tourism', good: '실제 목적 그대로' },
      en: { label: 'Purpose of entry', speech: { tip: 'For a holiday, pick tourism.', mistake: 'You cannot work on a tourist visa. For business or work, pick the real purpose.' },
            tip: 'Holiday = **Tourism**', mistake: 'Business or work? **Pick the real purpose**.', bad: 'Tourism for a work trip', good: 'the real purpose' },
    }},
    { type: 'type', field: 'entryDate', value: S.entryDate, text: {
      ko: { label: '입국 예정일', speech: { tip: '베트남에 도착하는 날이에요. 항공권 도착 날짜로요.', mistake: '밤 비행기는 도착이 다음 날일 수 있어요. 출발일이 아니라, 베트남 현지 도착 날짜를 쓰세요.' },
            tip: '항공권 **도착** 날짜', mistake: '밤 비행기는 **도착이 다음 날**일 수 있어요.', bad: '한국 출발일', good: '베트남 도착일' },
      en: { label: 'Intended date of entry', speech: { tip: 'The day you arrive in Vietnam, from your flight booking.', mistake: 'Overnight flights can land the next day. Use the local arrival date, not the departure date.' },
            tip: 'Your flight\'s **arrival** date', mistake: 'Overnight flights **land the next day**.', bad: 'departure date', good: 'arrival date in Vietnam' },
    }},
    { type: 'type', field: 'vnAddress', value: S.vnAddress, text: {
      ko: { label: '베트남 숙소 주소', speech: { tip: '베트남에서 묵는 곳 주소예요. 예약 확인서의 영문 주소를 그대로 옮기고, 아래에서 성이나 도시도 골라 주세요.', mistake: '호텔 이름만 쓰면 부족할 수 있어요. 번지랑 거리 이름까지 다 쓰세요.' },
            tip: '예약서의 **영문 주소** 그대로', mistake: '호텔 이름만 말고 **번지·거리까지**.', bad: 'SAMPLE HOTEL', good: 'SAMPLE HOTEL, 123 EXAMPLE STREET, DA NANG' },
      en: { label: 'Address in Vietnam', speech: { tip: 'Where you stay in Vietnam. Copy the address from your booking, then pick the province or city below.', mistake: 'A hotel name alone may not be enough. Write the street number and street too.' },
            tip: 'Copy it from your **booking**', mistake: 'Not just the hotel name: add **number and street**.', bad: 'SAMPLE HOTEL', good: 'SAMPLE HOTEL, 123 EXAMPLE STREET, DA NANG' },
    }},
    { type: 'select', field: 'entryPort', value: S.entryPort, text: {
      ko: { label: '입국 공항', speech: { tip: '베트남에 처음 내리는 공항이에요. 다낭이면 다낭 국제공항.', mistake: '출발하는 인천이나 경유 공항을 고르면 안 돼요. 실제로 베트남에 내릴 공항을 고르세요.' },
            tip: '베트남에 **처음 내리는** 공항', mistake: '출발·경유 공항이 아니라 **실제 도착 공항**.', bad: '인천 / 경유 공항', good: 'Da Nang Int Airport' },
      en: { label: 'Border gate of entry', speech: { tip: 'The airport where you first land in Vietnam.', mistake: 'Not your departure or transit airport. Pick the airport where you will really land in Vietnam.' },
            tip: 'Where you **first land** in Vietnam', mistake: 'Not departure or transit: **the airport you land at**.', bad: 'departure / transit airport', good: 'Da Nang Int Airport' },
    }},

    // ---------- DECLARE · REVIEW · PAY ----------
    { type: 'check', field: 'declare', hl: 'declareBox', text: {
      ko: { label: '서약', speech: { tip: '마지막 서약이에요. 입력한 내용이 사실이라는 내용이에요. 읽고 체크하세요.', mistake: '체크하기 전에 위로 올라가서 이름, 생년월일, 여권번호를 한 번 더 보세요. 거절되면 수수료를 돌려받지 못할 수 있어요.' },
            tip: '내용 확인 후 **체크**', mistake: '체크 전에 이름·생일·여권번호 **한 번 더**. 거절돼도 수수료 환불이 안 될 수 있어요.', bad: '확인 없이 체크', good: '한 번 더 보고 체크' },
      en: { label: 'Declaration', speech: { tip: 'The final declaration: your answers are true. Read it and tick the box.', mistake: 'Before ticking, scroll up and re-check your name, birth date and passport number. If it is refused, the fee may not be refunded.' },
            tip: 'Read it, then **tick the box**', mistake: 'Re-check name, birth date, passport no. **first**. The fee may not be refunded if refused.', bad: 'ticking without checking', good: 'check once more, then tick' },
    }},
    { type: 'manual', field: 'captcha', tipHold: 3000, text: {
      ko: { label: '보안 확인', speech: { tip: '보안 문자는 직접 입력하셔야 해요. 영상에서는 넘어갈게요.', mistake: '대문자와 소문자를 구분하는 경우가 많아요. 안 보이면 새로고침 버튼으로 새 글자를 받으세요.' },
            tip: '보안 문자는 **직접** 입력합니다', mistake: '**대·소문자** 구분. 안 보이면 새로고침.', bad: '대충 입력', good: '대·소문자 그대로' },
      en: { label: 'Security check', speech: { tip: 'The security code has to be typed by you. I will skip it here.', mistake: 'It is often case sensitive. If you cannot read it, refresh for a new one.' },
            tip: 'Type the security code **yourself**', mistake: 'Often **case sensitive**. Refresh if unreadable.', bad: 'guessing the code', good: 'exact upper and lower case' },
    }},
    { type: 'stop', field: 'payNow', tipHold: 3400, text: {
      ko: { label: '검토 · 결제', speech: { tip: '검토 화면에서 전체 내용을 다시 확인하고, 결제로 넘어가요. 영상은 여기서 멈출게요.', mistake: '결제 금액을 보세요. 단수는 이십오 달러, 복수는 오십 달러가 정부 수수료예요. 그보다 훨씬 비싸면 공식 사이트가 아니에요. 결과는 보통 삼 영업일 정도 걸리지만, 더 걸릴 수 있으니 미리 신청하세요.' },
            tip: '검토 후 결제 → 결제해야 **신청 완료**', mistake: '정부 수수료: 단수 **USD 25** · 복수 **USD 50**. 훨씬 비싸면 공식 아님.', bad: '$60~$100 결제 화면', good: 'USD 25 / 50' },
      en: { label: 'Review & payment', speech: { tip: 'Review everything once more, then continue to payment. The video stops here.', mistake: 'Check the amount. The government fee is twenty five dollars for single entry, fifty for multiple. Much more than that, and you are not on the official site. Results usually take about three working days, but can take longer, so apply early.' },
            tip: 'Review, then pay. **Not submitted until paid**', mistake: 'Government fee: **USD 25** single · **USD 50** multiple. Much more = not official.', bad: '$60–$100 checkout', good: 'USD 25 / 50' },
    }},

    // ---------- OUTRO (ticket) ----------
    { type: 'card', hold: 5000, card: {
      ko: { id: 'outro', speech: '끝났어요. 결제는 꼭 공식 사이트, 이비자 점 거브 점 브이엔에서만 하세요. 승인되면 이메일로 알려 주는데, 전자비자를 출력하거나 휴대폰에 저장해 두세요. 신청 코드도 꼭 캡처해 두시고요. 다음 영상은 해외여행 이심 개통이에요. 설명란에 공식 링크 있습니다.',
            route, title: '끝. **결제는 공식 사이트에서만**', subtitle: '공식: evisa.gov.vn · 단수 USD 25 / 복수 USD 50 · 최대 90일',
            meta: [{ k: '설명란 1줄', v: '공식 사이트' }, { k: '설명란 2줄', v: 'eSIM' }, { k: '설명란 3줄', v: '공항 이동' }], stamp: '결제\n직전\n까지', flag: '🇻🇳',
            rightTitle: '다음 영상', rightText: '', next: ['📱 해외 eSIM 5분 개통', '🚕 공항에서 시내까지 그랩', '🔔 서식 바뀌면 최신판 알림'], brand: '▶ 따라하면 끝 · 입국신고서·비자' },
      en: { id: 'outro', speech: 'Done. Pay only on the official site, e visa dot gov dot v n. When it is approved you get an email. Print the e-Visa or save it on your phone, and keep your registration code. Up next: a travel eSIM in five minutes. The official link is in the description.',
            route, title: 'Done. **Pay on the official site only**', subtitle: 'Official: evisa.gov.vn · USD 25 single / USD 50 multiple · up to 90 days',
            meta: [{ k: 'LINE 1', v: 'Official site' }, { k: 'LINE 2', v: 'eSIM' }, { k: 'LINE 3', v: 'Transfer' }], stamp: 'STOP\nBEFORE\nPAYING', flag: '🇻🇳',
            rightTitle: 'Up next', rightText: '', next: ['📱 Travel eSIM in 5 min', '🚕 Airport to city with Grab', '🔔 Subscribe for updates'], brand: '▶ Copy My Screen' },
    }},
  ],
};
