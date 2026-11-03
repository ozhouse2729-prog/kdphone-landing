#!/usr/bin/env node
/* assets/fonts.css의 폰트를 base64로 묶어 assets/fonts-data.js 생성
   (studio.html을 파일로 열면 브라우저가 폰트 파일을 읽지 못해 PNG 저장 시 폰트가 빠지므로 필요)
   폰트를 바꾸면 이 스크립트를 다시 실행: node scripts/build-studio-fonts.js */
const fs = require("fs");
const path = require("path");
const A = path.resolve(__dirname, "../assets");
const css = fs.readFileSync(path.join(A, "fonts.css"), "utf8").replace(/url\("([^"]+)"\)/g, (_, rel) =>
  `url("data:font/woff2;base64,${fs.readFileSync(path.join(A, rel)).toString("base64")}")`);
fs.writeFileSync(path.join(A, "fonts-data.js"), `window.CARD_FONT_CSS = ${JSON.stringify(css)};\n`);
console.log("assets/fonts-data.js", Math.round(fs.statSync(path.join(A, "fonts-data.js")).size / 1024) + "KB");
