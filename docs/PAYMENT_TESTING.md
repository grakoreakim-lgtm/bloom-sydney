# 결제 테스트 가이드

> [PAYMENT_SETUP.md](PAYMENT_SETUP.md)의 STEP 5 상세 버전.
> Test mode에서 모든 결제 수단을 한 번씩 검증하고 → Live 전환합니다.

---

## 사전 준비

✅ STEP 1~4 완료된 상태:
- Stripe Test 키 + Webhook 등록
- PayPal Sandbox 앱 + 테스트 구매자 계정
- Email Extension 설치 + Gmail 앱 비밀번호
- 관리자 Settings에 `pk_test_...` + PayPal Client ID 입력
- Cloud Function에 secret 키 설정 + 배포

---

## 테스트 시나리오 — 전부 한 번씩

### 시나리오 1: 카드 결제 (가장 기본)

1. 고객 사이트 (`/customer/`) 접속
2. Same-Day 상품 클릭 → 상세 모달
3. **Add to Cart** → 우측 드로어 열림
4. 폼 채우기:
   - 우편번호: `2118`
   - 주소: 아무 호주 주소
   - 날짜·슬롯·이메일·이름·전화 입력
5. Stripe Payment Element에서 카드 탭 선택
6. 카드 번호: **`4242 4242 4242 4242`** (Visa 성공)
7. Expiry: `01/30`, CVC: `123`, ZIP: `2118`
8. **Pay $XX** 버튼 클릭

**기대 결과**:
- ✅ "Order confirmed" 성공 화면 표시
- ✅ 사장님 폰에 푸시 알림 (FCM이 등록된 경우)
- ✅ 사장님 + 고객 메일함에 확정 이메일 (1분 내)
- ✅ Firestore `orders/{id}` 에 `paymentStatus: "PAID"`, `paymentProvider: "stripe"` 저장
- ✅ Stripe Dashboard → Payments → 결제 1건 보임

---

### 시나리오 2: 3D Secure 인증 (호주 강제 보안)

1. 위와 동일하나 카드 번호: **`4000 0027 6000 3184`**

**기대 결과**:
- 🔐 결제 시 3DS 챌린지 모달이 뜸 (Stripe가 자동 처리)
- "Complete authentication" 버튼 클릭 → 성공 처리
- 이후 시나리오 1과 동일

---

### 시나리오 3: Apple Pay (iPhone에서)

1. iPhone Safari에서 사이트 접속
2. Apple Wallet에 카드 1장 이상 등록되어 있어야 함
3. 체크아웃까지 진행 → Stripe Element에 **Apple Pay 버튼**이 자동 노출
4. 버튼 탭 → Face ID/Touch ID 인증

**기대 결과**:
- ✅ 인증 후 즉시 결제 완료
- ✅ Stripe Dashboard에 "Apple Pay" 표시

> 💡 데스크탑 Safari에서도 iPhone과 페어링되어 있으면 Apple Pay 가능.

---

### 시나리오 4: Google Pay (Android에서)

1. Android Chrome에서 접속
2. Google Pay에 카드 등록되어 있어야 함
3. Stripe Element에 **Google Pay 버튼** 자동 노출
4. 클릭 → 카드 선택 → 지문/PIN 인증

**기대 결과**: Stripe Dashboard에 "Google Pay" 표시

---

### 시나리오 5: Afterpay (4번 분할)

1. 체크아웃에서 **객단가 $30 이상** 보장 (Afterpay 최소 한도)
2. Stripe Element에서 **Afterpay** 옵션 선택
3. Afterpay 페이지로 redirect → Test mode 자동
4. 가짜 분할 시뮬레이션 → 승인

**기대 결과**:
- 사이트로 돌아온 후 성공 화면
- Stripe Dashboard에 "Afterpay" 표시

> ⚠️ Afterpay는 객단가 $30 미만이면 옵션 자체가 안 보임.

---

### 시나리오 6: PayPal Sandbox

1. 체크아웃에서 **PayPal 버튼** 클릭 (Stripe Element 아래)
2. PayPal 팝업창 → 테스트 구매자 계정으로 로그인
   - 이메일: `sb-xxxxx@personal.example.com`
   - 비번: PayPal Developer 콘솔의 Sandbox > Accounts에서 확인
3. **"Pay Now"** 클릭

**기대 결과**:
- ✅ 팝업 닫히고 사이트로 돌아옴
- ✅ "Order confirmed" 성공 화면
- ✅ Firestore에 `paymentProvider: "paypal"`, `paypalCaptureId` 저장
- ✅ PayPal Sandbox Dashboard → Activity에 거래 기록

---

### 시나리오 7: 카드 거절 (실패 처리 검증)

1. 카드 번호: **`4000 0000 0000 9995`** (잔액 부족 거절)

**기대 결과**:
- ❌ Stripe Element가 빨간 에러 메시지 표시: "Your card has insufficient funds."
- ✅ 사이트는 멈춰있고, 다른 카드로 재시도 가능
- ✅ Firestore에 `paymentStatus: "FAILED"` 로 저장 (PaymentIntent는 실패 상태)

---

### 시나리오 8: 환불 처리

1. 시나리오 1로 결제한 주문 1건 선택
2. Stripe Dashboard → Payments → 해당 결제 클릭 → **Refund**
3. 전액 또는 부분 환불 처리

**기대 결과** (1~2분 내):
- ✅ Webhook (`charge.refunded`)이 발사됨
- ✅ Firestore에 `paymentStatus: "REFUNDED"`, `refundedAt` 타임스탬프
- ✅ 사장님 관리자에서 주문 상태 자동 갱신 (Refunded 표시)

---

## 검증 체크리스트

전체 시나리오 완료 후 다음을 모두 확인:

- [ ] 7개 시나리오 모두 성공 (1, 2, 3, 4, 5, 6, 7)
- [ ] 환불 시나리오 8 동작
- [ ] 사장님 메일함에 8건의 알림 메일 도착
- [ ] 고객(테스트) 메일함에 7건의 확정 메일 도착 (실패 빼고)
- [ ] 폰에 8건의 FCM 푸시 알림 (등록된 경우)
- [ ] Firestore `orders/` 컬렉션에 8건 문서, 각 `paymentStatus` 정확
- [ ] 관리자 페이지 → Orders 화면에서 모든 주문 보임
- [ ] 알코올 포함 주문에 🍷 뱃지 표시 (와인 페어링 선택 시)

---

## 흔한 문제 & 해결

### "Stripe Payment Element 안 보임"
- 원인: 관리자 Settings에 `pk_test_...` 키 입력 안 됨
- 해결: 관리자 → Settings → Payment 섹션 키 입력 → Save → 페이지 새로고침

### "Pay 버튼 클릭해도 아무 일 없음"
- 원인: Cloud Function `createPaymentIntent` 가 503 반환 중 (서버 키 미설정)
- 해결: 터미널에서 `firebase functions:config:get` 실행해 stripe.secret_key 확인. 없으면 STEP 4 다시.

### "Webhook 안 들어옴 → paymentStatus가 PAID로 안 바뀜"
- 원인: Stripe Dashboard에 Webhook URL 등록 안 됨, 또는 secret 불일치
- 해결: 
  1. Stripe → Developers → Webhooks → 등록된 URL 확인 (`https://us-central1-bloom-sydney.cloudfunctions.net/stripeWebhook`)
  2. Signing secret 새로 받아서 `firebase functions:config:set stripe.webhook_secret="whsec_..."` + 재배포

### "이메일 안 와요"
- 원인 1: Trigger Email Extension 설치 안 됨
- 원인 2: SMTP URI 오타 (Gmail 앱 비밀번호 16자리, 공백 없이)
- 원인 3: Firestore `mail/{id}` 문서가 생성되었으나 Extension이 못 읽음
- 해결:
  1. Firebase Console → Extensions → Trigger Email → Logs 확인
  2. Firestore Console → `mail` 컬렉션 → 새 문서가 있는지 확인 (있으면 SMTP 문제, 없으면 Cloud Function 문제)

### "PayPal 버튼이 안 보임"
- 원인: 관리자 Settings에 PayPal Client ID 미입력 또는 mode 잘못 설정
- 해결: Settings → PayPal Client ID 확인 + mode가 `sandbox` 인지

### "Afterpay 옵션이 안 보임"
- 정상 — 객단가 $30 미만이면 안 보임 (Afterpay 정책)
- $30 이상 주문에서 다시 확인

---

## ✅ Live 전환 (테스트 다 끝난 후)

[PAYMENT_SETUP.md](PAYMENT_SETUP.md) STEP 6 참고. 5분이면 완료.

**중요**: 첫 Live 결제는 **사장님 본인 카드로 $1짜리 더미 주문**을 하나 직접 만들어서 진짜 차감되는지 확인한 후 환불하세요.
