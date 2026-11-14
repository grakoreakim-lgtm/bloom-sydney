# 📱 모바일로 하는 1회 셋업 (약 40분, 비용 0원)

순서대로 하면 됩니다. 각 단계 제목 아래 링크를 누르면 그 화면이 바로 열립니다.
브라우저는 **Chrome**, 구글 계정은 **GRA 코리아킴 계정**으로 로그인한 상태에서 시작하세요.
중간에 복사한 값(JSON·토큰·키)은 메모 앱에 잠깐 붙여 두었다가 마지막 단계에서 GitHub에 넣고 **메모는 지우세요.**

---

## 1단계 · 유튜브 채널 2개 (10분)

**1-1. 채널 만들기** → https://www.youtube.com/channel_switcher
- "채널 만들기" → 이름 `따라하면 끝 — 입국신고서·비자` → 만들기
- 다시 위 링크 → "채널 만들기" → 이름 `Copy My Screen — Arrival Cards & Visas`

**1-2. 각 채널 설정** → https://studio.youtube.com (오른쪽 위 프로필 → 채널 전환으로 두 채널을 오가며)
- 설정(⚙) → 채널 → 기본 정보: 국가 **대한민국**
- 설정 → 채널 → 고급 설정: **"아니요, 이 채널을 아동용으로 설정하지 않겠습니다"**
- 설정 → 채널 → 기능 사용 자격요건 → **전화번호 인증** (맞춤 썸네일·15분 초과 영상에 필요)
- 채널 맞춤설정 → 기본 정보 → 설명: `upload/channel.md` 의 소개문 붙여넣기

---

## 2단계 · Google Cloud 프로젝트 (15분)

**2-1. 프로젝트 만들기** → https://console.cloud.google.com/projectcreate
- 이름 `follow-done` → 만들기 → 잠시 뒤 위쪽 알림에서 "프로젝트 선택"

**2-2. API 2개 켜기** (각각 열어서 "사용" 버튼)
- YouTube Data API v3 → https://console.cloud.google.com/apis/library/youtube.googleapis.com
- Cloud Text-to-Speech API → https://console.cloud.google.com/apis/library/texttospeech.googleapis.com

**2-3. 결제 계정 연결** → https://console.cloud.google.com/billing
- TTS 무료 한도(월 100만 자) 안에서 쓰지만 결제 계정이 있어야 API가 동작합니다.

**2-4. OAuth 동의 화면** → https://console.cloud.google.com/auth/overview
- "시작하기" → 앱 이름 `follow-done`, 지원 이메일 선택 → 대상 **외부** → 연락처 이메일 → 만들기
- 왼쪽 메뉴 **대상(Audience)** → ⚠️ **"앱 게시"** 를 눌러 **프로덕션**으로 바꿉니다.
  테스트 모드로 두면 토큰이 7일마다 만료되어 자동화가 멈춥니다. "확인되지 않은 앱" 경고는 무시해도 됩니다(본인 계정만 사용).
- 왼쪽 메뉴 **데이터 액세스(Data access)** → 범위 추가 → 아래 2개 체크 → 저장
  - `https://www.googleapis.com/auth/youtube.upload`
  - `https://www.googleapis.com/auth/youtube`

**2-5. OAuth 클라이언트 만들기** → https://console.cloud.google.com/auth/clients/create
- 애플리케이션 유형: **웹 애플리케이션** (모바일에서 토큰을 만들기 위해 웹 유형으로)
- 이름 `follow-done-web`
- 승인된 리디렉션 URI → "URI 추가" → `https://developers.google.com/oauthplayground`
- 만들기 → 뜨는 창에서 **클라이언트 ID**와 **클라이언트 보안 비밀번호** 둘 다 복사해 메모 (⚠️ 이 창을 닫으면 비밀번호는 다시 못 봅니다. 그럴 땐 클라이언트를 새로 만드세요)

**2-6. TTS용 API 키** → https://console.cloud.google.com/apis/credentials
- "+ 사용자 인증 정보 만들기" → **API 키** → 키 복사해 메모
- (권장) 키 이름 옆 연필 → API 제한사항 → "키 제한" → Cloud Text-to-Speech API 만 선택 → 저장

---

## 3단계 · 유튜브 토큰 만들기 (채널마다 1회, 5분)

→ https://developers.google.com/oauthplayground

1. 오른쪽 위 **⚙(톱니)** → **"Use your own OAuth credentials"** 체크 → 2-5의 클라이언트 ID·비밀번호 입력 → Close
2. 왼쪽 "Step 1" 목록 맨 아래 입력창에 `https://www.googleapis.com/auth/youtube.upload` 입력 → **Authorize APIs**
3. 구글 로그인 창 → **한국어 채널 계정(브랜드 계정이면 그 채널)** 선택 → "계속" → 허용
4. "Step 2" → **Exchange authorization code for tokens**
5. 오른쪽에 나오는 **Refresh token** 값(`1//0g…` 로 시작)을 복사해 메모 → 이게 `YT_REFRESH_TOKEN_KO`
6. 영어 채널도 1~5를 반복 (3번에서 영어 채널 선택) → `YT_REFRESH_TOKEN_EN`

> 채널이 브랜드 계정이면 로그인 창에서 **채널 이름**이 보입니다. 꼭 그 채널을 선택하세요. 개인 계정을 고르면 영상이 개인 채널로 올라갑니다.

---

## 4단계 · GitHub Secrets 등록 (5분)

→ https://github.com/grakoreakim-lgtm/bloom-sydney/settings/secrets/actions

"New repository secret"을 눌러 아래 4개를 하나씩 추가합니다. 이름은 **정확히** 이렇게.

| Name | Secret (값) |
|---|---|
| `YT_CLIENT_SECRET_JSON` | 아래 한 줄을 2-5의 값으로 채워서 통째로: `{"web":{"client_id":"여기에_클라이언트ID","client_secret":"여기에_비밀번호"}}` |
| `YT_REFRESH_TOKEN_KO` | 3-5의 한국어 채널 Refresh token |
| `YT_REFRESH_TOKEN_EN` | 3-6의 영어 채널 Refresh token |
| `GOOGLE_TTS_API_KEY` | 2-6의 API 키 |

등록이 끝나면 **메모 앱의 값들은 삭제**하세요.

---

## 5단계 · 첫 실행 (10분)

→ https://github.com/grakoreakim-lgtm/bloom-sydney/actions/workflows/daily-videos.yml

1. 오른쪽 "Run workflow" → **Use workflow from: `claude/youtube-entry-form-strategy-bwq3ly`** 선택 → date는 `2027-01-23`, dry **체크** → Run workflow
2. 10분쯤 뒤 실행 항목을 열면 Summary에 결과, 아래 Artifacts에 영상·썸네일 zip → 내려받아 음성·화면 확인
3. 괜찮으면 같은 방법으로 dry **체크 해제** → 실행 → YouTube Studio에 비공개 영상이 생기고, 예약 시각에 자동 공개됩니다
   → https://studio.youtube.com/channel/UC/videos/upload

> ⚠️ 매일 06:00 자동 실행은 GitHub 규칙상 **기본 브랜치(main)에 있는 워크플로만** 됩니다. 수동 실행이 성공하면 채팅에서 "메인에 합쳐줘"라고 말씀해 주세요. PR을 만들어 드립니다.

---

## 막히면

- "확인되지 않은 앱" 화면 → "고급" → "follow-done(안전하지 않음)으로 이동" 눌러 진행
- Playground에서 Refresh token이 안 보임 → ⚙에서 "Force prompt: consent"가 켜져 있는지 확인 후 다시 Authorize
- Actions 실행이 빨간색 → 실행 항목 열어 빨간 단계 이름을 채팅에 알려주시면 제가 고칩니다
