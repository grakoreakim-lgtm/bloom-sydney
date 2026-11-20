# upload/ — 하루치 자동 제작·업로드

```
run-day.js     캘린더의 하루 → 녹화 → TTS → 합성 → 썸네일 → 메타데이터 → 예약 업로드
narration.js   서식 정의에서 대본을 뽑아 Google Cloud TTS로 클립 생성(해시 캐시)
mux.js         큐 타임라인 위치에 클립을 얹어 오디오 트랙 생성(ffmpeg)
thumbnail.js   1280×720 썸네일(국기·서식명·"무료 5분"·브랜드)
metadata.js    제목·설명(공식 링크→제휴 고지→제휴 링크→비용→챕터)·태그·예약 시각
auth.js        채널별 1회 OAuth → secrets/token-<채널>.json
upload.js      YouTube Data API v3 업로드(비공개+publishAt), 썸네일 설정
config.example.json → config.json 으로 복사해서 채움
channel.md     채널 소개문·배너·고정 댓글·제휴 신청 소개문
```

## 최초 1회 (사용자 PC, 약 30분)

1. `cd youtube-forms && npm install` (googleapis). Playwright 브라우저: `npx playwright install chromium`
2. Google Cloud 콘솔 → 프로젝트 → **YouTube Data API v3**, **Cloud Text-to-Speech API** 사용 설정
3. OAuth 클라이언트(데스크톱 앱) 생성 → JSON을 `upload/secrets/client_secret.json`으로 저장
4. TTS용 API 키 생성 → 환경변수 `GOOGLE_TTS_API_KEY` 로 설정 (파일에 쓰지 않음)
5. 채널마다 로그인 승인: `node upload/auth.js ko`, `node upload/auth.js en` (브라우저가 열림 → 허용)
6. `upload/config.example.json` → `upload/config.json` 복사, 제휴 링크·공개 시각 채우기
7. 테스트: `node upload/run-day.js --date 2027-01-23 --row 5 --dry` (업로드만 생략, TTS는 실제 호출)

## 매일

```bash
node upload/run-day.js                 # 오늘 날짜의 캘린더 행 전부
node upload/run-day.js --date 2027-02-01
```
Windows 작업 스케줄러 / macOS launchd / cron 에 아침 6시로 등록하면 그날 영상이 비공개로 올라가고
`publishHours` 에 적힌 시각에 자동 공개됩니다. 결과는 `out/days/<날짜>/log.json`.

## 알아둘 것

- **본편만 자동화됩니다.** 쇼츠·실수 TOP5·주간 뉴스는 다음 단계입니다. 해당 행은 "skipped" 로 기록됩니다.
- **서식 정의가 있어야 합니다.** `forms/<id>.js` 를 만들고 `config.json → formMap` 에 `"캘린더의 서식/주제": "<id>"` 를 추가하세요. 없는 행은 건너뜁니다.
- **실제 사이트 녹화**는 `config.json → target: "live"`. 선택자를 먼저 확인하고, 스크립트는 절대 제출하지 않습니다.
- **API 할당량**: 업로드 1건 ≈ 1,600 단위, 기본 10,000/일 → 하루 6개가 상한. 썸네일 설정 50 단위. 5개/일 계획에는 맞지만 재업로드가 겹치면 모자랄 수 있으니 할당량 증설을 신청해 두세요.
- **앱 심사 전**에는 API 업로드 영상이 비공개로 잠길 수 있습니다. 첫 주는 업로드 후 YouTube Studio에서 상태를 확인하세요.
- `secrets/` 와 `config.json` 은 git 에 올라가지 않습니다(.gitignore).
- 더 자연스러운 음성이 필요하면 `narration.js → synthesize()` 만 바꿔 ElevenLabs 등으로 교체할 수 있습니다. 나머지 파이프라인은 그대로입니다.
