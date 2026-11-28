# YouTube autopilot (starter kit)

Read `PLAYBOOK.md` first and follow it. It is the manual for turning one idea into a channel that makes,
checks, uploads and reports videos every day. The engine is in `youtube-forms/`; GitHub Actions workflows are in `.github/workflows/`.

Keep the owner's dated instructions and decisions in `youtube-forms/ops/OWNER-RULES.md`. Every role reads it before any work;
it overrides other guides. Append every new owner instruction or decision there (dated) in the same session.

Always:
- The owner may not be a developer. Report in the owner's language, in plain words, short. Give direct links for anything they must click.
- Never print, commit or screenshot secrets (tokens, keys, passwords). Never ask the owner to paste a secret into the chat; they put it in GitHub → Settings → Secrets.
- Recordings use fictional sample data only, and never press Submit/Pay or solve a CAPTCHA.
- Facts in videos come from official sources; anything unconfirmed stays out of the narration.
- Outward actions (publishing changes to existing videos, comment replies, emails, spending money) need the owner's approval first,
  unless the owner has explicitly delegated that kind of action.
- Keep costs low: reuse cached voice clips, stop at once on a daily quota or spend-cap error (no retry loops), respect the
  monthly image cap, and skip runs that have nothing to make.
- Illustrated formats: the art never contains text (the code draws all words); a person reviews the art before it is committed.
- Compare format experiments at equal video age (day 1/3/7/14), not on the same calendar date.
- Avoid mass-produced signals: fewer uploads, varied thumbnails, no same video re-uploaded per language (use auto dubbing).
  Grow for free by recombining existing material (quiz Shorts, compilations, listening videos), each adding something new.
