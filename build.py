"""Rebuilds index.html from src/: template + word data + page head."""
from pathlib import Path
src = Path(__file__).parent / "src"
page = (src / "template.html").read_text(encoding="utf-8").replace("__DATA__", (src / "words.json").read_text(encoding="utf-8"))
extra = {}
for f in sorted((src / "extra").glob("*.json")) if (src / "extra").exists() else []:
    extra.update(__import__("json").loads(f.read_text(encoding="utf-8")))
page = page.replace("__EXTRA__", __import__("json").dumps(extra, ensure_ascii=False, separators=(",", ":")))
i = page.index('<div class="app"')
out = (src / "head.html").read_text(encoding="utf-8") + page[:i] + "</head>\n<body>\n" + page[i:] + "\n</body>\n</html>\n"
(Path(__file__).parent / "index.html").write_text(out, encoding="utf-8")
print("index.html rebuilt")
