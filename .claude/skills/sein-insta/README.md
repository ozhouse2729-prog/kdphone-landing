# 새인 인스타 (Claude 스킬)

IT 소식을 인스타 카드뉴스 3장(1080×1350 PNG)으로 만드는 Claude 스킬입니다.
**Claude는 글만 쓰고, 디자인은 코드로 고정되어 있고, 규칙을 어기면 검사기가 막습니다.**

## 쓰는 법
Claude에게 이렇게 말하면 됩니다.

> 새인 인스타 만들어줘 + (기사 링크 또는 주제) + (제품 사진 첨부)

Claude가 알아서 아래를 처리합니다.
1. 기사를 읽고 사실(숫자·스펙·가격)을 정리
2. 정해진 칸에 카피 작성
3. 고정 디자인으로 PNG 3장 렌더링
4. 규칙 위반이 있으면 스스로 고쳐서 다시 렌더링
5. PNG 3장과 팩트체크 표 전달

사진이 없으면 어떤 사진을 찾아야 하는지 알려줍니다. 공식 보도자료 사진을 받아 첨부하세요.
고칠 게 있으면 "제목 더 궁금하게", "단점 다른 걸로"처럼 말하면 그 부분만 바꿔서 다시 만들어 줍니다.

## 설치
- **claude.ai:** 이 폴더(`sein-insta`)를 zip으로 압축해 **설정 → 기능(Capabilities) → 스킬**에서 업로드합니다. 렌더링하려면 코드 실행 기능이 켜져 있어야 합니다.
- **Claude Code:** 이 저장소에서 쓰면 `.claude/skills/sein-insta`에 있어서 자동으로 인식됩니다.

## 수동 모드 (Claude 없이)
`assets/studio.html`을 크롬으로 열고 카드 JSON을 붙여넣은 뒤 사진을 올리면, 같은 검사를 거쳐 PNG 3장을 저장할 수 있습니다. JSON 형식은 `references/copy-rules.md`에 있습니다.

## 폴더 구성
| 경로 | 내용 |
|---|---|
| `SKILL.md` | Claude가 따르는 작업 순서와 절대 규칙 |
| `references/copy-rules.md` | 카피 규칙 (글자 수·개수·형광펜·금지어·사실 규칙) |
| `references/design-rules.md` | 디자인 규칙 (판형·색·페이지별 설계·사진 규칙) |
| `scripts/render.js` | 렌더러 + 검사기 (Node + Playwright) |
| `assets/rules.js` | 검사 기준값, **브랜드명·인스타 계정** |
| `assets/cards.css` | 카드 디자인 |
| `assets/engine.js` | 검사·렌더 엔진 (자동·수동 공통) |
| `assets/studio.html` | 수동 모드 화면 |
| `assets/fonts/` | Pretendard 폰트 (SIL OFL 1.1) |

## 바꾸고 싶을 때
- **브랜드명·계정:** `assets/rules.js` 맨 위 `brand`, `handle`
- **글자 수·금지어:** `assets/rules.js`. 바꾼 숫자는 `references/copy-rules.md`에도 똑같이 반영
- **디자인:** `assets/cards.css`만 수정
