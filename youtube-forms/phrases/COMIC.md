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

## Rules for new episodes
- `comic.cast` stays the same across a series; set `"castFrom": "jp-restaurant"` so the new episode reuses that character sheet.
- Each phrase has a `scene` (what is happening, who is where) and `bubble` (`tl`). The traveler is always on the left
  and the staff on the right, so the bubbles point at the right person.
- Pictures contain no text at all; every word on screen is drawn by the code, so spelling is always right.
- Review every panel before committing: the same faces and clothes, no garbled writing, the gesture matches the phrase,
  and the bubble corner is empty.
