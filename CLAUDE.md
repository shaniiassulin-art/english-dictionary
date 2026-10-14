# English dictionary site

`index.html` is generated. Edit files in `src/`, then run `python3 build.py`, commit and push to `main` (Netlify deploys from it).

- `src/template.html` – the app (HTML/CSS/JS); `__DATA__` is replaced with `src/words.json`.
- Words: `[english, [hebrew…], level 1–10, example sentence]`. Groups are 50 words per level, in file order.
- Quiz: one input line per meaning (Hebrew split on `,` `;` `/` outside parentheses), multi-select options, score per meaning, then the user marks "ידעתי / לא ידעתי".
- Per-word "know" state lives in localStorage `dictKnow` and syncs via Firestore (project `english-dictionary-452b4`, collection `dictionary`).
