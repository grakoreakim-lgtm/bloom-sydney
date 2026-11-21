# 검색(SEO) 자동 분석 켜기 — 한 번만, 휴대폰으로 약 10분

영상을 만들 때 키워드를 넣는 일은 **이미 자동**입니다. 키워드는 `seo/keywords.json`에서 가져와 제목 앞부분, 설명 첫 줄, 태그, 해시태그에 들어갑니다.
2주마다 실제 검색어, 노출, 클릭률(CTR)을 읽어 오려면 Google이 **"분석 데이터 읽기" 권한**을 한 번 더 승인해 줘야 합니다.

## 1. API 두 개 사용 설정 (프로젝트: follow-done)
- YouTube Analytics API → https://console.cloud.google.com/apis/library/youtubeanalytics.googleapis.com → **사용**
- YouTube Reporting API → https://console.cloud.google.com/apis/library/youtubereporting.googleapis.com → **사용**

(화면 위쪽 프로젝트 이름이 follow-done인지 확인하세요.)

## 2. 동의 화면에 범위 추가
https://console.cloud.google.com/auth/scopes → **범위 추가 또는 삭제** → 아래 값을 직접 입력해 추가 → **저장**
```
https://www.googleapis.com/auth/yt-analytics.readonly
```
⚠ 앱 상태는 **프로덕션**으로 그대로 두세요. 테스트로 바꾸면 안 됩니다.

## 3. 토큰 다시 발급 (채널마다 한 번씩, 지난번과 같은 방법)
1. https://developers.google.com/oauthplayground 를 엽니다.
2. ⚙(오른쪽 위)에서 **Use your own OAuth credentials**가 체크돼 있는지 확인합니다. 풀렸으면 지난번처럼 다시 입력합니다.
3. 왼쪽 아래 입력칸에 아래 한 줄을 그대로 붙여 넣고 **Authorize APIs**를 누릅니다.
   ```
   https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/yt-analytics.readonly
   ```
4. grakorea.kim 계정을 고른 뒤 채널 **따라하면 끝**을 선택하고 모두 허용합니다. "확인되지 않은 앱" 경고가 나오면 **고급 → 이동**을 누르세요.
5. **Exchange authorization code for tokens**를 누르고 Refresh token을 복사합니다. 채팅이나 스크린샷에는 남기지 마세요.
6. https://github.com/grakoreakim-lgtm/bloom-sydney/settings/secrets/actions 에서 **YT_REFRESH_TOKEN_KO** 연필 아이콘을 누르고 값을 붙여 넣은 뒤 **Update secret**을 누릅니다.
7. 1~6을 한 번 더 반복합니다. 이번에는 채널 **Copy My Screen**을 선택하고 **YT_REFRESH_TOKEN_EN**을 바꿉니다.

새 토큰에도 업로드 권한이 들어 있어서 매일 업로드는 그대로 계속됩니다.

## 그다음은 자동
- 격주 월요일 11:17(KST)에 `seo-review` 워크플로가 실행됩니다.
  - 영상별 **실제 검색어**를 태그에 추가하고, 다음 영상의 태그와 설명에도 넣습니다(`seo/learned.json`).
  - **노출 300회 이상인데 CTR이 4% 미만**이면 제목을 다음 후보로 바꿉니다(`keywords.json`의 titles, 14일 쿨다운).
  - 노출이 부족한 영상과 시청 유지율이 낮은 영상은 보고서에 개선 제안으로 남깁니다.
- 보고서 위치: `youtube-forms/seo/reports/<날짜>.md`, 그리고 Actions → seo-review 실행 화면 요약
- 첫 실행 때 노출/CTR 일일 리포트 작업이 만들어지며, 노출 데이터는 그 뒤로 쌓입니다.
