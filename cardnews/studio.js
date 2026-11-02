/* =========================================================
   카드뉴스 스튜디오: JSON 검사 → 렌더 → 넘침 검사 → PNG 저장
   ========================================================= */
(() => {
  const R = window.CARD_RULES;
  const $ = (id) => document.getElementById(id);
  const state = { data: null, img1: null, img2: null, errors: [] };
  const STORE_KEY = "cardnews.json";

  /* ---------- 유틸 ---------- */
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
    const text = (v, path, max, hl = R.highlight.elsewhere) => {
      if (typeof v !== "string") return err(path, "문자열이어야 함");
      if (!plain(v).trim()) return err(path, "비어 있음");
      const n = len(v);
      if (n > max) err(path, `${n}자 → 최대 ${max}자 (공백 포함, ${n - max}자 줄일 것)`);
      const opens = (v.match(/\[\[/g) || []).length, closes = (v.match(/\]\]/g) || []).length;
      if (opens !== closes) err(path, "[[ ]] 짝이 맞지 않음");
      const h = hlCount(v);
      if (h < hl[0] || h > hl[1]) err(path, hl[1] === 0 ? "이 칸은 [[강조]] 금지" : `[[강조]]는 ${hl[0]}~${hl[1]}개 (현재 ${h}개)`);
      R.bannedWords.forEach((w) => { if (plain(v).includes(w)) err(path, `금지어 "${w}"`); });
      R.bannedPatterns.forEach((p) => { if (p.re.test(plain(v))) err(path, p.msg); });
      return h;
    };
    const arr = (v, path, min, max) => {
      if (!Array.isArray(v)) return err(path, "배열이어야 함"), false;
      if (v.length < min || v.length > max) err(path, min === max ? `정확히 ${min}개여야 함 (현재 ${v.length}개)` : `${min}~${max}개여야 함 (현재 ${v.length}개)`);
      return true;
    };
    const oneOf = (v, path, list) => { if (!list.includes(v)) err(path, `"${v}" 불가 → ${list.join(" / ")} 중 하나`); };

    if (!keysExact(d, "최상위", ["meta", "cover", "detail", "summary"])) return E;

    // meta
    const m = d.meta;
    if (keysExact(m, "meta", ["product", "status", "date", "sources"])) {
      text(m.product, "meta.product", R.len.product);
      oneOf(m.status, "meta.status", R.enums.status);
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

    // cover
    const c = d.cover;
    if (keysExact(c, "cover", ["tag", "kicker", "title", "imageBrief"])) {
      oneOf(c.tag, "cover.tag", R.enums.tag);
      if (isObj(m) && m.status && m.status !== "공식" && c.tag !== m.status) err("cover.tag", `meta.status가 "${m.status}"이면 태그도 "${m.status}"여야 함`);
      if (isObj(m) && m.status === "공식" && R.rumorTags.includes(c.tag)) err("cover.tag", `공식 발표인데 "${c.tag}" 태그 사용 불가`);
      text(c.kicker, "cover.kicker", R.len.kicker);
      text(c.imageBrief, "cover.imageBrief", R.len.imageBrief);
      if (arr(c.title, "cover.title", R.count.titleLinesMin, R.count.titleLinesMax)) {
        let total = 0;
        c.title.forEach((t, i) => { total += text(t, `cover.title[${i}]`, R.len.titleLine, [0, 1]) || 0; });
        if (total !== R.highlight.title[0]) err("cover.title", `제목 전체에서 [[강조]]는 정확히 1개 (현재 ${total}개)`);
        const q = c.title.join("").split("?").length - 1;
        if (q > 1) err("cover.title", "물음표는 최대 1개");
      }
    }

    // detail
    const t = d.detail;
    if (keysExact(t, "detail", ["headline", "lead", "points"])) {
      text(t.headline, "detail.headline", R.len.detailHeadline, R.highlight.detailHeadline);
      text(t.lead, "detail.lead", R.len.lead);
      if (arr(t.points, "detail.points", R.count.points, R.count.points)) {
        let total = 0;
        t.points.forEach((p, i) => {
          const path = `detail.points[${i}]`;
          if (!keysExact(p, path, ["label", "text"])) return;
          text(p.label, `${path}.label`, R.len.pointLabel);
          total += text(p.text, `${path}.text`, R.len.pointText, [0, 1]) || 0;
        });
        const [a, b] = R.highlight.pointsTotal;
        if (total < a || total > b) err("detail.points", `포인트 3개 합쳐 [[강조]]는 최대 ${b}개 (현재 ${total}개)`);
      }
    }

    // summary
    const s = d.summary;
    if (keysExact(s, "summary", ["headline", "compareWith", "rows", "cons", "verdict"])) {
      text(s.headline, "summary.headline", R.len.summaryHeadline);
      text(s.compareWith, "summary.compareWith", R.len.compareWith);
      if (isObj(m) && plain(s.compareWith || "") === plain(m.product || "")) err("summary.compareWith", "비교 대상이 이번 제품과 같음");
      if (arr(s.rows, "summary.rows", R.count.rows, R.count.rows)) {
        s.rows.forEach((r, i) => {
          const p = `summary.rows[${i}]`;
          if (!keysExact(r, p, ["item", "prev", "next", "change"])) return;
          text(r.item, `${p}.item`, R.len.rowItem);
          text(r.prev, `${p}.prev`, R.len.rowValue);
          text(r.next, `${p}.next`, R.len.rowValue);
          oneOf(r.change, `${p}.change`, R.enums.change);
          if (r.prev === r.next && r.change !== "same") err(`${p}.change`, "이전·이번 값이 같으면 same");
          if (r.prev !== r.next && r.change === "same") err(`${p}.change`, "값이 다른데 same 사용 불가");
          if (r.change === "new" && r.prev !== "없음") err(`${p}.prev`, 'change가 new면 prev는 "없음"');
        });
      }
      if (arr(s.cons, "summary.cons", R.count.cons, R.count.cons)) s.cons.forEach((x, i) => text(x, `summary.cons[${i}]`, R.len.con));
      text(s.verdict, "summary.verdict", R.len.verdict, R.highlight.verdict);
    }
    return E;
  }

  /* ---------- 2. 렌더 ---------- */
  const PAGE = (n) => `<span class="c-page"><b>0${n}</b> / 03</span>`;
  const top = (n) => `<div class="c-top"><span class="c-brand">${esc(R.brand)}</span>${PAGE(n)}</div>`;
  const foot = (d) => {
    const src = (d.meta.sources || []).map((x) => plain(x.name)).filter(Boolean);
    const label = src.length ? `출처: ${src[0]}${src.length > 1 ? ` 외 ${src.length - 1}곳` : ""}` : "";
    return `<div class="c-foot"><span>${esc(label)}</span><span>${esc((d.meta.date || "").replace(/-/g, "."))} 기준 · ${esc(R.handle)}</span></div>`;
  };
  const photoStyle = () => {
    const x = $("fx").value, y = $("fy").value, z = $("fz").value / 100;
    return `object-position:${x}% ${y}%;transform:scale(${z});transform-origin:${x}% ${y}%`;
  };

  function render(d) {
    const g = (o, k, def = "") => (isObj(o) && o[k] != null ? o[k] : def);
    const c = g(d, "cover", {}), t = g(d, "detail", {}), s = g(d, "summary", {}), m = g(d, "meta", {});
    const safe = { meta: m };
    const tag = String(g(c, "tag"));
    const bg2 = state.img2 || state.img1;

    const p1 = `
      <div class="card p1">
        ${state.img1 ? `<img class="c-photo" src="${state.img1}" style="${photoStyle()}" alt="">` : `<div class="c-placeholder">커버 사진을 넣어주세요</div>`}
        <div class="c-scrim"></div>
        ${top(1)}
        <div class="c-body" data-check="1p 본문">
          <div class="c-tagrow">
            <span class="c-tag ${R.rumorTags.includes(tag) ? "is-rumor" : ""}">${esc(tag)}</span>
            <span class="c-kicker">${rich(g(c, "kicker"), "hl-color")}</span>
          </div>
          <div class="c-title">
            ${(Array.isArray(c.title) ? c.title : []).map((l, i) => `<div class="c-title-line" data-check-x="1p 제목 ${i + 1}줄">${rich(l, "hl-color")}</div>`).join("")}
          </div>
        </div>
        <div class="c-swipe">넘겨서 확인 <i></i></div>
      </div>`;

    const p2 = `
      <div class="card p2">
        ${bg2 ? `<img class="c-bgphoto" src="${bg2}" alt="">` : ""}
        <div class="c-bgtint"></div>
        ${top(2)}
        <div class="c-body" data-check="2p 본문">
          <div class="c-label">핵심 내용</div>
          <h2 class="c-headline">${rich(g(t, "headline"), "hl-mark")}</h2>
          <p class="c-lead">${rich(g(t, "lead"), "hl-color")}</p>
          <div class="c-points">
            ${(Array.isArray(t.points) ? t.points : []).map((p, i) => `
              <div class="c-point">
                <span class="c-num">0${i + 1}</span>
                <div><div class="c-plabel">${rich(g(p, "label"), "hl-color")}</div><div class="c-ptext">${rich(g(p, "text"), "hl-color")}</div></div>
              </div>`).join("")}
          </div>
        </div>
        ${foot(safe)}
      </div>`;

    const BADGE = { up: "▲ 개선", down: "▼ 아쉬움", same: "동일", new: "NEW" }; // 소비자 입장 기준
    const p3 = `
      <div class="card p3">
        ${top(3)}
        <div class="c-body" data-check="3p 본문">
          <div class="c-label">정리</div>
          <h2 class="c-headline">${rich(g(s, "headline"), "hl-color")}</h2>
          <div class="c-table">
            <div class="c-tr head"><div>항목</div><div>${rich(g(s, "compareWith"), "")}</div><div>${rich(g(m, "product"), "")}</div></div>
            ${(Array.isArray(s.rows) ? s.rows : []).map((r) => `
              <div class="c-tr">
                <div class="c-item">${rich(g(r, "item"), "")}</div>
                <div class="c-prev">${rich(g(r, "prev"), "")}</div>
                <div class="c-next">${rich(g(r, "next"), "")}${BADGE[r && r.change] ? `<span class="c-badge ${r.change}">${BADGE[r.change]}</span>` : ""}</div>
              </div>`).join("")}
          </div>
          <div class="c-cons-label">아쉬운 점</div>
          <ul class="c-cons">${(Array.isArray(s.cons) ? s.cons : []).map((x) => `<li>${rich(x, "")}</li>`).join("")}</ul>
          <div class="c-verdict"><small>한줄 정리</small><p>${rich(g(s, "verdict"), "hl-color")}</p></div>
        </div>
        ${foot(safe)}
      </div>`;

    $("deck").innerHTML = [p1, p2, p3].map((h) => `<div class="frame">${h}</div>`).join("");
    $("brief").textContent = c.imageBrief ? `찾을 사진: ${c.imageBrief}` : "사진 가이드가 여기에 표시됩니다.";
  }

  /* ---------- 3. 디자인 넘침 검사 (글자 수가 맞아도 실제로 넘치면 막음) ---------- */
  function checkOverflow() {
    const E = [];
    document.querySelectorAll("[data-check]").forEach((el) => {
      if (el.scrollHeight > el.clientHeight + 1) E.push(`${el.dataset.check}: 내용이 카드 밖으로 넘침 (${el.scrollHeight - el.clientHeight}px) → 문장을 줄일 것`);
    });
    document.querySelectorAll("[data-check-x]").forEach((el) => {
      if (el.scrollWidth > el.clientWidth + 1) E.push(`${el.dataset.checkX}: 가로로 넘침 → 더 짧은 단어로 바꿀 것`);
    });
    document.querySelectorAll(".c-tr .c-next, .c-tr .c-prev").forEach((el) => {
      if (el.offsetHeight > 92) E.push(`3p 비교표 "${el.textContent.trim().slice(0, 12)}": 두 줄로 넘어감 → 값을 줄일 것`);
    });
    if (!state.img1) E.push("1p 커버 사진이 없음 (사진을 넣어주세요)");
    return E;
  }

  /* ---------- 상태 표시 ---------- */
  function showStatus() {
    const box = $("status");
    if (!state.errors.length) {
      box.className = "status ok";
      box.textContent = "모든 규칙 통과. 저장할 수 있습니다.";
    } else {
      box.className = "status bad";
      box.innerHTML = `규칙 위반 ${state.errors.length}건<ul>${state.errors.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>`;
    }
    $("export").disabled = state.errors.length > 0;
  }

  async function run() {
    let d;
    const raw = $("json").value.trim().replace(/^```(json)?\s*|\s*```$/g, "");
    try { d = JSON.parse(raw); } catch (e) {
      state.errors = [`JSON 형식 오류: ${e.message} (설명 문장 없이 JSON만 받아야 함)`];
      return showStatus();
    }
    try { localStorage.setItem(STORE_KEY, raw); } catch (_) {}
    state.data = d;
    const contentErrors = validate(d);
    render(d);
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll("#deck img")].map((i) => i.decode().catch(() => {})));
    state.errors = [...contentErrors, ...checkOverflow()];
    showStatus();
  }

  /* ---------- 사진 ---------- */
  const readImg = (input, key) => input.addEventListener("change", () => {
    const f = input.files[0]; if (!f) return;
    const fr = new FileReader();
    fr.onload = () => { state[key] = fr.result; run(); };
    fr.readAsDataURL(f);
  });
  readImg($("img1"), "img1");
  readImg($("img2"), "img2");
  ["fx", "fy", "fz"].forEach((id) => $(id).addEventListener("input", () => {
    const img = document.querySelector(".p1 .c-photo"); if (img) img.setAttribute("style", photoStyle());
  }));

  /* ---------- 저장 ---------- */
  $("export").addEventListener("click", async () => {
    const btn = $("export");
    btn.disabled = true; btn.textContent = "저장 중…";
    try {
      const slug = plain(state.data.meta.product).replace(/\s+/g, "");
      const cards = document.querySelectorAll("#deck .card");
      for (let i = 0; i < cards.length; i++) {
        const blob = await htmlToImage.toBlob(cards[i], { width: 1080, height: 1350, pixelRatio: 1, style: { transform: "none" } });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${state.data.meta.date}_${slug}_${i + 1}.png`;
        document.body.appendChild(a); a.click(); a.remove();
        await new Promise((r) => setTimeout(r, 400)); // 연속 다운로드 차단 방지
      }
    } catch (e) { alert("저장 실패: " + e.message); }
    btn.textContent = "PNG 3장 저장"; btn.disabled = state.errors.length > 0;
  });

  /* ---------- 수정 프롬프트 ---------- */
  $("copyFix").addEventListener("click", async () => {
    const msg = `아래 JSON이 카드뉴스 규칙 검사에서 탈락했어. 위반 항목만 고쳐서 JSON 전체를 다시 출력해. 설명·인사·코드블록 없이 JSON만. 위반 안 한 칸은 한 글자도 바꾸지 마.\n\n[위반 목록]\n${state.errors.map((e) => "- " + e).join("\n")}\n\n[현재 JSON]\n${$("json").value.trim()}`;
    try { await navigator.clipboard.writeText(msg); $("copyFix").textContent = "복사됨"; }
    catch (_) { prompt("복사해서 AI에게 보내세요", msg); }
    setTimeout(() => ($("copyFix").textContent = "수정 프롬프트 복사"), 1500);
  });

  /* ---------- 시작 ---------- */
  $("apply").addEventListener("click", run);
  $("loadSample").addEventListener("click", () => {
    $("json").value = JSON.stringify(window.CARD_SAMPLE, null, 2);
    run();
  });
  try { const saved = localStorage.getItem(STORE_KEY); if (saved) { $("json").value = saved; run(); } } catch (_) {}
})();
