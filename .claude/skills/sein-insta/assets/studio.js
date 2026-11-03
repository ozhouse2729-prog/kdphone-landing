/* =========================================================
   새인 인스타 스튜디오 (수동 모드): JSON 붙여넣기 → 검사 → PNG 저장
   검사·렌더 로직은 engine.js (자동 스크립트와 동일)
   ========================================================= */
(() => {
  const E = window.CardEngine;
  const $ = (id) => document.getElementById(id);
  const state = { data: null, cover: null, bg: null, errors: [] };
  const STORE_KEY = "sein-insta.json";
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const focus = () => ({ x: +$("fx").value, y: +$("fy").value, zoom: +$("fz").value });

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
      state.errors = [`JSON 형식 오류: ${e.message}`];
      return showStatus();
    }
    try { localStorage.setItem(STORE_KEY, raw); } catch (_) {}
    state.data = d;
    const contentErrors = E.validate(d);
    $("deck").innerHTML = E.render(d, { cover: state.cover, bg: state.bg }, focus()).map((h) => `<div class="frame">${h}</div>`).join("");
    $("brief").textContent = d?.cover?.imageBrief ? `찾을 사진: ${d.cover.imageBrief}` : "사진 가이드가 여기에 표시됩니다.";
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll("#deck img")].map((i) => i.decode().catch(() => {})));
    state.errors = [...contentErrors, ...E.checkOverflow($("deck"), !!state.cover)];
    showStatus();
  }

  /* 사진 */
  const readImg = (input, key) => input.addEventListener("change", () => {
    const f = input.files[0]; if (!f) return;
    const fr = new FileReader();
    fr.onload = () => { state[key] = fr.result; run(); };
    fr.readAsDataURL(f);
  });
  readImg($("img1"), "cover");
  readImg($("img2"), "bg");
  ["fx", "fy", "fz"].forEach((id) => $(id).addEventListener("input", () => {
    const img = document.querySelector(".p1 .c-photo"); if (img) img.setAttribute("style", E.photoStyle(focus()));
  }));

  /* 저장 */
  $("export").addEventListener("click", async () => {
    const btn = $("export");
    btn.disabled = true; btn.textContent = "저장 중…";
    try {
      const slug = E.plain(state.data.meta.product).replace(/\s+/g, "");
      const cards = document.querySelectorAll("#deck .card");
      for (let i = 0; i < cards.length; i++) {
        const blob = await htmlToImage.toBlob(cards[i], { width: 1080, height: 1350, pixelRatio: 1, style: { transform: "none" }, fontEmbedCSS: window.CARD_FONT_CSS });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${state.data.meta.date}_${slug}_${i + 1}.png`;
        document.body.appendChild(a); a.click(); a.remove();
        await new Promise((r) => setTimeout(r, 400)); // 연속 다운로드 차단 방지
      }
    } catch (e) { alert("저장 실패: " + e.message); }
    btn.textContent = "PNG 3장 저장"; btn.disabled = state.errors.length > 0;
  });

  /* 수정 요청 문구 */
  $("copyFix").addEventListener("click", async () => {
    const msg = `아래 카드 JSON이 규칙 검사에서 탈락했어. 위반 항목만 고쳐서 JSON 전체를 다시 줘. 위반 안 한 칸은 한 글자도 바꾸지 마.\n\n[위반 목록]\n${state.errors.map((e) => "- " + e).join("\n")}\n\n[현재 JSON]\n${$("json").value.trim()}`;
    try { await navigator.clipboard.writeText(msg); $("copyFix").textContent = "복사됨"; }
    catch (_) { prompt("복사해서 AI에게 보내세요", msg); }
    setTimeout(() => ($("copyFix").textContent = "수정 프롬프트 복사"), 1500);
  });

  /* 시작 */
  $("apply").addEventListener("click", run);
  $("loadSample").addEventListener("click", () => { $("json").value = JSON.stringify(window.CARD_SAMPLE, null, 2); run(); });

  const preset = window.CARD_PRESET; // 스킬이 만든 preset.js: { data, cover, bg, focus }
  if (preset) {
    $("json").value = JSON.stringify(preset.data, null, 2);
    state.cover = preset.cover || null; state.bg = preset.bg || null;
    if (preset.focus) { $("fx").value = preset.focus.x ?? 50; $("fy").value = preset.focus.y ?? 40; $("fz").value = preset.focus.zoom ?? 100; }
    run();
  } else {
    try { const saved = localStorage.getItem(STORE_KEY); if (saved) { $("json").value = saved; run(); } } catch (_) {}
  }
})();
