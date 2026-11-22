// eSIM — buy a travel eSIM and install it before you fly (generic, any country / any provider)
// First definition of the "after you arrive" series. Examples use a Singapore + Malaysia trip.
//
// There is NO single official site for this topic: every eSIM seller has its own checkout and every
// phone maker names the settings menus a little differently. So this tutorial is recorded ONLY on the
// practice page ../mock/esim-setup.html, which is a neutral store + a neutral "phone settings" panel.
// No real brand names, logos or screens are shown. The recording never pays (the Pay button is a `stop`).
//
// Facts checked 2026-11 against Apple Support ("Use eSIM while travelling internationally",
// "Set up eSIM on iPhone", "Using Dual SIM with an eSIM"), Android device guides and several
// eSIM provider help centres. Things that differ by provider are worded as "depends on the provider".

const path = require('path');

// Sample data — obviously fake. Never use a real email on camera.
const S = {
  destination: 'SGMY',            // Singapore + Malaysia (regional)
  email: 'sample.traveller@example.com',
  label: 'Travel',
  defaultLine: 'home',
  dataLine: 'travel',
};

const route = { from: 'ICN', fromCity: 'SEOUL', to: 'SIN', toCity: 'SINGAPORE' };

const mockUrl = 'file://' + path.join(__dirname, '..', 'mock', 'esim-setup.html');

const selectors = {
  supportsEsim: '#supportsEsim', supportRow: '#supportRow', unlocked: '#unlocked', unlockRow: '#unlockRow',
  destination: '#destination', plan: '#plan7', planCard: '#plan7Card', email: '#email', confirm: '#confirm', confirmRow: '#confirmRow', pay: '#pay',
  qrMail: '#qrMail', addEsim: '#addEsim', scanQr: '#scanQr', scanBox: '#scanBox',
  label: '#label', labelRow: '#labelRow', defaultLine: '#defaultLine', defaultRow: '#defaultRow', dataLine: '#dataLine', dataRow: '#dataRow',
  dataSwitch: '#dataSwitch', switchRow: '#switchRow', homeRoaming: '#homeRoaming', homeRoamRow: '#homeRoamRow',
  travelRoaming: '#travelRoaming', travelRoamRow: '#travelRoamRow', travelOn: '#travelOn', travelOnRow: '#travelOnRow', status: '#status',
};

module.exports = {
  id: 'esim',
  pack: 'settle',     // closest existing pack ("after you arrive"); _packs.js is not edited here
  country: { ko: '해외여행', en: 'Travel' }, flag: '📱',
  fee: '국가·용량별 (1주일 기준 보통 몇 달러~15달러 안팎)', when: '출국 1~2일 전 설치', captcha: false,
  title: { ko: '여행용 eSIM 구매·설치 따라하기', en: 'Travel eSIM: Buy and Install It Before You Fly' },
  shortTitle: { ko: '여행 eSIM 설치', en: 'Travel eSIM setup' },   // Shorts headline / title
  videoTitle: { ko: '해외여행 eSIM 설치 방법 {year} | 구매부터 로밍 설정까지 따라하기', en: 'How to Install a Travel eSIM {year} | Buy, Set Up, Avoid Roaming Charges | Copy My Screen' },

  url: {
    mock: mockUrl,
    // no single official site (any eSIM provider works the same way) → "live" is the same practice page
    live: mockUrl,
  },

  selectors: {
    mock: selectors,
    // same practice page, so the live map is a copy of the mock map
    live: { ...selectors },
  },

  strings: {
    ko: { easyPill: '👀 화면 그대로 따라만 하세요', mistakeTitle: '⚠ 많이 틀리는 곳', pause: '⏸ 여기까지 따라 하세요', pauseSub: '내 폰에서 하고 나서 재생' },
    en: { easyPill: '👀 Just copy the screen', mistakeTitle: '⚠ Common mistake', pause: '⏸ Do this, then press play', pauseSub: '' },
  },

  steps: [
    // ---------- INTRO (ticket) ----------
    { type: 'card', hold: 4500, card: {
      ko: { id: 'intro', speech: '해외여행 갈 때, 이심 하나만 미리 깔아 두면, 도착하자마자 데이터가 바로 터져요. 유심을 갈아 끼울 필요도 없고, 한국 번호도 그대로 살아 있어요. 사는 것부터 로밍 설정까지, 순서대로 같이 해 볼게요. 어느 회사 이심이든 방법은 똑같아요. 요금 폭탄 맞기 쉬운 곳에서는, 제가 잠깐 멈출게요.',
            route, title: '여행용 eSIM,\n**출국 전에 미리 깔아 두세요**', subtitle: '구매 → 설치 → 로밍 설정까지. 틀리기 쉬운 곳에서 멈춥니다.',
            meta: [{ k: '소요', v: '10분' }, { k: '비용', v: '국가·용량별' }, { k: '설치', v: '출국 1~2일 전' }, { k: '기준', v: '2026' }], stamp: '따라\n하면\n끝', flag: '📱',
            rightTitle: 'Travel eSIM', rightText: '준비물: eSIM 지원 폰 · 와이파이 · 이메일\n어느 eSIM 회사든 방법은 같아요', brand: '▶ 따라하면 끝 · 도착 후 준비' },
      en: { id: 'intro', speech: 'Install a travel eSIM before you fly, and you have mobile data the moment you land. No swapping SIM cards, and your home number keeps working. We go through it in order: buying, installing, and the roaming settings. Any eSIM provider works the same way. I will pause at the spots where people end up with a roaming bill.',
            route, title: 'Travel eSIM,\n**install it before you fly**', subtitle: 'Buy → install → roaming settings. We stop where people slip up.',
            meta: [{ k: 'TIME', v: '10 min' }, { k: 'COST', v: 'Varies' }, { k: 'WHEN', v: '1–2 days before' }, { k: 'YEAR', v: '2026' }], stamp: 'COPY\nMY\nSCREEN', flag: '📱',
            rightTitle: 'Travel eSIM', rightText: 'Need: eSIM-capable phone · Wi-Fi · email\nAny eSIM provider works the same way', brand: '▶ Copy My Screen · After You Arrive' },
    }},

    // ---------- CHECK THE PHONE ----------
    { type: 'check', field: 'supportsEsim', hl: 'supportRow', text: {
      ko: { label: 'eSIM 지원 확인', speech: { tip: '사기 전에, 내 폰이 이심을 지원하는지부터 확인해요. 전화 앱에서 별, 샵, 공육, 샵을 눌러 보세요. 이아이디라는 번호가 나오면, 이심이 되는 폰이에요. 설정에 이심 추가 메뉴가 있는지 봐도 돼요.' },
            tip: '전화 앱에서 ***#06#** → **EID**가 보이면 지원' },
      en: { label: 'eSIM support', speech: { tip: 'Before you buy anything, check that your phone supports eSIM. Open the phone app and dial star, hash, zero six, hash. If you see a number called E I D, your phone can use an eSIM. You can also look for an Add eSIM option in your settings.' },
            tip: 'Dial ***#06#** → an **EID** means eSIM works' },
    }},
    { type: 'check', field: 'unlocked', hl: 'unlockRow', text: {
      ko: { label: '통신사 잠금 확인', speech: { tip: '두 번째는 통신사 잠금이에요. 폰이 한 통신사에만 묶여 있으면, 다른 회사 이심은 안 깔려요.', mistake: '여기서 돈을 날리는 분이 있어요. 이심을 샀는데, 폰이 잠겨 있거나 이심이 안 되는 모델인 거예요. 같은 기종이라도, 산 나라에 따라 이심이 없는 모델이 있어요. 해외에서 샀거나 약정이 걸린 폰이면, 사기 전에 통신사에 꼭 확인하세요.' },
            tip: '한 통신사에 묶인 폰은 **다른 회사 eSIM 설치 불가**', mistake: '해외 구매·약정 폰은 **구매 전** 잠금 여부 확인. 같은 기종도 판매 국가에 따라 eSIM이 없을 수 있습니다.', bad: '일단 결제부터', good: 'EID + 잠금 해제 확인 후 결제' },
      en: { label: 'Carrier lock', speech: { tip: 'Second, the carrier lock. If your phone is tied to one carrier, an eSIM from another company will not install.', mistake: 'This is where people lose money. They buy the eSIM, and then find the phone is locked, or it is a model without eSIM. The same model can ship without eSIM in some countries. If you bought the phone abroad or on a contract, check with your carrier before you pay.' },
            tip: 'A carrier-locked phone **cannot install another company\'s eSIM**', mistake: 'Bought abroad or on contract? Check the lock **before paying**. Some regional models have no eSIM at all.', bad: 'pay first, check later', good: 'EID + unlocked, then pay' },
    }},

    // ---------- STORE ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'store', speech: '이제 이심을 사 볼게요. 화면은 연습용 가게인데요, 어느 회사든 순서는 같아요. 나라 고르고, 요금제 고르고, 이메일 넣으면 끝이에요.', route, title: 'eSIM 구매', subtitle: '나라 → 요금제 → 이메일. 어느 회사든 순서는 같습니다', flag: '🛒', rightTitle: '1 / 3', rightText: '여행지 · 기간과 용량\n이메일 · 결제' },
      en: { id: 'store', speech: 'Now let us buy the eSIM. This is a practice store, but every provider follows the same order. Pick the country, pick a plan, enter your email.', route, title: 'Buy the eSIM', subtitle: 'Country → plan → email. Every provider follows the same order', flag: '🛒', rightTitle: '1 / 3', rightText: 'Destination · days and data\nemail · payment' },
    }},
    { type: 'select', field: 'destination', value: S.destination, text: {
      ko: { label: '여행지', speech: { tip: '먼저 여행지를 골라요. 한 나라만 가면 그 나라를 고르면 되고요. 싱가포르랑 말레이시아처럼 두 나라를 같이 가면, 두 나라가 묶인 요금제를 고르세요. 이심 하나로 국경을 넘어도 그대로 쓸 수 있어요.' },
            tip: '두 나라 이상이면 **묶음(지역) 요금제** 하나로' },
      en: { label: 'Destination', speech: { tip: 'First, the destination. For one country, just pick that country. If you are visiting two, like Singapore and Malaysia, pick a plan that covers both. One eSIM keeps working when you cross the border.' },
            tip: 'Two or more countries? One **regional plan**' },
    }},
    { type: 'radio', field: 'plan', hl: 'planCard', text: {
      ko: { label: '요금제 (기간·용량)', speech: { tip: '다음은 요금제예요. 기간이랑 데이터 용량을 봐요. 기간은 여행 날짜를 다 덮게 고르세요. 여기서는 칠 일에 오 기가로 할게요. 가격은 나라랑 용량마다 달라요.', mistake: '많이 헷갈리는 게 사용 기간이에요. 기간이 설치한 순간부터 시작하는 회사가 있고, 현지에서 처음 연결될 때부터 시작하는 회사가 있어요. 회사마다, 요금제마다 달라요. 결제하기 전에 상세 설명에서 꼭 확인하세요. 설치할 때부터 세는 요금제라면, 너무 일찍 깔면 여행 중에 끊겨요.' },
            tip: '기간은 **여행 날짜를 전부 덮게**, 용량은 쓰는 만큼', mistake: '사용 기간이 **설치 시점**부터인지 **현지 첫 연결**부터인지는 회사·요금제마다 다릅니다. 결제 전 확인.', bad: '확인 없이 일주일 전 설치', good: '기간 시작 조건 확인 후 설치' },
      en: { label: 'Plan (days · data)', speech: { tip: 'Next, the plan. You are choosing the number of days and the amount of data. Make sure the days cover your whole trip. Here I will take seven days with five gigabytes. Prices vary by country and data size.', mistake: 'The validity period confuses a lot of people. With some providers the days start counting when you install the eSIM. With others they start when it first connects at your destination. It depends on the provider and the plan, so read the plan details before you pay. If yours counts from installation, installing too early means it can run out during your trip.' },
            tip: 'Days must **cover the whole trip**; data to match your use', mistake: 'Validity may start at **installation** or at **first connection** abroad. It depends on the provider and plan. Check before paying.', bad: 'install a week early, unchecked', good: 'check when validity starts' },
    }},
    { type: 'type', field: 'email', value: S.email, text: {
      ko: { label: '이메일', speech: { tip: '이메일을 넣어요. 설치용 큐알 코드가 이 주소로 와요. 오타가 나면 못 받으니까, 한 번 더 확인하세요.' },
            tip: '**QR 코드가 여기로** 옵니다. 오타 확인' },
      en: { label: 'Email', speech: { tip: 'Enter your email. The QR code for installation is sent to this address, so check it for typos.' },
            tip: 'The **QR code is sent here**. Check for typos' },
    }},
    { type: 'check', field: 'confirm', hl: 'confirmRow', text: {
      ko: { label: '호환 확인 체크', speech: { tip: '아까 확인한 두 가지예요. 이심 지원, 그리고 잠금 해제. 확인했으면 체크해요.' }, tip: 'eSIM 지원 · 잠금 해제 **확인했으면 체크**' },
      en: { label: 'Compatibility check', speech: { tip: 'These are the two things we checked earlier. eSIM support, and an unlocked phone. Tick the box once you have confirmed both.' }, tip: 'eSIM support · unlocked: **tick once confirmed**' },
    }},
    { type: 'stop', field: 'pay', tipHold: 3200, text: {
      ko: { label: '결제', speech: { tip: '여기서 결제하면 돼요. 저는 연습 화면이라 누르지 않을게요. 결제가 끝나면, 몇 분 안에 메일로 큐알 코드가 와요.' },
            tip: '결제하면 **메일로 QR 코드**가 옵니다 (영상에서는 누르지 않아요)' },
      en: { label: 'Pay', speech: { tip: 'This is where you pay. I will not press it, because this is a practice page. After payment, the QR code usually arrives by email within a few minutes.' },
            tip: 'After payment the **QR code arrives by email** (not pressed in this video)' },
    }},

    // ---------- INSTALL ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'install', speech: '이제 설치예요. 출국 하루 이틀 전에, 집에서 와이파이를 켜 놓고 하세요. 여기부터는 내 폰 설정 화면이에요. 메뉴 이름은 폰마다 조금씩 다른데, 순서는 같아요.', route, title: '내 폰에 설치', subtitle: '집에서, 와이파이 켜고, 출국 1~2일 전에', flag: '📲', rightTitle: '2 / 3', rightText: 'iPhone: 설정 → 셀룰러 → eSIM 추가\nGalaxy: 설정 → 연결 → SIM 관리자 → eSIM 추가' },
      en: { id: 'install', speech: 'Now the installation. Do it at home, on Wi-Fi, a day or two before you fly. From here on, this is your phone settings. Menu names differ a little between phones, but the order is the same.', route, title: 'Install on your phone', subtitle: 'At home, on Wi-Fi, 1–2 days before you fly', flag: '📲', rightTitle: '2 / 3', rightText: 'iPhone: Settings → Cellular → Add eSIM\nAndroid: Settings → Network / Connections → SIMs → Add eSIM' },
    }},
    { type: 'manual', field: 'qrMail', tipHold: 3000, text: {
      ko: { label: 'QR 코드 메일', speech: { tip: '메일이 이렇게 와요. 큐알 코드가 있고, 그 밑에 직접 입력하는 코드가 같이 있어요. 큐알 코드는 폰 카메라로 찍어야 하니까, 컴퓨터나 다른 폰에 띄워 두세요. 띄울 화면이 없으면, 밑에 있는 주소랑 활성화 코드를 직접 입력해도 돼요.' },
            tip: 'QR은 **다른 화면에 띄워서** 찍기. 없으면 **코드 직접 입력**' },
      en: { label: 'The QR code email', speech: { tip: 'The email looks like this. There is a QR code, and under it, codes you can enter by hand. Your phone camera has to scan the QR code, so open it on a computer or another phone. If you have no second screen, type in the address and activation code instead.' },
            tip: 'Show the QR on **another screen** to scan it, or **enter the codes manually**' },
    }},
    { type: 'click', field: 'addEsim', text: {
      ko: { label: 'eSIM 추가', speech: { tip: '설정에서 모바일 데이터 메뉴로 들어가요. 아이폰은 설정, 셀룰러. 갤럭시는 설정, 연결, 심 관리자예요. 거기서 이심 추가를 눌러요.', mistake: '공항에 가서 깔려고 하면 낭패예요. 이심을 내려받으려면 인터넷이 있어야 하거든요. 꼭 출국 전에, 집 와이파이에서 깔아 두세요.' },
            tip: '설정 → 모바일 데이터(셀룰러) → **eSIM 추가**', mistake: 'eSIM 설치에는 **인터넷이 필요**합니다. 도착 공항에서 하지 말고 집 와이파이에서 미리.', bad: '도착해서 공항에서 설치', good: '출국 전 집 와이파이에서 설치' },
      en: { label: 'Add eSIM', speech: { tip: 'Open the mobile data menu in your settings. On an iPhone that is Settings, then Cellular or Mobile Data. On Android it is under Network and internet, or Connections, then SIMs. Tap Add eSIM.', mistake: 'Do not leave this for the airport. Downloading an eSIM needs an internet connection. Install it at home, on Wi-Fi, before you leave.' },
            tip: 'Settings → Mobile Data (Cellular) → **Add eSIM**', mistake: 'Installing an eSIM **needs internet**. Do it on home Wi-Fi, not at the arrival airport.', bad: 'install after landing', good: 'install at home on Wi-Fi' },
    }},
    { type: 'click', field: 'scanQr', hl: 'scanBox', text: {
      ko: { label: 'QR 코드 스캔', speech: { tip: '카메라가 켜지면, 메일로 받은 큐알 코드를 비춰요. 조금 기다리면 이심이 추가됐다고 나와요.', mistake: '이거 정말 중요해요. 설치한 이심은 여행이 끝날 때까지 지우지 마세요. 큐알 코드는 대부분 한 번만 쓸 수 있어요. 안 된다고 지우고 다시 찍으면, 이미 사용된 코드라고 나오는 경우가 많아요. 회사마다 다르긴 한데, 문제가 생기면 지우지 말고 고객센터에 먼저 물어보세요.' },
            tip: '메일로 받은 **QR 코드를 카메라로** 비추기', mistake: 'QR 코드는 **대부분 1회용**입니다. 설치한 eSIM은 여행이 끝날 때까지 삭제하지 마세요.', bad: '안 되면 삭제 후 재설치', good: '삭제하지 말고 고객센터 문의' },
      en: { label: 'Scan the QR code', speech: { tip: 'When the camera opens, point it at the QR code from your email. After a short wait, it says the eSIM was added.', mistake: 'This one really matters. Do not delete the eSIM until your trip is over. Most QR codes can only be used once. If you delete the eSIM and scan again, you often get a message that the code was already used. It varies by provider, so if something goes wrong, contact their support before you delete anything.' },
            tip: 'Point the camera at the **QR code from your email**', mistake: '**Most QR codes are single use**. Do not delete the eSIM until your trip is over.', bad: 'delete and reinstall', good: 'keep it, ask support' },
    }},
    { type: 'select', field: 'label', value: S.label, hl: 'labelRow', text: {
      ko: { label: '회선 이름 정하기', speech: { tip: '이제 폰에 회선이 두 개예요. 헷갈리지 않게 새 이심에 이름을 붙여요. 여행이라고 해 둘게요.' },
            tip: '새 eSIM에 **"여행(Travel)"** 이름 붙이기' },
      en: { label: 'Label the line', speech: { tip: 'Your phone now has two lines. Give the new eSIM a label so you do not mix them up. I will call it Travel.' },
            tip: 'Label the new eSIM **"Travel"**' },
    }},

    // ---------- LINES & ROAMING ----------
    { type: 'card', hold: 2600, card: {
      ko: { id: 'roaming', speech: '여기부터가 제일 중요해요. 전화랑 문자는 한국 번호로, 데이터는 여행용 이심으로. 이렇게 나눠 주는 거예요. 이걸 잘못 해 두면, 한국 통신사 로밍 요금이 나와요.', route, title: '회선 나누기 · 로밍 설정', subtitle: '전화·문자는 원래 번호, 데이터는 여행 eSIM', flag: '⚙️', rightTitle: '3 / 3', rightText: '기본 회선 · 데이터 회선\n원래 번호 로밍 끔 · 여행 eSIM 로밍 켬' },
      en: { id: 'roaming', speech: 'This is the most important part. Calls and texts stay on your home number. Data goes through the travel eSIM. Get this wrong, and your home carrier charges you for roaming.', route, title: 'Split the lines · roaming', subtitle: 'Calls and texts on your home number, data on the travel eSIM', flag: '⚙️', rightTitle: '3 / 3', rightText: 'Default line · data line\nhome roaming OFF · travel eSIM roaming ON' },
    }},
    { type: 'select', field: 'defaultLine', value: S.defaultLine, hl: 'defaultRow', text: {
      ko: { label: '기본 회선 (전화·문자)', speech: { tip: '기본 회선은 원래 쓰던 한국 번호로 둬요. 그래야 은행이나 카드사 인증 문자를 여행 가서도 받을 수 있어요. 여행용 이심은 대부분 데이터 전용이라, 전화번호가 없어요.' },
            tip: '전화·문자는 **원래 번호** 그대로 (인증 문자 수신용)' },
      en: { label: 'Default line (calls · SMS)', speech: { tip: 'Keep your usual home number as the default line. That way you still get verification texts from your bank or card company while you travel. Most travel eSIMs are data only and have no phone number.' },
            tip: 'Calls and SMS stay on your **home number** (for verification texts)' },
    }},
    { type: 'select', field: 'dataLine', value: S.dataLine, hl: 'dataRow', text: {
      ko: { label: '데이터 회선', speech: { tip: '모바일 데이터 회선은 여행용 이심으로 바꿔요. 인터넷은 이제 이쪽으로만 나가요.' },
            tip: '모바일 데이터는 **여행 eSIM**으로' },
      en: { label: 'Mobile data line', speech: { tip: 'Switch the mobile data line to the travel eSIM. From now on, your internet goes through this line only.' },
            tip: 'Mobile data goes to the **travel eSIM**' },
    }},
    { type: 'manual', field: 'dataSwitch', hl: 'switchRow', tipHold: 2800, text: {
      ko: { label: '데이터 전환 허용', speech: { tip: '바로 밑에 데이터 전환 허용이라는 스위치가 있으면, 꺼 두세요. 켜져 있으면, 여행용 이심 신호가 약할 때 폰이 알아서 한국 번호 데이터로 넘어갈 수 있어요.' },
            tip: '데이터 전환 허용은 **꺼 두기**' },
      en: { label: 'Data switching', speech: { tip: 'If you see a switch called allow mobile data switching right below, leave it off. When it is on, the phone can quietly fall back to your home line for data when the travel eSIM signal is weak.' },
            tip: 'Leave data switching **OFF**' },
    }},
    { type: 'click', field: 'homeRoaming', hl: 'homeRoamRow', text: {
      ko: { label: '원래 번호 데이터 로밍', speech: { tip: '이제 한국 번호 쪽 데이터 로밍을 꺼요. 원래 번호 회선으로 들어가서, 데이터 로밍 스위치를 끄면 돼요.', mistake: '요금 폭탄은 여기서 나와요. 한국 번호의 데이터 로밍이 켜진 채로 나가면, 한국 통신사 로밍 요금이 붙을 수 있어요. 이심을 샀는데도요. 회선은 켜 두고, 데이터 로밍만 끄세요. 그러면 문자는 받고, 데이터 요금은 안 나와요.' },
            tip: '원래 번호의 **데이터 로밍 끄기** (회선은 켜 둠)', mistake: '원래 번호 로밍이 켜져 있으면 eSIM을 샀어도 **통신사 로밍 요금**이 나올 수 있습니다.', bad: '원래 번호 데이터 로밍 ON', good: '원래 번호 데이터 로밍 OFF' },
      en: { label: 'Home SIM data roaming', speech: { tip: 'Now turn off data roaming on your home number. Open the home line and switch data roaming off.', mistake: 'This is where the bill shock comes from. If data roaming stays on for your home number, your home carrier can still charge roaming rates, even though you bought an eSIM. Keep the line on, and turn only its data roaming off. You still get your texts, without the data charges.' },
            tip: 'Turn **data roaming OFF** on the home SIM (keep the line on)', mistake: 'With home roaming left on, your **home carrier can still charge you**, even with an eSIM.', bad: 'home SIM data roaming ON', good: 'home SIM data roaming OFF' },
    }},
    { type: 'check', field: 'travelRoaming', hl: 'travelRoamRow', text: {
      ko: { label: '여행 eSIM 데이터 로밍', speech: { tip: '반대로, 여행용 이심은 데이터 로밍을 켜요. 여행 회선으로 들어가서, 데이터 로밍 스위치를 켜 주세요.', mistake: '이걸 안 켜서 도착하고 당황하는 분이 정말 많아요. 로밍이라는 말 때문에 요금이 나올까 봐 꺼 두시는데요, 여행용 이심은 대부분 로밍을 켜야 연결돼요. 이미 낸 요금 안에서 쓰는 거라, 추가 요금은 없어요. 원래 번호는 끄고, 여행 이심은 켜고.' },
            tip: '여행 eSIM의 **데이터 로밍 켜기**', mistake: '여행 eSIM은 대부분 **데이터 로밍을 켜야** 연결됩니다. 선불 요금 안에서 쓰는 것이라 추가 요금은 없습니다.', bad: '둘 다 로밍 OFF', good: '원래 번호 OFF · 여행 eSIM ON' },
      en: { label: 'Travel eSIM data roaming', speech: { tip: 'The travel eSIM is the opposite. Open the travel line and turn data roaming on.', mistake: 'So many people land and wonder why nothing connects. The word roaming sounds expensive, so they leave it off. But most travel eSIMs only connect with data roaming on. You are using the data you already paid for, so there is no extra charge. Home number off, travel eSIM on.' },
            tip: 'Turn **data roaming ON** for the travel eSIM', mistake: 'Most travel eSIMs **only connect with data roaming on**. It is prepaid data, so no extra charge.', bad: 'roaming OFF on both', good: 'home OFF · travel eSIM ON' },
    }},

    // ---------- ON ARRIVAL ----------
    { type: 'check', field: 'travelOn', hl: 'travelOnRow', text: {
      ko: { label: '도착 후 회선 켜기', speech: { tip: '여기까지가 출국 전에 할 일이에요. 이제 비행기에서 내리면, 비행기 모드를 풀고, 여행 회선이 켜져 있는지 확인해요. 꺼져 있으면 이렇게 켜 주세요.' },
            tip: '도착하면 **비행기 모드 해제** → 여행 회선 켜기' },
      en: { label: 'Turn it on when you land', speech: { tip: 'Everything so far is done before you fly. When you get off the plane, turn off flight mode and check that the travel line is on. If it is off, switch it on like this.' },
            tip: 'On landing: **flight mode off** → travel line on' },
    }},
    { type: 'stop', field: 'status', tipHold: 3200, text: {
      ko: { label: '연결 확인', speech: { tip: '일 분쯤 기다리면 신호가 잡히고, 데이터가 연결돼요. 이러면 끝이에요. 혹시 안 잡히면, 여행 이심의 데이터 로밍이 켜져 있는지 다시 보고, 비행기 모드를 한 번 켰다 꺼 보세요. 그래도 안 되면, 이심 회사 안내에 나온 대로 따라 하시면 돼요.' },
            tip: '1분쯤 기다리면 **연결 완료**. 안 되면 로밍 ON 확인 → 비행기 모드 껐다 켜기' },
      en: { label: 'Check the connection', speech: { tip: 'Give it about a minute, and the signal appears and data connects. That is it. If nothing happens, check again that data roaming is on for the travel eSIM, then switch flight mode on and off once. Still nothing? Follow the steps in your provider\'s instructions.' },
            tip: 'Wait about a minute to **connect**. Stuck? Check roaming is ON → toggle flight mode' },
    }},

    // ---------- OUTRO (ticket) ----------
    { type: 'card', hold: 5000, card: {
      ko: { id: 'outro', speech: '끝났어요. 정리하면요, 출국 전에 와이파이에서 설치. 원래 번호는 데이터 로밍 끄기. 여행 이심은 데이터 로밍 켜기. 그리고 여행이 끝날 때까지 이심은 지우지 않기. 이 네 가지만 기억하세요. 다음은 공항에서 시내 가는 방법이에요. 설명란에 링크 있습니다.',
            route, title: '끝. **이 네 가지만 기억하세요**', subtitle: '와이파이에서 미리 설치 · 원래 번호 로밍 OFF · 여행 eSIM 로밍 ON · 삭제 금지',
            meta: [{ k: '출국 전', v: '설치' }, { k: '원래 번호', v: '로밍 OFF' }, { k: '여행 eSIM', v: '로밍 ON' }], stamp: '설치\n완료', flag: '📱',
            rightTitle: '다음 영상', rightText: '', next: ['🚆 공항에서 시내 가는 법', '🇸🇬 싱가포르 입국카드 SG Arrival Card', '🔔 바뀌면 최신판 알림'], brand: '▶ 따라하면 끝 · 도착 후 준비' },
      en: { id: 'outro', speech: 'Done. To recap: install it on Wi-Fi before you fly. Data roaming off for your home number. Data roaming on for the travel eSIM. And do not delete the eSIM until the trip is over. Next up: getting from the airport into the city. Links are in the description.',
            route, title: 'Done. **Remember these four**', subtitle: 'Install on Wi-Fi first · home roaming OFF · travel eSIM roaming ON · do not delete it',
            meta: [{ k: 'BEFORE', v: 'Install' }, { k: 'HOME SIM', v: 'Roaming OFF' }, { k: 'TRAVEL eSIM', v: 'Roaming ON' }], stamp: 'ALL\nSET', flag: '📱',
            rightTitle: 'Up next', rightText: '', next: ['🚆 Airport to city transfer', '🇸🇬 Singapore SG Arrival Card', '🔔 Subscribe for updates'], brand: '▶ Copy My Screen · After You Arrive' },
    }},
  ],
};
