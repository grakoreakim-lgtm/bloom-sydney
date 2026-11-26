# 유튜브 자동 영상 제작 플레이북

이 문서와 같은 폴더의 엔진(`youtube-forms/`)·자동 실행 설정(`.github/workflows/`)을 새 저장소에 넣고,
Claude Code에게 이렇게만 말하면 됩니다.

> **"PLAYBOOK.md를 읽고, 아이디어: ○○○ 로 시작해."**

Claude는 아래 10단계를 순서대로 진행합니다. 각 단계 끝의 **완료 기준**을 만족해야 다음으로 넘어갑니다.
이 문서는 실제 채널 3개를 운영하며 겪은 문제와 해결법을 바탕으로 썼습니다(9장).

---

## 0. 구성 한눈에 보기

```
아이디어 → 형식 선택 → 정의 파일(대본·화면·사실) → [매일 밤 GitHub Actions]
   녹화(Playwright) → 음성(TTS) → 싱크 검수(QA) → 배경음악 → 썸네일 → 제목·설명·태그
   → 예약 업로드 → 쇼츠 → 재생목록·AI 표시·제휴·구독 링크
→ [매일 아침] 보고(조회수·문제·댓글 답글 초안)  [매일] 독립 검수  [매주] 기획
```

| 폴더/파일 | 하는 일 |
|---|---|
| `youtube-forms/upload/run-day.js` | 하루 제작의 중심. 일정표·주제 → 녹화 → 음성 → QA → 썸네일 → 메타데이터 → 업로드 → 쇼츠 |
| `youtube-forms/lib/recorder.js`, `overlay.js` | 브라우저 자동 조작 + 화면 강조·말풍선·자막 |
| `youtube-forms/upload/narration.js` | 대본 생성, 음성 합성(Gemini/Google/OpenAI/CLOVA), 예비 음성 전환, 시간 제한 |
| `youtube-forms/upload/qa.js` | 말과 화면 싱크, 화면 값 확인 — 실패하면 공개하지 않음 |
| `youtube-forms/upload/phrases.js` | 카드형 영상(회화·설명) + 세로 쇼츠 |
| `youtube-forms/upload/demo.js` | 실제 화면을 먼저 녹화 → 대본을 나중에 붙이는 영상 |
| `youtube-forms/upload/thumbnail.js`, `metadata.js`, `seo.js` | 썸네일, 제목·설명·태그·구간 |
| `youtube-forms/upload/maintain.js` | AI 표시, 재생목록, 제휴 링크, 구독 링크, 워터마크, 조회수 |
| `youtube-forms/upload/comments.js`, `offers.json` | 댓글 읽기, 승인된 답글 게시, 추천 가능한 상품 목록 |
| `youtube-forms/upload/config.ci.json` | 모든 설정(채널, 시간, 음성, 주제 매핑, 썸네일 문구, 제휴) |
| `youtube-forms/ops/roles/*.md` | 검수·기획·댓글 담당 지침 |
| `.github/workflows/*.yml` | 매일 제작, 관리, 댓글, 썸네일 교체, 공개 전환 등 |

---

## 1. 아이디어 → 영상 형식 고르기

| 형식 | 맞는 아이디어 | 엔진 | 예시 파일 |
|---|---|---|---|
| **A. 화면 따라하기** | 신청서·서식·웹사이트 사용법 (입국카드, 비자, 정부 서식, 앱 웹버전) | `run-day.js` + `forms/<id>.js` + `mock/<id>.html` | `forms/tdac.js`, `mock/tdac-form.html` |
| **B. 카드형 설명** | 문장·항목을 하나씩 설명 (여행 회화, 용어, 체크리스트, 제품 비교 요약) | `phrases.js` + `phrases/<id>.json` | `phrases/jp-restaurant.json` |
| **C. 실제 화면 먼저 녹화** | 실제 앱·AI 서비스 시연, 제품 사용기 (자동 조작이 어려운 것) | `demo.js` + `demos/<id>/screen.mp4` + `demo.json` | `demos/example/demo.json` 형식은 `demo.js` 맨 위 주석 |
| **D. 쇼츠** | A·B의 핵심 장면을 세로로 | 자동 (A는 "많이 틀리는 곳" 장면, B는 `short` 표시 문장) | — |

결정 규칙:
- 시청자가 **화면을 따라 해야** 하면 A. 실제 사이트를 쓸 수 없으면 연습 화면(mock)을 만들고 "연습 화면"이라고 표시합니다.
- **듣고 따라 말하거나, 하나씩 비교**하는 내용이면 B.
- **실제 제품·앱의 모습이 핵심**이면 C. 사람이나 맥북에서 녹화가 필요합니다.
- 어떤 형식이든 **쇼츠(D)는 같이** 만듭니다. 초반 조회수는 쇼츠에서 나왔습니다(9장).

**완료 기준:** 형식, 언어(한국어/영어/둘 다), 채널 이름, 첫 2주 주제 10개 목록. 주제는 검색량이 있는 것부터 고릅니다.

---

## 2. 채널과 권한 준비 (채널 주인이 할 일 — Claude는 화면별로 안내)

1. **채널 만들기**: YouTube 채널(브랜드 계정 가능) → 휴대폰 인증(https://www.youtube.com/verify).
2. **고급 기능 켜기**: https://www.youtube.com/features → 고급 기능. **설명란 링크가 눌리려면 필수**입니다(9장).
3. **Google Cloud 프로젝트**(https://console.cloud.google.com):
   - API 사용 설정: YouTube Data API v3, YouTube Analytics API, YouTube Reporting API, (Google 음성 쓰면) Cloud Text-to-Speech API.
   - OAuth 동의 화면 → **프로덕션** 상태(테스트로 두면 토큰이 7일 뒤 만료). 범위 4개 추가:
     `youtube.upload`, `youtube`, `youtube.force-ssl`(댓글 답글), `yt-analytics.readonly`.
   - 사용자 인증 정보 → OAuth 클라이언트 ID(웹 애플리케이션), 승인된 리디렉션 URI에 `https://developers.google.com/oauthplayground`.
4. **채널별 토큰 발급**(OAuth Playground, https://developers.google.com/oauthplayground):
   - ⚙ → Use your own OAuth credentials → 클라이언트 ID·비밀.
   - 범위 한 줄: `https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/yt-analytics.readonly`
   - **브랜드 계정 채널이면**: 시크릿 창에서 https://www.youtube.com/channel_switcher 로 그 채널로 전환한 뒤, Playground에서 **Force prompt = Select account**로 진행해야 그 채널이 선택됩니다.
   - Exchange → Refresh token 복사.
5. **GitHub 시크릿**(저장소 → Settings → Secrets and variables → Actions):

| 이름 | 값 |
|---|---|
| `YT_CLIENT_ID` | OAuth 클라이언트 ID |
| `YT_CLIENT_SECRET` | OAuth 클라이언트 비밀 |
| `YT_REFRESH_TOKEN_<KEY>` | 채널별 토큰. KEY는 설정의 채널 키(예: `KO`, `EN`) |
| `GEMINI_API_KEY` | (Gemini 음성) Google AI Studio 키, 선불 충전 필요 |
| `GOOGLE_TTS_API_KEY` | (Google 음성·예비 음성) Cloud TTS 키 |

6. `check-tokens` 워크플로 실행 → 토큰마다 채널 ID(UC…)가 나옵니다 → `config.ci.json`의 `channelIds`에 `{"ko": "UC…", "en": "UC…"}`로 적습니다.
   **이 값이 있어야** 업로드가 엉뚱한 채널로 가는 것을 막습니다(9장).

**완료 기준:** `check-tokens`가 채널마다 맞는 채널 이름을 출력하고, `comments` 워크플로 `mode=scopes`가 `reply: yes`.

---

## 3. 설정 (`youtube-forms/upload/config.ci.json`)

자주 바꾸는 항목:

| 키 | 뜻 |
|---|---|
| `channelIds`, `brands` | 채널 키 → 채널 ID / 화면·썸네일에 쓰는 채널 이름 |
| `timezone`, `publishWindow` | 공개 시간대 (예: 한국 시간 6~10시 사이 무작위) |
| `uploadsPerDay` | 하루 업로드 한도. 기본 프로젝트 할당량이면 **6** (본편+쇼츠 합계) |
| `maxVideosPerDay` | 하루 본편 수 |
| `calendar` | 일정표 CSV (`plan/`). 행마다 날짜·국가·주제·언어 |
| `formMap` | 일정표의 "서식/주제" 이름 → `forms/<id>.js` |
| `thumbText` | `"<id>:<언어>": [어디(흰색), 무엇(노란색·가장 큼), 왜 눌러야 하나(빨간 띠)]` |
| `tts.voices`, `tts.fallback`, `tts.maxMinutesPerVideo` | 기본 음성, 예비 음성, 영상당 음성 시간 제한(15분) |
| `bgm`, `bgmVolume` | 배경음악 폴더, 볼륨(목소리 나올 때 자동으로 작아짐) |
| `affiliate`, `affiliateByForm` | 설명란 제휴 링크 (국가/주제별) |
| `playlists` | 재생목록 이름 → 주제 목록 |
| `phraseQueue` | 카드형(B) 에피소드 순서 — 매일 밤 하나씩 |
| `extraTopics`, `channelSchedule` | 일정표에 없는 주제, 요일별 추가 채널 |

**완료 기준:** `node upload/run-day.js --date <내일> --plan --config upload/config.ci.json`이 의도한 주제를 보여 줌.

---

## 4. 내용 쓰기 (형식별 정의 파일)

### 공통 규칙 (모든 형식)
- **사실은 공식 출처에서만.** 파일 맨 위 주석에 출처와 "확인 못 한 것" 목록을 적고, 확인 못 한 내용은 대본에 넣지 않습니다.
  공식 사이트가 막혀 있으면 공식 페이지를 인용한 검색 결과를 쓰고 그렇다고 적습니다.
- **샘플 정보는 누가 봐도 가짜**로: HONG GILDONG, M12345678, sample.traveller@example.com, "SAMPLE HOTEL".
- **시작은 두 문장 안에 본론.** 엔진이 인트로를 첫 두 문장(+면책 문장)으로 자릅니다. 첫 문장 = 누구를 위한 영상인지, 둘째 = 무엇을 얻는지.
- **"많이 틀리는 곳"을 꼭 넣습니다.** 쇼츠 재료이고 시청 유지에 효과가 있습니다.
- 말투: 친근하고 짧게. 숫자·날짜는 읽는 그대로 씁니다("삼 일 전").

### A. 화면 따라하기: `forms/<id>.js` + `mock/<id>.html`
`forms/tdac.js`를 복사해 시작합니다.
- `id, country{ko,en}, flag, title, shortTitle, videoTitle{ko,en}, url{mock, live}, selectors{mock, live}, strings{ko,en}`
- `steps`: 순서대로
  - `{type:'card', hold, card:{ko:{id:'intro'|..., speech, title, subtitle, ...}, en:{...}}}` — 인트로·구간 제목·마무리(`id:'outro'`)
  - `{type:'type'|'select'|'radio'|'check'|'click', field, value, text:{ko:{label, speech:{tip, mistake}, tip, mistake, bad, good}, en:{...}}}`
  - 실제 사이트용: `choose`(라디오 그룹), `auto`(자동완성), `date3`(일/월/년 칸), `tick`, `next`(다음 페이지)
  - `{type:'manual'}` 캡차·인증번호처럼 **가리키기만** / `{type:'stop'}` 제출 버튼을 **가리키기만**(절대 누르지 않음)
- 연습 화면 `mock/<id>.html`: 실제 서식의 칸·순서를 그대로, 맨 위에 빨간 띠 "PRACTICE FORM FOR VIDEO RECORDING ONLY — not the official site, submits nothing".
- 실제 사이트 녹화: `liveForms`에 id를 넣고 `stepsLive`/`selectors.live`를 채운 뒤 `verify-live`로 선택자를 확인합니다. 클라우드에서 막히는 사이트가 많습니다(9장).
- `config.ci.json`: `formMap`, `thumbText`, `affiliateByForm`, `playlists`. `seo/keywords.json`에 같은 id로 검색어 항목을 추가합니다(tdac 항목 참고).

### B. 카드형: `phrases/<id>.json`
`phrases/jp-restaurant.json`을 복사합니다.
- `id, channel, country, flag, target{lang, voice, fallbackVoice}, checkedOn, title, lead, thumb[3], tags, hashtags, intro{title,sub,say}, phrases[], bonus, outro{title,say}`
- `phrases[]`: `{label, ja(원문), pron(한글 발음), ko(뜻), when(상황 설명, 말함), tip(뒤에 말함), hear?(상대가 먼저 하는 말), short?(쇼츠 제목 — 있으면 쇼츠 생성)}`
  (언어가 일본어가 아니어도 키 이름은 그대로 씁니다. 원문 = `ja`)
- 진행: 상황 → 원문(보통 속도) → 원문(천천히) → 따라 말할 틈 → 팁. 카드는 자기 음성 길이만큼만 나와서 싱크가 어긋나지 않습니다.
- 매일 제작에 넣으려면 `config.ci.json`의 `phraseQueue`에 id를 추가합니다.
- **제품 비교·추천 채널**(예: AI 글래스 종류별 설명)도 이 형식으로 만들 수 있습니다. `ja`=제품명, `pron`=핵심 한 줄, `ko`=누구에게 맞나, `tip`=주의점.
  구매 링크는 설명란과 댓글(7장)에서만, 영상 안에서 재촉하지 않습니다.

### C. 실제 화면 먼저: `demos/<id>/screen.mp4` + `demo.json`
- 실제 앱을 사람 속도로 한 번 쓰면서 화면을 녹화합니다(맥북 `screencapture -v` 또는 QuickTime, 휴대폰 화면 녹화).
- 녹화를 **본 다음** `demo.json`을 씁니다: `segments:[{from, to, caption, say}]`. 각 `say`는 그 구간 화면에 실제로 나온 것만 말합니다.
  출처(`sources`)와 확인 날짜(`checkedOn`)는 필수입니다.
- `node upload/demo.js demos/<id>` → `QA PASS` 확인 → `--upload`(비공개) → 주인 승인 후 공개.

**완료 기준:** 4장 형식대로 파일이 있고, 5장의 시험 제작이 `QA PASS`.

---

## 5. 시험 제작 → 매일 자동 제작

```bash
cd youtube-forms && npm install
# A: 가짜 음성으로 시험 (업로드 안 함)
node upload/run-day.js --date 2026-12-01 --forms <id> --dry --fake-tts --no-shorts --config upload/config.ci.json
# B
node upload/phrases.js phrases/<id>.json --fake-tts
```
- `QA PASS`가 나와야 합니다. `out/days/<날짜>/rec-*/`의 화면 캡처 2~3장을 열어 강조 상자가 맞는 칸에 있는지 봅니다.
- 실제 음성·업로드는 GitHub에서: `daily-videos` 워크플로(매일 밤 자동, 수동 실행 시 date/forms/dry/review/phrases_only 입력 가능).
- 처음 며칠은 `review=true`(비공개 업로드)로 돌려 주인이 보고 `set-public`으로 공개합니다.

매일 밤 순서: 주제 결정 → 녹화 → 음성(영상당 15분 제한, 넘으면 예비 음성으로 통째 전환 + 알림) → QA(실패 시 비공개 보류)
→ 썸네일 → 제목·설명(공식 링크, 제휴, 구간, FAQ, AI 음성 표시, 구독 링크, 댓글 유도) → 예약 업로드 → 쇼츠(+90분) → 카드형 1편
→ 재생목록·AI 표시·제휴·구독 링크 정리 → 만든 기록(`plan/produced.json`) 저장 → **0건이면 GitHub 이슈로 경보**.

**완료 기준:** `daily-videos`가 하루 동안 돌아 영상이 예약되고, 다음 날 같은 주제를 다시 만들지 않음.

---

## 6. 품질 규칙 (지켜야 조회수가 나옴)

- **썸네일**: 글자 3줄만(어디 / 무엇 / 왜 눌러야 하나). 휴대폰 목록에서 읽혀야 합니다. 약속은 영상이 지킬 수 있는 것만("무료", "5분").
- **제목**: 검색어 + 연도 + 결과("5분 따라하기"). `seo/keywords.json`과 2주마다 도는 `seo-review`가 실제 검색어로 다듬습니다.
- **설명란 첫 두 줄**: 무엇을 해결하는지 + 공식 사이트 링크.
- **표시 의무**: AI 음성 사용 문구 + `containsSyntheticMedia` 표시, 제휴 링크 수수료 문구.
- **구독·댓글**: 영상 끝에 한 문장("궁금한 건 댓글로"), 설명란에 원클릭 구독 링크, 채널 워터마크(`maintain --only watermark`).
- **음성**: 목소리는 품질에 가장 큰 영향을 줍니다. 무료/저가 음성은 어색할 수 있으니 처음에 샘플(`voice-samples`)로 비교해 고르고,
  한도·크레딧을 확인합니다(9장).

---

## 7. 운영 (사람 없이 돌게 하는 역할들)

| 역할 | 언제 | 지침 | 결과 |
|---|---|---|---|
| 매일 보고 | 매일 아침 | 이 문서 + 아래 | 어제 영상 링크, 조회수 변화, 문제·조치, 댓글 답글 초안, 주인 결정 사항 |
| 검수 | 매일, 밤 제작 전 | `ops/roles/reviewer.md` | `ops/reviews/<날짜>.md` — 다음 영상의 사실·싱크·맞춤법·과장 문구 확인, 확실한 오류는 수정 |
| 기획 | 매주 | `ops/roles/planner.md` | `ops/plans/<주>.md` — 숫자 근거로 다음 주 순서, 한 주 최대 3가지 변경 |
| 댓글 | 매일(보고 안에서) | `ops/roles/comments.md` | 답글 초안 → 주인 승인 → 게시 |

- Claude Code 예약 작업으로 등록합니다. 검수·기획은 **매번 새 세션**(만든 사람과 다른 눈), 매일 보고는 주인과 같은 대화.
- **댓글로 매출 만들기**: `upload/offers.json`에 상품마다 "누구에게 맞나/안 맞나/링크/표시 문구"를 적어 두면, 추천 요청 댓글에
  상황에 맞는 조언 → 맞는 상품 하나를 권합니다. **노골적이면 안 되고, 같은 패턴을 반복하면 안 됩니다** — 재촉하는 말, 같은 첫·끝 문장,
  하루 5개 중 2개 이상의 상품 언급은 게시 단계에서 자동으로 막힙니다.
- **승인 규칙(처음엔 모두 승인 후)**: 공개된 영상 수정·삭제, 댓글 게시, 메일, 돈 드는 일. 2주 정도 품질을 본 뒤 주인이 원하면 일부만 자동으로.

---

## 8. 안전 규칙
- 신청서 **제출·결제 버튼은 절대 누르지 않고**, 캡차·인증번호는 자동으로 풀지 않습니다(가리키기만, 또는 주인이 직접).
- 비밀값은 화면·채팅·파일·스크린샷 어디에도 남기지 않습니다. GitHub 시크릿에만.
- 개인 정보가 나온 녹화는 다시 찍습니다(흐리게 처리하지 말고).
- 각 서비스 이용 약관 안에서만: 봇 차단을 피하려는 우회 접속(유료 프록시 등)은 쓰지 않습니다.
- YouTube API 할당량을 늘리려고 프로젝트를 여러 개 만들지 않습니다. 필요하면 할당량 증설 신청을 합니다.

---

## 9. 겪었던 문제와 해결법

| 증상 | 원인 | 해결 |
|---|---|---|
| 업로드가 다른 채널로 감 | 토큰을 발급할 때 다른 채널이 선택됨 | `channelIds` 등록(엔진이 다른 채널이면 업로드 거부). 브랜드 계정은 channel_switcher + Select account로 재발급 |
| `invalid_client` | 클라이언트 비밀을 지웠거나 오타 | Cloud에서 새 비밀 → `YT_CLIENT_SECRET` 교체 |
| 토큰이 7일 만에 죽음 | 동의 화면이 "테스트" 상태 | **프로덕션**으로 두기 |
| 썸네일이 안 바뀜 | 휴대폰 인증 전 / "too many thumbnails" 한도 | 인증 후 `fix-thumbnails` 재실행 / 몇 시간 뒤 재시도 |
| 쇼츠에 가로 썸네일이 들어감 | 일괄 교체 도구가 쇼츠까지 바꿈 | `fix-thumbs`는 쇼츠에 자기 화면을 씀(수정됨) |
| 음성이 1시간 넘게 멈춤 | Gemini 음성 "요청 과다(429)" | 영상당 15분 제한 → 예비 음성으로 통째 전환 + 이슈 알림. 근본 해결은 AI Studio 결제 등급·크레딧 |
| 한 영상에 목소리 두 개가 섞임 | 문장마다 따로 예비 음성 전환 | 한 영상의 문장을 먼저 다 만들고, 실패 시 전체를 예비 음성으로 |
| 말과 화면이 어긋남 | 음성 길이 ≠ 화면 시간 | QA가 단계별로 검사, 실패 시 비공개 보류. 카드형은 카드 시간 = 음성 길이 |
| "음…" 소리가 거슬림 | 쉼 표시를 음성이 소리로 읽음 / 일부러 넣은 추임새 | 쉼표 마크업 금지, 실제 무음으로 문장 연결. 추임새는 선택 사항 |
| 인트로가 길어 이탈 | 설명이 길었음 | 첫 두 문장만 남기도록 엔진이 자름 |
| 실제 사이트 녹화 실패 | 정부 사이트가 클라우드(데이터센터) 접속 차단, 봇 확인 | 집 인터넷의 맥북에서 녹화, 앱은 휴대폰 화면 녹화(C 형식), 안 되면 실제와 같은 연습 화면 |
| 설명란 링크가 안 눌림 | 채널 "고급 기능" 꺼짐 | https://www.youtube.com/features 에서 켜기. 쇼츠 설명란 링크는 원래 안 눌림 |
| 밤 제작이 0건인데 "성공" | 준비된 주제 소진 | 0건 경보 이슈 + 주제를 2주 치 미리 준비, 카드형 대기열로 메우기 |
| 예약 작업이 몇 시간씩 늦게 돎 | GitHub 예약 실행 지연 | 공개 시간이 지났으면 엔진이 30분 뒤로 자동 조정 |
| 매일 관리 작업이 할당량을 씀 | 모든 영상에 AI 표시를 매번 다시 보냄 | 최근 3일 영상만 |
| 일정표 CSV 전체가 바뀜 | 다시 저장하면서 줄바꿈 형식이 바뀜 | 해당 줄만 바꿔 넣고, 파일 전체를 다시 쓰지 않기 |
| 회화 편이 만들어지고 안 올라감 | `--upload` 빠짐 | 워크플로에서 `phrases.js --next --upload` |

---

## 10. 새 아이디어 체크리스트 (Claude가 순서대로)

1. **아이디어 정리**: 형식(1장), 언어, 채널 이름, 시청자, 첫 2주 주제 10개(검색량 근거) → 주인 확인.
2. **채널·권한**(2장): 주인에게 화면별 안내 → `check-tokens`로 채널 ID 확인 → `channelIds`.
3. **설정**(3장): `brands`, 공개 시간, 한도, 음성 선택(샘플 비교 후).
4. **첫 주제 1개** 정의 파일 작성(4장) → 시험 제작 `QA PASS` → 화면 캡처 확인.
5. **비공개 업로드**(`review=true`) → 주인이 보고 승인 → 공개.
6. 나머지 주제 정의 → 매일 제작 켜기(`daily-videos` 예약) → 카드형 대기열.
7. **역할 예약**: 매일 보고, 검수, 주간 기획, 댓글(7장). `offers.json`에 이 채널 상품.
8. **첫 주 점검**: 매일 보고에서 조회수·쇼츠·음성 대체·0건 경보 확인, 문제는 9장 표부터.
9. **2주 뒤**: `seo-review` 결과로 제목·썸네일 조정, 잘 되는 주제·형식 늘리기.
10. **주제가 바닥나기 1주 전**에 다음 주제를 준비(0건 방지).

**전체 완료 기준:** 주인 손 없이 7일 연속 매일 영상이 예약되고, 매일 아침 보고가 오며, 승인할 것만 주인에게 갑니다.
