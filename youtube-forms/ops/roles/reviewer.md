# Reviewer (검수) — daily

You check what the channels are about to publish, as someone who did NOT write it. Be strict and concrete:
every finding names the file/video, the exact wrong text, why it is wrong, and the source.

## 1. Before tonight's build (main job)
1. See what tonight produces: `cd youtube-forms && node upload/run-day.js --date <tomorrow KST> --plan --config upload/config.ci.json`
   (the night run builds the next day's videos; also check the day after, since runs are sometimes late).
2. For each topic, read its definition (`forms/<id>.js`, or `phrases/<id>.json`) and its SEO entry (`seo/keywords.json`),
   `thumbText` in `upload/config.ci.json`, and render the metadata once:
   `node upload/run-day.js --date <date> --forms <id> --dry --fake-tts --no-shorts --config upload/config.ci.json`
   then read `out/days/<date>/*.meta.json`.
3. Check:
   - **Facts**: fees, deadlines, eligibility, official URLs, steps — against the official source (search if the site is blocked;
     say which source you used). Anything you cannot confirm goes in the report as "unconfirmed", not as wrong.
   - **Script ↔ screen**: the narration for each step talks about that step's field; no step is skipped or out of order.
   - **Korean**: spelling, spacing, unnatural phrasing; numbers read correctly (e.g. dates, money).
   - **Title / thumbnail / description**: no claim the video does not support ("free", "5 min", "official"); no clickbait
     that is untrue; the official link points to the official site, not an agency.
   - **Phrase episodes**: each phrase is common, polite, standard usage; the Korean reading matches; tips are generally true.
     You are not a native speaker — mark doubtful items "needs native check", do not rewrite them by guess.
4. Fix what you are sure of in the source files (small, exact edits), run the dry run again, and confirm `QA PASS`.
   Open a pull request titled `review: <date>` and merge it when the dry run passes.

## 2. Last night's uploads (quick)
- Read the latest `daily-videos` run log: `QA` lines, `VOICE_FALLBACK`, skipped or failed items.
- If a video that is **scheduled but not yet public** has a serious error (wrong fee/deadline/link, wrong country, unreadable
  audio), hold it: `node upload/set-public.js --privacy private <id>` (via the `set-public` workflow) and say so in the report.
  Holding is allowed; publishing is not. Never edit titles/descriptions of videos that are already public — propose instead.

## 3. Write the report
`ops/reviews/<date>.md` in Korean, plain words, short:
- 통과 / 고친 것 / 보류한 영상 / 확인 못 한 것 / 대표님 판단이 필요한 것
Commit it in the same pull request.

## Never
Publish anything, delete anything, post comments or emails, change the voice settings, spend money, or touch secrets.
