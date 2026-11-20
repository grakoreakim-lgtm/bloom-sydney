# Studio — 여러 채널 · 여러 주제팩 · 일정 · 자동 제작·업로드

```bash
cd youtube-forms && npm install
node studio/server.js            # http://127.0.0.1:8787  (워커 포함, 30초마다 제작)
node studio/server.js --no-worker
```

## 화면

| 탭 | 하는 일 |
|---|---|
| 대시보드 | 연결 채널 수 · 예정 · 오늘 완료 · 오류 · 이번 주 표 |
| 채널 | 채널 추가 → **언어**·**주제팩**·하루 개수·초반 절반 속도 일수·시작일·공개 시각·시간대·제휴 링크 → **YouTube 연결**(OAuth) → **30일 일정 생성** |
| 주제팩 | 입국신고서 / 전자여행허가 / 전자비자 / 항공 체크인 / 철도·관광지 / 해외 정착 / 한국 거주 외국인 / 금융 / 시험. 서식 정의가 있는 것만 진하게 |
| 일정 | 날짜·슬롯·주제·언어·상태. 지금 제작 / 건너뛰기 / 날짜 ◀▶ / 언어 변경 / 삭제 / 행 추가. 완료되면 썸네일·영상·유튜브 링크·공개 시각 |
| 작업 | 제작 로그(narration → record → mux → thumbnail → metadata → upload) |
| 설정 | 건식↔실제 업로드, 연습 폼↔실제 사이트, 무음↔Google TTS, 속도, 며칠 전 제작, 배경음악 |

## 동작

- 채널마다 **주제팩 × 언어**의 조합을 큐로 만들고(언어는 번갈아), 하루 개수만큼 날짜에 배정합니다. 같은 채널에 이미 있는 (주제, 언어)는 다시 넣지 않습니다.
- 워커는 30초마다 `planned` 상태이고 날짜가 `오늘 + leadDays` 이내인 행을 하나 골라 `upload/pipeline.js`로 제작합니다.
- 실제 업로드 모드에서는 **비공개 + publishAt**으로 올라가 채널의 공개 시각에 자동 공개됩니다.
- 모든 상태는 `studio/data/db.json`(git 제외)에 있습니다. 나중에 실제 DB로 바꿀 때 API는 그대로 둡니다.

## YouTube 계정 연결 (채널마다)

1. Google Cloud → OAuth 클라이언트 **데스크톱 앱** → JSON을 `upload/secrets/client_secret.json`에 저장 (한 번만)
2. 채널 카드의 **YouTube 연결** → 그 채널 계정으로 로그인 → 허용 → 자동으로 돌아옴
3. 토큰은 `upload/secrets/token-<채널id>.json`에 저장. 채널마다 다른 구글 계정이어도 됩니다.

## 새 주제·서식 추가

1. `forms/<id>.js` 작성 (`forms/mdac.js` 복사). 상단에 `pack`, `country`, `flag`, `fee`, `when`, `videoTitle` 채우기.
2. `forms/_packs.js`의 해당 팩 `roadmap`에 `<id>` 추가 (없으면).
3. 채널에서 "일정 생성"을 다시 누르면 뒤에 붙습니다.

## 여러 사용자용 서비스로 키울 때

- `store.js`를 Postgres/Firestore로 교체하고 모든 레코드에 `ownerId`를 붙입니다(이미 id 기반이라 API 변경 없음).
- 워커를 서버와 분리해 큐(예: BullMQ)로 돌리고, 녹화는 Playwright 컨테이너에서.
- OAuth 리디렉션 URI를 공개 도메인으로 바꾸고 클라이언트 유형을 "웹 애플리케이션"으로.
- 제작물 보관은 S3/GCS, `out/` 경로를 URL로.
