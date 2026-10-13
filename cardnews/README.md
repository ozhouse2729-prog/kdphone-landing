# 카드뉴스 생성기

1080×1080 노란 폴더 양식 카드뉴스를 `slides.json` 내용으로 PNG로 뽑아줍니다.

## 준비
```bash
cd cardnews
npm install
```

### 폰트
`fonts/` 폴더에 아래 파일을 넣어주세요. 파일이 없으면 비슷한 대체 폰트(Noto Sans KR 등)로 렌더링하고 경고를 띄웁니다.

| 용도 | 폰트 | 파일 이름 |
| --- | --- | --- |
| 제목 | G마켓 산스 TTF Bold | `GmarketSansTTFBold.ttf` |
| 상단 탭(파일명·페이지) | G마켓 산스 TTF Medium | `GmarketSansTTFMedium.ttf` |
| 설명 | 210 옴니고딕 030 | `210OmniGothic030.ttf` |

## 만들기
1. `projects/<이름>/slides.json`을 작성하고 이미지는 `projects/<이름>/images/`에 넣습니다.
2. `node render.mjs projects/<이름>`을 실행하면 `output/<이름>/01.png`부터 차례로 생성됩니다.

## slides.json 형식
```json
{
  "tab": "Apple Event_1013.zip",
  "slides": [
    { "template": "cover", "image": "images/cover.png",
      "title": ["2026년 10월 13일", "[애플 행사] 총정리"],
      "desc": ["설명 첫 줄", "설명 둘째 줄"] },
    { "title": ["[M5 맥북 프로] 공개"], "image": "images/macbook.png",
      "desc": ["본문 설명", "[강조] 단어는 굵게"] }
  ]
}
```
- `template`: `cover`(크림색 표지 양식) 또는 `content`(흰 바탕 본문 양식)입니다. 생략하면 첫 장은 표지, 나머지는 본문이 됩니다.
- `title`, `desc`: 배열 한 칸이 한 줄입니다. `[대괄호]`로 감싼 글자는 강조돼요. 표지 제목은 형광 연두, 본문 제목은 형광펜 밑줄, 설명은 굵은 글씨로 표시됩니다.
- 페이지 번호(`01 / 05`)는 장 수에 맞춰 자동으로 들어갑니다.
- `image`를 비우면 점선으로 "이미지 자리"가 표시됩니다.
- 선택 항목: `highlight`(강조색, 기본 `#f1ff50`), `pageColor`(페이지 번호 색, 기본 `#1a66ff`), 장별 `tab`.
