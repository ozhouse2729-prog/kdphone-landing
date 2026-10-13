#!/usr/bin/env python3
"""spec(JSON) → 카드 PNG 렌더.

사용:
  python scripts/render.py projects/<주제>/slides.json --slide 2 --candidate B
  python scripts/render.py projects/<주제>/slides.json --all-candidates   # 모든 장 후보 A/B/C + 비교시트
  python scripts/render.py projects/<주제>/slides.json --final            # 선택본 전체 → final/
spec 구조는 CLAUDE.md 참고.
"""
import argparse, json, base64, mimetypes, copy, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
TPL = ROOT / "templates" / "card.html"
CFG = json.loads((ROOT / "config.json").read_text(encoding="utf-8")) if (ROOT / "config.json").exists() else {}
OUT_SIZE = CFG.get("output_size", 1080)

def data_uri(path: Path) -> str:
    mt = mimetypes.guess_type(str(path))[0] or "image/png"
    return f"data:{mt};base64," + base64.b64encode(path.read_bytes()).decode()

def font_faces() -> str:
    css = []
    for fam, key in (("KDHead", "headline_font"), ("KDBody", "body_font")):
        f = CFG.get(key)
        if f and (ROOT / "assets/fonts" / f).exists():
            css.append(f'@font-face{{font-family:"{fam}";src:url("{data_uri(ROOT/"assets/fonts"/f)}");}}')
    return "\n".join(css)

def build_html(spec: dict, proj: Path) -> str:
    s = copy.deepcopy(spec)
    s["__frame_src"] = data_uri(ROOT / "assets/frames" / f"frame_{s.get('frame','content')}.jpg")
    if s.get("image"):
        p = (proj / s["image"]) if not s["image"].startswith("assets/") else ROOT / s["image"]
        if not p.exists():
            sys.exit(f"이미지 없음: {p}")
        s["__img_src"] = data_uri(p)
    html = TPL.read_text(encoding="utf-8")
    return html.replace("/*__FONTFACES__*/", font_faces()).replace("/*__SPEC__*/{}", json.dumps(s, ensure_ascii=False))

def render(jobs):
    """jobs: [(spec, proj_dir, out_path)]"""
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        for spec, proj, out in jobs:
            pg = br.new_page(viewport={"width": 1254, "height": 1254})
            pg.on("pageerror", lambda e: print("JS 오류:", e))
            pg.set_content(build_html(spec, proj), wait_until="load")
            pg.wait_for_selector("body[data-ready='1']", state="attached", timeout=10000)
            pg.evaluate("document.fonts.ready")
            out.parent.mkdir(parents=True, exist_ok=True)
            tmp = out.with_suffix(".raw.png")
            pg.screenshot(path=str(tmp))
            Image.open(tmp).convert("RGB").resize((OUT_SIZE, OUT_SIZE), Image.LANCZOS).save(out)
            tmp.unlink()
            pg.close()
            print("저장:", out)
        br.close()

def merged(slide: dict, cand: str | None) -> dict:
    """공통 필드 + 후보(candidates[X]) 필드 병합. tweak은 깊게 병합."""
    base = {k: v for k, v in slide.items() if k not in ("candidates", "selected")}
    c = (slide.get("candidates") or {}).get(cand or slide.get("selected") or "", {})
    out = {**base, **{k: v for k, v in c.items() if k != "tweak"}}
    out["tweak"] = {**base.get("tweak", {}), **c.get("tweak", {})}
    return out

def contact_sheet(paths, labels, out):
    W = 640; pad = 30; head = 90
    sheet = Image.new("RGB", (pad + len(paths) * (W + pad), W + head + pad), "white")
    d = ImageDraw.Draw(sheet)
    try:
        ft = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc", 56)
    except Exception:
        ft = ImageFont.load_default(size=56)  # CJK 폰트 없는 환경에서도 라벨 크기 유지 (Pillow>=10.1)
    for i, (p, lb) in enumerate(zip(paths, labels)):
        x = pad + i * (W + pad)
        sheet.paste(Image.open(p).resize((W, W)), (x, head))
        d.text((x + W // 2, head // 2), lb, fill="#1F6BFF", font=ft, anchor="mm")
    sheet.save(out); print("비교시트:", out)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slides_json")
    ap.add_argument("--slide", type=int, help="장 번호(1부터)")
    ap.add_argument("--candidate", help="A/B/C (생략 시 selected)")
    ap.add_argument("--all-candidates", action="store_true")
    ap.add_argument("--final", action="store_true")
    a = ap.parse_args()
    sj = Path(a.slides_json).resolve(); proj = sj.parent
    data = json.loads(sj.read_text(encoding="utf-8"))
    slides = data["slides"]; n = len(slides)
    for i, s in enumerate(slides, 1):
        s.setdefault("page", f"{i:02d} / {n:02d}")
    targets = [a.slide] if a.slide else range(1, n + 1)
    jobs, sheets = [], []
    for i in targets:
        s = slides[i - 1]
        if a.final:
            jobs.append((merged(s, None), proj, proj / "final" / f"{i:02d}.png"))
        elif a.all_candidates or (a.slide and not a.candidate and s.get("candidates") and not s.get("selected")):
            outs = []
            for c in sorted((s.get("candidates") or {"A": {}}).keys()):
                o = proj / "candidates" / f"s{i:02d}_{c}.png"
                jobs.append((merged(s, c), proj, o)); outs.append((o, c))
            sheets.append((i, outs))
        else:
            c = a.candidate or s.get("selected")
            tag = c or "X"
            jobs.append((merged(s, c), proj, proj / "work" / f"s{i:02d}_{tag}.png"))
    render(jobs)
    for i, outs in sheets:
        if len(outs) > 1:
            contact_sheet([o for o, _ in outs], [f"{i}-{c}" for _, c in outs], proj / "candidates" / f"s{i:02d}_compare.png")

if __name__ == "__main__":
    main()
