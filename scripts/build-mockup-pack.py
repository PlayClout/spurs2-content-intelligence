#!/usr/bin/env python3
"""Build ONE self-contained review file with every Spurs² mockup inside it.

  python3 scripts/build-mockup-pack.py  ->  out/Spurs2-mockups.html

Each mockup is a complete standalone page (images, CSS, data inlined) stored base64 inside the pack and opened in a
frame on demand, so the pack needs no internet, no server and no other files. Sources:
  sketches/001-producer-saas/producer-mockup-standalone.html   (producer desk direction, Oct 22)
  sketches/library-page/a-collections-rail/standalone.html     (Library page, variant A)
  sketches/library-page/b-search-first/standalone.html         (Library page, variant B)
"""
import base64, datetime, html, json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SK = ROOT / "sketches"

# refresh the Library standalone files from their sources first (shared.css/js + inventory are inlined)
lib = SK / "library-page"
css, js, inv = (lib / "shared.css").read_text(), (lib / "shared.js").read_text(), (lib / "inventory.js").read_text()
for v in ["a-collections-rail", "b-search-first"]:
    s = (lib / v / "index.html").read_text()
    s = s.replace('<link rel="stylesheet" href="../shared.css">', f"<style>\n{css}\n</style>")
    s = s.replace('<script src="../inventory.js"></script>', f"<script>\n{inv}\n</script>")
    s = s.replace('<script src="../shared.js"></script>', f"<script>\n{js}\n</script>")
    assert "../shared" not in s and "../inventory" not in s, v
    (lib / v / "standalone.html").write_text(s)

MOCKS = [
    {
        "id": "library-a", "group": "Library page (new, needs your pick)", "title": "A · Collections rail",
        "file": lib / "a-collections-rail/standalone.html", "status": "Pick A or B",
        "about": "Browse first. ScorePlay's collections down the left (Match, Around the match, Creative, Photos), every asset in a grid, TwelveLabs search in the top bar. Each card has Make clip.",
        "try": ["Click a collection in the second column (e.g. Press Conference, Match photos).",
                "Type “Solanke goal” in the search box and press Enter: each result opens at the moment, not the start of the file.",
                "Click any card to open its details, then Make clip.",
                "Click the club name (top left) to switch to San Antonio Spurs. Live match disappears from the menu: San Antonio has no full match."],
    },
    {
        "id": "library-b", "group": "Library page (new, needs your pick)", "title": "B · Search first",
        "file": lib / "b-search-first/standalone.html", "status": "Pick A or B",
        "about": "Ask, don't browse. A big “Describe the moment you want…” box with suggested searches; collections drop to a few tabs underneath.",
        "try": ["Click a suggested search under the box (e.g. “De Zerbi press conference”).",
                "Use the tabs (Match, Around the match, Creative, Photos) to browse instead.",
                "Click any card, then Make clip.",
                "Click the club name (top left) to switch clubs."],
    },
    {
        "id": "producer", "group": "Earlier direction (built since)", "title": "Producer desk · Oct 22",
        "file": SK / "001-producer-saas/producer-mockup-standalone.html", "status": "Reference: now built",
        "about": "The clean SaaS producer desk we agreed on Oct 22: Inbox, Approved, Published, Montages, Settings. The real app is built from this; included for reference only.",
        "try": ["Use the left menu inside the mockup to move between Inbox, Approved, Published, Montages and Settings.",
                "Click a clip in the Inbox list to see the preview and the reasons it was suggested."],
    },
]

for m in MOCKS:
    if not m["file"].exists():
        sys.exit(f"missing mockup: {m['file']}")
    m["b64"] = base64.b64encode(m["file"].read_bytes()).decode()
    m["kb"] = round(m["file"].stat().st_size / 1024)

commit = subprocess.run(["git", "-C", str(ROOT), "log", "-1", "--format=%h"], capture_output=True, text=True).stdout.strip()
built = datetime.datetime.now().strftime("%-d %b %Y")
nav, groups = [], []
for m in MOCKS:
    if m["group"] not in groups:
        groups.append(m["group"])
for g in groups:
    nav.append(f'<p class="grp">{html.escape(g)}</p>')
    for m in [x for x in MOCKS if x["group"] == g]:
        i = MOCKS.index(m) + 1
        nav.append(f'<button class="item" data-id="{m["id"]}"><span class="k">{i}</span><span class="t">{html.escape(m["title"])}'
                   f'<small>{html.escape(m["status"])}</small></span></button>')
cards = "".join(
    f'<li><button class="card" data-id="{m["id"]}"><b>{MOCKS.index(m) + 1} · {html.escape(m["title"])}</b>'
    f'<span class="st">{html.escape(m["status"])}</span><span>{html.escape(m["about"])}</span></button></li>' for m in MOCKS)
meta = json.dumps([{k: m[k] for k in ("id", "title", "about", "try", "status")} for m in MOCKS])
data = "\n".join(f'<script type="application/octet-stream" id="b64-{m["id"]}">{m["b64"]}</script>' for m in MOCKS)

page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Spurs² · Mockups for review</title>
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif;background:#f6f7f9;color:#111827;font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased}}
button{{font:inherit;color:inherit}}
.app{{display:grid;grid-template-columns:264px 1fr;height:100vh}}
aside{{background:#fff;border-right:1px solid #e5e7eb;display:flex;flex-direction:column;padding:16px 12px;overflow:auto}}
.brand{{padding:2px 8px 14px;border-bottom:1px solid #e5e7eb;margin-bottom:8px}}
.brand b{{display:block;font-size:15px}} .brand small{{color:#6b7280;font-size:12px}}
.grp{{padding:14px 8px 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#9ca3af}}
.item{{display:flex;gap:10px;align-items:flex-start;width:100%;border:0;background:none;text-align:left;border-radius:8px;padding:8px;cursor:pointer}}
.item:hover{{background:#f3f4f6}} .item.on{{background:#eef3ff;color:#1d4ed8}}
.item .k{{flex:none;width:22px;height:22px;border-radius:6px;background:#f3f4f6;color:#4b5563;display:grid;place-items:center;font-size:12px;font-weight:700}}
.item.on .k{{background:#2e6cff;color:#fff}}
.item .t{{font-weight:600;font-size:13.5px}} .item small{{display:block;font-weight:500;font-size:11.5px;color:#6b7280}}
.home{{margin-top:auto;border:1px solid #e5e7eb;background:#fff;border-radius:8px;padding:8px 10px;cursor:pointer;font-weight:600;font-size:13px;text-align:left}}
.home:hover{{background:#f9fafb}}
.foot{{font-size:11px;color:#9ca3af;padding:10px 8px 0}}
main{{display:flex;flex-direction:column;min-width:0;min-height:0}}
.bar{{display:flex;align-items:center;gap:12px;background:#fff;border-bottom:1px solid #e5e7eb;padding:10px 16px;min-height:56px}}
.bar h1{{font-size:15px;font-weight:650}} .bar p{{font-size:12.5px;color:#4b5563;flex:1;min-width:0}}
.bar .nav{{display:flex;gap:6px;flex:none}}
.btn{{border:1px solid #d1d5db;background:#fff;border-radius:7px;height:32px;padding:0 12px;font-weight:600;font-size:13px;cursor:pointer;white-space:nowrap}}
.btn:hover{{background:#f9fafb}} .btn:disabled{{opacity:.4;cursor:default}}
.tryb{{background:#fffbeb;border-bottom:1px solid #fde68a;padding:8px 16px;font-size:12.5px;color:#78350f;display:flex;gap:8px;align-items:flex-start}}
.tryb ol{{display:flex;flex-wrap:wrap;gap:4px 18px;padding-left:16px}}
.stage{{flex:1;min-height:0;position:relative;background:#e5e7eb}}
iframe{{position:absolute;inset:0;width:100%;height:100%;border:0;background:#fff}}
.welcome{{overflow:auto;padding:36px 44px;max-width:900px}}
.welcome h2{{font-size:24px;letter-spacing:-.02em;margin-bottom:6px}} .welcome .lead{{color:#4b5563;margin-bottom:22px}}
.welcome h3{{font-size:14px;margin:22px 0 8px}}
.steps{{display:grid;gap:8px;padding-left:20px}} .steps li{{padding-left:2px}}
kbd{{font:600 12px/1 ui-monospace,Menlo,monospace;background:#fff;border:1px solid #d1d5db;border-bottom-width:2px;border-radius:4px;padding:2px 6px}}
.cards{{list-style:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}}
.card{{width:100%;height:100%;text-align:left;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px;cursor:pointer;display:grid;gap:6px;align-content:start}}
.card:hover{{border-color:#2e6cff;box-shadow:0 2px 10px rgba(16,24,40,.08)}}
.card b{{font-size:14px}} .card span{{font-size:12.5px;color:#4b5563}}
.card .st{{justify-self:start;background:#eef3ff;color:#1d4ed8;border-radius:999px;padding:0 8px;font-size:11.5px;font-weight:600}}
.note{{margin-top:22px;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:12px}}
</style></head>
<body>
<div class="app">
  <aside>
    <div class="brand"><b>Spurs² · Mockups</b><small>Spursx2 AI · for review · {built}</small></div>
    {''.join(nav)}
    <button class="home" id="home">How to use this file</button>
    <p class="foot">{len(MOCKS)} mockups · works offline · repo {commit}</p>
  </aside>
  <main>
    <div class="bar" id="bar" hidden>
      <h1 id="btitle"></h1><p id="babout"></p>
      <div class="nav"><button class="btn" id="prev">← Previous</button><button class="btn" id="next">Next →</button><button class="btn" id="full" title="Fill the window">Full screen</button></div>
    </div>
    <div class="tryb" id="tryb" hidden><b>Try:</b><ol id="try"></ol></div>
    <div class="stage" id="stage">
      <section class="welcome" id="welcome">
        <h2>Spurs² mockups</h2>
        <p class="lead">Every mockup in one file. No internet, no install, no login: it opens in any web browser.</p>
        <h3>Open it</h3>
        <ol class="steps">
          <li><b>Download</b> the attachment (in Gmail, use the download arrow, not the preview: the preview can't run the mockups).</li>
          <li><b>Double-click</b> <code>Spurs2-mockups.html</code>. It opens in Chrome, Safari or Edge.</li>
          <li>If your Mac asks which app to use, pick your browser.</li>
        </ol>
        <h3>Move around</h3>
        <ol class="steps">
          <li>Pick a mockup from the <b>left menu</b>, or click a card below.</li>
          <li><b>Previous / Next</b> (top right), or the <kbd>←</kbd> <kbd>→</kbd> keys, step through them in order. Keys <kbd>1</kbd>–<kbd>{len(MOCKS)}</kbd> jump straight to one.</li>
          <li>Each mockup is clickable. The yellow <b>Try</b> strip under the title lists what to click.</li>
          <li><b>Full screen</b> hides this frame; press <kbd>Esc</kbd> to come back.</li>
        </ol>
        <h3>The mockups</h3>
        <ul class="cards">{cards}</ul>
        <h3>What I need from you</h3>
        <p>For the Library page, <b>A or B</b> (or "A with B's search box"). The producer desk mockup is included for reference only; it is already built.</p>
        <p class="note">Data in the Library mockups is real: Tottenham's and San Antonio's actual ScorePlay collections (names, lengths, photographer captions) and real TwelveLabs results for the suggested searches. Thumbnails are placeholders; the built page uses ScorePlay's own thumbnails. Nothing in this file publishes or changes anything.</p>
      </section>
    </div>
  </main>
</div>
{data}
<script>
const META = {meta};
const urls = {{}};
const $ = (id) => document.getElementById(id);
let cur = null;
function docUrl(id) {{
  if (!urls[id]) {{
    const bin = atob($("b64-" + id).textContent.trim());
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    urls[id] = URL.createObjectURL(new Blob([bytes], {{ type: "text/html" }}));
  }}
  return urls[id];
}}
function show(id) {{
  cur = id;
  document.querySelectorAll(".item").forEach((b) => b.classList.toggle("on", b.dataset.id === id));
  const stage = $("stage");
  if (!id) {{
    $("bar").hidden = true; $("tryb").hidden = true;
    stage.innerHTML = ""; stage.appendChild(welcome); history.replaceState(null, "", "#");
    return;
  }}
  const m = META.find((x) => x.id === id), i = META.indexOf(m);
  $("bar").hidden = false; $("tryb").hidden = false;
  $("btitle").textContent = (i + 1) + " · " + m.title;
  $("babout").textContent = m.about;
  $("try").innerHTML = m.try.map((t) => "<li>" + t.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</li>").join("");
  $("prev").disabled = i === 0; $("next").disabled = i === META.length - 1;
  stage.innerHTML = "";
  const f = document.createElement("iframe");
  f.title = m.title; f.src = docUrl(id);
  stage.appendChild(f);
  history.replaceState(null, "", "#" + id);
}}
const welcome = $("welcome");
const step = (d) => {{ const i = META.findIndex((x) => x.id === cur); const j = Math.max(0, Math.min(META.length - 1, i + d)); show(META[cur ? j : 0].id); }};
document.addEventListener("click", (e) => {{
  const t = e.target.closest("[data-id]"); if (t) show(t.dataset.id);
}});
$("home").onclick = () => show(null);
$("prev").onclick = () => step(-1);
$("next").onclick = () => step(1);
$("full").onclick = () => $("stage").requestFullscreen?.();
document.addEventListener("keydown", (e) => {{
  if (e.target.closest("input,textarea,select")) return;
  if (e.key === "ArrowRight") step(1);
  else if (e.key === "ArrowLeft") step(-1);
  else if (/^[1-9]$/.test(e.key) && META[+e.key - 1]) show(META[+e.key - 1].id);
}});
const start = location.hash.slice(1);
show(META.some((m) => m.id === start) ? start : null);
</script>
</body></html>
"""
out = ROOT / "out" / "Spurs2-mockups.html"
out.parent.mkdir(exist_ok=True)
out.write_text(page)
print(out, f"{out.stat().st_size / 1024 / 1024:.1f} MB", "|", ", ".join(f"{m['title']} ({m['kb']} KB)" for m in MOCKS))
