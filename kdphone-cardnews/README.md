# 시작하기 (최초 1회)
1. `pip install playwright pillow && playwright install chromium`
2. `.env.example` → `.env` 복사 후 이미지 API 키 입력 (Gemini 또는 OpenAI)
3. 쓰는 폰트 파일을 `assets/fonts/`에 넣고 `config.json`에 파일명 입력
4. 이 폴더에서 `claude` 실행

# 사용
- `/card <원고 붙여넣기>` → 장별 후보 3개 비교시트
- `/pick 1-A 2-C` → 선택 / `/pick 2번 제목 좀 키워` → 디테일 수정 / `/pick 최종`
- 슬래시 없이 그냥 말로 해도 CLAUDE.md 규칙대로 동작

테스트: `python scripts/render.py projects/_example/slides.json --all-candidates`
