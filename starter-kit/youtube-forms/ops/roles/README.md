# Roles

Two roles run as separate scheduled sessions, each starting fresh (no memory of how a video was written),
so their checks are independent. Everything else stays in the daily pipeline and the daily report.

| Role | When | Guide | Writes |
|---|---|---|---|
| Reviewer (검수) | daily, before the night build | `reviewer.md` | `ops/reviews/<date>.md` |
| Planner (기획·분석) | weekly, Monday | `planner.md` | `ops/plans/<yyyy-Www>.md` |
| Comments (댓글) | daily, in the daily report | `comments.md` | `ops/comments/replies-<date>.md/json` |

The daily report (in the owner's main conversation) reads the latest review and plan and passes on what matters.

Shared rules (also in the root `CLAUDE.md`): the owner reads Korean, plain words. Never print or commit secrets.
Recordings use fictional data and never press Submit/Pay. Outward actions need the owner's approval, except what
each role guide explicitly allows.
