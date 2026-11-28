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

- 실수 TOP5·주간 뉴스 행은 아직 자동화되지 않아 "skipped" 로 기록됩니다. 쇼츠는 본편과 함께 만들어집니다.
- **서식 정의가 있어야 합니다.** `forms/<id>.js` 를 만들고 `config.json → formMap` 에 `"캘린더의 서식/주제": "<id>"` 를 추가하세요. 없는 행은 건너뜁니다.
- **실제 사이트 녹화**는 `config.json → target: "live"`. 선택자를 먼저 확인하고, 스크립트는 절대 제출하지 않습니다.
- **API 할당량**: 업로드 1건 ≈ 1,600 단위, 기본 10,000/일 → 하루 6개가 상한. 썸네일 설정 50 단위. 5개/일 계획에는 맞지만 재업로드가 겹치면 모자랄 수 있으니 할당량 증설을 신청해 두세요.
- **앱 심사 전**에는 API 업로드 영상이 비공개로 잠길 수 있습니다. 첫 주는 업로드 후 YouTube Studio에서 상태를 확인하세요.
- `secrets/` 와 `config.json` 은 git 에 올라가지 않습니다(.gitignore).
- 더 자연스러운 음성이 필요하면 `narration.js → synthesize()` 만 바꿔 ElevenLabs 등으로 교체할 수 있습니다. 나머지 파이프라인은 그대로입니다.

## 업로드 수 규칙 (`config.ci.json`)

- `tutorialRules`: 따라하기 본편을 줄이는 규칙(대표님 결정, `ops/OWNER-RULES.md` 6b).
  `skipLangs`(hi·es·id·ja 줄은 만들지 않음, 다른 언어는 자동 더빙으로), `perLang`(언어별 하루 본편 수, ko 1·en 1),
  `enForms`(영어 채널은 이 양식만: tdac·mdac·sgac·vjw·esta). 빠진 줄은 로그에 `tutorialRules: N row(s) left out`.
- `uploadsPerDay`: 하루 업로드 총수(본편+쇼츠+회화). 회화 편은 따라하기가 쓰고 남은 수만큼만 올리고, 올릴 수 없는 쇼츠는 만들지도 않습니다.
- `pauseTutorials`: 싱크 교체가 끝날 때까지 따라하기 제작을 멈춤. 끝나면 지우고 `uploadsPerDay`를 6으로.

## 회화·만화 편 (`phrases.js`)

- 파일: `phrases/<id>.json`(대사·상황·팁), 그림 `phrases/art/<id>/cast.jpg, p1.jpg …`. 형식과 그림 규칙은 `phrases/COMIC.md`.
- 모든 칸 그림이 있으면 자동으로 만화 화면(말풍선·맞혀 보기·끝의 기억 테스트)으로 만들고, 없으면 카드 화면입니다.
- **한국어판 / 영어판**: `lang`(기본 ko, 영어판은 `"lang": "en"`, `channel: "en"`). 영어판은 `<id>-en.json`이고
  `comic.artFrom`으로 한국어판 그림을 그대로 씁니다. `pron`은 로마자, `ko` 칸에 영어 뜻(키 이름은 엔진 때문에 그대로).
- **그림 만들기**: `comic-art` 워크플로(`node upload/comic-art.js phrases/<id>.json`). 결과는 `art-output` 브랜치에 올라가고,
  검수(`ops/roles/reviewer.md` 1b)를 통과한 칸만 main의 `phrases/art/<id>/`에 넣습니다. 고칠 칸만 `only: 3,5`로 다시 그립니다.
  `--styles`(그림체 비교), `--page`(한 장 그리기), `--model`은 시험용입니다 — 기본은 고급 모델로 한 칸씩(COMIC.md).
- **매일 대기열**: `config.ci.json → phraseQueue` 순서대로 밤마다 1편(`phrases.js --next`). 다 만든 편은 `plan/produced.json`.
  만화 편은 검수된 그림이 커밋될 때까지 기다립니다(`PHRASES waiting for art`) — 카드판으로 잘못 나가지 않게.
- 수동 실행: `phrases` 워크플로. `shorts`(쇼츠도 만들기), `new_copy`(같은 제목이 이미 있어도 올리기 — 다시 그린 판 등).
- 쇼츠 → 본편 연결은 `plan/shorts.json`. `replace.js`로 본편을 교체하면 옛 본편을 가리키던 쇼츠도 새 본편으로 고쳐집니다.

## 비용 줄이는 장치 (`ops/OWNER-RULES.md` 6c)

- **목소리 저장**: 같은 대사·같은 목소리는 `out/tts-cache`에 저장해 다시 쓰고, `daily-videos`가 이 폴더를 캐시로 이어 갑니다.
- **한도에서 바로 멈춤**: Gemini 목소리가 하루 한도·결제 상한에 닿으면 `narration.js`가 기다리지 않고 표시 파일
  (`out/gemini-exhausted-<날짜>`)을 남겨, 그날 남은 문장은 바로 예비 목소리(Kore)로 갑니다. 그림은 결제 상한 메시지를 받으면 즉시 멈춥니다.
- **그림 월 한도**: `comic-art.js`가 만든 그림 수를 `plan/image-usage.json`에 세고, `imageMonthlyCap`(200장)에 닿으면 멈춥니다.
- **빈 밤 건너뛰기**: `daily-videos`의 첫 단계가 만들 것이 없으면(따라하기 멈춤 + 대기열 끝) 설치·제작을 건너뜁니다.
