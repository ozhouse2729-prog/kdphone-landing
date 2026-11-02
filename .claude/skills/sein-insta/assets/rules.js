/* =========================================================
   카드뉴스 규칙 (단일 기준)
   - studio.html의 검사기가 이 값으로 검사합니다.
   - 숫자를 바꾸면 PROMPT.md / schema.json의 같은 숫자도 함께 바꾸세요.
   ========================================================= */
window.CARD_RULES = {
  brand: "KD폰",        // 1p 왼쪽 위 로고
  handle: "@kdphone",   // 2p·3p 맨 아래

  // 글자 수 = 공백 포함, [[ ]] 기호 제외, 따옴표 포함
  len: {
    product: 14,
    titleLine: 11,        // 1p 제목 한 줄
    imageBrief: 80,
    headline: 22,         // 2p·3p 따옴표 제목
    para: 60,             // 2p 본문 문단
    conclusion: 34,       // 2p·3p 마지막 결론 (자동 형광펜)
    compareWith: 14,
    rowItem: 5,
    rowValue: 11,
    con: 24,
    sourceName: 20,
  },

  count: {
    titleLinesMin: 3,
    titleLinesMax: 4,
    paras: 2,
    rows: 3,
    cons: 2,
    sourcesMin: 1,
    sourcesMax: 3,
  },

  // [[형광펜]] 개수 (min, max)
  highlight: {
    title: [0, 0],        // 1p 제목은 전부 흰 글자 (예시 1)
    headline: [1, 2],     // 2p·3p 제목
    para: [0, 1],         // 2p 문단마다
    elsewhere: [0, 0],    // 그 외 모든 칸 금지
  },

  enums: {
    status: ["공식", "루머", "유출"],
  },

  // 루머·유출 기사는 1p 제목에 이 단어 중 하나가 반드시 들어가야 함
  rumorWords: ["루머", "유출", "소문", "예상", "전망"],

  // 금지어 (낚시·과장·비속)
  bannedWords: [
    "충격", "경악", "역대급", "미쳤", "대박", "실화", "ㄷㄷ", "ㅋㅋ", "ㅎㅎ",
    "무조건", "100%", "필수템", "끝판왕", "갓성비", "혁명", "완벽", "최초공개",
    "알고보니", "결국", "드디어", "난리", "소름", "모르면 손해"
  ],

  // 금지 기호
  bannedPatterns: [
    { re: /\p{Extended_Pictographic}/u, msg: "이모지 사용 금지" },
    { re: /!/, msg: "느낌표(!) 사용 금지" },
    { re: /~/, msg: "물결(~) 사용 금지" },
    { re: /\.\.\.|…/, msg: "말줄임표(…) 사용 금지" },
    { re: /["'「」『』<>《》#*_`]/, msg: "곧은 따옴표·꺾쇠·마크다운 기호 금지 (따옴표는 “ ”만)" },
    { re: /\s{2,}/, msg: "공백 2칸 이상 금지" },
    { re: /^\s|\s$/, msg: "앞뒤 공백 금지" },
  ],
};
