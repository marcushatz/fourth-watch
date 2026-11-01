// Three bold profile marks for Fourth Watch. 512x512 SVG strings.
const G='#E3B25C', P='#F2E6CF';
const defs = `
<defs>
 <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26324D"/><stop offset="1" stop-color="#131A2B"/></linearGradient>
 <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101727"/><stop offset="1" stop-color="#070A12"/></linearGradient>
 <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${G}" stop-opacity=".55"/><stop offset="1" stop-color="#FFE3A3"/></linearGradient>
 <radialGradient id="glass" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#FFF1C9"/><stop offset=".55" stop-color="${G}"/><stop offset="1" stop-color="#B9741F"/></radialGradient>
 <radialGradient id="halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${G}" stop-opacity=".55"/><stop offset="1" stop-color="${G}" stop-opacity="0"/></radialGradient>
 <filter id="blur8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
 <filter id="blur3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>`;

// A: a beam of light over the night sea; the beam, the horizon glint and the reflection form a cross.
function crossOnWater(){
  let refl='';
  const widths=[24,30,20,28,17,24,14,20,11,15,8,10];
  widths.forEach((w,i)=>{ const y=266+i*17; const o=(1-i/widths.length)*0.95+0.08; const dx=(i%2?4:-4);
    refl+=`<rect x="${256-w/2+dx}" y="${y}" width="${w}" height="9" rx="4.5" fill="${G}" opacity="${o.toFixed(2)}"/>`; });
  let waves='';
  [[310,.4],[360,.32],[420,.24]].forEach(([y,o],i)=>{ waves+=`<path d="M ${70+i*14} ${y} q 30 -9 60 0 t 60 0" stroke="#3A4767" stroke-width="4" fill="none" opacity="${o}"/><path d="M ${320-i*8} ${y+20} q 30 -9 60 0 t 60 0" stroke="#3A4767" stroke-width="4" fill="none" opacity="${o}"/>`; });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs}
  <rect width="512" height="256" fill="url(#sky)"/><rect y="256" width="512" height="256" fill="url(#sea)"/>
  ${waves}
  <ellipse cx="256" cy="252" rx="190" ry="40" fill="url(#halo)"/>
  <circle cx="256" cy="200" r="120" fill="url(#halo)" opacity=".5"/>
  <rect x="242" y="70" width="28" height="190" rx="12" fill="url(#beam)" filter="url(#blur8)" opacity=".8"/>
  <rect x="245" y="70" width="22" height="190" rx="11" fill="url(#beam)"/>
  <rect x="148" y="241" width="216" height="20" rx="10" fill="${G}" filter="url(#blur3)"/>
  <rect x="148" y="243" width="216" height="16" rx="8" fill="#FFE3A3"/>
  ${refl}
  </svg>`;
}

// B: a flat robed figure standing on a wave crest, lit from above.
function figureOnWater(){
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs}
  <rect width="512" height="512" fill="url(#sky)"/>
  <path d="M 120 0 L 210 0 L 330 400 L 150 400 Z" fill="${G}" opacity=".10"/>
  <rect y="372" width="512" height="140" fill="url(#sea)"/>
  <ellipse cx="256" cy="378" rx="120" ry="18" fill="url(#halo)"/>
  <ellipse cx="256" cy="160" rx="25" ry="30" fill="${P}"/>
  <path d="M 226 198 Q 256 186 286 198 Q 300 214 302 238 L 318 300 Q 312 306 304 300 L 300 284 L 304 372 L 208 372 L 214 270 Q 216 230 226 198 Z" fill="${P}"/>
  <path d="M 120 382 Q 170 360 220 378 Q 256 392 292 378 Q 342 360 392 382" stroke="${G}" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M 150 420 Q 200 402 256 418 Q 312 434 362 418" stroke="${G}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".45"/>
  </svg>`;
}

// C: a lantern whose frame forms a cross against the light (keeping watch through the night).
function lanternCross(){
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs}
  <rect width="512" height="512" fill="url(#sky)"/>
  <circle cx="256" cy="262" r="170" fill="url(#halo)"/>
  <circle cx="256" cy="92" r="20" stroke="${P}" stroke-width="9" fill="none"/>
  <path d="M 214 140 L 226 112 L 286 112 L 298 140 Z" fill="${P}"/>
  <rect x="200" y="140" width="112" height="214" rx="10" fill="url(#glass)"/>
  <rect x="200" y="140" width="112" height="214" rx="10" stroke="${P}" stroke-width="10" fill="none"/>
  <rect x="249" y="140" width="14" height="214" fill="#1A2034"/>
  <rect x="200" y="200" width="112" height="14" fill="#1A2034"/>
  <path d="M 186 354 L 326 354 L 316 382 L 196 382 Z" fill="${P}"/>
  </svg>`;
}
module.exports={crossOnWater,figureOnWater,lanternCross};
