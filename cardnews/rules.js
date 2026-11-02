/* =========================================================
   카드뉴스 규칙 (단일 기준)
   - studio.html의 검사기가 이 값으로 검사합니다.
   - 숫자를 바꾸면 PROMPT.md / RULES.md의 같은 숫자도 함께 바꾸세요.
   ========================================================= */
window.CARD_RULES = {
  brand: "KD폰",
  handle: "@kdphone",

  // 글자 수 = 공백 포함, [[ ]] 기호 제외
  len: {
    product: 14,
    kicker: 16,
    titleLine: 9,       // 커버 제목 한 줄
    imageBrief: 80,
    detailHeadline: 16,
    lead: 48,
    pointLabel: 8,
    pointText: 28,
    summaryHeadline: 14,
    compareWith: 14,
    rowItem: 5,
    rowValue: 12,
    con: 24,
    verdict: 22,
    sourceName: 20,
  },

  count: {
    titleLinesMin: 2,
    titleLinesMax: 3,
    points: 3,
    rows: 4,
    cons: 2,
    sourcesMin: 1,
    sourcesMax: 3,
  },

  // 강조 [[ ]] 개수 (min, max)
  highlight: {
    title: [1, 1],
    detailHeadline: [1, 1],
    pointsTotal: [0, 1],   // 3개 포인트를 합쳐서
    verdict: [0, 1],
    elsewhere: [0, 0],     // 그 외 모든 칸은 강조 금지
  },

  enums: {
    tag: ["신제품", "출시확정", "가격", "업데이트", "루머", "유출", "비교", "이슈"],
    status: ["공식", "루머", "유출"],
    change: ["up", "down", "same", "new"],
  },

  // 루머/유출 기사는 반드시 이 태그 중 하나
  rumorTags: ["루머", "유출"],

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
    { re: /[「」『』<>《》#*_`]/, msg: "꺾쇠·마크다운 기호 사용 금지" },
    { re: /\s{2,}/, msg: "공백 2칸 이상 금지" },
    { re: /^\s|\s$/, msg: "앞뒤 공백 금지" },
  ],
};
