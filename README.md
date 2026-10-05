# KD폰 랜딩페이지

휴대폰 번호이동·기기변경 상담 신청용 정적 랜딩페이지입니다. 빌드 과정 없이 `index.html`을 열거나 정적 호스팅(GitHub Pages, Netlify 등)에 올리면 됩니다.

## 구성
- `index.html`: 페이지 마크업 (히어로 + 견적 폼, 실시간 신청 티커, 혜택, 인기폰 시세, 비교, 개통절차, 후기, FAQ, CTA, 푸터, 모바일 하단 고정 바)
- `assets/style.css`: 스타일 (반응형: 1024px / 640px 기준)
- `assets/main.js`: 시세 카드 렌더링, 탭·필터, 티커, 카운트업, 폼 검증 및 제출

## 수정 포인트
- **기종·가격**: `assets/main.js`의 `PHONES` 배열 (출고가, 공시지원금, 가입유형별 추가지원금)
- **상담 접수 서버**: `assets/main.js`의 `FORM_ENDPOINT`에 주소를 넣으면 JSON으로 POST 전송합니다. 비워두면 완료 모달만 띄웁니다.
- **전화번호·사업자 정보**: `index.html`의 `1600-0000`, 푸터 `address`
