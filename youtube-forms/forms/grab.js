// GRAB — airport → city by ride-hailing app in Singapore & Malaysia ("after you arrive" series)
// Sign up before the trip, then book a ride from Changi (SIN) or KLIA (KUL) to the hotel.
//
// The real flow is a MOBILE APP, not a website, so there is no live page to record. Both targets point at the
// practice page ../mock/ride-app.html (generic "Ride app (practice)" — no Grab logo, colours or UI design).
// "Grab" is named in text and speech only, as a factual reference.
//
// Facts checked 2026-11 (re-check before each yearly refresh):
//  - Sign-up works with a foreign (non-local) mobile number; a 6-digit code arrives by SMS, so the number must be
//    able to receive SMS. Grab's global page: "no local SIM card needed". Hence: sign up BEFORE flying.
//  - Changi: book in the app, then go to the Arrival / Ride-Hailing pick-up point of your terminal (T1–T4).
//    Official pages disagree on door numbers (Level 1 doors vs Basement 1), so the script only says
//    "follow the signs / the point shown in the app".
//  - KLIA: designated e-hailing pickup on Level 1 — Terminal 1 Main Terminal Building (Doors 3–4), Terminal 2
//    Transportation Hub. Door numbers have moved over the years, so the script says "Level 1, follow the signs".
//  - Fare: fixed upfront price shown before booking, but Grab SG states it EXCLUDES tolls and surcharges;
//    ERP (Singapore road tolls) is added at the end of the trip. Malaysia: highway tolls likewise.
//  - Cancelling late or keeping the driver waiting can cost a fee (SG about S$4 after a short grace period,
//    MY RM3–5 after 5 minutes). Sources differ on the grace period (3 vs 5 min), so no number is spoken.
//  - Share-my-ride is in the in-app Safety Centre. Rating / tipping after the trip is optional.
//  - NOT confirmed from an official page: cash as a payment option for a tourist account, and whether a
//    Google / Apple sign-up still asks for a phone number. Both are worded conditionally in the script.
//
// Never type a card number on camera: the card step is `manual`. The Book button is a `stop` step.

const path = require('path');

// Sample traveller — obviously fake. Never use real personal data on camera.
const S = {
  phoneCode: '82',
  phone: '1012345678',
  name: 'HONG GILDONG',
  email: 'sample.traveller@example.com',
  pickup: 'SIN-T1',
  dest: 'SAMPLE HOTEL SINGAPORE',
};

const route = { from: 'SIN', fromCity: 'CHANGI AIRPORT', to: 'HTL', toCity: 'YOUR HOTEL' };

const MOCK_URL = 'file://' + path.join(__dirname, '..', 'mock', 'ride-app.html');
const SELECTORS = {
  installRow: '#installRow', altRow: '#altRow', phoneCode: '#phoneCode', phone: '#phone', otp: '#otpRow',
  name: '#name', email: '#email', payCard: '#payCard', payRow: '#payRow', cardBox: '#cardBox',
  pickup: '#pickup', dest: '#dest', rideStd: '#rideStd', rideRow: '#rideRow', fare: '#fareRow', payWithCard: '#payWithCard', payWithRow: '#payWithRow',
  book: '#book', driver: '#driverCard', share: '#shareBtn', rate: '#rateRow',
};

module.exports = {
  id: 'grab',
  pack: 'settle',   // closest existing pack; an "after you arrive" pack does not exist yet
  country: { ko: '싱가포르·말레이시아', en: 'Singapore & Malaysia' }, flag: '🚕',
  fee: '앱 무료 (요금은 거리별)', when: '출국 전 가입, 도착 후 호출', captcha: false,
  title: { ko: '공항에서 시내까지: 그랩 가입·호출 따라하기', en: 'Airport to City: Sign Up and Book a Grab Ride' },
  shortTitle: { ko: '그랩 사용법', en: 'How to use Grab' },   // Shorts headline / title
  videoTitle: { ko: '그랩 사용법 {year} | 싱가포르·말레이시아 공항에서 시내까지, 가입부터 호출 따라하기', en: 'How to Use Grab {year} | Singapore & Malaysia Airport to City | Copy My Screen' },

  url: {
    mock: MOCK_URL,
    live: MOCK_URL,   // the real flow is a mobile app, not a website — there is nothing live to record
  },

  selectors: {
    mock: SELECTORS,
    live: { ...SELECTORS },   // copy of the mock selectors (see url.live)
  },

  strings: {
    ko: { easyPill: '👀 화면 그대로 따라만 하세요', mistakeTitle: '⚠ 많이 틀리는 곳', pause: '⏸ 여기까지 해 보세요', pauseSub: '다 하고 나서 재생' },
    en: { easyPill: '👀 Just copy the screen', mistakeTitle: '⚠ Common mistake', pause: '⏸ Do this, then press play', pauseSub: '' },
  },

  steps: [
    // ---------- INTRO (ticket) ----------
    { type: 'card', hold: 4500, card: {
      ko: { id: 'intro', speech: '싱가포르나 말레이시아 가시죠? 공항에서 호텔까지, 그랩이라는 차량 호출 앱으로 가는 방법이에요. 가입은 집에서 미리 하고, 도착해서는 부르기만 하면 돼요. 연습 화면으로 순서대로 보여 드릴게요. 많이 실수하는 곳에서는 제가 잠깐 멈출게요.',
            route, title: '공항에서 시내까지,\n**그랩 가입부터 호출까지**', subtitle: '연습 화면으로 순서 그대로. 실수하기 쉬운 곳에서 멈춥니다.',
            meta: [{ k: '소요', v: '6분' }, { k: '앱', v: '무료' }, { k: '가입', v: '출국 전' }, { k: '기준', v: '2026' }], stamp: '따라\n하면\n끝', flag: '🚕',
            rightTitle: 'Grab 사용법', rightText: '준비물: 휴대폰 · 문자 수신 · 카드\n화면은 연습용, 실제 앱과 모양이 달라요', brand: '▶ 따라하면 끝 · 도착 후 가이드' },
      en: { id: 'intro', speech: 'Flying to Singapore or Malaysia? This is how to get from the airport to your hotel with Grab, the ride-hailing app. You sign up at home, and after you land, you just book. I will walk through it on a practice screen, and pause at the spots people usually get wrong.',
            route, title: 'Airport to city,\n**Grab from sign-up to pick-up**', subtitle: 'A practice screen, step by step. We stop where people slip up.',
            meta: [{ k: 'TIME', v: '6 min' }, { k: 'APP', v: 'Free' }, { k: 'SIGN UP', v: 'Before you fly' }, { k: 'YEAR', v: '2026' }], stamp: 'COPY\nMY\nSCREEN', flag: '🚕',
            rightTitle: 'How to use Grab', rightText: 'Need: phone · SMS · a card\nPractice screen, the real app looks different', brand: '▶ Copy My Screen · After You Arrive' },
    }},

    // ---------- 1. SIGN UP (before the trip) ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'signup', speech: '먼저 가입이에요. 이건 꼭 출국 전에, 집에서 해 두세요.', route, title: '1. 출국 전, **집에서 가입**', subtitle: '앱 설치 → 휴대폰 인증 → 이름·이메일 → 결제 수단', flag: '📱', rightTitle: '1 / 3', rightText: '설치 · 휴대폰 번호 · 문자 인증\n이름 · 이메일 · 결제 수단' },
      en: { id: 'signup', speech: 'First, signing up. Do this at home, before you fly.', route, title: '1. Before you fly, **sign up at home**', subtitle: 'Install → verify your number → name and email → payment', flag: '📱', rightTitle: '1 / 3', rightText: 'Install · mobile number · SMS code\nname · email · payment' },
    }},
    { type: 'manual', field: 'installRow', tipHold: 2800, text: {
      ko: { label: '앱 설치', speech: { tip: '앱스토어나 구글 플레이에서 그랩을 검색해서 설치해요. 영어로 지, 알, 에이, 비예요. 앱은 무료예요.', mistake: '제일 많이 하는 실수가, 공항에 도착해서 가입하는 거예요. 가입할 때 문자로 인증번호가 오는데, 로밍을 안 했거나 현지 유심으로 바꿔 끼우면 한국 번호로 문자를 못 받아요. 그래서 가입은 집에서 끝내고 가세요.' },
            tip: '앱스토어·구글 플레이에서 **Grab** 설치 (무료)', mistake: '도착해서 가입하면 **인증 문자를 못 받을 수** 있어요. 출국 전에 끝내세요.', bad: '공항 도착 후 가입', good: '출국 전 집에서 가입' },
      en: { label: 'Install the app', speech: { tip: 'Search for Grab in the App Store or Google Play, and install it. The app is free.', mistake: 'The most common mistake is signing up after you land. Sign-up sends a code by text message. Without roaming, or after you swap in a local SIM, your home number cannot receive it. So finish signing up at home.' },
            tip: 'Install **Grab** from the App Store or Google Play (free)', mistake: 'Sign up after landing and the **SMS code may never arrive**. Do it before you fly.', bad: 'sign up at the airport', good: 'sign up at home' },
    }},
    { type: 'manual', field: 'altRow', tipHold: 2600, text: {
      ko: { label: '가입 방법', speech: { tip: '가입은 휴대폰 번호로 해도 되고, 구글이나 애플 계정으로 시작해도 돼요. 어느 쪽이든 휴대폰 번호 인증을 요구할 수 있으니까, 오늘은 번호로 해 볼게요.' }, tip: '**휴대폰 번호** 또는 구글·애플 계정' },
      en: { label: 'How to sign up', speech: { tip: 'You can sign up with your mobile number, or start with a Google or Apple account. Either way the app may still ask to verify a phone number, so today we will use the number.' }, tip: '**Mobile number**, or Google / Apple' },
    }},
    { type: 'select', field: 'phoneCode', value: S.phoneCode, text: {
      ko: { label: '국가번호', speech: { tip: '국가번호예요. 한국 번호 그대로 쓰면 돼요. 플러스 팔십이를 고르세요. 현지 번호는 없어도 돼요.' }, tip: '한국 번호 그대로, **+82**' },
      en: { label: 'Country code', speech: { tip: 'The country code. Your home number works, you do not need a local one. Pick your own country code.' }, tip: 'Your **home number** works' },
    }},
    { type: 'type', field: 'phone', value: S.phone, text: {
      ko: { label: '휴대폰 번호', speech: { tip: '번호를 넣어요. 국가번호를 골랐으니까 맨 앞 영은 빼고, 일공 일이삼사 오륙칠팔, 이렇게요.' }, tip: '맨 앞 **0 빼고** 입력' },
      en: { label: 'Mobile number', speech: { tip: 'Type your number. You already chose the country code, so leave out the first zero.' }, tip: 'Drop the **leading 0**' },
    }},
    { type: 'manual', field: 'otp', tipHold: 2800, text: {
      ko: { label: '문자 인증', speech: { tip: '문자로 여섯 자리 인증번호가 와요. 그 숫자를 여기에 직접 넣으세요. 이 번호는 다른 사람한테 알려 주면 안 돼요.' }, tip: '문자로 온 **6자리 번호**를 직접 입력' },
      en: { label: 'SMS code', speech: { tip: 'A six digit code arrives by text message. Type it in here yourself. Never share this code with anyone.' }, tip: 'Type the **6-digit SMS code** yourself' },
    }},
    { type: 'type', field: 'name', value: S.name, text: {
      ko: { label: '이름', speech: { tip: '이름이에요. 기사님이 이 이름을 보고 손님을 확인해요. 영어로, 읽기 쉽게 적어 주세요.' }, tip: '기사님이 보는 이름. **영문**으로' },
      en: { label: 'Name', speech: { tip: 'Your name. The driver sees it and uses it to confirm it is you, so keep it easy to read.' }, tip: 'The **driver sees** this name' },
    }},
    { type: 'type', field: 'email', value: S.email, text: {
      ko: { label: '이메일', speech: { tip: '이메일이에요. 영수증이 여기로 와요. 여행 중에 열어 볼 수 있는 메일로 적으세요.' }, tip: '**영수증**이 오는 메일' },
      en: { label: 'Email', speech: { tip: 'Your email. Receipts are sent here, so use an inbox you can open while you travel.' }, tip: '**Receipts** are sent here' },
    }},
    { type: 'radio', field: 'payCard', hl: 'payRow', text: {
      ko: { label: '결제 수단', speech: { tip: '결제 수단이에요. 카드를 등록해 두면 내릴 때 자동으로 결제돼서 편해요. 해외 결제가 되는 카드를 고르세요.' }, tip: '**해외 결제 되는 카드**가 편해요' },
      en: { label: 'Payment method', speech: { tip: 'Payment method. With a card on file, the fare is charged automatically when you get out. Use a card that works abroad.' }, tip: 'A **card that works abroad** is easiest' },
    }},
    { type: 'manual', field: 'cardBox', tipHold: 3000, text: {
      ko: { label: '카드 등록', speech: { tip: '여기에 본인 카드 번호를 직접 넣으세요. 저는 화면에 카드 번호를 보여 드리지 않아요.', mistake: '카드 등록에서 막히는 분이 많아요. 등록할 때 카드사 본인 인증이 뜨는데, 그 인증 문자도 한국 번호로 와요. 그래서 이것도 집에서 해야 해요. 그래도 안 되는 카드가 있으니까, 다른 카드 한 장이랑 현지 현금을 조금 챙겨 가세요. 앱에 현금 결제가 보이면, 그걸로 바꿔서 타면 돼요.' },
            tip: '**본인 카드**를 직접 입력하세요', mistake: '카드사 **본인 인증**에서 막힐 수 있어요. 예비 카드와 현지 현금을 준비하세요.', bad: '카드 한 장만 믿기', good: '예비 카드 + 현지 현금' },
      en: { label: 'Add your card', speech: { tip: 'Enter your own card here. I will not show a card number on screen.', mistake: 'People often get stuck here. Adding a card can trigger a security check from your bank, and that code also goes to your home number. One more reason to do this at home. Some cards are still declined, so bring a second card and a little local cash. If the app shows a cash option, you can switch to that.' },
            tip: 'Enter **your own card** here', mistake: 'Your bank may ask for a **security check**, or decline. Carry a backup card and local cash.', bad: 'one card only', good: 'backup card + local cash' },
    }},

    // ---------- 2. BOOK (on arrival) ----------
    { type: 'card', hold: 2800, card: {
      ko: { id: 'book', speech: '이제 도착했어요. 짐을 다 찾고 나서 앱을 여세요. 차가 금방 오기 때문에, 짐 찾기 전에 부르면 기다리는 요금이 붙을 수 있어요.', route, title: '2. 도착해서 **차 부르기**', subtitle: '짐을 다 찾은 다음에 호출하세요', flag: '🛬', rightTitle: '2 / 3', rightText: '탑승 위치 · 목적지 · 차량 종류\n요금 확인 · 결제 수단 · 호출' },
      en: { id: 'book', speech: 'Now you have landed. Collect your bags first, then open the app. Cars arrive quickly, so if you book before you have your bags, a waiting fee can apply.', route, title: '2. After landing, **book the ride**', subtitle: 'Collect your bags first, then book', flag: '🛬', rightTitle: '2 / 3', rightText: 'Pick-up · destination · ride type\nfare · payment · book' },
    }},
    { type: 'select', field: 'pickup', value: S.pickup, mistakeHold: 4200, text: {
      ko: { label: '탑승 위치', speech: { tip: '탑승 위치예요. 지금 있는 터미널을 고르세요. 창이 공항은 터미널마다 차량 호출 전용 탑승장이 따로 있어요.', mistake: '여기서 제일 많이 헤매요. 공항에서는 아무 데서나 탈 수 없어요. 앱에 탑승 지점이 문 번호까지 나오니까, 그 번호를 보고, 공항 안내판에 라이드 헤일링이나 어라이벌 픽업이라고 적힌 곳을 따라가세요. 쿠알라룸푸르 공항, 케이엘아이에이는 일 층에 이 헤일링 탑승장이 있어요. 그리고 터미널을 잘못 고르면 차가 다른 터미널로 가요. 내가 내린 터미널이 몇 번인지 꼭 확인하세요.' },
            tip: '지금 있는 **터미널**의 호출 차량 탑승장', mistake: '공항은 **지정된 탑승장**에서만 탑니다. 터미널과 문 번호를 앱에서 확인하세요.', bad: '택시 승강장 · 출국층', good: 'Ride-hailing / Arrival pick-up 표지판' },
      en: { label: 'Pick-up point', speech: { tip: 'The pick-up point. Choose the terminal you are in. At Changi, every terminal has its own ride-hailing pick-up area.', mistake: 'This is where people get lost. At an airport you cannot be picked up just anywhere. The app shows the exact pick-up point, down to the door number. Then follow the airport signs that say ride-hailing, or arrival pick-up. At Kuala Lumpur airport, KLIA, the e-hailing pick-up is on level one. And if you choose the wrong terminal, the car goes to the wrong terminal, so check which one you landed at.' },
            tip: 'The ride-hailing pick-up at **your terminal**', mistake: 'Airports use **designated pick-up points**. Check the terminal and door in the app.', bad: 'taxi rank · departure level', good: 'signs for Ride-hailing / Arrival pick-up' },
    }},
    { type: 'type', field: 'dest', value: S.dest, text: {
      ko: { label: '목적지', speech: { tip: '목적지에 호텔 이름을 영어로 쳐요. 비슷한 이름의 호텔이 여러 개 나올 수 있으니까, 아래에 나오는 주소를 예약서랑 비교해 보고 고르세요.' }, tip: '호텔 이름 입력 후 **주소 확인**' },
      en: { label: 'Destination', speech: { tip: 'Type your hotel name as the destination. Several hotels can have similar names, so compare the address in the list with your booking before you choose.' }, tip: 'Hotel name, then **check the address**' },
    }},
    { type: 'radio', field: 'rideStd', hl: 'rideRow', text: {
      ko: { label: '차량 종류', speech: { tip: '차량 종류를 골라요. 한두 명에 큰 가방 두 개 정도면, 사인승 일반 차량이면 충분해요.', mistake: '짐이 많은데 작은 차를 부르는 실수가 많아요. 일반 차량은 트렁크에 큰 캐리어가 두 개 정도 들어가요. 세 명 이상이거나 캐리어가 세 개 넘으면, 처음부터 육인승 큰 차를 부르세요. 짐이 안 실리면 취소하고 다시 불러야 해요.' },
            tip: '1~2명 + 큰 가방 2개 → **일반 차량**', mistake: '짐이 많으면 처음부터 **6인승 큰 차**를 부르세요.', bad: '3명 + 캐리어 3개에 일반 차량', good: '6인승 큰 차' },
      en: { label: 'Ride type', speech: { tip: 'Choose the ride type. For one or two people with about two large bags, a standard four seat car is enough.', mistake: 'A common mistake is booking a small car with a lot of luggage. A standard car fits about two large suitcases in the boot. With three or more people, or more than three suitcases, book the six seat car from the start. If the bags do not fit, you have to cancel and book again.' },
            tip: '1–2 people + 2 large bags → **standard car**', mistake: 'Lots of luggage? Book the **6-seater** from the start.', bad: '3 people + 3 suitcases in a standard car', good: 'the 6-seater' },
    }},
    { type: 'manual', field: 'fare', tipHold: 2800, mistakeHold: 4200, text: {
      ko: { label: '요금 확인', speech: { tip: '요금은 부르기 전에 미리 정해져서 나와요. 미터기가 아니라서, 길이 막혀도 이 요금은 그대로예요. 화면의 숫자는 예시예요.', mistake: '그런데 이 금액이 끝이 아닐 수 있어요. 통행료나 추가 요금은 여기에 안 들어가 있어요. 싱가포르는 이알피라는 도로 통행료가 있고, 말레이시아는 고속도로 통행료가 있어요. 이런 건 내릴 때 합쳐져서 나와요. 그러니까 영수증 금액이 조금 더 많아도 놀라지 마세요.' },
            tip: '호출 전에 **요금이 미리 확정**됩니다', mistake: '**통행료·추가 요금**은 나중에 더해질 수 있어요.', bad: '표시 금액 = 최종 금액', good: '표시 금액 + 통행료' },
      en: { label: 'Check the fare', speech: { tip: 'The fare is fixed and shown before you book. There is no meter, so it does not go up in traffic. The numbers on this screen are only samples.', mistake: 'But that may not be the final amount. Tolls and surcharges are not included. Singapore has road tolls called ERP, and Malaysia has highway tolls. They are added at the end of the trip. So do not be surprised if the receipt is a little higher.' },
            tip: 'The fare is **fixed before you book**', mistake: '**Tolls and surcharges** can be added on top.', bad: 'shown fare = final amount', good: 'shown fare + tolls' },
    }},
    { type: 'radio', field: 'payWithCard', hl: 'payWithRow', text: {
      ko: { label: '결제 수단 확인', speech: { tip: '부르기 전에 결제 수단을 한 번 더 보세요. 카드인지, 현금인지요. 현금으로 되어 있으면 내릴 때 기사님한테 직접 내야 하니까, 현지 돈이 있어야 해요.' }, tip: '카드인지 현금인지 **호출 전에 확인**' },
      en: { label: 'Check payment', speech: { tip: 'Before you book, look at the payment method once more. Card, or cash. If it says cash, you pay the driver directly at the end, so you need local money.' }, tip: 'Card or cash? **Check before you book**' },
    }},
    { type: 'stop', field: 'book', tipHold: 3400, text: {
      ko: { label: '호출', speech: { tip: '이제 호출 버튼을 누르면 기사님을 찾기 시작해요. 저는 연습이라 누르지 않을게요. 탑승장에 다 와서 누르는 게 좋아요. 기사님이 정해진 뒤에 늦게 취소하거나 오래 기다리게 하면, 수수료가 붙을 수 있어요.' }, tip: '탑승장에 와서 호출. **늦은 취소는 수수료**가 붙을 수 있어요' },
      en: { label: 'Book', speech: { tip: 'Press book, and the app starts looking for a driver. This is practice, so I will not press it. It is best to book once you are at the pick-up point. If you cancel late after a driver is assigned, or keep the driver waiting, a fee can apply.' }, tip: 'Book at the pick-up point. **Late cancelling can cost a fee**' },
    }},

    // ---------- 3. THE RIDE ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'ride', speech: '기사님이 정해지면 이런 화면이 나와요. 타기 전에 확인할 게 하나 있어요.', route, title: '3. **타기 전 확인**', subtitle: '차 번호판 · 기사님 이름 · 이동 경로 공유', flag: '🚗', rightTitle: '3 / 3', rightText: '차량 번호판 확인\n경로 공유 · 평가와 팁(선택)' },
      en: { id: 'ride', speech: 'Once a driver is assigned, you see a screen like this. There is one thing to check before you get in.', route, title: '3. **Before you get in**', subtitle: 'Number plate · driver name · share your trip', flag: '🚗', rightTitle: '3 / 3', rightText: 'Match the number plate\nshare trip · rate and tip (optional)' },
    }},
    { type: 'manual', field: 'driver', tipHold: 2800, mistakeHold: 4200, text: {
      ko: { label: '차량 확인', speech: { tip: '기사님 이름, 차 종류, 색깔, 그리고 차 번호판이 나와요. 지도에서 차가 오는 것도 보여요.', mistake: '이건 정말 중요해요. 탑승장에는 비슷한 차가 여러 대 서 있어요. 번호판을 안 보고 타면 다른 사람 차를 탈 수 있어요. 앱에 나온 번호판이랑 차 번호판이 똑같은지 먼저 보세요. 그리고 타면서 기사님한테 내 이름을 물어보세요. 내 이름을 맞게 말하면, 내 차예요.' },
            tip: '기사님 이름 · 차종 · **번호판**이 나와요', mistake: '**번호판이 같은지** 확인하고 타세요. 비슷한 차가 많아요.', bad: '색깔만 보고 탑승', good: '번호판 + 기사님이 내 이름 확인' },
      en: { label: 'Check the car', speech: { tip: 'You see the driver name, the car model and colour, and the number plate. You can also watch the car arrive on the map.', mistake: 'This one really matters. Several similar cars wait at the pick-up point. If you do not check the plate, you can get into someone else’s car. Match the plate in the app with the plate on the car first. Then, as you get in, ask the driver who the ride is for. If they say your name, it is your car.' },
            tip: 'Driver name · car · **number plate**', mistake: '**Match the plate** before you get in. Many cars look alike.', bad: 'going by colour only', good: 'plate + driver says your name' },
    }},
    { type: 'click', field: 'share', text: {
      ko: { label: '이동 경로 공유', speech: { tip: '타고 나서는 이동 경로를 가족이나 일행한테 보낼 수 있어요. 링크를 받은 사람이 지금 어디쯤 가고 있는지 볼 수 있어요. 밤에 혼자 탈 때 좋아요.' }, tip: '가족·일행에게 **실시간 위치** 보내기 (선택)' },
      en: { label: 'Share your trip', speech: { tip: 'Once you are in, you can share the trip with family or friends. They get a link and can see where you are. Handy when you ride alone at night.' }, tip: 'Send your **live location** (optional)' },
    }},
    { type: 'manual', field: 'rate', tipHold: 3000, text: {
      ko: { label: '도착·평가', speech: { tip: '도착하면 카드는 자동으로 결제되니까 그냥 내리면 돼요. 현금이면 앱에 나온 금액을 내세요. 별점이랑 팁은 선택이에요. 안 해도 괜찮아요. 내리기 전에 두고 내린 물건이 없는지 한 번 보세요.' }, tip: '카드는 **자동 결제**. 별점·팁은 선택' },
      en: { label: 'Arrive and rate', speech: { tip: 'When you arrive, a card is charged automatically, so you just get out. With cash, pay the amount shown in the app. The rating and the tip are optional. Before you get out, check that you have left nothing behind.' }, tip: 'Card is **charged automatically**. Rating and tip are optional' },
    }},

    // ---------- OUTRO (ticket) ----------
    { type: 'card', hold: 5000, card: {
      ko: { id: 'outro', speech: '끝났어요. 정리하면, 가입이랑 카드 등록은 출국 전에, 호출은 짐을 찾고 탑승장에 가서, 타기 전에는 번호판 확인. 이 세 가지만 기억하세요. 다음은 현지 이심 개통이랑 입국카드 작성법이에요. 설명란에 링크 있습니다.',
            route, title: '끝. **이 세 가지만 기억하세요**', subtitle: '가입은 출국 전 · 호출은 탑승장에서 · 타기 전 번호판 확인',
            meta: [{ k: '출국 전', v: '가입·카드' }, { k: '도착 후', v: '탑승장' }, { k: '타기 전', v: '번호판' }], stamp: '호출\n완료', flag: '🚕',
            rightTitle: '다음 영상', rightText: '', next: ['📱 싱가포르 eSIM 5분 개통', '🇸🇬 싱가포르 입국카드 SG Arrival Card', '🇲🇾 말레이시아 입국신고서 MDAC'], brand: '▶ 따라하면 끝 · 도착 후 가이드' },
      en: { id: 'outro', speech: 'Done. To sum up: sign up and add your card before you fly, book once you have your bags and are at the pick-up point, and match the plate before you get in. Next up: a local eSIM in five minutes, and the arrival cards. Links are in the description.',
            route, title: 'Done. **Remember these three**', subtitle: 'Sign up before you fly · book at the pick-up point · match the plate',
            meta: [{ k: 'BEFORE', v: 'Sign up + card' }, { k: 'ON ARRIVAL', v: 'Pick-up point' }, { k: 'BOARDING', v: 'Plate' }], stamp: 'RIDE\nBOOKED', flag: '🚕',
            rightTitle: 'Up next', rightText: '', next: ['📱 Singapore eSIM in 5 min', '🇸🇬 SG Arrival Card', '🇲🇾 Malaysia Arrival Card (MDAC)'], brand: '▶ Copy My Screen' },
    }},
  ],
};
