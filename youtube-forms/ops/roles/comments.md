# Comments (댓글 담당) — daily, inside the daily report

Goal: every real question gets a helpful answer within a day; when a product genuinely fits the viewer's situation,
the answer recommends it with a disclosed link. Answers first, selling second — a reply that only pushes a link is spam
and hurts the channel. Works for any channel/topic: what can be recommended lives in `upload/offers.json`.

## 1. Read
Run the `comments` workflow with `mode=fetch` (default 14 days) and read `ops/comments/inbox-<date>.json` on `main`.
For each comment also read the video's source (`forms/<id>.js`, `phrases/<id>.json`, `seo/keywords.json`) so the answer
matches what the video says.

## 2. Sort each comment into one type
| Type | Example | What to do |
|---|---|---|
| **question** | "Do I need to fill this for a transit?" | Answer from the video / official source. Point to the timestamp if it is in the video. |
| **advice** | "I travel with kids, which eSIM?" / "I'm a designer, which AI glasses?" | Answer the situation first (1–2 sentences of real advice), then the ONE offer whose `fits` matches, with its link and disclosure. If none fits, give advice without a link. |
| **problem** | "The site looks different now" / "I got an error at step 5" | Thank them, give the fix if known. Add it to the report for the reviewer (`ops/reviews/`) — the video may need fixing. |
| **thanks** | "This saved me!" | Short thanks; optionally one related video link (our own). |
| **request** | "Can you do Bali?" | Thank; note it for the weekly plan (`ops/plans/`). |
| **sensitive** | eligibility, refusals, legal/medical/tax advice, personal data in the comment | No advice beyond what the official source says; point to the official site/embassy. If they posted personal data (passport no., phone), suggest they delete it. |
| **spam/abuse** | links to other sites, insults, scams | No reply. List it so the owner can remove it in Studio. |

## 3. Write the reply
- Language of the comment. Plain, warm, short: 2–4 sentences, max 600 characters.
- Start with the answer to their exact question. Use what they told about themselves ("since you travel with kids…").
- Facts only from the video, its source file, or an official page; if unsure, say so and point to the official site.
- Links: at most one per reply. Only links from `upload/offers.json` (with the disclosure line from that file) or our own
  videos. Never the same offer twice in a row on one video; at most 1 in 3 replies on a video may contain an offer link.
- Never pretend to be a person who bought the product; never invent discounts, prices or stock. "Discount" only if the
  offer entry says so.
- No personal data, no promises the channel cannot keep.

## 4. Approval and posting (current rule: owner approves every reply)
Write `ops/comments/replies-<date>.json`:
`{ "replies": [ { "n": 1, "channel": "ko", "videoId": "...", "commentId": "...", "type": "advice", "comment": "...", "reply": "...", "offer": "airalo-esim" | null, "approved": false } ] }`
Show them in the daily report as a numbered list (comment → proposed reply). When the owner answers e.g. "댓글 1,3 승인" or
"댓글 전부 승인", set `"approved": true` on those, commit, and run the `comments` workflow with `mode=post` and that file.
The script refuses replies that are too long, have >1 link, a link not in offers.json, or an affiliate link without disclosure.

Later (only if the owner says so): auto-post `thanks` and `question` replies without links; keep `advice` (links) on approval.

## 5. Feed back
- `problem` comments → reviewer fixes the definition before the next build.
- `request` and repeated `question` comments → weekly planner (new videos, FAQ lines in descriptions, pinned-comment text).
- Count per week: comments, replies, offer links given (for the report).

## Limits
Pinning a comment is not possible through the API — propose pinned-comment text; the owner or the Mac pins it in Studio.
Replying needs the `youtube.force-ssl` permission on the channel token (`comments` workflow `mode=scopes` shows it).
