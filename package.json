# Instagram Business API 연동 가이드

Daily Bloom & Vine — 자동 포스팅 + 피드 캐시 셋업

---

## 개요

| 기능 | 방식 |
|---|---|
| 매일 오전 6시 자동 포스팅 | Instagram Graph API (Business 계정 필수) |
| 홈페이지 피드 표시 | Firestore 캐시 (1시간마다 자동 갱신) |
| 토큰 자동 갱신 | Firebase Function (매월 1일) |

---

## STEP 1 — 인스타그램 비즈니스 계정 전환 (2분)

개인 계정으로는 자동 포스팅 API가 차단됩니다. 비즈니스 계정은 무료입니다.

1. 인스타그램 앱 → **프로필** → 우측 상단 ☰ → **설정 및 개인정보**
2. **계정 유형 및 도구** → **프로페셔널 계정으로 전환**
3. 카테고리: **Florist** 또는 **Local Business** 선택
4. **비즈니스** 선택 (크리에이터 X)
5. Facebook 페이지 연결 (없으면 새로 생성 — 무료)

---

## STEP 2 — Meta Developer App 생성 (5분)

1. [developers.facebook.com](https://developers.facebook.com) 접속 → **My Apps** → **Create App**
2. Use case: **Other** → **Business**
3. App 이름: `Bloom Sydney` (아무 이름 가능)
4. 생성 완료 후 **App Dashboard** 진입

### Instagram Graph API 추가
1. 좌측 메뉴 **Add Products** → **Instagram Graph API** → **Set Up**
2. **Generate Token** 클릭
3. 본인 인스타 계정으로 로그인 → 권한 허용:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`

---

## STEP 3 — Long-lived Token 발급 (3분)

기본 발급 토큰은 1시간짜리 단기 토큰입니다. 60일짜리로 교환해야 합니다.

### 단기 토큰 → 장기 토큰 교환

브라우저에서 아래 URL 접속 (값 채워서):

```
https://graph.facebook.com/v18.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={APP_ID}
  &client_secret={APP_SECRET}
  &fb_exchange_token={SHORT_LIVED_TOKEN}
```

**APP_ID, APP_SECRET**: App Dashboard → Settings → Basic에서 확인

응답에서 `access_token` 값 복사 → 이게 60일짜리 Long-lived Token

### Instagram User ID 확인

```
https://graph.facebook.com/v18.0/me?fields=id,name&access_token={LONG_LIVED_TOKEN}
```

응답의 `id` 값 복사 (Instagram User ID)

---

## STEP 4 — Firebase에 토큰 등록

```bash
firebase functions:config:set \
  instagram.access_token="IGxxx..." \
  instagram.user_id="12345678901234"
```

확인:
```bash
firebase functions:config:get
```

---

## STEP 5 — 배포 및 테스트

```bash
firebase deploy --only functions:refreshInstagramFeed
```

Firestore Console에서 `cache/instagram_feed` 문서 생성 확인.

```bash
firebase deploy --only functions:scheduledInstagramPost
```

수동 트리거 테스트 (Firebase Console → Functions → scheduledInstagramPost → **Test**):
```json
{}
```

---

## 토큰 자동 갱신

`refreshInstagramToken` Function이 **매월 1일 오전 9시**에 자동 갱신합니다.
별도 작업 없이 토큰 만료 걱정 없음.

---

## 자동화 흐름 요약

```
사장님이 꽃 사진 업로드 (admin → 오늘의 꽃 관리)
        ↓
Firestore daily_products/{오늘날짜} 저장
        ↓
매일 오전 06:00 → scheduledInstagramPost 실행
        ↓
Instagram에 자동 포스팅 🎉
        ↓
매 시간 → refreshInstagramFeed 실행
        ↓
고객 홈페이지 피드 자동 갱신
```

---

## 주의사항

| 항목 | 제한 |
|---|---|
| 자동 포스팅 횟수 | 하루 25개 이하 (1개면 문제없음) |
| 이미지 URL | 공개 접근 가능해야 함 (Firebase Storage 사용 권장) |
| 토큰 유효기간 | 60일 (Function이 매월 자동 갱신) |
| 비디오 포스팅 | Reels는 별도 API 필요 (이미지만 우선 적용) |

---

## 문제 해결

**포스팅 안 됨:**
- `instagramPosted` 필드가 `true`인지 확인
- Firebase Functions 로그 확인: `firebase functions:log`
- 토큰 만료 여부 확인: Graph API Explorer에서 토큰 테스트

**피드 안 뜸:**
- `cache/instagram_feed` Firestore 문서 존재 확인
- `refreshInstagramFeed` 수동 실행 후 재확인
