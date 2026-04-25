# Twilio WhatsApp 기념일 알림 셋업 가이드

Daily Bloom & Vine — 앱 없이 고객 WhatsApp으로 기념일 리마인더 발송

---

## 개요

| 항목 | 내용 |
|---|---|
| 발송 시점 | 기념일 D-14, D-7, D-2 오전 9시 |
| 발송 채널 | WhatsApp Business (Twilio) |
| 트리거 | Firebase Function Cron (매일 오전 9시) |
| 할인 코드 | 10% 얼리버드 자동 포함 |

---

## STEP 1 — Twilio 계정 생성 (5분)

1. [twilio.com/try-twilio](https://www.twilio.com/try-twilio) 접속
2. 이름, 이메일, 비밀번호 입력 → 가입
3. 전화번호 인증 (본인 번호)
4. "What are you building?" → **WhatsApp** 선택

### Console에서 키 확인
- [console.twilio.com](https://console.twilio.com) → Dashboard
- **Account SID** 복사
- **Auth Token** 복사 (눈 아이콘 클릭)

---

## STEP 2 — WhatsApp Sandbox 활성화 (2분)

> 정식 WhatsApp Business API 승인 전, Sandbox로 먼저 테스트합니다.

1. Twilio Console → 좌측 메뉴 **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Sandbox 번호 확인: `+1 415 523 8886`
3. **본인 WhatsApp**에서 아래 메시지를 Sandbox 번호로 전송:
   ```
   join <your-code>
   ```
   (화면에 표시된 코드 사용, 예: `join yellow-tiger`)
4. "Joined!" 응답 오면 성공 ✅

---

## STEP 3 — 테스트 스크립트 실행

```bash
cd docs
npm install twilio
```

`test-whatsapp.js` 파일 열어서 수정:
```js
const ACCOUNT_SID = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"; // 본인 SID
const AUTH_TOKEN  = "your_auth_token_here";               // 본인 토큰
const FROM_NUMBER = "whatsapp:+14155238886";              // Twilio Sandbox 번호
const TEST_TO     = "whatsapp:+61XXXXXXXXX";              // 본인 WhatsApp 번호
```

실행:
```bash
node test-whatsapp.js
```

성공 화면:
```
✅ Basic message sent!
   SID: SMxxxxxxxxxxxxxx
   Status: queued
✅ Anniversary reminder format sent!
🎉 All tests passed! Twilio WhatsApp is ready.
```

---

## STEP 4 — Firebase에 키 등록

```bash
firebase functions:config:set \
  twilio.account_sid="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  twilio.auth_token="your_auth_token_here" \
  twilio.whatsapp_from="+14155238886"
```

확인:
```bash
firebase functions:config:get twilio
```

---

## STEP 5 — 배포

```bash
firebase deploy --only functions:anniversaryReminders
```

### 수동 테스트 (Firebase Console)
1. Firebase Console → Functions → `anniversaryReminders`
2. **Test function** 클릭
3. Input: `{}`
4. Logs에서 "Anniversary reminders sent: N" 확인

---

## 알림 발송 흐름

```
고객이 주문 시 기념일 등록
        ↓
Firestore customers/{email}/anniversaries 저장
        ↓
매일 오전 09:00 → anniversaryReminders 실행
        ↓
오늘로부터 14일 / 7일 / 2일 후가 기념일인 고객 탐색
        ↓
해당 고객 WhatsApp으로 메시지 발송 🎉
```

---

## 발송 메시지 예시

```
🌸 Hey Sarah!

*Wife's Birthday* is coming up in 14 days.

We've curated this season's most beautiful arrangement
— and we'd love to help you make it special again.

✨ Book now and get *10% early-bird discount*
👉 https://dailybloom.au/pre-order

Daily Bloom & Vine · Carlingford, Sydney
```

---

## 정식 WhatsApp Business API 전환 (선택사항)

Sandbox는 테스트용입니다. 실제 운영 시 정식 승인이 필요합니다.

1. Twilio Console → **Messaging** → **Senders** → **WhatsApp senders**
2. **Request Access** → Facebook Business Manager 연동
3. 심사 기간: 약 1~3 영업일
4. 승인 후 `FROM_NUMBER`를 정식 번호로 교체

> 💡 초기 MVP 단계에서는 Sandbox로도 충분히 운영 가능합니다. 고객에게 먼저 "join 코드"를 보내도록 안내하면 됩니다.

---

## 요금

| 항목 | 비용 |
|---|---|
| Sandbox 테스트 | 무료 |
| WhatsApp 메시지 (정식) | ~$0.005 AUD / 건 |
| 월 100건 발송 기준 | ~$0.50 AUD |

사실상 무료 수준입니다.

---

## 문제 해결

| 에러 코드 | 원인 | 해결 |
|---|---|---|
| 20003 | 잘못된 인증 정보 | ACCOUNT_SID, AUTH_TOKEN 재확인 |
| 63007 | Sandbox 미가입 | WhatsApp에서 "join 코드" 전송 |
| 21211 | 잘못된 수신 번호 | 형식: `whatsapp:+61XXXXXXXXX` |
| 21608 | Sandbox에서 미가입 번호 | 수신자도 Sandbox join 필요 |
