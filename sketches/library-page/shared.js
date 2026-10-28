// Library page mockup behaviour. Data = the REAL ScorePlay inventory + REAL TwelveLabs hits for the sample queries
// (sketches/library-page/inventory.js, names/durations/captions only, no media). Thumbnails are placeholder tiles:
// the real page uses ScorePlay's own thumbnail_url for each asset.
(() => {
  const INV = window.INVENTORY, HITS = window.SAMPLE_SEARCH, V = window.VARIANT;
  const CLUBS = {
    "tottenham-hotspur": { league: "Premier League", crest: "#132257", tile: ["#132257", "#24366f"], queries: Object.keys(HITS["tottenham-hotspur"]), index: "premiere-league index · 58 videos" },
    "san-antonio-spurs": { league: "NBA", crest: "#111111", tile: ["#1f2328", "#4b5563"], queries: Object.keys(HITS["san-antonio-spurs"]), index: "club-san-antonio-spurs index · 68 videos" },
  };
  const GROUP = { "Full Match": "Match", Moments: "Match", Highlights: "Match", "Pre-Match": "Around the match", "Post-Match": "Around the match", "Press Conference": "Around the match", "Creative Video": "Creative", Match: "Photos", "Dressing Room": "Photos", "Raw Footage": "Game footage", "Social Edits": "Club posts", Photos: "Photos" };
  const PHOTO_LABEL = { Match: "Match photos", "Dressing Room": "Dressing room photos", Photos: "Photos" };
  const state = { club: "tottenham-hotspur", col: null, kind: "all", query: "", selected: null, made: new Set() };
  const $ = (id) => document.getElementById(id);
  const fmt = (s) => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return h ? `${h}:${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}` : `${m}:${String(x).padStart(2, "0")}`; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const tidy = (n) => n.replace(/\.(mp4|mov|MOV)$/, "").replace(/_/g, " ");
  const toast = (t) => { const el = $("toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 2600); };

  const club = () => INV[state.club];
  const cols = () => club().collections.flatMap((c) => {
    const out = [];
    if (c.videos.length) out.push({ key: `${c.id}:v`, name: c.name, kind: "video", items: c.videos.map((v) => ({ ...v, kind: "video", col: c.name })) });
    if (c.photos.length) out.push({ key: `${c.id}:p`, name: c.videos.length ? `${c.name} photos` : (PHOTO_LABEL[c.name] ?? c.name), kind: "photo", items: c.photos.map((p) => ({ ...p, kind: "photo", col: c.name })) });
    return out;
  });
  const allItems = () => cols().flatMap((c) => c.items);
  const searchable = (it) => it.kind === "video" ? it.indexed : true;

  function tile(it, big = false, win) {
    const [a, b] = CLUBS[state.club].tile;
    const glyph = it.kind === "photo" ? "▣" : "▶";
    const badge = win ? `<span class="win">${fmt(win.start)}–${fmt(win.end)}</span>` : "";
    const dur = it.kind === "video" ? `<span class="dur">${fmt(it.dur)}</span>` : `<span class="dur">Photo</span>`;
    return `<div class="thumb${big ? " big" : ""}" style="background:linear-gradient(135deg,${a},${b})"><span class="glyph">${glyph}</span>${badge}${dur}</div>`;
  }
  function card(it, win) {
    const id = win ? `${it.id}@${win.start}` : `${it.id}`;
    const title = it.kind === "photo" ? (it.caption || "Untitled photo") : tidy(it.name);
    const status = it.kind === "video"
      ? (it.indexed ? `<span class="pill tone-blue">Searchable</span>` : `<span class="pill tone-gray" title="Not in this club's TwelveLabs index yet">Not indexed</span>`)
      : `<span class="pill tone-gray">Caption</span>`;
    const made = state.made.has(id);
    const canMake = it.kind === "photo" || it.indexed;
    const sub = win ? `${esc(it.col)} · hit #${win.rank}` : esc(it.col);
    return `<article class="card${state.selected === id ? " sel" : ""}" data-id="${esc(id)}">
      ${tile(it, false, win)}
      <div class="meta"><div class="name" title="${esc(title)}">${esc(title)}</div>
        <div class="row">${status}<span class="src">${sub}</span></div>
        <div class="mk">${made ? `<button class="btn sm done" disabled>✓ In inbox</button>`
          : canMake ? `<button class="btn sm primary" data-make="${esc(id)}">Make clip</button>`
          : `<button class="btn sm" data-index="${esc(id)}" title="Add to this club's TwelveLabs index so it can be searched and clipped">Index</button>`}</div>
      </div></article>`;
  }

  function renderSide() {
    const c = CLUBS[state.club];
    $("crest").style.background = c.crest;
    $("orgName").textContent = club().label;
    $("orgLeague").textContent = c.league;
    $("indexPill").textContent = `TwelveLabs: ${c.index}`;
    $("q").placeholder = V === "rail" ? `Search this club's footage: “${c.queries[0]}”, “${c.queries[2]}”…` : "Describe the moment you want…";
    document.querySelectorAll("[data-only]").forEach((el) => { el.style.display = el.dataset.only === state.club ? "" : "none"; });
  }
  function renderCollections() {
    const list = cols();
    const total = allItems().length;
    if (V === "rail") {
      let html = `<button class="col${state.col === null ? " on" : ""}" data-col=""><span class="tl"></span>Everything<span class="n">${total}</span></button>`;
      let last = "";
      for (const c of list) {
        const g = GROUP[c.name.replace(/ photos$/, "")] ?? (c.kind === "photo" ? "Photos" : "Other");
        if (g !== last) { html += `<p class="railGroup">${g}</p>`; last = g; }
        const idx = c.items.filter(searchable).length;
        html += `<button class="col${state.col === c.key ? " on" : ""}" data-col="${c.key}" title="${idx}/${c.items.length} searchable"><span class="tl${idx ? "" : " off"}"></span>${esc(c.name)}<span class="n">${c.items.length}</span></button>`;
      }
      $("rail").innerHTML = html;
    } else {
      // tabs = the GROUPS (Match, Around the match, Creative, Photos...), not every collection: a dozen tabs crowd the row
      const groups = [];
      for (const c of list) {
        const g = GROUP[c.name.replace(/ photos$/, "")] ?? (c.kind === "photo" ? "Photos" : "Other");
        const k = c.kind === "photo" ? "Photos" : g;
        let x = groups.find((y) => y.name === k);
        if (!x) groups.push(x = { name: k, keys: [], n: 0 });
        x.keys.push(c.key); x.n += c.items.length;
      }
      state.groups = groups;
      $("tabs").innerHTML = `<button class="tab${state.col === null ? " on" : ""}" data-col="">Everything<span class="n">${total}</span></button>` +
        groups.map((g) => `<button class="tab${state.col === `g:${g.name}` ? " on" : ""}" data-col="g:${esc(g.name)}">${esc(g.name)}<span class="n">${g.n}</span></button>`).join("");
      $("chips").innerHTML = `<span class="sub" style="align-self:center;margin-right:4px">Try</span>` + CLUBS[state.club].queries.map((q) => `<button class="chip" data-q="${esc(q)}">${esc(q)}</button>`).join("");
    }
  }
  function renderGrid() {
    const grid = $("grid");
    if (state.query) {
      const hits = (HITS[state.club][state.query] ?? []);
      const items = allItems();
      const rows = hits.map((h) => ({ it: items.find((x) => x.id === h.id && x.kind === "video"), h })).filter((r) => r.it && (state.kind !== "photo"));
      $("title").textContent = `“${state.query}”`;
      $("subtitle").innerHTML = rows.length
        ? `${rows.length} moments from TwelveLabs across this club's indexed footage · each opens at the moment, not the start of the file`
        : `No sample results recorded for this query in the mockup (the real page searches live).`;
      grid.innerHTML = rows.length
        ? rows.map(({ it, h }) => card(it, h)).join("")
        : `<div class="empty">In the real page this runs a live TwelveLabs search. The mockup only has results for the suggested queries.</div>`;
      $("more").innerHTML = `<span class="hitsHead"><a data-clear>← Back to ${state.col ? "the collection" : "everything"}</a></span>`;
      return;
    }
    const pick = () => {
      if (!state.col) return { name: "Everything", items: allItems() };
      if (state.col.startsWith("g:")) {
        const g = (state.groups ?? []).find((x) => `g:${x.name}` === state.col);
        const sub = cols().filter((c) => g?.keys.includes(c.key));
        return { name: g?.name ?? "Everything", items: sub.flatMap((c) => c.items), parts: sub.map((c) => `${c.name} ${c.items.length}`).join(" · ") };
      }
      const c = cols().find((x) => x.key === state.col);
      return { name: c.name, items: c.items };
    };
    const view = pick();
    let items = view.items;
    if (state.kind !== "all") items = items.filter((x) => x.kind === state.kind);
    $("title").textContent = view.name;
    const nv = items.filter((x) => x.kind === "video").length, np = items.filter((x) => x.kind === "photo").length;
    const nidx = items.filter((x) => x.kind === "video" && x.indexed).length;
    $("subtitle").textContent = (view.parts ? `${view.parts} · ` : "") + [nv && `${nv} videos (${nidx} searchable)`, np && `${np} photos`].filter(Boolean).join(" · ") + ` · from ScorePlay`;
    const SHOW = 48;
    grid.innerHTML = items.length ? items.slice(0, SHOW).map((it) => card(it)).join("") : `<div class="empty">Nothing of this type in this collection.</div>`;
    $("more").textContent = items.length > SHOW ? `Showing ${SHOW} of ${items.length} · scroll loads more` : "";
  }
  function openDrawer(id) {
    state.selected = id;
    const [mid, at] = id.split("@");
    const it = allItems().find((x) => String(x.id) === mid);
    const hit = at && (HITS[state.club][state.query] ?? []).find((h) => String(h.id) === mid && String(h.start) === at);
    $("drawer").hidden = false;
    $("dThumb").outerHTML = tile(it, true, hit).replace('class="thumb big"', 'class="thumb big" id="dThumb"');
    $("dKicker").textContent = `${it.col} · ScorePlay ${it.id}`;
    $("dTitle").textContent = it.kind === "photo" ? (it.caption || "Untitled photo") : tidy(it.name);
    const facts = it.kind === "photo"
      ? [["Type", "Photo"], ["Named from", "The photographer's caption"], ["Rights", "Checked on Make clip"]]
      : [["Type", "Video"], ["Length", fmt(it.dur)], ["TwelveLabs", it.indexed ? "Indexed, searchable" : "Not indexed"], ["Rights", "Checked on Make clip"]];
    if (hit) facts.splice(2, 0, ["Moment", `${fmt(hit.start)}–${fmt(hit.end)} (search hit #${hit.rank})`]);
    $("dFacts").innerHTML = facts.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("");
    if (it.kind === "video") {
      const s = hit ? hit.start : 0, e = hit ? hit.end : Math.min(it.dur, 15);
      const L = Math.max(it.dur, e, 1);
      $("dTrim").innerHTML = `<div class="trimLabel"><span>Clip window</span><span>${fmt(s)}–${fmt(e)} of ${fmt(it.dur)}</span></div>
        <div class="bar"><div class="sel" style="left:${(s / L) * 100}%;width:${Math.max(2, ((e - s) / L) * 100)}%"></div></div>
        <p class="note" style="margin-top:6px">${hit ? "Starts at the search hit. Pegasus tightens it to the play." : "No search yet: Pegasus finds the best moment in the first window."} Drag to adjust.</p>`;
    } else $("dTrim").innerHTML = "";
    const canMake = it.kind === "photo" || it.indexed;
    const b = $("dMake");
    b.disabled = !canMake || state.made.has(id);
    b.textContent = state.made.has(id) ? "✓ In the inbox" : canMake ? "Make clip" : "Index first to clip";
    b.className = state.made.has(id) ? "btn wide done" : "btn primary wide";
    b.dataset.make = id;
    renderGrid();
  }
  function make(id) {
    if (state.made.has(id)) return;
    state.made.add(id);
    toast("Queued: Pegasus is checking the moment. The draft lands in the Inbox in about 30 seconds.");
    if (state.selected === id) openDrawer(id); else renderGrid();
  }
  function render() { renderSide(); renderCollections(); renderGrid(); }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-make],[data-index],[data-col],[data-q],[data-clear],.card,#closeDrawer,#org,.seg button");
    if (!t) return;
    if (t.dataset.make !== undefined) { e.stopPropagation(); make(t.dataset.make); return; }
    if (t.dataset.index !== undefined) { e.stopPropagation(); toast("Indexing in TwelveLabs (a few minutes). It becomes searchable and clippable here when ready."); return; }
    if (t.dataset.col !== undefined) { state.col = t.dataset.col || null; state.query = ""; $("q").value = ""; render(); return; }
    if (t.dataset.q !== undefined) { state.query = t.dataset.q; $("q").value = t.dataset.q; renderGrid(); return; }
    if (t.dataset.clear !== undefined) { state.query = ""; $("q").value = ""; renderGrid(); return; }
    if (t.id === "closeDrawer") { $("drawer").hidden = true; state.selected = null; renderGrid(); return; }
    if (t.id === "org") { state.club = state.club === "tottenham-hotspur" ? "san-antonio-spurs" : "tottenham-hotspur"; Object.assign(state, { col: null, query: "", selected: null }); $("q").value = ""; $("drawer").hidden = true; render(); return; }
    if (t.matches(".seg button")) { state.kind = t.dataset.kind; document.querySelectorAll(".seg button").forEach((b) => b.classList.toggle("on", b === t)); renderGrid(); return; }
    if (t.classList.contains("card")) openDrawer(t.dataset.id);
  });
  $("dMake").addEventListener("click", (e) => make(e.currentTarget.dataset.make));
  $("searchForm").addEventListener("submit", (e) => { e.preventDefault(); const q = $("q").value.trim(); const known = CLUBS[state.club].queries.find((x) => x.toLowerCase() === q.toLowerCase()); state.query = known ?? q; renderGrid(); });
  render();
})();
