# English dictionary site

`index.html` is generated. Edit files in `src/`, then run `python3 build.py`.

## Weekly word lists (the user sends one every week)
Append a new entry to `src/lists.json` → `lists`: `{"date": "YYYY-MM-DD", "words": [[english, hebrew], ...]}`.
- A word whose English text matches a dictionary word in `src/words.json` exactly (case-insensitive) is shown as "יודעת" in its group. Nothing else changes; it still appears in quizzes.
- Any other word goes into the "המילים שלי" group automatically. For every such new word, add a short, simple English example sentence to `sentences` (key = the English word exactly as written).
- Don't edit `src/words.json` for weekly lists.
Then run `python3 build.py`, commit and push to `main`. Tell the user which words matched and which were added.
