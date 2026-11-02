/* =========================================================
   카드뉴스 엔진 — 규칙 검사 · 렌더 · 넘침 검사
   studio.html(수동)과 render.html(자동 스크립트)이 함께 씀
   ========================================================= */
(() => {
  const R = window.CARD_RULES;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const plain = (s) => String(s).replace(/\[\[|\]\]/g, "");
  const len = (s) => [...plain(s)].length;
  const hlCount = (s) => (String(s).match(/\[\[[^\[\]]+\]\]/g) || []).length;
  const rich = (s, cls) => esc(s).replace(/\[\[([^\[\]]+)\]\]/g, `<span class="${cls}">$1</span>`);
  const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

  /* ---------- 1. 내용 규칙 검사 ---------- */
  function validate(d) {
    const E = [];
    const err = (path, msg) => E.push(`${path}: ${msg}`);

    const keysExact = (obj, path, keys) => {
      if (!isObj(obj)) return err(path, "객체여야 함"), false;
      Object.keys(obj).forEach((k) => { if (!keys.includes(k)) err(`${path}.${k}`, "정의되지 않은 항목 (삭제할 것)"); });
      keys.forEach((k) => { if (!(k in obj)) err(`${path}.${k}`, "필수 항목 누락"); });
      return true;
    };

    // 텍스트 한 칸 검사
    const text = (v, path, max, hl = R.highlight.elsewhere, allowQuotes = false) => {
      if (typeof v !== "string") return err(path, "문자열이어야 함");
      if (!plain(v).trim()) return err(path, "비어 있음");
      const n = len(v);
      if (n > max) err(path, `${n}자 → 최대 ${max}자 (공백 포함, ${n - max}자 줄일 것)`);
      const opens = (v.match(/\[\[/g) || []).length, closes = (v.match(/\]\]/g) || []).length;
      if (opens !== closes) err(path, "[[ ]] 짝이 맞지 않음");
      const h = hlCount(v);
      if (h < hl[0] || h > hl[1]) err(path, hl[1] === 0 ? "이 칸은 [[형광펜]] 금지" : `[[형광펜]]은 ${hl[0]}~${hl[1]}개 (현재 ${h}개)`);
      if (!allowQuotes && /[“”]/.test(v)) err(path, "따옴표 “ ” 금지 (2p 제목 따옴표는 자동으로 붙음)");
      R.bannedWords.forEach((w) => { if (plain(v).includes(w)) err(path, `금지어 "${w}"`); });
      R.bannedPatterns.forEach((p) => { if (p.re.test(plain(v))) err(path, p.msg); });
      return h;
    };
    const arr = (v, path, min, max) => {
      if (!Array.isArray(v)) return err(path, "배열이어야 함"), false;
      if (v.length < min || v.length > max) err(path, min === max ? `정확히 ${min}개여야 함 (현재 ${v.length}개)` : `${min}~${max}개여야 함 (현재 ${v.length}개)`);
      return true;
    };

    if (!keysExact(d, "최상위", ["meta", "cover", "detail", "summary"])) return E;

    // meta
    const m = d.meta;
    if (keysExact(m, "meta", ["product", "status", "date", "sources"])) {
      text(m.product, "meta.product", R.len.product);
      if (!R.enums.status.includes(m.status)) err("meta.status", `"${m.status}" 불가 → ${R.enums.status.join(" / ")} 중 하나`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(m.date || "") || isNaN(Date.parse(m.date))) err("meta.date", "YYYY-MM-DD 형식");
      if (arr(m.sources, "meta.sources", R.count.sourcesMin, R.count.sourcesMax)) {
        m.sources.forEach((s, i) => {
          const p = `meta.sources[${i}]`;
          if (!keysExact(s, p, ["name", "url"])) return;
          text(s.name, `${p}.name`, R.len.sourceName);
          if (!/^https?:\/\/\S+$/.test(s.url || "")) err(`${p}.url`, "http(s)로 시작하는 실제 주소");
        });
      }
    }

    // cover (예시 1: 3~4줄 흰 제목, 따옴표 한 쌍까지)
    const c = d.cover;
    if (keysExact(c, "cover", ["title", "imageBrief"])) {
      text(c.imageBrief, "cover.imageBrief", R.len.imageBrief);
      if (arr(c.title, "cover.title", R.count.titleLinesMin, R.count.titleLinesMax)) {
        c.title.forEach((t, i) => text(t, `cover.title[${i}]`, R.len.titleLine, R.highlight.title, true));
        const all = c.title.join("\n");
        const o = (all.match(/“/g) || []).length, cl = (all.match(/”/g) || []).length;
        if (o > 1 || cl > 1 || o !== cl) err("cover.title", "따옴표는 “ ” 한 쌍만 (여는 것·닫는 것 각 1개)");
        if (o === 1 && cl === 1) {
          const oi = c.title.findIndex((l) => l.includes("“")), ci = c.title.findIndex((l) => l.includes("”"));
          if (!c.title[oi].startsWith("“")) err(`cover.title[${oi}]`, "여는 따옴표 “는 줄 맨 앞에");
          if (!c.title[ci].endsWith("”")) err(`cover.title[${ci}]`, "닫는 따옴표 ”는 줄 맨 끝에");
          if (ci < oi) err("cover.title", "닫는 따옴표가 여는 따옴표보다 앞에 있음");
        }
        if ((all.match(/\?/g) || []).length > 1) err("cover.title", "물음표는 최대 1개");
        if (/[.]$/m.test(all)) err("cover.title", "제목 줄 끝 마침표 금지");
        if (isObj(m) && m.status && m.status !== "공식" && !R.rumorWords.some((w) => all.includes(w)))
          err("cover.title", `${m.status} 기사는 제목에 ${R.rumorWords.join("/")} 중 하나를 넣을 것`);
      }
    }

    // detail (예시 2)
    const t = d.detail;
    if (keysExact(t, "detail", ["headline", "paras", "conclusion"])) {
      text(t.headline, "detail.headline", R.len.headline, R.highlight.headline);
      if (arr(t.paras, "detail.paras", R.count.paras, R.count.paras))
        t.paras.forEach((p, i) => text(p, `detail.paras[${i}]`, R.len.para, R.highlight.para));
      text(t.conclusion, "detail.conclusion", R.len.conclusion);
    }

    // summary
    const s = d.summary;
    if (keysExact(s, "summary", ["headline", "compareWith", "rows", "cons", "conclusion"])) {
      text(s.headline, "summary.headline", R.len.headline, R.highlight.headline);
      text(s.compareWith, "summary.compareWith", R.len.compareWith);
      if (isObj(m) && plain(s.compareWith || "") === plain(m.product || "")) err("summary.compareWith", "비교 대상이 이번 제품과 같음");
      if (arr(s.rows, "summary.rows", R.count.rows, R.count.rows)) {
        s.rows.forEach((r, i) => {
          const p = `summary.rows[${i}]`;
          if (!keysExact(r, p, ["item", "prev", "next"])) return;
          text(r.item, `${p}.item`, R.len.rowItem);
          text(r.prev, `${p}.prev`, R.len.rowValue);
          text(r.next, `${p}.next`, R.len.rowValue);
        });
      }
      if (arr(s.cons, "summary.cons", R.count.cons, R.count.cons)) s.cons.forEach((x, i) => text(x, `summary.cons[${i}]`, R.len.con));
      text(s.conclusion, "summary.conclusion", R.len.conclusion);
    }
    return E;
  }

  /* ---------- 2. 렌더 ---------- */
  // focus: { x: 0~100, y: 0~100, zoom: 100~200 } — 1p 사진에서 보여줄 위치
  const photoStyle = (f = {}) => {
    const x = f.x ?? 50, y = f.y ?? 40, z = (f.zoom ?? 100) / 100;
    return `object-position:${x}% ${y}%;transform:scale(${z});transform-origin:${x}% ${y}%`;
  };

  // 3장의 카드 HTML 배열을 돌려줌. imgs: { cover, bg } (data URL)
  function render(d, imgs = {}, focus = {}) {
    const g = (o, k, def = "") => (isObj(o) && o[k] != null ? o[k] : def);
    const list = (v) => (Array.isArray(v) ? v : []);
    const c = g(d, "cover", {}), t = g(d, "detail", {}), s = g(d, "summary", {}), m = g(d, "meta", {});
    const bg = imgs.bg || imgs.cover;
    const bgLayer = `${bg ? `<img class="c-bgphoto" src="${bg}" alt="">` : ""}<div class="c-bgtint"></div>`;
    const handle = `<div class="c-handle">${esc(R.handle)}</div>`;
    const src = list(m.sources).map((x) => plain(g(x, "name"))).filter(Boolean);
    const srcLine = `출처: ${src[0] || ""}${src.length > 1 ? ` 외 ${src.length - 1}곳` : ""} · ${String(g(m, "date")).replace(/-/g, ".")} 기준`;

    const p1 = `
      <div class="card p1">
        ${imgs.cover ? `<img class="c-photo" src="${imgs.cover}" style="${photoStyle(focus)}" alt="">` : `<div class="c-placeholder">커버 사진을 넣어주세요</div>`}
        <div class="c-scrim"></div>
        <div class="c-logo">${esc(R.brand)}</div>
        <div class="c-body" data-check="1p 제목">
          ${list(c.title).map((l, i) => `<div class="c-title-line" data-check-x="1p 제목 ${i + 1}줄">${esc(plain(l))}</div>`).join("")}
        </div>
      </div>`;

    const p2 = `
      <div class="card p2">
        ${bgLayer}
        <div class="c-body center" data-check="2p 본문">
          <div class="c-num">1.</div>
          <h2 class="c-headline">“${rich(g(t, "headline"), "mk")}”</h2>
          ${list(t.paras).map((p) => `<p class="c-para">${rich(p, "mk")}</p>`).join("")}
          <p class="c-conclusion"><span class="mk">${esc(plain(g(t, "conclusion")))}</span></p>
        </div>
        ${handle}
      </div>`;

    const p3 = `
      <div class="card p3">
        ${bgLayer}
        <div class="c-body center" data-check="3p 본문">
          <div class="c-num">2.</div>
          <h2 class="c-headline">${rich(g(s, "headline"), "mk")}</h2>
          <div class="c-compare">
            ${list(s.rows).map((r, i) => {
              const same = plain(g(r, "prev")) === plain(g(r, "next"));
              return `<div>
                <div class="c-row-item">${esc(plain(g(r, "item")))}</div>
                <div class="c-row-val" data-check-x="3p 비교 ${i + 1}행"><span class="c-prev">${esc(plain(g(r, "prev")))}</span><span class="c-arrow">→</span>${same ? `<span>${esc(plain(g(r, "next")))} (동일)</span>` : `<span class="mk">${esc(plain(g(r, "next")))}</span>`}</div>
              </div>`;
            }).join("")}
          </div>
          <div class="c-cons-label">아쉬운 점</div>
          <ul class="c-cons">${list(s.cons).map((x) => `<li>${esc(plain(x))}</li>`).join("")}</ul>
          <p class="c-conclusion"><span class="mk">${esc(plain(g(s, "conclusion")))}</span></p>
        </div>
        <div class="c-source" data-check-x="3p 출처">${esc(srcLine)}</div>
        ${handle}
      </div>`;

    return [p1, p2, p3];
  }

  /* ---------- 3. 디자인 넘침 검사 (글자 수가 맞아도 실제로 넘치면 막음) ---------- */
  function checkOverflow(root, hasCover) {
    const E = [];
    root.querySelectorAll("[data-check]").forEach((el) => {
      if (el.scrollHeight > el.clientHeight + 1) E.push(`${el.dataset.check}: 내용이 카드 밖으로 넘침 (${el.scrollHeight - el.clientHeight}px) → 문장을 줄일 것`);
    });
    root.querySelectorAll("[data-check-x]").forEach((el) => {
      if (el.scrollWidth > el.clientWidth + 1) E.push(`${el.dataset.checkX}: 가로로 넘침 → 더 짧게 쓸 것`);
    });
    if (!hasCover) E.push("1p 커버 사진이 없음 (사진을 넣어주세요)");
    return E;
  }

  window.CardEngine = { validate, render, checkOverflow, photoStyle, plain };
})();
