#!/usr/bin/env node
/* =========================================================
   새인 인스타 렌더러
   카드 JSON + 사진 → 규칙 검사 → 통과하면 PNG 3장 (1080×1350)

   사용:
     node render.js --data card.json --cover cover.jpg --out ./out
   옵션:
     --bg 사진        2p·3p 배경 (없으면 커버 사진을 어둡게)
     --x 0~100        1p 사진 좌우 위치 (기본 50)
     --y 0~100        1p 사진 상하 위치 (기본 40)
     --zoom 100~200   1p 사진 확대 (기본 100)
     --preview        위반이 있어도 미리보기 PNG 생성 (파일명 _preview)
     --studio         브라우저 없이 수동 스튜디오 폴더 생성 (사용자가 열어서 저장)
   결과: 표준출력에 JSON { ok, errors, files, ... }
   종료 코드: 0 통과 / 2 규칙 위반 / 1 실행 오류
   ========================================================= */
const fs = require("fs");
const path = require("path");

const ASSETS = path.resolve(__dirname, "../assets");
const args = process.argv.slice(2);
const opt = (k, def) => { const i = args.indexOf(`--${k}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : def; };
const flag = (k) => args.includes(`--${k}`);
const out = (o, code) => { console.log(JSON.stringify(o, null, 2)); process.exit(code); };

const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif" };
const toDataUrl = (p) => {
  if (!p) return null;
  if (!fs.existsSync(p)) out({ ok: false, error: `사진 파일 없음: ${p}` }, 1);
  const mime = MIME[path.extname(p).toLowerCase()];
  if (!mime) out({ ok: false, error: `지원하지 않는 사진 형식: ${p} (jpg/png/webp)` }, 1);
  return `data:${mime};base64,${fs.readFileSync(p).toString("base64")}`;
};

(async () => {
  const dataPath = opt("data");
  if (!dataPath) out({ ok: false, error: "--data card.json 이 필요합니다" }, 1);
  let data;
  try { data = JSON.parse(fs.readFileSync(dataPath, "utf8")); }
  catch (e) { out({ ok: false, error: `JSON 읽기 실패: ${e.message}` }, 1); }

  const imgs = { cover: toDataUrl(opt("cover")), bg: toDataUrl(opt("bg")) };
  const focus = { x: +opt("x", 50), y: +opt("y", 40), zoom: +opt("zoom", 100) };
  const outDir = path.resolve(opt("out", "./sein-insta-out"));
  fs.mkdirSync(outDir, { recursive: true });

  /* 브라우저가 없을 때: 수동 스튜디오 폴더를 만들어 사용자에게 넘김 */
  if (flag("studio")) {
    const dir = path.join(outDir, "studio");
    fs.cpSync(ASSETS, dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "preset.js"), `window.CARD_PRESET = ${JSON.stringify({ data, ...imgs, focus })};\n`);
    out({ ok: true, studio: path.join(dir, "studio.html"), note: "studio 폴더째 사용자에게 전달 → studio.html 열기 → PNG 3장 저장" }, 0);
  }

  let chromium;
  for (const mod of ["playwright", "playwright-core"]) { try { ({ chromium } = require(mod)); break; } catch (_) {} }
  if (!chromium) out({ ok: false, error: "playwright 없음. `npm i playwright && npx playwright install chromium` 후 재시도하거나 --studio 로 수동 스튜디오를 만드세요." }, 1);

  let browser;
  try {
    try { browser = await chromium.launch(); }
    catch (_) { browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); }
  } catch (e) { out({ ok: false, error: `브라우저 실행 실패: ${e.message.split("\n")[0]} (--studio 로 대체 가능)` }, 1); }

  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
    await page.goto("file://" + path.join(ASSETS, "render.html"));
    const { errors, fontOk } = await page.evaluate(([d, i, f]) => window.runCards(d, i, f), [data, imgs, focus]);
    const passed = errors.length === 0;

    const files = [];
    if (passed || flag("preview")) {
      const slug = String(data?.meta?.product || "card").replace(/\[\[|\]\]/g, "").replace(/[\\/:*?"<>|\s]+/g, "");
      const date = data?.meta?.date || "date";
      const cards = await page.$$(".card");
      for (let n = 0; n < cards.length; n++) {
        const file = path.join(outDir, `${date}_${slug}_${n + 1}${passed ? "" : "_preview"}.png`);
        await cards[n].screenshot({ path: file });
        files.push(file);
      }
    }
    await browser.close();
    const res = { ok: passed, errors, files };
    if (!fontOk) res.warning = "카드 폰트(ONE Mobile Title·RIDIBatang) 로딩 실패. 결과물 글꼴이 다를 수 있음";
    out(res, passed ? 0 : 2);
  } catch (e) {
    await browser.close();
    out({ ok: false, error: e.message.split("\n")[0] }, 1);
  }
})();
