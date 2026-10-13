#!/usr/bin/env python3
"""AI 이미지 생성 (카드 안에 들어갈 그림만 생성 — 글자는 HTML이 얹음).

사용:
  python scripts/gen_image.py --prompt "..." --out projects/<주제>/images/s02_A.png
  python scripts/gen_image.py --prompt "..." --out ... --ref references/ref_03.jpg   # 참고 이미지(구도·톤)
  python scripts/gen_image.py --prompt "..." --out ... --ref images/s02_B.png --edit # 선택 이미지 부분 수정
환경변수(.env): IMAGE_PROVIDER=gemini|openai, GEMINI_API_KEY, OPENAI_API_KEY, IMAGE_MODEL(선택)
"""
import argparse, base64, json, os, sys, mimetypes, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
env = ROOT / ".env"
if env.exists():
    for line in env.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1); os.environ.setdefault(k.strip(), v.strip())

STYLE = ("Clean, high-end commercial product render style, crisp lighting, high detail. "
         "Absolutely no text, letters, numbers, captions or watermarks anywhere in the image.")

def post(url, body, headers):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json", **headers})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"API 오류 {e.code}: {e.read().decode()[:800]}")

def gemini(prompt, refs):
    key = os.environ.get("GEMINI_API_KEY") or sys.exit("GEMINI_API_KEY 없음 (.env)")
    model = os.environ.get("IMAGE_MODEL") or "gemini-2.5-flash-image"
    parts = [{"text": prompt}]
    for r in refs:
        parts.append({"inline_data": {"mime_type": mimetypes.guess_type(r)[0] or "image/png",
                                      "data": base64.b64encode(Path(r).read_bytes()).decode()}})
    body = {"contents": [{"parts": parts}],
            "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "1:1"}}}
    res = post(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
               body, {"x-goog-api-key": key})
    for p in res.get("candidates", [{}])[0].get("content", {}).get("parts", []):
        d = p.get("inlineData") or p.get("inline_data")
        if d: return base64.b64decode(d["data"])
    sys.exit("이미지 응답 없음: " + json.dumps(res)[:800])

def openai(prompt, refs, transparent):
    key = os.environ.get("OPENAI_API_KEY") or sys.exit("OPENAI_API_KEY 없음 (.env)")
    model = os.environ.get("IMAGE_MODEL") or "gpt-image-1"
    if refs:  # 참고/편집: multipart edits 엔드포인트
        import uuid
        b = uuid.uuid4().hex; buf = b""
        def field(n, v): return f"--{b}\r\nContent-Disposition: form-data; name=\"{n}\"\r\n\r\n{v}\r\n".encode()
        buf += field("model", model) + field("prompt", prompt) + field("size", "1024x1024")
        for r in refs:
            buf += (f"--{b}\r\nContent-Disposition: form-data; name=\"image[]\"; filename=\"{Path(r).name}\"\r\n"
                    f"Content-Type: {mimetypes.guess_type(r)[0] or 'image/png'}\r\n\r\n").encode() + Path(r).read_bytes() + b"\r\n"
        buf += f"--{b}--\r\n".encode()
        req = urllib.request.Request("https://api.openai.com/v1/images/edits", data=buf,
            headers={"Authorization": f"Bearer {key}", "Content-Type": f"multipart/form-data; boundary={b}"})
        try:
            res = json.loads(urllib.request.urlopen(req, timeout=300).read())
        except urllib.error.HTTPError as e:
            sys.exit(f"API 오류 {e.code}: {e.read().decode()[:800]}")
    else:
        body = {"model": model, "prompt": prompt, "size": "1024x1024"}
        if transparent: body["background"] = "transparent"
        res = post("https://api.openai.com/v1/images/generations", body, {"Authorization": f"Bearer {key}"})
    return base64.b64decode(res["data"][0]["b64_json"])

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--ref", action="append", default=[], help="참고 이미지 (여러 번 가능)")
    ap.add_argument("--edit", action="store_true", help="ref 이미지를 유지하고 프롬프트대로만 수정")
    ap.add_argument("--cutout", action="store_true", help="흰 배경 단독 오브젝트(텍스트 옆 배치용)")
    a = ap.parse_args()
    prompt = a.prompt
    if a.cutout:
        prompt += " Isolated subject on a pure solid white (#FFFFFF) background, no floor, no shadow box, no scenery."
    if a.edit:
        prompt = "Edit the provided image. Keep composition, subject and style identical except: " + prompt
    prompt += " " + STYLE
    prov = os.environ.get("IMAGE_PROVIDER", "gemini")
    img = gemini(prompt, a.ref) if prov == "gemini" else openai(prompt, a.ref, a.cutout)
    out = Path(a.out); out.parent.mkdir(parents=True, exist_ok=True); out.write_bytes(img)
    print("생성:", out)

if __name__ == "__main__":
    main()
