# Comic phrase episodes (만화 회화)

One episode = one short story told in 8–9 panels (one panel per phrase), with recurring characters.
Art: `node upload/comic-art.js phrases/<id>.json` (workflow `comic-art`) → review on the `art-output` branch →
commit to `phrases/art/<id>/`. Video: `phrases.js` switches to the comic layout automatically when every panel exists.

## Why it is built this way
Learning (education research):
- **Picture + words together (dual coding).** A scene is easier to recall than a list. The phrase is attached to a moment.
- **Guess first (pretesting).** Each scene starts with an empty "?" bubble and a 1.6 s pause before the answer.
  Even a wrong guess makes the answer stick better.
- **Text where the eye is (contiguity, signalling).** The Japanese is in the speaker's bubble on the picture.
  The reading is in the same bubble, and the meaning is in the colour bar.
- **Small steps (segmenting).** One scene = situation → answer → slow → repeat pause → one tip.
- **Recall round (retrieval practice).** At the end, each picture comes back with an empty bubble and 3 seconds to say it,
  then the answer. Testing beats re-reading.
- **Story and characters.** The same people move through a real sequence (enter → order → pay → leave), so the order
  itself is a memory aid. The staff's line (`hear`) appears in their own bubble, so viewers learn what they will *hear* too.

YouTube (retention and series):
- **Hook in the first seconds.** Open on the full page of empty bubbles with a promise: "끝나면 그림만 보고 말할 수 있어요".
- **Open loops keep people watching.** The quiz beat in every scene and the recall round at the end give viewers a reason to stay.
  The recall round is also a natural chapter.
- **Comments.** The outro asks "몇 개 맞혔는지 댓글로". Shorts are quizzes ("일본어로 뭐라고 할까요?").
- **Series habit.** The same characters (지우·민준) in every episode make a binge path: restaurant → convenience store → transport → hotel.
  Thumbnails show a panel with a filled bubble.

## Decisions
- **Style B, ink diary-toon (owner, 2026-11-28).** The owner found the first art "too AI-looking" and chose B out of three
  hand-drawn options (watercolour picture book / ink diary-toon / coloured pencil). Every episode uses the same
  `comic.style` text as `jp-restaurant.json`: black ink lines, three flat colours (warm grey, mustard, indigo) on off-white
  paper, one wide panel per image. Copy it unchanged.
- **Pro model, one panel per image.** `comic-art.js` draws each panel with `gemini-3-pro-image-preview` and the cast
  sheet as reference. Tested on 2026-11-28: `--page` (whole episode as one image, ~1/10 the cost) and the flash model
  both put text in speech bubbles, let the characters drift between panels and gave flatter art. They stay as test
  options only (`--page`, `--model`).
- **Image budget.** Images are, with the voice, the only cost (OWNER-RULES 6c, 80,000 KRW a month). Every image made is
  counted in `plan/image-usage.json`; at `imageMonthlyCap` (200 a month) the script stops and the owner is asked. A spend-cap
  error stops the run at once. Redraw only the panels that failed review (`--only 3,5`), never the whole episode.

## Rules for new episodes
- `comic.cast` stays the same across a series; set `"castFrom": "jp-restaurant"` so the new episode reuses that character
  sheet (`phrases/art/jp-restaurant/cast.jpg`) instead of drawing a new one.
- Each phrase has a `scene` (what is happening, who is where) and `bubble` (`tl`). The traveler is always on the left
  and the staff on the right (`comic.layout`), so the bubbles point at the right person.
- `comic.setting` describes the place with pictogram-only signs. `comic.staffIcon` sets the emoji in the staff bubble per
  place (🚉 station, 🛎 hotel, 🛂 airport …; default 👩‍🍳).
- Pictures contain no text at all; every word on screen is drawn by the code, so spelling is always right.
- **English edition**: `<id>-en.json` with `"lang": "en"`, `"channel": "en"` and `"comic": {"artFrom": "<id>", …}` reuses the
  Korean edition's panels (no new images). `pron` is romaji and the `ko` field holds the English meaning. Titles and spoken
  lines are English; the Japanese is identical to the Korean edition. Compare it with the same rules as the Korean edition.
- The nightly build makes a comic episode only when every panel is committed; until then it logs `waiting for art`.

## Art review checklist (before committing, see `ops/roles/reviewer.md` 1b)
- The same faces, hair and clothes as the cast sheet in every panel.
- No text, letters, numbers, signs with writing or fake Japanese anywhere.
- The gesture matches the line (pointing, paying, bowing …).
- Traveler left, staff right.
- No uniforms, logos or colours that look like a real brand or chain.
- The bubble corner is calm and empty.
