# 결제 시스템 셋업 가이드 (Stripe + PayPal + 이메일)

> 작업 시간: 약 60~90분 (계좌 인증 대기 시간 제외)
> 코드는 이미 준비되어 있으니, 아래 단계대로 키만 입력하시면 바로 동작합니다.

---

## 🟦 STEP 1 — Stripe Australia 가입 (15~30분)

### 1.1 가입
1. https://dashboard.stripe.com/register 접속
2. 이메일 (`mecacademy.adm@gmail.com` 추천) + 비밀번호로 가입
3. **Country**: Australia 선택 ⚠️ 매우 중요 (다른 국가 선택 시 AUD/Afterpay 등 활성화 안 됨)
4. 인증 메일 확인 → 클릭

### 1.2 사업자 정보 입력 (Activate Account)
- Business type: **Individual** 또는 **Sole trader** 또는 **Company** (사업자 등록 형태에 맞게)
- Industry: **Florists / Floral Services**
- Business name: `Bloom & Vine`
- ABN (호주 사업자번호): 입력
- 주소: 매장 주소 (Carlingford NSW)
- Bank account (정산 받을 호주 은행 계좌):
  - BSB (6자리)
  - Account number
- Statement descriptor (카드명세서에 표시될 이름): `BLOOM AND VINE` (22자 이내 영문)

> ⚠️ 인증에 1~3일 걸릴 수 있지만, **Test mode는 인증 전에도 즉시 사용 가능**합니다. 인증되기 전이라도 코드 셋업 + 테스트 다 가능해요.

### 1.3 Test Mode API 키 받기
1. Stripe Dashboard → 우측 상단 **"Test mode"** 토글 ON (오렌지색으로 변함)
2. 좌측 메뉴 → **Developers** → **API keys**
3. 다음 두 값을 복사:
   - **Publishable key** (`pk_test_...` 로 시작) ← 사장님이 admin Settings에 입력
   - **Secret key** (`sk_test_...` 로 시작) ← 절대 공개 금지! 아래 명령으로 등록

### 1.4 Webhook 설정 (결제 성공 자동 처리)
1. Developers → **Webhooks** → **Add endpoint**
2. Endpoint URL: 
   ```
   https://us-central1-bloom-sydney.cloudfunctions.net/stripeWebhook
   ```
   *(사장님 Firebase 프로젝트 ID에 따라 `bloom-sydney` 부분이 다를 수 있음 — 정확한 URL은 Functions 배포 후 알려드림)*
3. Events to send: 다음 3개 체크
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. 생성 후 **Signing secret** (`whsec_...` 로 시작) 복사

### 1.5 활성화할 결제 수단 (Stripe Dashboard)
1. **Settings** → **Payment methods**
2. 다음을 모두 **Enable**:
   - ✅ Cards (Visa, Mastercard, Amex)
   - ✅ Apple Pay (자동 활성화)
   - ✅ Google Pay (자동 활성화)
   - ✅ Afterpay / Clearpay
   - ✅ Link (Stripe의 빠른결제)
3. (선택) Zip — AU에서 인기 있음

---

## 🟨 STEP 2 — PayPal Australia 가입 (15~30분)

### 2.1 가입
1. https://www.paypal.com/au/business 접속
2. **Sign Up** → **Business Account**
3. 동일 이메일 사용 권장
4. 사업자 정보 입력 (Stripe와 동일하게)

### 2.2 Sandbox (테스트) 계정 만들기
1. https://developer.paypal.com 접속 → 위에서 가입한 계정으로 로그인
2. **Apps & Credentials** → **Sandbox** 탭
3. **My Apps & Credentials** → **Create App**
4. App Name: `Bloom Sydney Test`
5. Type: **Merchant**
6. 생성 후 다음 두 값 복사:
   - **Client ID** ← admin Settings에 입력
   - **Secret** ← 절대 공개 금지, 아래 명령으로 등록

### 2.3 Sandbox 테스트 계정 (가짜 구매자)
- **Sandbox** → **Accounts** 메뉴
- 자동 생성된 테스트 구매자 계정의 이메일/비번 메모 (테스트 결제 시 사용)

---

## 📧 STEP 3 — 이메일 자동 발송 셋업 (10분)

Firebase의 공식 확장(Extension)을 쓰면 가장 간단합니다. 우리 Firestore에 `mail/{id}` 문서를 쓰면 자동으로 이메일이 나갑니다.

### 3.1 Firebase Trigger Email Extension 설치
1. Firebase Console → 프로젝트 → 좌측 메뉴 **Extensions**
2. **Browse all extensions** → 검색창에 "Trigger Email"
3. **Trigger Email from Firestore** by Firebase 선택 → **Install**
4. 설정값:
   - **SMTP connection URI**: Gmail 사용 시 → `smtps://mecacademy.adm@gmail.com:앱비밀번호@smtp.gmail.com:465`
     - **앱 비밀번호 만들기**: https://myaccount.google.com/apppasswords (2단계 인증 필수)
     - 16자리 비밀번호 발급받아서 위 URI에 끼워넣기
   - **Default From**: `Bloom & Vine <mecacademy.adm@gmail.com>`
   - **Default Reply-to**: `mecacademy.adm@gmail.com`
   - **Email documents collection**: `mail` (디폴트)
   - **Users collection**: 비워둠
   - **Templates collection**: `mail_templates` (선택, 디폴트로 두기)
5. **Install extension** → 1~2분 소요

### 3.2 작동 확인 (선택)
설치 후 Firestore Console에서:
- 컬렉션 `mail` 생성
- 새 문서 추가:
  ```json
  {
    "to": "mecacademy.adm@gmail.com",
    "message": {
      "subject": "Test from Bloom & Vine",
      "html": "<p>If you see this, email automation works.</p>"
    }
  }
  ```
- 1분 내 본인 메일함 확인 → 도착하면 성공

---

## 🔑 STEP 4 — 키를 Firebase에 등록 (10분)

### 4.1 Cloud Function용 비밀 키 (서버 사이드)

PowerShell이나 터미널에서 실행:

```bash
# Stripe
firebase functions:config:set ^
  stripe.secret_key="sk_test_여기에붙여넣기" ^
  stripe.webhook_secret="whsec_여기에붙여넣기" ^
  stripe.mode="test"

# PayPal
firebase functions:config:set ^
  paypal.client_id="여기에붙여넣기" ^
  paypal.secret="여기에붙여넣기" ^
  paypal.mode="sandbox"

# 확인
firebase functions:config:get
```

> Windows PowerShell이 아니라 일반 cmd라면 `^` 대신 한 줄로 쓰셔도 됩니다.

### 4.2 클라이언트(브라우저)용 공개 키 — 관리자 Settings에서 입력

배포 후 관리자 페이지 → **Settings** → **Payment** 섹션에 입력:
- **Stripe publishable key** (`pk_test_...`)
- **PayPal client ID** (Sandbox용)
- **Mode**: Test / Live 토글

→ 이 부분은 코드에서 자동으로 admin UI를 만들어둘게요.

### 4.3 배포

```bash
firebase deploy --only functions
firebase deploy --only firestore:rules
```

---

## ✅ STEP 5 — 테스트 (5분)

### 5.1 Stripe 테스트 카드
고객 사이트에서 결제할 때:

| 카드 번호 | 결과 |
|---|---|
| `4242 4242 4242 4242` | ✅ 성공 (디폴트 테스트 카드) |
| `4000 0027 6000 3184` | 🔐 3DS 인증 필요 후 성공 |
| `4000 0000 0000 9995` | ❌ 잔액 부족 실패 |
| `4000 0000 0000 0002` | ❌ 카드 거절 |

- Expiry: 미래의 아무 날짜 (`01/30` 등)
- CVC: 아무 3자리 (`123`)
- ZIP: 아무 4자리

### 5.2 Apple Pay / Google Pay 테스트
- Test mode에서도 동작합니다 (실제 카드는 차감 안 됨)
- 폰의 Wallet에 등록된 카드로 결제 시도 → 가짜 결제 처리됨

### 5.3 Afterpay 테스트
- 결제 시 Afterpay 선택
- Test mode에서 자동으로 Sandbox 계정으로 진행
- 4번 분할 시뮬레이션됨

### 5.4 PayPal 테스트
- "Pay with PayPal" 버튼 클릭
- 위 STEP 2.3에서 메모한 Sandbox 구매자 계정으로 로그인
- 결제 진행 → 즉시 성공

### 5.5 이메일 테스트
- 테스트 결제 후 사용자 이메일로 주문 확정 메일이 와야 함
- 사장님 메일에도 새 주문 알림 (이미 만든 FCM 푸시도 함께)

---

## 🚀 STEP 6 — Live 전환 (테스트 다 끝난 후, 5분)

테스트가 모두 잘 동작하면:

1. Stripe Dashboard → "Test mode" 토글 OFF (Live mode로)
2. **API keys** 페이지에서 Live 키 복사 (`pk_live_...`, `sk_live_...`)
3. **Webhooks** → 새 endpoint 추가 (Live mode용, 같은 URL)
4. PayPal: Sandbox → Live 환경으로 전환, **Live** 탭의 Client ID/Secret 사용
5. Cloud Function 키 갱신:
   ```bash
   firebase functions:config:set ^
     stripe.secret_key="sk_live_..." ^
     stripe.webhook_secret="whsec_..." ^
     stripe.mode="live" ^
     paypal.client_id="..." ^
     paypal.secret="..." ^
     paypal.mode="live"
   firebase deploy --only functions
   ```
6. 관리자 Settings → Payment → 키 갱신 → Mode: Live로
7. **사장님 본인 카드로 $1 짜리 더미 주문 한 번 직접 해서 진짜 차감되는지 확인** (그 후 환불)

---

## 💸 비용 안내 (Stripe AU)

| 항목 | 수수료 |
|---|---|
| 호주 도메스틱 카드 (Visa/MC) | 1.7% + $0.30 |
| 국제 카드 | 3.5% + $0.30 |
| Apple Pay / Google Pay | 같음 (위 카드 수수료) |
| Afterpay | 4~6% (Afterpay에서 가져감) |
| Link / Stripe saved card | 같음 (위 카드 수수료) |
| **PayPal**: 도메스틱 | 2.6% + $0.30 |
| 환불 | 무료 (수수료 환불 안 됨) |
| 정산 주기 | 매일 자동 (T+2 영업일) |

---

## 🆘 문제 발생 시

| 증상 | 원인 | 해결 |
|---|---|---|
| "Stripe key not configured" 에러 | 관리자 Settings에 `pk_test_` 키 입력 안 됨 | Settings에 키 입력 |
| 결제 시 빈 화면 | Stripe 라이브러리 로드 실패 | 브라우저 콘솔(F12) 확인 |
| Webhook 안 옴 | URL 오타 또는 secret 불일치 | Stripe Dashboard → Webhooks → 로그 확인 |
| 이메일 안 옴 | Trigger Email Extension SMTP 설정 오류 | Extension 로그 확인 (Firebase Console) |
| Afterpay 옵션이 안 보임 | Stripe Dashboard에서 활성화 안 됨 OR 객단가가 너무 낮음 (Afterpay는 $30 이상부터) | Settings → Payment methods에서 활성화 |

---

질문 있으시면 알려주세요. 셋업 진행하시는 동안 코드는 제가 미리 만들어둘게요.
