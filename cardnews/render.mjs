// 카드뉴스 렌더러: projects/<이름>/slides.json → output/<이름>/01.png ...
// 사용법: node render.mjs projects/apple-event-1013
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SIZE = 1080;

// 정식 폰트(fonts/ 폴더) → 없으면 대체 폰트(node_modules)로 렌더링
const FONTS = {
  title: {
    file: 'GmarketSansTTFBold.ttf',
    local: ['GmarketSansTTFBold', 'Gmarket Sans TTF Bold'],
    fallback: 'node_modules/@fontsource/noto-sans-kr/files/noto-sans-kr-korean-900-normal.woff2',
  },
  tab: {
    file: 'GmarketSansTTFMedium.ttf',
    local: ['GmarketSansTTFMedium', 'Gmarket Sans TTF Medium'],
    fallback: 'node_modules/@noonnu/gmarket-sans-medium/fonts/gmarketsansmedium-normal.woff',
  },
  body: {
    file: '210OmniGothic030.ttf',
    local: ['210 OmniGothic 030', '210 옴니고딕 030'],
    fallback: 'node_modules/@fontsource/noto-sans-kr/files/noto-sans-kr-korean-400-normal.woff2',
  },
};

function fontFaces() {
  return Object.entries(FONTS).map(([name, f]) => {
    const real = path.join(ROOT, 'fonts', f.file);
    const srcs = f.local.map((n) => `local('${n}')`);
    if (fs.existsSync(real)) {
      srcs.push(`url('${pathToFileURL(real)}')`);
    } else {
      console.warn(`[폰트] fonts/${f.file} 없음 → 대체 폰트로 렌더링합니다.`);
      srcs.push(`url('${pathToFileURL(path.join(ROOT, f.fallback))}')`);
    }
    return `@font-face { font-family: 'cn-${name}'; src: ${srcs.join(', ')}; }`;
  }).join('\n');
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// [대괄호] 안의 글자는 형광 강조
const rich = (s) => esc(s).replace(/\[([^\]]+)\]/g, '<em>$1</em>');
// 둥근 외곽선: text-stroke는 모서리가 뾰족하게 튀어나와서 그림자를 원형으로 둘러 만든다
const roundStroke = (r, color = '#000') => Array.from({ length: 32 }, (_, i) => {
  const a = (i / 32) * Math.PI * 2;
  return `${(Math.cos(a) * r).toFixed(2)}px ${(Math.sin(a) * r).toFixed(2)}px 0 ${color}`;
}).join(', ');
const lines = (v) => (Array.isArray(v) ? v : v ? [v] : []);

function slideHtml(deck, slide, index, baseDir) {
  const tpl = slide.template || (index === 0 ? 'cover' : 'content');
  const page = `${String(index + 1).padStart(2, '0')} / ${String(deck.total || deck.slides.length).padStart(2, '0')}`;
  const img = slide.image
    ? `<img class="art" src="${pathToFileURL(path.resolve(baseDir, slide.image))}"${slide.imageOverlap ? ` style="margin-bottom:-${slide.imageOverlap}px"` : ''}>`
    : '<div class="art placeholder">이미지 자리</div>';
  const title = lines(slide.title).map((l) => `<div>${rich(l)}</div>`).join('');
  const desc = lines(slide.desc).map((l) => `<div>${rich(l)}</div>`).join('');
  const icon = pathToFileURL(path.join(ROOT, 'templates', `icon-${slide.tabIcon || deck.tabIcon || 'folder'}.png`));
  const asset = (p) => pathToFileURL(path.resolve(baseDir, p));
  // 말풍선(후기) 레이아웃: bubbles = [{ tone: 'gray'|'blue', text: [...] }]
  // 테두리는 렌더 시 drawBubbles()가 그린다
  const bubbles = (slide.bubbles || []).map((b) => `
    <div class="bubble ${b.tone || 'gray'}">
      ${slide.avatar ? `<img class="avatar" src="${asset(slide.avatar)}">` : ''}
      <div class="say">${lines(b.text).map((l) => `<div>${rich(l)}</div>`).join('')}</div>
    </div>`).join('');
  // 패널 안에 잘려 보이는 장식 이미지: side = { src, left|right, top, width, rotate }
  const side = slide.side
    ? `<div class="clip"><img class="side" src="${asset(slide.side.src)}" style="${['left', 'right', 'top', 'width']
        .filter((k) => slide.side[k] != null).map((k) => `${k}:${slide.side[k]}px`).join(';')};transform:rotate(${slide.side.rotate || 0}deg)"></div>`
    : '';
  const frame = pathToFileURL(path.join(ROOT, 'templates', `frame-${tpl}.png`));

  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontFaces()}
:root { --lime: ${slide.highlight || deck.highlight || '#f1ff50'}; --blue: ${deck.pageColor || '#1a66ff'}; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: ${SIZE}px; height: ${SIZE}px; overflow: hidden; }
body { background: url('${frame}') 0 0 / ${SIZE}px ${SIZE}px no-repeat; position: relative; word-break: keep-all; }
.tab, .page { position: absolute; display: flex; align-items: center; }
/* 탭 흰 영역: 왼쪽 y 83~155, 오른쪽(페이지 번호) y 102~155 */
.tab { left: 100px; top: 83px; height: 72px; gap: 20px;
  font-family: 'cn-tab'; font-size: 27px; color: #111; letter-spacing: -0.3px; }
.tab .ico { height: 42px; width: auto; }
.page { right: 100px; top: 102px; height: 53px; font-family: 'cn-title'; color: var(--blue); font-size: 25px; }
.body { position: absolute; display: flex; flex-direction: column; align-items: center; text-align: center; }
.art { display: block; flex: 1 1 auto; min-height: 0; max-width: 100%; object-fit: contain; }
.placeholder { width: 100%; border: 4px dashed #d9cf9f; border-radius: 24px; display: flex;
  align-items: center; justify-content: center; font-family: 'cn-body'; font-size: 32px; color: #b8ad7a; }
.title { position: relative; font-family: 'cn-title'; letter-spacing: -2px; line-height: 1.12; }
.desc { font-family: 'cn-body'; color: #111; font-size: 31px; line-height: 1.45; letter-spacing: -0.5px; }

/* 표지: 흰 글씨 + 검정 외곽선, 강조는 형광 연두 */
.cover .body { left: 60px; right: 60px; top: 172px; bottom: 70px; }
.cover .art { margin-bottom: 14px; }
.cover .title { color: #fff; text-shadow: ${roundStroke(7)}; }
.cover .title div:first-child { font-size: 74px; }
.cover .title div + div { font-size: 92px; margin-top: 2px; }
.cover .title em { font-style: normal; color: var(--lime); }
.cover .desc { margin: 12px 0 14px; font-size: 38px; }

/* 본문: 검정 글씨, 강조는 형광펜 밑줄 */
.content .body { left: 100px; right: 100px; top: 196px; bottom: 100px; gap: 26px; }
.content .title { color: #111; font-size: 64px; }
.content .title em { font-style: normal; background: linear-gradient(transparent 55%, var(--lime) 55%); padding: 0 4px; }
.content .art { border-radius: 20px; }
.content .desc em { font-style: normal; font-family: 'cn-title'; }

/* 말풍선 후기 */
.clip { position: absolute; left: 62px; top: 179px; right: 58px; bottom: 53px; border-radius: 26px; overflow: hidden; }
.side { position: absolute; }
.chat { width: 100%; display: flex; flex-direction: column; align-items: flex-start; gap: 40px; margin-top: 30px; padding-left: 14px; }
.cover.has-chat .body { top: 196px; }
.has-chat .title div:first-child { font-size: 68px; }
.has-chat .title div + div { font-size: 84px; }
.bubble { position: relative; isolation: isolate; display: flex; align-items: center; gap: 20px; padding: 14px 34px 14px 18px; text-align: left; }
.bubble > svg { position: absolute; left: 0; top: 0; z-index: -1; overflow: visible; }
.bubble path { fill: #f3f2f2; stroke: #111; stroke-width: 3.5px; stroke-linejoin: round; }
.bubble.blue path { fill: #e2f0fd; }
.avatar { width: 76px; height: 76px; flex: none; }
.say { font-family: 'cn-body'; font-size: 27px; line-height: 1.42; color: #111; letter-spacing: -0.6px; }
</style></head><body class="${tpl}${bubbles ? ' has-chat' : ''}">
  ${side}
  <div class="tab">${(slide.tabIcon ?? deck.tabIcon) === false ? '' : `<img class="ico" src="${icon}">`}<span>${esc(slide.tab || deck.tab || '')}</span></div>
  <div class="page">${page}</div>
  <div class="body">
    ${bubbles ? `<div class="title">${title}</div><div class="chat">${bubbles}</div>`
      : tpl === 'cover' ? `${img}<div class="title">${title}</div>` : `<div class="title">${title}</div>${img}`}
    ${desc ? `<div class="desc">${desc}</div>` : ''}
  </div>
</body></html>`;
}

// 브라우저 안에서 실행: 말풍선 몸통+꼬리를 하나의 경로로 그린다(테두리 두께 일정)
function drawBubbles() {
  document.querySelectorAll('.bubble').forEach((el) => {
    const w = el.offsetWidth, h = el.offsetHeight, r = Math.min(46, h / 2), t = r + 20;
    const d = `M${r},0 H${w - r} A${r},${r} 0 0 1 ${w},${r} V${h - r} A${r},${r} 0 0 1 ${w - r},${h}`
      + ` H${t + 30} C${t + 22},${h + 12} ${t + 8},${h + 22} ${t - 12},${h + 28} C${t + 2},${h + 18} ${t + 4},${h + 9} ${t},${h}`
      + ` H${r} A${r},${r} 0 0 1 0,${h - r} V${r} A${r},${r} 0 0 1 ${r},0 Z`;
    el.insertAdjacentHTML('afterbegin', `<svg width="${w}" height="${h}"><path d="${d}"/></svg>`);
  });
}

async function main() {
  const projectDir = path.resolve(process.argv[2] || 'projects/apple-event-1013');
  const deck = JSON.parse(fs.readFileSync(path.join(projectDir, 'slides.json'), 'utf8'));
  const outDir = path.join(ROOT, 'output', path.basename(projectDir));
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
  for (const [i, slide] of deck.slides.entries()) {
    const htmlPath = path.join(outDir, `.slide-${i + 1}.html`);
    fs.writeFileSync(htmlPath, slideHtml(deck, slide, i, projectDir));
    await page.goto(pathToFileURL(htmlPath).href);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(drawBubbles);
    const out = path.join(outDir, `${String(i + 1).padStart(2, '0')}.png`);
    await page.screenshot({ path: out });
    fs.unlinkSync(htmlPath);
    console.log('✔', path.relative(ROOT, out));
  }
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
