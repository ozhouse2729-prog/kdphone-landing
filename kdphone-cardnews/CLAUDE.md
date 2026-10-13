# 국대폰 인스타 카드뉴스 이미지 제작

IT 소식 카드뉴스(1:1, 장당 1080px)를 폴더 양식 위에 제작한다.
**글자는 HTML로 얹고, AI는 그림만 만든다.** (AI가 한글을 그리면 깨지므로 이미지 프롬프트에 텍스트 금지)

## 폴더
- `assets/frames/` — 양식. `frame_cover.jpg`(1장 표지, 크림색 앞판) / `frame_content.jpg`(2장~, 흰 속지 + 헤더 줄)
- `assets/fonts/` — 폰트 파일을 넣고 `config.json`의 `headline_font`, `body_font`에 파일명 입력 (비우면 시스템 폰트)
- `references/` — 완성 예시 5장. 톤·크기감·배치는 여기 기준. 작업 전 한 번 열어볼 것
- `templates/card.html` — 렌더 템플릿 (레이아웃 7종) / `templates/outro.json` — 마지막 장 고정 프리셋
- `scripts/gen_image.py` — 이미지 생성 / `scripts/render.py` — 렌더·비교시트·최종본
- `projects/<주제>/` — 작업 단위. `slides.json`, `images/`, `candidates/`, `work/`, `final/`

## 워크플로 (반드시 이 순서)
1. **원고 → slides.json**: 사용자가 준 텍스트를 장별로 나눈다. 장 수는 원고대로, 마지막 장은 `templates/outro.json` 그대로 추가. 페이지 번호(`01 / 05`)는 자동.
2. **장마다 후보 3개(A/B/C)**: 각 후보는 *이미지 컨셉 + 레이아웃*이 서로 확실히 다르게. (같은 그림에 위치만 바꾼 3개 금지)
   - 이미지 생성: `python scripts/gen_image.py --prompt "..." --out projects/<주제>/images/s02_A.png [--cutout] [--ref references/ref_0X.jpg]`
   - 3개는 한 번에 병렬 실행해도 됨
   - `python scripts/render.py projects/<주제>/slides.json --slide 2` → `candidates/s02_A~C.png` + `s02_compare.png`
3. **렌더 결과를 직접 열어서 검수** 후 보여준다: 글자-이미지 겹침, 프레임 밖 잘림, 헤드라인 줄넘침, 이미지 속 글자/워터마크가 있으면 tweak 또는 재생성으로 고친 뒤 보여줄 것.
4. **사용자에게는 `sXX_compare.png`만 보여주고 선택 대기.** 사용자는 "2-B", "2번 B" 식으로 고른다. "다 별로"면 그 장만 새 컨셉 3개 다시.
5. **선택 → 디테일**: `"selected": "B"` 기록. 이후 수정은 해당 후보의 `tweak`만 바꿔서 `--slide N`로 재렌더(`work/`에 저장). 이미지 자체 수정은 `--ref images/s02_B.png --edit`으로 원본 유지한 채 부분 수정.
6. 전 장 선택 끝나면 `python scripts/render.py projects/<주제>/slides.json --final` → `final/01.png ~`

원고만 주면 1~3을 첫 장부터 끝까지 이어서 진행하고, 장별 비교시트를 한꺼번에 보여준다. (`--all-candidates`) 중간에 묻지 말 것.

## slides.json
```json
{"topic":"주제","slides":[{
  "frame":"content",                     // cover(1장) | content
  "label":"User_Review.jpg",             // 헤더 파일명
  "label_icon":"image",                  // image | folder | none (cover 기본 none)
  "kicker":"작은 윗줄 (선택)",
  "headline":["줄1","[[강조어]] 줄2"],    // 줄 단위 배열, [[ ]] = 강조색
  "highlight_color":"pink",              // pink | blue | sky | cream | #hex
  "body":"본문\n줄바꿈은 \\n",
  "extra_html":"",                       // 말풍선·도표 등 특수 요소 (#inner 기준 절대배치)
  "tweak":{},                            // 공통 조정값
  "candidates":{
    "A":{"image":"images/s02_A.png","layout":"top-bottom","tweak":{}},
    "B":{...},"C":{...}},
  "selected":"B"}]}
```

### 레이아웃
| 이름 | 배치 | 이미지 성격 |
|---|---|---|
| top-bottom | 위 텍스트 중앙, 아래 큰 이미지 | 흰 배경 단독 오브젝트(`--cutout`) |
| top-right / top-left | 위 텍스트, 아래 오른쪽/왼쪽 이미지 | cutout |
| left-right | 왼쪽 정렬 텍스트, 오른쪽 아래 이미지 | cutout |
| top-bleed | 위 텍스트, 아래 꽉 찬 장면 + 위쪽 페이드 | 장면 이미지(배경 있음), 위 25%는 비어있게 |
| full-bg | 이미지 전체 배경 | 상단 40%가 단순한 장면 |
| text-only | 텍스트 + extra_html | 없음 |

cutout 이미지는 자동 multiply 합성(흰 배경이 사라짐). 투명 PNG면 `"image_blend":"normal"`.

### tweak 키 (디테일 수정은 이것만 만진다)
`headline_scale`(기본 1) `headline_x/y` `kicker_scale` `body_scale` `body_x/y` `text_x/y`(텍스트 블록 전체 이동)
`image_x/y` `image_scale` `image_rotate` `image_w/h` `image_fit`(contain|cover) `image_pos`(object-position) `fade`(%)
단위 px, 캔버스 1254 기준. 위로 = y 음수.

### 수정 요청 해석
- "제목 좀 키워/줄여" → headline_scale ±0.06~0.08
- "이미지 크게/작게" → image_scale ±0.08 (또는 image_w/h)
- "이미지 좀 내려/올려/오른쪽" → image_y/x ±30~40
- "글자랑 겹쳐" → 이미지 축소·이동 우선, 안 되면 headline_scale 축소
- "강조색 바꿔" → highlight_color
- "폰 각도/색/배경 바꿔" → 이미지 `--edit` 재생성
수치 바꾼 뒤 렌더해서 직접 확인하고 결과 이미지만 보여준다.

## 디자인 규칙 (references 기준)
- 헤드라인: 흰 글자 + 두꺼운 검정 외곽선, 강조어만 색. 1~2줄, 줄당 최대 12자 내외. 넘치면 headline_scale 낮추거나 줄 나누기
- 표지(1장): `frame:"cover"`, label은 `<제품/주제>.zip`, kicker로 후킹 한 줄 + 큰 헤드라인 2줄, 강조색 cream 기본
- 본문 장 label: 내용을 나타내는 영문 파일명 `.jpg` (User_Review.jpg, Overseas_Report.jpg, Apple_Response.jpg, Spec_Compare.jpg …)
- 강조색은 장마다 pink/sky를 섞되 한 장 안에서는 1~2색
- 마지막 장: `templates/outro.json` 고정 (문구 변경은 사용자가 요청할 때만)
- 문구 톤: 정보성. 광고처럼 보이는 표현 금지. 사용자가 준 문구는 임의로 고치지 않는다(줄바꿈만 조정 가능)

## 이미지 프롬프트 규칙
- 영어로, 구체적으로: 피사체·각도·조명·색감·배경. 끝에 텍스트 금지 문구는 스크립트가 자동 추가
- 후보 3개는 다른 축으로: 예) A 제품 클로즈업 cutout / B 상황 연출 장면(top-bleed) / C 상징 오브젝트·아이콘형
- 신제품(공개 전 포함)은 references나 사용자가 준 실제 사진을 `--ref`로 넣어 외형을 맞춘다
- 장면형은 텍스트 들어갈 상단을 비워두라고 명시: "keep the top 30% of the frame empty, plain background"
