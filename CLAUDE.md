# English dictionary site

`index.html` is generated. Edit files in `src/`, then run `python3 build.py`, commit and push to `main` (Netlify deploys from it).

- `src/template.html` – the app (HTML/CSS/JS); `__DATA__` is replaced with `src/words.json`.
- Words: `[english, [hebrew…], level 1–10, example sentence]`. Groups are 50 words per level, in file order.
- Each entry in the Hebrew list is one meaning. A line from the original dictionary stays as written (commas kept); separate dictionary lines with the same meaning are joined with " / ". Entries naming several English forms (e.g. "know, knew") keep one meaning per form.
- Quiz: one input line per meaning, multi-select options (one option per meaning plus one similar-looking wrong meaning), score per meaning, then the user marks "ידעתי / לא ידעתי".
- Per-word "know" state lives in localStorage `dictKnow` and syncs via Firestore (project `english-dictionary-452b4`, collection `dictionary`, one fixed document `d-kZzMHDu3fpCjwyFCqiU9ys` for all devices; sync merges by timestamps).
- Voice mode (mic button in the quiz): reads the word and options aloud (en-US / he-IL speech synthesis) and listens with Web Speech recognition in Hebrew; commands: numbers / option text, "ידעתי", "לא ידעתי", "חזור", "עצור".
