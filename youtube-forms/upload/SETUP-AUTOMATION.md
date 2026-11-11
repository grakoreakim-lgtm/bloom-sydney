# 완전 자동화 셋업 (1회, 약 40분) — 이후 비용 0원

```
채팅(관제)  ──push──▶  GitHub 저장소  ──매일 06:00 KST──▶  GitHub Actions(공장)  ──▶  YouTube 예약 공개
서식 정의·캘린더 수정                                      녹화·TTS·합성·썸네일·업로드
```

## A. Google Cloud (15분)
1. https://console.cloud.google.com → 새 프로젝트
2. API 및 서비스 → 라이브러리 → **YouTube Data API v3**, **Cloud Text-to-Speech API** 사용 설정
3. **OAuth 동의 화면** → 외부 → 앱 이름·이메일 입력 → 범위에 `youtube.upload`, `youtube` 추가 → 저장
4. ⚠️ 동의 화면에서 **"앱 게시(프로덕션으로 전환)"** 를 누릅니다. 테스트 모드로 두면 토큰이 **7일마다 만료**되어 자동화가 멈춥니다. "확인되지 않은 앱" 경고는 본인 계정만 쓰므로 그대로 진행해도 됩니다.
5. 사용자 인증 정보 → **OAuth 클라이언트 ID → 데스크톱 앱** → JSON 다운로드
6. 사용자 인증 정보 → **API 키** 생성 (TTS용) → 복사
7. 결제 계정 연결 (TTS 무료 한도 월 100만 자, 초과분만 과금)

## B. 토큰 만들기 (PC에서 5분, 브라우저가 필요한 유일한 단계)
```bash
cd youtube-forms && npm install
mkdir -p upload/secrets && cp ~/Downloads/client_secret_*.json upload/secrets/client_secret.json
node upload/auth.js ko     # 한국어 채널 계정으로 로그인 → 허용 → upload/secrets/token-ko.json
node upload/auth.js en     # 영어 채널 계정으로 로그인 → 허용 → upload/secrets/token-en.json
```

## C. GitHub Secrets 등록 (5분)
저장소 → Settings → Secrets and variables → Actions → New repository secret

| 이름 | 값 |
|---|---|
| `YT_CLIENT_SECRET_JSON` | `upload/secrets/client_secret.json` 파일 내용 전체 |
| `YT_TOKEN_KO_JSON` | `upload/secrets/token-ko.json` 내용 전체 |
| `YT_TOKEN_EN_JSON` | `upload/secrets/token-en.json` 내용 전체 |
| `GOOGLE_TTS_API_KEY` | A-6의 API 키 |

채널을 더 붙이면 `YT_TOKEN_<언어대문자>_JSON` 을 추가하고 `upload/config.ci.json → channels` 에 매핑합니다.

## D. 첫 실행 (5분)
1. 저장소 → Actions → **daily-videos** → Run workflow → date 비움, dry ✔ → 실행
2. 10분쯤 뒤 Summary에 결과, Artifacts에 영상·썸네일이 올라옵니다. 내려받아 음성·화면 확인
3. 괜찮으면 dry 해제하고 한 번 더 → YouTube Studio에 비공개 영상이 올라오고 캘린더의 공개 시각에 공개됩니다
4. 그 뒤는 매일 06:00 KST 자동. 아무것도 안 해도 됩니다

## E. 매일 운영에서 사람이 할 일
- 없음. 다만 처음 1~2주는 YouTube Studio에서 영상이 "비공개"로 잠기지 않았는지 확인 (앱 심사 전 API 업로드 제한이 걸리는 경우가 있음 → 그때는 Studio에서 공개로 바꾸거나 앱 심사 신청)
- 캘린더 변경·새 서식 추가·오류 대응은 **채팅에서 요청**하면 제가 수정해서 push → 다음 실행에 반영

## F. 실제 사이트 녹화로 전환
`upload/config.ci.json → "target": "live"` (또는 Run workflow 에서 target=live). 서식마다 `forms/<id>.js → selectors.live` 가 실제 페이지와 맞는지 한 번은 확인해야 합니다. Actions 러너는 정부 사이트에 접근할 수 있고, CAPTCHA 칸은 보여주기만 하고 절대 입력·제출하지 않습니다. 봇 차단(Cloudflare)이 걸리는 사이트는 mock 으로 유지합니다.

## G. 비용·한도
| 항목 | 한도 | 예상 사용 |
|---|---|---|
| GitHub Actions | 비공개 월 2,000분 무료 (공개 저장소는 무제한) | 영상 1개 ≈ 10분 → 하루 5개 × 30일 ≈ 1,500분 |
| Google TTS Neural2 | 월 100만 자 무료 | 영상당 ≈ 3,000자 → 월 45만 자 |
| YouTube API | 하루 10,000 단위 (업로드 1,600) | 하루 5개 = 8,000 단위. 6개 이상이면 할당량 증설 신청 |
