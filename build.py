"""Rebuilds index.html from src/: template + word data + page head."""
from pathlib import Path
src = Path(__file__).parent / "src"
page = (src / "template.html").read_text(encoding="utf-8").replace("__DATA__", (src / "words.json").read_text(encoding="utf-8")).replace("__PRIVATE__", (src / "private.json").read_text(encoding="utf-8"))
extra = {}
for f in sorted((src / "extra").glob("*.json")) if (src / "extra").exists() else []:
    [extra.setdefault(k, {}).update(v) for k, v in __import__("json").loads(f.read_text(encoding="utf-8")).items()]
page = page.replace("/*__AMIRAM_JS__*/", (src / "amiram.js").read_text(encoding="utf-8"))
(Path(__file__).parent / "amiram.json").write_text((src / "amiram.json").read_text(encoding="utf-8"), encoding="utf-8")
page = page.replace("__EXTRA__", __import__("json").dumps(extra, ensure_ascii=False, separators=(",", ":")))
i = page.index('<div class="app"')
out = (src / "head.html").read_text(encoding="utf-8") + page[:i] + "</head>\n<body>\n" + page[i:] + "\n</body>\n</html>\n"
(Path(__file__).parent / "index.html").write_text(out, encoding="utf-8")
print("index.html rebuilt")
