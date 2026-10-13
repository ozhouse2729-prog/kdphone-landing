// 목록(items)에 쓰는 선 아이콘. viewBox 0 0 48 48, 검정 선
export const ICONS = {
  hand: `<rect x="17" y="4" width="18" height="31" rx="3.5"/><path d="M23 8h6"/>
    <path d="M17 22c-4 0-6 3-5 7l3 6c1 3 3 5 6 6v6"/><path d="M35 15c3 0 4 3 2 5"/><path d="M35 21c3 0 4 3 2 5"/>
    <path d="M35 27c3 0 3 4 1 6l-4 4v10"/>`,
  feather: `<path d="M40 7C25 7 13 18 12 33v4h4C30 36 41 24 40 7Z"/><path d="M7 42 30 18"/>
    <path d="M18 31h9"/><path d="M22 25h11"/><path d="M27 19h10"/>`,
  backpack: `<path d="M18 13v-3c0-3 3-5 6-5s6 2 6 5v3"/><rect x="10" y="13" width="28" height="31" rx="9"/>
    <rect x="16" y="29" width="16" height="11" rx="3"/><path d="M16 23h16"/>`,
  camera: `<path d="M16 14l3-5h10l3 5"/><rect x="6" y="14" width="36" height="26" rx="5"/>
    <circle cx="24" cy="27" r="7.5"/><circle cx="35.5" cy="19.5" r="1.2"/>`,
  phone: `<rect x="13" y="4" width="22" height="40" rx="5" fill="#ffd6e2"/><path d="M21 8.5h6"/><path d="M21 39.5h6"/>`,
};

export const icon = (name) =>
  `<svg class="ico-line" viewBox="0 0 48 48">${ICONS[name] || ''}</svg>`;
