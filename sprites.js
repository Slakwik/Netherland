// Sprite definitions as inline SVG strings.
// Convention:
//   - Ground tiles (grass/water/road): 64x32, anchor (W/2, 0).
//   - Mountain tile: W=64, H=56; footprint diamond at bottom 32px; anchor (W/2, H-32).
//   - Buildings: footprint diamond at bottom 32px of the sprite; anchor (W/2, H-32).
//     Buildings with an __ACCENT__ placeholder get tinted by owner color.
//   - Robot chassis: anchor at bottom-center (W/2, H); tinted by owner.
//   - Weapons: anchor at bottom-center (W/2, H), placed on chassis turret mount.
//   - Explosion: anchor at center (W/2, H/2).
//   - Platform: anchor at bottom-center (W/2, H).

const OWNER_COLORS = {
  player:  '#2a6ab0',
  enemy:   '#b03a3a',
  neutral: '#6a6a6a',
};

const SPRITE_SRC = {
  tile_grass: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32">
    <polygon points="32,0 64,16 32,32 0,16" fill="#5a8040" stroke="#2a4020" stroke-width="1"/>
    <circle cx="18" cy="17" r="1.2" fill="#6a9050"/>
    <circle cx="44" cy="14" r="1.2" fill="#6a9050"/>
    <circle cx="32" cy="22" r="1" fill="#4a6830"/>
    <circle cx="28" cy="10" r="1" fill="#4a6830"/>
  </svg>`,

  tile_road: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32">
    <polygon points="32,0 64,16 32,32 0,16" fill="#8a7a5a" stroke="#5a4a2a" stroke-width="1"/>
  </svg>`,

  tile_water: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32">
    <polygon points="32,0 64,16 32,32 0,16" fill="#2a5085" stroke="#103060" stroke-width="1"/>
    <ellipse cx="22" cy="15" rx="5" ry="1" fill="#6aa0d0" opacity="0.6"/>
    <ellipse cx="42" cy="20" rx="4" ry="1" fill="#6aa0d0" opacity="0.6"/>
    <ellipse cx="34" cy="10" rx="3" ry="1" fill="#6aa0d0" opacity="0.6"/>
  </svg>`,

  tile_mountain: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="56">
    <polygon points="32,24 64,40 32,56 0,40" fill="#4a4035" stroke="#201810" stroke-width="1"/>
    <polygon points="32,6 18,34 32,42 46,34" fill="#7a6858" stroke="#302010" stroke-width="0.5"/>
    <polygon points="32,6 46,34 32,42" fill="#8a7868"/>
    <polygon points="32,6 32,42 18,34" fill="#5a4838"/>
    <polygon points="32,6 28,14 36,14" fill="#b0a090"/>
  </svg>`,

  cursor:        `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32"><polygon points="32,1 63,16 32,31 1,16" fill="none" stroke="#ffe87a" stroke-width="2"/></svg>`,
  cursor_attack: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32"><polygon points="32,1 63,16 32,31 1,16" fill="none" stroke="#ff5a3a" stroke-width="2" stroke-dasharray="3,2"/></svg>`,
  cursor_move:   `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32"><polygon points="32,1 63,16 32,31 1,16" fill="none" stroke="#6aff6a" stroke-width="2" stroke-dasharray="3,2"/></svg>`,

  // Factory: W=72, H=82, anchor (36, 50)
  factory: `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="82">
    <polygon points="36,50 72,66 36,82 0,66" fill="#161616" stroke="#000" stroke-width="0.5"/>
    <polygon points="8,50 36,64 36,20 8,6" fill="#50585e"/>
    <polygon points="64,50 36,64 36,20 64,6" fill="#707880"/>
    <polygon points="8,6 36,0 64,6 36,20" fill="__ACCENT__" stroke="#000" stroke-width="0.4"/>
    <rect x="11" y="26" width="4" height="4" fill="#ffd870"/>
    <rect x="11" y="36" width="4" height="4" fill="#ffd870"/>
    <rect x="18" y="30" width="4" height="4" fill="#ffd870"/>
    <rect x="18" y="40" width="4" height="4" fill="#ffd870"/>
    <rect x="25" y="34" width="4" height="4" fill="#ffd870"/>
    <rect x="25" y="44" width="4" height="4" fill="#ffd870"/>
    <rect x="46" y="28" width="4" height="4" fill="#ffd870"/>
    <rect x="46" y="38" width="4" height="4" fill="#ffd870"/>
    <rect x="53" y="32" width="4" height="4" fill="#ffd870"/>
    <rect x="53" y="42" width="4" height="4" fill="#ffd870"/>
    <rect x="44" y="10" width="6" height="12" fill="#3a3a3a"/>
    <rect x="43" y="8" width="8" height="3" fill="#4a4a4a"/>
    <rect x="45" y="2" width="4" height="8" fill="#ff9a3a" opacity="0.7"/>
  </svg>`,

  // Warehouse: W=68, H=64, anchor (34, 32)
  warehouse: `<svg xmlns="http://www.w3.org/2000/svg" width="68" height="64">
    <polygon points="34,32 68,48 34,64 0,48" fill="#161616" stroke="#000" stroke-width="0.5"/>
    <polygon points="6,32 34,46 34,16 6,2" fill="#7a6040"/>
    <polygon points="62,32 34,46 34,16 62,2" fill="#94764e"/>
    <polygon points="6,2 34,14 62,2 34,16" fill="#55401e"/>
    <polygon points="6,2 34,14 34,18 6,6" fill="__ACCENT__" stroke="#000" stroke-width="0.3"/>
    <polygon points="62,2 34,14 34,18 62,6" fill="__ACCENT__" opacity="0.85" stroke="#000" stroke-width="0.3"/>
    <rect x="28" y="30" width="12" height="14" fill="#3a2410"/>
    <rect x="29" y="31" width="10" height="12" fill="#1a0c04"/>
    <line x1="34" y1="31" x2="34" y2="43" stroke="#3a2410" stroke-width="0.5"/>
    <line x1="9" y1="18" x2="34" y2="30" stroke="#4a3018" stroke-width="0.4"/>
    <line x1="15" y1="10" x2="34" y2="22" stroke="#4a3018" stroke-width="0.4"/>
    <line x1="59" y1="18" x2="34" y2="30" stroke="#4a3018" stroke-width="0.4"/>
    <line x1="53" y1="10" x2="34" y2="22" stroke="#4a3018" stroke-width="0.4"/>
  </svg>`,

  // Mine: W=72, H=58, anchor (36, 26)
  mine: `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="58">
    <polygon points="36,26 72,42 36,58 0,42" fill="#161616" stroke="#000" stroke-width="0.5"/>
    <ellipse cx="36" cy="38" rx="26" ry="10" fill="#4a3a2a"/>
    <ellipse cx="30" cy="30" rx="18" ry="7" fill="#5a4a3a"/>
    <ellipse cx="44" cy="26" rx="12" ry="4" fill="#4a3a2a"/>
    <circle cx="22" cy="28" r="2" fill="#6a5a4a"/>
    <circle cx="50" cy="30" r="2.5" fill="#6a5a4a"/>
    <path d="M 26,40 L 46,40 L 46,32 Q 36,22 26,32 Z" fill="#140804"/>
    <rect x="25" y="30" width="2.5" height="12" fill="#6a4020"/>
    <rect x="45.5" y="30" width="2.5" height="12" fill="#6a4020"/>
    <rect x="23" y="28" width="27" height="3" fill="__ACCENT__"/>
    <rect x="50" y="36" width="12" height="6" fill="#3a3a3a"/>
    <circle cx="52" cy="42" r="2" fill="#1a1a1a"/>
    <circle cx="60" cy="42" r="2" fill="#1a1a1a"/>
    <rect x="51" y="32" width="10" height="5" fill="#60402a"/>
    <rect x="52" y="33" width="2" height="3" fill="#a0704a"/>
    <rect x="56" y="33" width="2" height="3" fill="#a0704a"/>
  </svg>`,

  // Nuclear reactor: W=70, H=98, anchor (35, 66)
  nuclear: `<svg xmlns="http://www.w3.org/2000/svg" width="70" height="98">
    <polygon points="35,66 70,82 35,98 0,82" fill="#161616" stroke="#000" stroke-width="0.5"/>
    <ellipse cx="28" cy="8" rx="14" ry="5" fill="#d8d8d8" opacity="0.8"/>
    <ellipse cx="42" cy="4" rx="12" ry="4" fill="#f0f0f0" opacity="0.7"/>
    <ellipse cx="22" cy="2" rx="10" ry="3" fill="#ffffff" opacity="0.55"/>
    <path d="M 18,66 Q 16,28 22,14 L 48,14 Q 54,28 52,66 Z" fill="#c8c8c8" stroke="#404040" stroke-width="0.5"/>
    <path d="M 18,66 Q 16,28 22,14 L 26,14 Q 22,28 23,66 Z" fill="#989898"/>
    <ellipse cx="35" cy="14" rx="13" ry="2.5" fill="#b0b0b0"/>
    <path d="M 19,40 Q 35,44 51,40 L 51,46 Q 35,50 19,46 Z" fill="__ACCENT__" stroke="#000" stroke-width="0.3"/>
    <circle cx="35" cy="56" r="5" fill="#ffd870" stroke="#000" stroke-width="0.6"/>
    <circle cx="35" cy="56" r="1.3" fill="#000"/>
    <path d="M 35,56 L 35,52 A 4 4 0 0 1 38.5,58 Z" fill="#000"/>
    <path d="M 35,56 L 31.5,58 A 4 4 0 0 1 35,52 Z" fill="#000" transform="rotate(120 35 56)"/>
    <path d="M 35,56 L 31.5,58 A 4 4 0 0 1 35,52 Z" fill="#000" transform="rotate(240 35 56)"/>
  </svg>`,

  // Central computer: W=82, H=128, anchor (41, 96)
  central: `<svg xmlns="http://www.w3.org/2000/svg" width="82" height="128">
    <polygon points="41,96 82,112 41,128 0,112" fill="#0e0e0e" stroke="#000" stroke-width="0.5"/>
    <polygon points="12,96 41,110 41,38 12,24" fill="#3a3a4a"/>
    <polygon points="70,96 41,110 41,38 70,24" fill="#5a5a6a"/>
    <polygon points="12,24 41,10 70,24 41,38" fill="__ACCENT__" stroke="#000" stroke-width="0.4"/>
    <g fill="#ffd870">
      <rect x="17" y="42" width="3" height="5"/><rect x="23" y="46" width="3" height="5"/><rect x="29" y="50" width="3" height="5"/><rect x="35" y="54" width="3" height="5"/>
      <rect x="17" y="52" width="3" height="5"/><rect x="23" y="56" width="3" height="5"/><rect x="29" y="60" width="3" height="5"/><rect x="35" y="64" width="3" height="5"/>
      <rect x="17" y="62" width="3" height="5"/><rect x="23" y="66" width="3" height="5"/><rect x="29" y="70" width="3" height="5"/><rect x="35" y="74" width="3" height="5"/>
      <rect x="17" y="72" width="3" height="5"/><rect x="23" y="76" width="3" height="5"/><rect x="29" y="80" width="3" height="5"/><rect x="35" y="84" width="3" height="5"/>
      <rect x="17" y="82" width="3" height="5"/><rect x="23" y="86" width="3" height="5"/><rect x="29" y="90" width="3" height="5"/>
      <rect x="52" y="42" width="3" height="5"/><rect x="58" y="46" width="3" height="5"/><rect x="64" y="50" width="3" height="5"/>
      <rect x="52" y="52" width="3" height="5"/><rect x="58" y="56" width="3" height="5"/><rect x="64" y="60" width="3" height="5"/>
      <rect x="52" y="62" width="3" height="5"/><rect x="58" y="66" width="3" height="5"/><rect x="64" y="70" width="3" height="5"/>
      <rect x="52" y="72" width="3" height="5"/><rect x="58" y="76" width="3" height="5"/><rect x="64" y="80" width="3" height="5"/>
      <rect x="52" y="82" width="3" height="5"/><rect x="58" y="86" width="3" height="5"/>
    </g>
    <line x1="41" y1="10" x2="41" y2="0" stroke="#888" stroke-width="1.5"/>
    <circle cx="41" cy="0" r="2.5" fill="#ff4a4a"/>
  </svg>`,

  // Player platform: W=58, H=34, anchor (29, 34)
  platform: `<svg xmlns="http://www.w3.org/2000/svg" width="58" height="34">
    <ellipse cx="29" cy="30" rx="23" ry="4" fill="#000" opacity="0.3"/>
    <ellipse cx="29" cy="22" rx="26" ry="7" fill="#25476c"/>
    <ellipse cx="29" cy="19" rx="26" ry="7" fill="#5a8ab0"/>
    <ellipse cx="29" cy="17" rx="15" ry="5" fill="#7aaed0"/>
    <ellipse cx="29" cy="15" rx="11" ry="4" fill="#9acde8"/>
    <ellipse cx="29" cy="14" rx="7" ry="2.5" fill="#1a2a3a"/>
    <ellipse cx="26" cy="13" rx="3" ry="1" fill="#c0e8f8" opacity="0.9"/>
    <circle cx="5" cy="20" r="1.6" fill="#ffe87a"/>
    <circle cx="53" cy="20" r="1.6" fill="#ffe87a"/>
    <circle cx="29" cy="26" r="1.6" fill="#ff5a3a"/>
  </svg>`,

  // Robot chassis — anchor (W/2, H). Turret mount indicated in CHASSIS[].turretY (sprite-space y where weapon bottom sits)
  chassis_bipod: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="44">
    <ellipse cx="16" cy="42" rx="10" ry="1.5" fill="#000" opacity="0.35"/>
    <rect x="10" y="26" width="3" height="14" fill="#2e2e2e"/>
    <rect x="19" y="26" width="3" height="14" fill="#2e2e2e"/>
    <ellipse cx="11.5" cy="41" rx="3" ry="1" fill="#121212"/>
    <ellipse cx="20.5" cy="41" rx="3" ry="1" fill="#121212"/>
    <rect x="8" y="14" width="16" height="14" rx="2" fill="__ACCENT__" stroke="#000" stroke-width="0.5"/>
    <rect x="9" y="15" width="14" height="3" fill="#ffffff" opacity="0.25"/>
    <circle cx="12" cy="22" r="1" fill="#ffe87a"/>
    <circle cx="20" cy="22" r="1" fill="#ffe87a"/>
    <rect x="11" y="10" width="10" height="4" fill="#1e1e1e"/>
  </svg>`,

  chassis_tripod: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44">
    <ellipse cx="18" cy="42" rx="14" ry="2" fill="#000" opacity="0.35"/>
    <polygon points="13,26 9,40 13,40 15,26" fill="#2e2e2e"/>
    <polygon points="23,26 27,40 23,40 21,26" fill="#2e2e2e"/>
    <polygon points="17,28 18,40 20,40 19,28" fill="#3e3e3e"/>
    <ellipse cx="11" cy="41" rx="3" ry="1" fill="#121212"/>
    <ellipse cx="25" cy="41" rx="3" ry="1" fill="#121212"/>
    <ellipse cx="18.5" cy="41" rx="3" ry="1" fill="#121212"/>
    <ellipse cx="18" cy="20" rx="11" ry="8" fill="__ACCENT__" stroke="#000" stroke-width="0.5"/>
    <ellipse cx="18" cy="18" rx="10" ry="2.5" fill="#ffffff" opacity="0.25"/>
    <circle cx="14" cy="22" r="1.2" fill="#ffe87a"/>
    <circle cx="22" cy="22" r="1.2" fill="#ffe87a"/>
    <rect x="13" y="8" width="10" height="4" fill="#1e1e1e"/>
  </svg>`,

  chassis_quad: `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42">
    <ellipse cx="21" cy="40" rx="17" ry="2.5" fill="#000" opacity="0.35"/>
    <rect x="6" y="22" width="3" height="14" fill="#2e2e2e"/>
    <rect x="33" y="22" width="3" height="14" fill="#2e2e2e"/>
    <rect x="13" y="24" width="3" height="12" fill="#242424"/>
    <rect x="26" y="24" width="3" height="12" fill="#242424"/>
    <ellipse cx="7.5" cy="38" rx="3" ry="1" fill="#121212"/>
    <ellipse cx="34.5" cy="38" rx="3" ry="1" fill="#121212"/>
    <ellipse cx="14.5" cy="38" rx="3" ry="1" fill="#121212"/>
    <ellipse cx="27.5" cy="38" rx="3" ry="1" fill="#121212"/>
    <rect x="3" y="10" width="36" height="14" rx="3" fill="__ACCENT__" stroke="#000" stroke-width="0.5"/>
    <rect x="5" y="11" width="32" height="3" fill="#ffffff" opacity="0.22"/>
    <circle cx="10" cy="18" r="1.2" fill="#ffe87a"/>
    <circle cx="21" cy="18" r="1.2" fill="#ffe87a"/>
    <circle cx="32" cy="18" r="1.2" fill="#ffe87a"/>
    <rect x="16" y="6" width="10" height="4" fill="#1e1e1e"/>
  </svg>`,

  chassis_antigrav: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
    <ellipse cx="20" cy="38" rx="13" ry="2" fill="#000" opacity="0.22"/>
    <ellipse cx="8" cy="26" rx="5" ry="2" fill="#8acef0" opacity="0.9"/>
    <ellipse cx="32" cy="26" rx="5" ry="2" fill="#8acef0" opacity="0.9"/>
    <ellipse cx="20" cy="30" rx="5" ry="2" fill="#8acef0" opacity="0.7"/>
    <ellipse cx="20" cy="18" rx="16" ry="7" fill="__ACCENT__" stroke="#000" stroke-width="0.5"/>
    <ellipse cx="20" cy="16" rx="13" ry="3" fill="#ffffff" opacity="0.3"/>
    <circle cx="12" cy="20" r="1.2" fill="#ffe87a"/>
    <circle cx="20" cy="20" r="1.2" fill="#ffe87a"/>
    <circle cx="28" cy="20" r="1.2" fill="#ffe87a"/>
    <rect x="15" y="6" width="10" height="4" fill="#1e1e1e"/>
  </svg>`,

  // Weapons — anchor bottom-center (W/2, H)
  weapon_cannon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="16">
    <ellipse cx="11" cy="13" rx="7" ry="3" fill="#3a3a3a" stroke="#000" stroke-width="0.4"/>
    <rect x="10" y="4" width="11" height="3" fill="#1e1e1e" stroke="#000" stroke-width="0.3"/>
    <rect x="20" y="3" width="2" height="5" fill="#0e0e0e"/>
  </svg>`,

  weapon_missile: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="16">
    <rect x="2" y="9" width="20" height="5" fill="#3a3a3a" stroke="#000" stroke-width="0.3"/>
    <rect x="3" y="3" width="4" height="6" fill="#aa3a3a" stroke="#000" stroke-width="0.3"/>
    <rect x="10" y="3" width="4" height="6" fill="#aa3a3a" stroke="#000" stroke-width="0.3"/>
    <rect x="17" y="3" width="4" height="6" fill="#aa3a3a" stroke="#000" stroke-width="0.3"/>
    <polygon points="3,3 5,0 7,3" fill="#ddd"/>
    <polygon points="10,3 12,0 14,3" fill="#ddd"/>
    <polygon points="17,3 19,0 21,3" fill="#ddd"/>
  </svg>`,

  weapon_phaser: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="16">
    <ellipse cx="11" cy="13" rx="7" ry="3" fill="#3a3a5a" stroke="#000" stroke-width="0.4"/>
    <rect x="10" y="4" width="8" height="3" fill="#5a5a7a" stroke="#000" stroke-width="0.3"/>
    <circle cx="18" cy="5.5" r="2" fill="#aacfff" stroke="#ffffff" stroke-width="0.4"/>
    <circle cx="8" cy="10" r="0.9" fill="#aacfff"/>
    <circle cx="14" cy="10" r="0.9" fill="#aacfff"/>
  </svg>`,

  // Explosion — anchor center (W/2, H/2)
  explosion: `<svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 46 46">
    <circle cx="23" cy="23" r="20" fill="#ff4a0a" opacity="0.5"/>
    <circle cx="23" cy="23" r="14" fill="#ffa42a" opacity="0.75"/>
    <circle cx="23" cy="23" r="8" fill="#ffe87a" opacity="0.95"/>
    <circle cx="23" cy="23" r="3" fill="#ffffff"/>
    <polygon points="23,3 26,14 23,18 20,14" fill="#ffe87a" opacity="0.7"/>
    <polygon points="43,23 32,26 28,23 32,20" fill="#ffe87a" opacity="0.7"/>
    <polygon points="23,43 20,32 23,28 26,32" fill="#ffe87a" opacity="0.7"/>
    <polygon points="3,23 14,20 18,23 14,26" fill="#ffe87a" opacity="0.7"/>
  </svg>`,

  // Rubble for destroyed buildings
  rubble: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="40">
    <polygon points="32,8 64,24 32,40 0,24" fill="#2a2a2a" stroke="#000" stroke-width="0.5"/>
    <polygon points="18,18 26,12 32,22 22,28" fill="#4a4038"/>
    <polygon points="34,14 44,20 40,28 30,24" fill="#5a5048"/>
    <polygon points="28,20 38,26 36,32 26,30" fill="#3a3028"/>
    <circle cx="22" cy="28" r="2" fill="#6a5a4a"/>
    <circle cx="42" cy="26" r="1.5" fill="#6a5a4a"/>
    <circle cx="32" cy="32" r="1.2" fill="#4a3a2a"/>
  </svg>`,

  // Projectile: shell (cannon) — small bullet, drawn as circle in code but keep sprite for polish
  shell: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><circle cx="4" cy="4" r="3" fill="#ffd870" stroke="#000" stroke-width="0.5"/></svg>`,
  missile_proj: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="6">
    <rect x="2" y="1.5" width="11" height="3" fill="#aa3a3a" stroke="#000" stroke-width="0.3"/>
    <polygon points="13,1.5 16,3 13,4.5" fill="#ddd"/>
    <polygon points="2,1.5 0,0 2,4.5 0,6" fill="#f88" opacity="0.7"/>
  </svg>`,
};

const SPRITES = {};
let SPRITES_LOADED = false;

function svgToImg(svg) {
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  return img;
}

function loadSprites() {
  const promises = [];
  const tintTargets = ['factory','warehouse','mine','nuclear','central','chassis_bipod','chassis_tripod','chassis_quad','chassis_antigrav'];
  for (const [name, svg] of Object.entries(SPRITE_SRC)) {
    if (tintTargets.includes(name) && svg.includes('__ACCENT__')) {
      for (const [owner, color] of Object.entries(OWNER_COLORS)) {
        // Skip neutral tint for chassis (only buildings have neutral)
        if (name.startsWith('chassis_') && owner === 'neutral') continue;
        const tinted = svg.replace(/__ACCENT__/g, color);
        const img = svgToImg(tinted);
        SPRITES[name + '_' + owner] = img;
        promises.push(new Promise((res) => { img.onload = res; img.onerror = res; }));
      }
    } else {
      const img = svgToImg(svg);
      SPRITES[name] = img;
      promises.push(new Promise((res) => { img.onload = res; img.onerror = res; }));
    }
  }
  return Promise.all(promises).then(() => { SPRITES_LOADED = true; });
}
