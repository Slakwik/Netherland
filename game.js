// ======================================================================
// Nether Earth — Browser prototype
// ======================================================================
// Isometric RTS inspired by the 1987 ZX Spectrum original by David Stewart.
// Build robots from chassis + weapon + electronics. Capture buildings.
// Destroy the enemy Central Computer to win.

const TILE_W = 64;
const TILE_H = 32;
const MAP_W = 16;
const MAP_H = 12;
const CANVAS_W = 960;
const CANVAS_H = 560;

// Center the isometric map on the canvas
const CAMERA_X = 400;
const CAMERA_Y = 100;

// --- Definitions ---------------------------------------------------------

const CHASSIS = {
  bipod:    { name: 'Bipod',     hp: 25, speed: 2.0, cost: 3, turretY: 10, flying: false, sprite: 'chassis_bipod' },
  tripod:   { name: 'Tripod',    hp: 45, speed: 1.5, cost: 5, turretY: 8,  flying: false, sprite: 'chassis_tripod' },
  quad:     { name: 'Quad',      hp: 70, speed: 0.9, cost: 8, turretY: 6,  flying: false, sprite: 'chassis_quad' },
  antigrav: { name: 'Anti-grav', hp: 30, speed: 2.3, cost: 10, turretY: 6, flying: true,  sprite: 'chassis_antigrav' },
};

const WEAPONS = {
  none:    { name: 'None',    range: 0, damage: 0,  cooldown: 1.0, cost: 0, proj: null,       sprite: null },
  cannon:  { name: 'Cannon',  range: 3, damage: 8,  cooldown: 1.0, cost: 2, proj: 'shell',    sprite: 'weapon_cannon' },
  missile: { name: 'Missile', range: 5, damage: 16, cooldown: 1.6, cost: 4, proj: 'missile',  sprite: 'weapon_missile' },
  phaser:  { name: 'Phaser',  range: 4, damage: 22, cooldown: 1.3, cost: 5, proj: 'beam',     sprite: 'weapon_phaser' },
};

const ELECTRONICS = {
  basic:   { name: 'Basic',   hpMul: 1.0, cost: 0, autonomous: false },
  nuclear: { name: 'Nuclear', hpMul: 1.5, cost: 3, autonomous: false },
  ai:      { name: 'AI',      hpMul: 1.2, cost: 4, autonomous: true },
};

const BUILDINGS = {
  factory:   { name: 'Factory',          sprite: 'factory',   hp: 120, anchor: 50 },
  warehouse: { name: 'Warehouse',        sprite: 'warehouse', hp: 80,  anchor: 32 },
  mine:      { name: 'Mine',             sprite: 'mine',      hp: 70,  anchor: 26 },
  nuclear:   { name: 'Nuclear Reactor',  sprite: 'nuclear',   hp: 90,  anchor: 66 },
  central:   { name: 'Central Computer', sprite: 'central',   hp: 250, anchor: 96 },
};

// --- Map -----------------------------------------------------------------

const terrain = Array.from({ length: MAP_H }, () => Array(MAP_W).fill('grass'));

// Mountains (impassable for all)
[[5,3],[6,3],[6,2],[9,8],[10,8],[10,7],[3,5],[12,5]].forEach(([x,y]) => terrain[y][x] = 'mountain');
// Water (only anti-grav can cross)
[[11,2],[12,2],[11,3],[4,9],[5,9],[5,10]].forEach(([x,y]) => terrain[y][x] = 'water');
// Roads (cosmetic, no speed difference)
[[2,2],[3,3],[13,9],[12,8]].forEach(([x,y]) => terrain[y][x] = 'road');

const initialBuildings = [
  // Player base (top-left)
  { type: 'central',   tx: 1,  ty: 1,  owner: 'player' },
  { type: 'factory',   tx: 2,  ty: 0,  owner: 'player' },
  { type: 'mine',      tx: 0,  ty: 2,  owner: 'player' },
  { type: 'nuclear',   tx: 3,  ty: 1,  owner: 'player' },
  { type: 'warehouse', tx: 0,  ty: 0,  owner: 'player' },
  // Enemy base (bottom-right)
  { type: 'central',   tx: 14, ty: 10, owner: 'enemy' },
  { type: 'factory',   tx: 13, ty: 11, owner: 'enemy' },
  { type: 'mine',      tx: 15, ty: 9,  owner: 'enemy' },
  { type: 'nuclear',   tx: 12, ty: 10, owner: 'enemy' },
  { type: 'warehouse', tx: 15, ty: 11, owner: 'enemy' },
  // Neutrals in the middle
  { type: 'warehouse', tx: 7,  ty: 4,  owner: 'neutral' },
  { type: 'warehouse', tx: 8,  ty: 7,  owner: 'neutral' },
  { type: 'mine',      tx: 4,  ty: 6,  owner: 'neutral' },
  { type: 'mine',      tx: 11, ty: 5,  owner: 'neutral' },
  { type: 'factory',   tx: 10, ty: 2,  owner: 'neutral' },
];

// --- Game state ----------------------------------------------------------

const state = {
  buildings: [],
  units: [],
  projectiles: [],
  effects: [],
  decorations: [],          // rubble, etc.
  platform: { x: 3.5, y: 2.5 },
  input: { up: false, down: false, left: false, right: false },
  res: { player: { mat: 30 }, enemy: { mat: 35 } },
  selectedUnit: null,
  selectedBuilding: null,
  buildSelection: { chassis: 'bipod', weapon: 'cannon', electronics: 'basic' },
  mouse: { sx: 0, sy: 0, tx: -1, ty: -1 },
  mode: 'playing',
  time: 0,
  aiBuildTimer: 3,
  nextId: 1,
};

function initBuildings() {
  for (const b of initialBuildings) {
    const def = BUILDINGS[b.type];
    state.buildings.push({
      id: state.nextId++,
      type: b.type,
      tx: b.tx, ty: b.ty,
      owner: b.owner,
      hp: def.hp, maxHp: def.hp,
      buildQueue: null,        // {chassis, weapon, electronics, progress, total}
      capturing: null,         // {owner, progress}
    });
  }
}

// --- Coordinate math -----------------------------------------------------

function tileToScreen(tx, ty) {
  return {
    sx: (tx - ty) * (TILE_W / 2) + CAMERA_X,
    sy: (tx + ty) * (TILE_H / 2) + CAMERA_Y,
  };
}

function tileCenterScreen(tx, ty) {
  const { sx, sy } = tileToScreen(tx, ty);
  return { sx, sy: sy + TILE_H / 2 };
}

function screenToTile(sx, sy) {
  const x = sx - CAMERA_X;
  const y = sy - CAMERA_Y - TILE_H / 2;   // shift to tile-center space
  const tx = (x / (TILE_W / 2) + y / (TILE_H / 2)) / 2;
  const ty = (y / (TILE_H / 2) - x / (TILE_W / 2)) / 2;
  return { tx, ty };
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
}

function manhattan(ax, ay, bx, by) {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

function buildingAt(x, y) {
  for (const b of state.buildings) if (b.tx === x && b.ty === y && b.hp > 0) return b;
  return null;
}

function unitAt(x, y) {
  for (const u of state.units) if (Math.round(u.tx) === x && Math.round(u.ty) === y && u.hp > 0) return u;
  return null;
}

// --- Pathfinding (A*) ----------------------------------------------------

function isWalkable(x, y, flying, goalX, goalY) {
  if (!inBounds(x, y)) return false;
  const t = terrain[y][x];
  if (t === 'mountain') return false;
  if (t === 'water' && !flying) return false;
  const b = buildingAt(x, y);
  if (b && !(x === goalX && y === goalY)) return false;
  return true;
}

function findPath(startX, startY, goalX, goalY, flying) {
  if (startX === goalX && startY === goalY) return [];
  // If goal itself isn't accessible (e.g., mountain), bail
  if (!inBounds(goalX, goalY)) return [];
  const goalTerrain = terrain[goalY][goalX];
  if (goalTerrain === 'mountain') return [];
  if (goalTerrain === 'water' && !flying) return [];

  const key = (x, y) => y * MAP_W + x;
  const open = [{ x: startX, y: startY, g: 0, f: manhattan(startX, startY, goalX, goalY), parent: null }];
  const best = new Map();
  best.set(key(startX, startY), open[0]);
  const closed = new Set();

  let iters = 0;
  while (open.length && iters++ < 800) {
    // Find lowest-f
    let bestIdx = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bestIdx].f) bestIdx = i;
    const cur = open.splice(bestIdx, 1)[0];
    if (cur.x === goalX && cur.y === goalY) {
      const path = [];
      let n = cur;
      while (n.parent) { path.unshift({ x: n.x, y: n.y }); n = n.parent; }
      return path;
    }
    closed.add(key(cur.x, cur.y));
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (closed.has(key(nx, ny))) continue;
      if (!isWalkable(nx, ny, flying, goalX, goalY)) continue;
      const g = cur.g + 1;
      const prev = best.get(key(nx, ny));
      if (prev && prev.g <= g) continue;
      const node = { x: nx, y: ny, g, f: g + manhattan(nx, ny, goalX, goalY), parent: cur };
      best.set(key(nx, ny), node);
      open.push(node);
    }
  }
  return [];
}

// --- Units ---------------------------------------------------------------

function createUnit(owner, chassis, weapon, electronics, tx, ty) {
  const cd = CHASSIS[chassis];
  const ed = ELECTRONICS[electronics];
  const maxHp = Math.round(cd.hp * ed.hpMul);
  const unit = {
    id: state.nextId++,
    owner, chassis, weapon, electronics,
    tx, ty,
    hp: maxHp, maxHp,
    path: [], moveProgress: 0,
    target: null, orderedTarget: null, orderedTile: null,
    attackCooldown: 0,
    facing: owner === 'player' ? 1 : -1,
  };
  state.units.push(unit);
  return unit;
}

function unitInterpPos(u) {
  if (u.path.length > 0) {
    const next = u.path[0];
    return {
      x: u.tx + (next.x - u.tx) * u.moveProgress,
      y: u.ty + (next.y - u.ty) * u.moveProgress,
    };
  }
  return { x: u.tx, y: u.ty };
}

function targetTile(t) {
  if (!t) return null;
  return { x: Math.round(t.tx), y: Math.round(t.ty) };
}

function isAlive(t) { return t && t.hp > 0; }

function isHostileTo(a, b) {
  if (!a || !b) return false;
  if (a.owner === b.owner) return false;
  if (b.owner === 'neutral') return false;
  return true;
}

function distTiles(a, b) {
  return manhattan(Math.round(a.tx), Math.round(a.ty), Math.round(b.tx), Math.round(b.ty));
}

function findNearestHostile(unit) {
  // Enemy-owned units and buildings (NOT neutrals)
  let best = null, bestD = Infinity;
  for (const u of state.units) {
    if (u === unit || !isAlive(u) || u.owner === unit.owner || u.owner === 'neutral') continue;
    const d = distTiles(unit, u);
    if (d < bestD) { best = u; bestD = d; }
  }
  for (const b of state.buildings) {
    if (!isAlive(b) || b.owner === unit.owner || b.owner === 'neutral') continue;
    const d = distTiles(unit, b);
    if (d < bestD) { best = b; bestD = d; }
  }
  return best;
}

function findNearestNeutralBuilding(unit) {
  let best = null, bestD = Infinity;
  for (const b of state.buildings) {
    if (!isAlive(b) || b.owner !== 'neutral') continue;
    const d = distTiles(unit, b);
    if (d < bestD) { best = b; bestD = d; }
  }
  return best;
}

function fireWeapon(unit, target) {
  const w = WEAPONS[unit.weapon];
  if (!w || w.range === 0) return;
  const from = { x: unit.tx, y: unit.ty };
  const to = { x: target.tx, y: target.ty };
  if (w.proj === 'beam') {
    target.hp -= w.damage;
    state.effects.push({ type: 'beam', fromX: from.x, fromY: from.y, toX: to.x, toY: to.y, life: 0.18, maxLife: 0.18 });
    if (target.hp <= 0) onKilled(target, unit);
  } else {
    state.projectiles.push({
      kind: w.proj,
      x: from.x, y: from.y,
      tx: to.x, ty: to.y,
      target,
      damage: w.damage,
      speed: w.proj === 'missile' ? 5 : 9,
      life: 3,
    });
  }
  // Muzzle flash
  state.effects.push({ type: 'muzzle', fromX: from.x, fromY: from.y, life: 0.08, maxLife: 0.08 });
}

function onKilled(target, killer) {
  if (target.hp > 0) return;
  if (target._dead) return;
  target._dead = true;
  if (target.type) {
    // Building
    state.decorations.push({ type: 'rubble', tx: target.tx, ty: target.ty });
    // Check win/lose
    if (target.type === 'central') {
      if (target.owner === 'player') state.mode = 'lost';
      if (target.owner === 'enemy') state.mode = 'won';
    }
  } else {
    // Unit
    const pos = unitInterpPos(target);
    state.effects.push({ type: 'explosion', fromX: pos.x, fromY: pos.y, life: 0.6, maxLife: 0.6 });
  }
  if (state.selectedUnit === target) state.selectedUnit = null;
  if (state.selectedBuilding === target) state.selectedBuilding = null;
}

// --- Unit update ---------------------------------------------------------

function updateUnit(u, dt) {
  if (u.hp <= 0) return;
  u.attackCooldown = Math.max(0, u.attackCooldown - dt);

  const elec = ELECTRONICS[u.electronics];
  const weapon = WEAPONS[u.weapon];
  const chassis = CHASSIS[u.chassis];

  // Clear dead or same-owner (already captured) targets
  if (u.target && (!isAlive(u.target) || u.target.owner === u.owner)) u.target = null;
  if (u.orderedTarget && (!isAlive(u.orderedTarget) || u.orderedTarget.owner === u.owner)) u.orderedTarget = null;

  // Decide target
  let desiredTarget = null;
  if (u.orderedTarget) {
    desiredTarget = u.orderedTarget;
  } else if (elec.autonomous) {
    desiredTarget = findNearestHostile(u) || findNearestNeutralBuilding(u);
  } else if (!u.orderedTile && u.path.length === 0) {
    // Idle: auto-engage an in-range hostile
    const enemy = findNearestHostile(u);
    if (enemy && distTiles(u, enemy) <= weapon.range + 1) desiredTarget = enemy;
  }
  u.target = desiredTarget;

  // Is the current goal a capture-walk (neutral building or an explicit tile)?
  const captureTarget = (u.target && u.target.owner === 'neutral') ? u.target : null;

  // Try to attack (never fire at neutrals — capture them instead)
  if (u.target && u.target.owner !== 'neutral' && weapon.range > 0) {
    const d = distTiles(u, u.target);
    if (d <= weapon.range && u.attackCooldown === 0) {
      fireWeapon(u, u.target);
      u.attackCooldown = weapon.cooldown;
      u.facing = u.target.tx >= u.tx ? 1 : -1;
    }
  }

  // Path progression
  if (u.path.length > 0) {
    u.moveProgress += chassis.speed * dt;
    while (u.moveProgress >= 1 && u.path.length > 0) {
      u.tx = u.path[0].x;
      u.ty = u.path[0].y;
      u.path.shift();
      u.moveProgress -= 1;
      if (u.path.length > 0) u.facing = u.path[0].x >= u.tx ? 1 : -1;
    }
    if (u.path.length === 0) u.moveProgress = 0;
    if (u.orderedTile && Math.round(u.tx) === u.orderedTile.x && Math.round(u.ty) === u.orderedTile.y && u.path.length === 0) {
      u.orderedTile = null;
    }
  } else {
    // Not moving: decide where to go
    let goal = null;
    let walkOnto = false;    // true: we must end up ON the goal tile (capture/move order)
    if (u.orderedTile) { goal = u.orderedTile; walkOnto = true; }
    else if (u.orderedTarget) {
      goal = targetTile(u.orderedTarget);
      if (u.orderedTarget.owner === 'neutral') walkOnto = true;
    }
    else if (captureTarget) { goal = targetTile(captureTarget); walkOnto = true; }
    else if (u.target) { goal = targetTile(u.target); }

    if (goal) {
      const cx = Math.round(u.tx), cy = Math.round(u.ty);
      const d = manhattan(cx, cy, goal.x, goal.y);
      const needMove = walkOnto ? (cx !== goal.x || cy !== goal.y) : d > weapon.range;
      if (needMove) {
        const path = findPath(cx, cy, goal.x, goal.y, chassis.flying);
        if (path.length > 0) {
          u.path = path;
          u.moveProgress = 0;
          u.facing = path[0].x >= u.tx ? 1 : -1;
        }
      }
    }
  }

  // Capture buildings stepped on
  if (u.path.length === 0) {
    const b = buildingAt(Math.round(u.tx), Math.round(u.ty));
    if (b && b.owner !== u.owner) {
      if (!b.capturing || b.capturing.owner !== u.owner) {
        b.capturing = { owner: u.owner, progress: 0 };
      }
      b.capturing.progress += dt / 2.0;   // 2 seconds to capture
      if (b.capturing.progress >= 1) {
        b.owner = u.owner;
        b.capturing = null;
        if (u.orderedTile && u.orderedTile.x === b.tx && u.orderedTile.y === b.ty) u.orderedTile = null;
        if (u.orderedTarget === b) u.orderedTarget = null;
      }
    } else if (b && b.owner === u.owner && b.capturing) {
      b.capturing = null;
    }
  }
}

// --- Buildings update ----------------------------------------------------

function updateBuilding(b, dt) {
  if (b.hp <= 0) return;

  // Clear capture if no unit on tile
  if (b.capturing) {
    const u = unitAt(b.tx, b.ty);
    if (!u || u.owner !== b.capturing.owner) {
      b.capturing = null;
    }
  }

  // Production: mines produce materials for owner
  if (b.owner === 'player' || b.owner === 'enemy') {
    if (b.type === 'mine') {
      state.res[b.owner].mat += 1.0 * dt;
    } else if (b.type === 'warehouse') {
      state.res[b.owner].mat += 0.4 * dt;
    }
  }

  // Factory build queue
  if (b.type === 'factory' && b.buildQueue && (b.owner === 'player' || b.owner === 'enemy')) {
    b.buildQueue.progress += dt;
    if (b.buildQueue.progress >= b.buildQueue.total) {
      // Find free adjacent tile
      const adj = findFreeAdjacentTile(b.tx, b.ty, CHASSIS[b.buildQueue.chassis].flying);
      if (adj) {
        createUnit(b.owner, b.buildQueue.chassis, b.buildQueue.weapon, b.buildQueue.electronics, adj.x, adj.y);
        b.buildQueue = null;
      }
      // If no free tile, keep queue frozen until one opens up
    }
  }
}

function findFreeAdjacentTile(bx, by, flying) {
  const candidates = [[0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]];
  for (const [dx, dy] of candidates) {
    const x = bx + dx, y = by + dy;
    if (!inBounds(x, y)) continue;
    const t = terrain[y][x];
    if (t === 'mountain') continue;
    if (t === 'water' && !flying) continue;
    if (buildingAt(x, y)) continue;
    if (unitAt(x, y)) continue;
    return { x, y };
  }
  return null;
}

// --- AI ------------------------------------------------------------------

function updateAI(dt) {
  state.aiBuildTimer -= dt;
  if (state.aiBuildTimer > 0) return;
  state.aiBuildTimer = 5 + Math.random() * 3;

  // Enemy: try to build a robot at a random owned factory
  const factories = state.buildings.filter(b => b.owner === 'enemy' && b.type === 'factory' && b.hp > 0 && !b.buildQueue);
  if (factories.length === 0) return;

  const mat = state.res.enemy.mat;

  // Pick a random affordable config
  const chassisPool = ['bipod', 'tripod', 'quad', 'antigrav'];
  const weaponPool = ['cannon', 'missile', 'phaser'];
  const options = [];
  for (const c of chassisPool) {
    for (const w of weaponPool) {
      const cost = CHASSIS[c].cost + WEAPONS[w].cost + ELECTRONICS.ai.cost;
      if (cost <= mat) options.push({ chassis: c, weapon: w, electronics: 'ai', cost });
    }
  }
  if (options.length === 0) return;

  const pick = options[Math.floor(Math.random() * options.length)];
  const fac = factories[Math.floor(Math.random() * factories.length)];
  state.res.enemy.mat -= pick.cost;
  fac.buildQueue = {
    chassis: pick.chassis, weapon: pick.weapon, electronics: pick.electronics,
    progress: 0, total: pick.cost * 0.45,
  };
}

// --- Projectiles & effects -----------------------------------------------

function updateProjectiles(dt) {
  for (const p of state.projectiles) {
    p.life -= dt;
    if (p.life <= 0) { p.dead = true; continue; }
    let goalX, goalY;
    if (isAlive(p.target)) {
      const pos = p.target.type ? { x: p.target.tx, y: p.target.ty } : unitInterpPos(p.target);
      goalX = pos.x; goalY = pos.y;
      p.tx = goalX; p.ty = goalY;
    } else {
      goalX = p.tx; goalY = p.ty;
    }
    const dx = goalX - p.x, dy = goalY - p.y;
    const dist = Math.hypot(dx, dy);
    const step = p.speed * dt;
    if (dist <= step) {
      if (isAlive(p.target)) {
        p.target.hp -= p.damage;
        state.effects.push({ type: 'explosion', fromX: goalX, fromY: goalY, life: 0.4, maxLife: 0.4 });
        if (p.target.hp <= 0) onKilled(p.target, null);
      }
      p.dead = true;
    } else {
      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;
    }
  }
  state.projectiles = state.projectiles.filter(p => !p.dead);
}

function updateEffects(dt) {
  for (const e of state.effects) e.life -= dt;
  state.effects = state.effects.filter(e => e.life > 0);
}

// --- Input ---------------------------------------------------------------

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function onKey(e, down) {
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup')    { state.input.up = down; e.preventDefault(); }
  if (k === 's' || k === 'arrowdown')  { state.input.down = down; e.preventDefault(); }
  if (k === 'a' || k === 'arrowleft')  { state.input.left = down; e.preventDefault(); }
  if (k === 'd' || k === 'arrowright') { state.input.right = down; e.preventDefault(); }
  if (down && k === 'escape') deselect();
}
window.addEventListener('keydown', e => onKey(e, true));
window.addEventListener('keyup', e => onKey(e, false));

canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  const sx = (e.clientX - r.left) * (canvas.width / r.width);
  const sy = (e.clientY - r.top) * (canvas.height / r.height);
  state.mouse.sx = sx; state.mouse.sy = sy;
  const { tx, ty } = screenToTile(sx, sy);
  state.mouse.tx = Math.round(tx);
  state.mouse.ty = Math.round(ty);
});

canvas.addEventListener('mousedown', e => {
  if (state.mode !== 'playing') return;
  const r = canvas.getBoundingClientRect();
  const sx = (e.clientX - r.left) * (canvas.width / r.width);
  const sy = (e.clientY - r.top) * (canvas.height / r.height);
  const { tx, ty } = screenToTile(sx, sy);
  const x = Math.round(tx), y = Math.round(ty);
  if (e.button === 2) { deselect(); e.preventDefault(); return; }
  if (e.button !== 0) return;
  handleLeftClick(x, y);
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

function handleLeftClick(x, y) {
  if (!inBounds(x, y)) { deselect(); return; }

  const clickedUnit = unitAt(x, y);
  const clickedBuilding = buildingAt(x, y);

  // If we have a unit selected, issue an order
  if (state.selectedUnit && state.selectedUnit.hp > 0 && state.selectedUnit.owner === 'player') {
    const u = state.selectedUnit;
    if (clickedUnit && clickedUnit.owner !== 'player' && clickedUnit.hp > 0) {
      u.orderedTarget = clickedUnit; u.orderedTile = null;
      return;
    }
    if (clickedBuilding && clickedBuilding.owner !== 'player' && clickedBuilding.hp > 0) {
      // Attack if has weapon, else capture
      if (WEAPONS[u.weapon].range > 0 && clickedBuilding.owner === 'enemy') {
        u.orderedTarget = clickedBuilding; u.orderedTile = null;
      } else {
        u.orderedTarget = null;
        u.orderedTile = { x, y };
      }
      return;
    }
    // Move order to empty / own tile
    u.orderedTarget = null;
    u.orderedTile = { x, y };
    u.target = null;
    return;
  }

  // No unit selected: select something
  if (clickedUnit && clickedUnit.owner === 'player') {
    state.selectedUnit = clickedUnit;
    state.selectedBuilding = null;
    renderPanel();
    return;
  }
  if (clickedBuilding && clickedBuilding.owner === 'player') {
    state.selectedBuilding = clickedBuilding;
    state.selectedUnit = null;
    renderPanel();
    return;
  }
  // Select enemy/neutral building for info
  if (clickedBuilding) {
    state.selectedBuilding = clickedBuilding;
    state.selectedUnit = null;
    renderPanel();
    return;
  }
  deselect();
}

function deselect() {
  state.selectedUnit = null;
  state.selectedBuilding = null;
  renderPanel();
}

// --- Platform movement ---------------------------------------------------

function updatePlatform(dt) {
  const speed = 5;
  let dx = 0, dy = 0;
  if (state.input.up) dy -= 1;
  if (state.input.down) dy += 1;
  if (state.input.left) dx -= 1;
  if (state.input.right) dx += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
    state.platform.x += dx * speed * dt;
    state.platform.y += dy * speed * dt;
    state.platform.x = Math.max(0, Math.min(MAP_W - 1, state.platform.x));
    state.platform.y = Math.max(0, Math.min(MAP_H - 1, state.platform.y));
  }
}

// --- Build menu UI -------------------------------------------------------

const panel = document.getElementById('panel-content');

function calcCost(sel) {
  return CHASSIS[sel.chassis].cost + WEAPONS[sel.weapon].cost + ELECTRONICS[sel.electronics].cost;
}

function renderPanel() {
  const sel = state.buildSelection;
  if (state.selectedBuilding) {
    const b = state.selectedBuilding;
    const def = BUILDINGS[b.type];
    const ownerColor = b.owner === 'player' ? '#6aaaff' : b.owner === 'enemy' ? '#ff7a5a' : '#aaaaaa';
    const ownerTxt = b.owner === 'player' ? 'YOURS' : b.owner === 'enemy' ? 'ENEMY' : 'NEUTRAL';
    let html = `<div class="title">${def.name} <span style="color:${ownerColor};font-size:11px;">[${ownerTxt}]</span></div>`;
    html += `<div class="row dim">HP: ${Math.ceil(b.hp)} / ${b.maxHp}</div>`;
    if (b.type === 'factory' && b.owner === 'player') {
      html += buildMenuHTML();
      if (b.buildQueue) {
        const pct = Math.round(100 * b.buildQueue.progress / b.buildQueue.total);
        html += `<div id="progress"><div style="width:${pct}%"></div></div>`;
        html += `<div class="row dim">Building ${b.buildQueue.chassis} / ${b.buildQueue.weapon} / ${b.buildQueue.electronics} &mdash; ${pct}%</div>`;
      }
    } else if (b.type === 'factory') {
      html += `<div class="row dim">Capture this factory to build robots.</div>`;
    } else if (b.type === 'mine') {
      html += `<div class="row dim">Produces +1 material/sec for owner.</div>`;
    } else if (b.type === 'warehouse') {
      html += `<div class="row dim">Produces +0.4 material/sec for owner.</div>`;
    } else if (b.type === 'nuclear') {
      html += `<div class="row dim">Provides power to nearby facilities.</div>`;
    } else if (b.type === 'central') {
      html += `<div class="row dim">${b.owner === 'player' ? 'DEFEND IT.' : 'DESTROY IT TO WIN.'}</div>`;
    }
    panel.innerHTML = html;
    attachBuildMenuHandlers();
  } else if (state.selectedUnit) {
    const u = state.selectedUnit;
    const ownerColor = u.owner === 'player' ? '#6aaaff' : '#ff7a5a';
    const ownerTxt = u.owner === 'player' ? 'YOURS' : 'ENEMY';
    let html = `<div class="title">Robot <span style="color:${ownerColor};font-size:11px;">[${ownerTxt}]</span></div>`;
    html += `<div class="row dim">Chassis: <b>${CHASSIS[u.chassis].name}</b> · Weapon: <b>${WEAPONS[u.weapon].name}</b> · Brain: <b>${ELECTRONICS[u.electronics].name}</b></div>`;
    html += `<div class="row dim">HP: ${Math.ceil(u.hp)} / ${u.maxHp}${ELECTRONICS[u.electronics].autonomous ? ' · <span style="color:#ffc44a">AI autonomous</span>' : ''}</div>`;
    html += `<div class="row dim">Left-click a tile to move, enemy to attack.</div>`;
    panel.innerHTML = html;
  } else {
    panel.innerHTML = `<div class="title">Briefing</div><div class="row dim">Click an <span class="player-color">own factory</span> to build robots. Click an <span class="player-color">own robot</span> to select and issue orders. Capture enemy/neutral buildings by walking onto them.</div>`;
  }
}

function buildMenuHTML() {
  const sel = state.buildSelection;
  const mat = Math.floor(state.res.player.mat);
  const cost = calcCost(sel);
  const affordable = mat >= cost;
  const rowBtns = (group, opts) => opts.map(p => {
    const name = group === 'chassis' ? CHASSIS[p].name
               : group === 'weapon' ? WEAPONS[p].name
               : ELECTRONICS[p].name;
    const c = group === 'chassis' ? CHASSIS[p].cost
            : group === 'weapon' ? WEAPONS[p].cost
            : ELECTRONICS[p].cost;
    return `<button class="pbtn ${sel[group] === p ? 'sel' : ''}" data-g="${group}" data-p="${p}">${name} <span class="dim">(${c})</span></button>`;
  }).join('');
  return `
    <div class="row"><span class="lbl">Chassis:</span>${rowBtns('chassis', ['bipod','tripod','quad','antigrav'])}</div>
    <div class="row"><span class="lbl">Weapon:</span>${rowBtns('weapon', ['none','cannon','missile','phaser'])}</div>
    <div class="row"><span class="lbl">Brain:</span>${rowBtns('electronics', ['basic','nuclear','ai'])}</div>
    <div class="row">
      <button id="build-btn" ${affordable ? '' : 'disabled'}>BUILD</button>
      <span id="cost">cost: ${cost} mat  (you have ${mat})</span>
    </div>`;
}

function attachBuildMenuHandlers() {
  panel.querySelectorAll('.pbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = btn.dataset.g, p = btn.dataset.p;
      state.buildSelection[g] = p;
      renderPanel();
    });
  });
  const bb = panel.querySelector('#build-btn');
  if (bb) bb.addEventListener('click', doBuild);
}

function doBuild() {
  const b = state.selectedBuilding;
  if (!b || b.type !== 'factory' || b.owner !== 'player' || b.hp <= 0) return;
  if (b.buildQueue) return;
  const sel = state.buildSelection;
  const cost = calcCost(sel);
  if (state.res.player.mat < cost) return;
  state.res.player.mat -= cost;
  b.buildQueue = {
    chassis: sel.chassis, weapon: sel.weapon, electronics: sel.electronics,
    progress: 0, total: cost * 0.45,
  };
  renderPanel();
}

// --- HUD -----------------------------------------------------------------

const hudEls = {
  mat: document.getElementById('s-mat'),
  inc: document.getElementById('s-inc'),
  mines: document.getElementById('s-mines'),
  react: document.getElementById('s-react'),
  ware: document.getElementById('s-ware'),
  fac: document.getElementById('s-fac'),
  rob: document.getElementById('s-rob'),
  emat: document.getElementById('s-emat'),
  erob: document.getElementById('s-erob'),
};

function updateHUD() {
  const mines = state.buildings.filter(b => b.owner === 'player' && b.type === 'mine' && b.hp > 0).length;
  const react = state.buildings.filter(b => b.owner === 'player' && b.type === 'nuclear' && b.hp > 0).length;
  const ware  = state.buildings.filter(b => b.owner === 'player' && b.type === 'warehouse' && b.hp > 0).length;
  const fac   = state.buildings.filter(b => b.owner === 'player' && b.type === 'factory' && b.hp > 0).length;
  const rob   = state.units.filter(u => u.owner === 'player' && u.hp > 0).length;
  const erob  = state.units.filter(u => u.owner === 'enemy' && u.hp > 0).length;
  hudEls.mat.textContent = Math.floor(state.res.player.mat);
  hudEls.inc.textContent = (mines + ware * 0.4).toFixed(1) + '/s';
  hudEls.mines.textContent = mines;
  hudEls.react.textContent = react;
  hudEls.ware.textContent = ware;
  hudEls.fac.textContent = fac;
  hudEls.rob.textContent = rob;
  hudEls.emat.textContent = Math.floor(state.res.enemy.mat);
  hudEls.erob.textContent = erob;
}

// --- Rendering -----------------------------------------------------------

function render() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Layer 1: ground tiles (diamond fill) in row-major order
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const t = terrain[y][x];
      if (t === 'mountain') continue;    // drawn later
      const { sx, sy } = tileToScreen(x, y);
      const spriteName = t === 'water' ? 'tile_water' : t === 'road' ? 'tile_road' : 'tile_grass';
      const img = SPRITES[spriteName];
      ctx.drawImage(img, sx - img.width / 2, sy);
    }
  }

  // Hover highlight (under entities)
  if (inBounds(state.mouse.tx, state.mouse.ty) && state.mode === 'playing') {
    const t = terrain[state.mouse.ty][state.mouse.tx];
    if (t !== 'mountain') {
      const { sx, sy } = tileToScreen(state.mouse.tx, state.mouse.ty);
      let cur = SPRITES.cursor;
      if (state.selectedUnit && state.selectedUnit.owner === 'player') {
        const hoverU = unitAt(state.mouse.tx, state.mouse.ty);
        const hoverB = buildingAt(state.mouse.tx, state.mouse.ty);
        if ((hoverU && hoverU.owner !== 'player') || (hoverB && hoverB.owner === 'enemy')) cur = SPRITES.cursor_attack;
        else cur = SPRITES.cursor_move;
      }
      ctx.drawImage(cur, sx - cur.width / 2, sy);
    }
  }

  // Selection highlight under selected
  if (state.selectedUnit) drawSelectionDiamond(state.selectedUnit.tx, state.selectedUnit.ty, '#ffe87a');
  if (state.selectedBuilding) drawSelectionDiamond(state.selectedBuilding.tx, state.selectedBuilding.ty, '#ffe87a');

  // Decorations (rubble) — below buildings/units but above tiles
  for (const d of state.decorations) {
    if (d.type === 'rubble') {
      const { sx, sy } = tileToScreen(d.tx, d.ty);
      const img = SPRITES.rubble;
      ctx.drawImage(img, sx - img.width / 2, sy - (img.height - TILE_H));
    }
  }

  // Build depth-sorted draw list
  const items = [];
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (terrain[y][x] === 'mountain') items.push({ d: x + y - 0.1, kind: 'mountain', x, y });
    }
  }
  for (const b of state.buildings) {
    if (b.hp <= 0) continue;
    items.push({ d: b.tx + b.ty, kind: 'building', b });
  }
  for (const u of state.units) {
    if (u.hp <= 0) continue;
    const pos = unitInterpPos(u);
    items.push({ d: pos.x + pos.y + 0.2, kind: 'unit', u, pos });
  }
  // Platform
  items.push({ d: state.platform.x + state.platform.y + 0.3, kind: 'platform' });
  // Projectiles
  for (const p of state.projectiles) items.push({ d: p.x + p.y + 0.4, kind: 'projectile', p });
  // Effects (beams/explosions) always on top
  items.push({ d: 99999, kind: 'effects' });

  items.sort((a, b) => a.d - b.d);
  for (const it of items) drawItem(it);

  // Overlay: game messages
  if (state.mode !== 'playing') drawMessage();
}

function drawSelectionDiamond(tx, ty, color) {
  const { sx, sy } = tileToScreen(tx, ty);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(sx, sy + 2);
  ctx.lineTo(sx + TILE_W / 2 - 2, sy + TILE_H / 2);
  ctx.lineTo(sx, sy + TILE_H - 2);
  ctx.lineTo(sx - TILE_W / 2 + 2, sy + TILE_H / 2);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawItem(it) {
  if (it.kind === 'mountain') {
    const { sx, sy } = tileToScreen(it.x, it.y);
    const img = SPRITES.tile_mountain;
    ctx.drawImage(img, sx - img.width / 2, sy - (img.height - TILE_H));
  } else if (it.kind === 'building') {
    drawBuilding(it.b);
  } else if (it.kind === 'unit') {
    drawUnit(it.u, it.pos);
  } else if (it.kind === 'platform') {
    drawPlatform();
  } else if (it.kind === 'projectile') {
    drawProjectile(it.p);
  } else if (it.kind === 'effects') {
    drawEffects();
  }
}

function drawBuilding(b) {
  const def = BUILDINGS[b.type];
  const { sx, sy } = tileToScreen(b.tx, b.ty);
  const img = SPRITES[def.sprite + '_' + b.owner];
  if (!img) return;
  const drawX = sx - img.width / 2;
  const drawY = sy - def.anchor;
  ctx.drawImage(img, drawX, drawY);
  // Capture flash
  if (b.capturing) {
    const pct = b.capturing.progress;
    ctx.save();
    ctx.fillStyle = b.capturing.owner === 'player' ? 'rgba(106,170,255,0.25)' : 'rgba(255,122,90,0.25)';
    ctx.fillRect(drawX, drawY, img.width, img.height);
    ctx.restore();
    // progress bar
    const bw = img.width * 0.7;
    const bx = sx - bw / 2;
    const by = drawY - 8;
    ctx.fillStyle = '#000';
    ctx.fillRect(bx - 1, by - 1, bw + 2, 5);
    ctx.fillStyle = b.capturing.owner === 'player' ? '#6aaaff' : '#ff7a5a';
    ctx.fillRect(bx, by, bw * pct, 3);
  }
  // HP bar if damaged
  if (b.hp < b.maxHp) {
    const bw = Math.min(img.width * 0.6, 60);
    const bx = sx - bw / 2;
    const by = drawY - 4;
    ctx.fillStyle = '#000';
    ctx.fillRect(bx - 1, by - 1, bw + 2, 4);
    ctx.fillStyle = '#aa2020';
    ctx.fillRect(bx, by, bw, 2);
    ctx.fillStyle = b.hp > b.maxHp * 0.4 ? '#60c060' : '#ffa040';
    ctx.fillRect(bx, by, bw * (b.hp / b.maxHp), 2);
  }
}

function drawUnit(u, pos) {
  const cd = CHASSIS[u.chassis];
  const wd = WEAPONS[u.weapon];
  const img = SPRITES[cd.sprite + '_' + u.owner];
  if (!img) return;
  const scx = (pos.x - pos.y) * (TILE_W / 2) + CAMERA_X;
  const scy = (pos.x + pos.y) * (TILE_H / 2) + CAMERA_Y + TILE_H / 2;

  const cx = scx - img.width / 2;
  const cy = scy - img.height;

  // Draw chassis, optionally mirrored by facing
  if (u.facing < 0) {
    ctx.save();
    ctx.translate(scx, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, -img.width / 2, cy);
    ctx.restore();
  } else {
    ctx.drawImage(img, cx, cy);
  }

  // Weapon
  if (wd.sprite) {
    const wimg = SPRITES[wd.sprite];
    if (wimg) {
      const wx = scx - wimg.width / 2;
      const wy = cy + cd.turretY - wimg.height;
      if (u.facing < 0) {
        ctx.save();
        ctx.translate(scx, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(wimg, -wimg.width / 2, wy);
        ctx.restore();
      } else {
        ctx.drawImage(wimg, wx, wy);
      }
    }
  }

  // HP bar
  if (u.hp < u.maxHp) {
    const bw = 22;
    const bx = scx - bw / 2;
    const by = cy - 5;
    ctx.fillStyle = '#000';
    ctx.fillRect(bx - 1, by - 1, bw + 2, 4);
    ctx.fillStyle = '#aa2020';
    ctx.fillRect(bx, by, bw, 2);
    ctx.fillStyle = u.hp > u.maxHp * 0.4 ? '#60c060' : '#ffa040';
    ctx.fillRect(bx, by, bw * (u.hp / u.maxHp), 2);
  }

  // AI indicator dot
  if (ELECTRONICS[u.electronics].autonomous) {
    ctx.fillStyle = '#ffc44a';
    ctx.beginPath();
    ctx.arc(scx + 10, cy + 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlatform() {
  const p = state.platform;
  const scx = (p.x - p.y) * (TILE_W / 2) + CAMERA_X;
  const scy = (p.x + p.y) * (TILE_H / 2) + CAMERA_Y + TILE_H / 2;
  const hover = 12 + Math.sin(state.time * 3) * 1.5;
  const img = SPRITES.platform;
  ctx.drawImage(img, scx - img.width / 2, scy - img.height - hover);
  // Shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(scx, scy - 2, 18, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawProjectile(p) {
  const scx = (p.x - p.y) * (TILE_W / 2) + CAMERA_X;
  const scy = (p.x + p.y) * (TILE_H / 2) + CAMERA_Y + TILE_H / 2 - 12;
  if (p.kind === 'shell') {
    const img = SPRITES.shell;
    ctx.drawImage(img, scx - 4, scy - 4);
  } else if (p.kind === 'missile') {
    const img = SPRITES.missile_proj;
    ctx.drawImage(img, scx - 8, scy - 3);
  }
}

function drawEffects() {
  for (const e of state.effects) {
    const scx = (e.fromX - e.fromY) * (TILE_W / 2) + CAMERA_X;
    const scy = (e.fromX + e.fromY) * (TILE_H / 2) + CAMERA_Y + TILE_H / 2 - 12;
    if (e.type === 'beam') {
      const tcx = (e.toX - e.toY) * (TILE_W / 2) + CAMERA_X;
      const tcy = (e.toX + e.toY) * (TILE_H / 2) + CAMERA_Y + TILE_H / 2 - 14;
      const a = e.life / e.maxLife;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = '#c8e8ff';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(scx, scy); ctx.lineTo(tcx, tcy); ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(scx, scy); ctx.lineTo(tcx, tcy); ctx.stroke();
      ctx.restore();
    } else if (e.type === 'explosion') {
      const a = e.life / e.maxLife;
      const s = 1 - a * 0.5;
      const img = SPRITES.explosion;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.drawImage(img, scx - (img.width * s) / 2, scy - (img.height * s) / 2, img.width * s, img.height * s);
      ctx.restore();
    } else if (e.type === 'muzzle') {
      ctx.save();
      ctx.fillStyle = 'rgba(255,220,120,' + (e.life / e.maxLife) + ')';
      ctx.beginPath(); ctx.arc(scx, scy, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
}

function drawMessage() {
  const msg = state.mode === 'won' ? 'VICTORY' : 'DEFEAT';
  const sub = state.mode === 'won' ? 'Enemy Central Computer destroyed.' : 'Your Central Computer was destroyed.';
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = state.mode === 'won' ? '#ffe87a' : '#ff7a5a';
  ctx.font = 'bold 56px Courier New, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(msg, CANVAS_W / 2, CANVAS_H / 2 - 16);
  ctx.fillStyle = '#ccc';
  ctx.font = '18px Courier New, monospace';
  ctx.fillText(sub, CANVAS_W / 2, CANVAS_H / 2 + 16);
  ctx.fillStyle = '#999';
  ctx.font = '14px Courier New, monospace';
  ctx.fillText('Click to restart', CANVAS_W / 2, CANVAS_H / 2 + 48);
  ctx.restore();
}

// Click on the victory / defeat overlay to restart
canvas.addEventListener('click', () => {
  if (state.mode === 'playing') return;
  // Reset state in-place
  state.buildings = [];
  state.units = [];
  state.projectiles = [];
  state.effects = [];
  state.decorations = [];
  state.selectedUnit = null;
  state.selectedBuilding = null;
  state.res = { player: { mat: 30 }, enemy: { mat: 35 } };
  state.platform = { x: 3.5, y: 2.5 };
  state.time = 0;
  state.aiBuildTimer = 3;
  state.mode = 'playing';
  initBuildings();
  renderPanel();
});

// --- Main loop -----------------------------------------------------------

let lastT = 0;
let panelRefreshTimer = 0;

function tick(t) {
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0);
  lastT = t;

  if (state.mode === 'playing') {
    state.time += dt;
    updatePlatform(dt);
    for (const u of state.units) updateUnit(u, dt);
    for (const b of state.buildings) updateBuilding(b, dt);
    updateProjectiles(dt);
    updateEffects(dt);
    updateAI(dt);
    // Remove dead
    state.units = state.units.filter(u => u.hp > 0);
    // Keep destroyed buildings out of selection but leave rubble decoration
    state.buildings = state.buildings.filter(b => b.hp > 0);
  }

  render();
  updateHUD();

  panelRefreshTimer += dt;
  if (panelRefreshTimer > 0.2) {
    panelRefreshTimer = 0;
    if (state.selectedBuilding && state.selectedBuilding.hp > 0) renderPanel();
  }

  requestAnimationFrame(tick);
}

// --- Bootstrap -----------------------------------------------------------

loadSprites().then(() => {
  initBuildings();
  renderPanel();
  requestAnimationFrame(tick);
}).catch(err => {
  console.error(err);
  panel.innerHTML = '<div class="title">Error</div><div class="row">Failed to load sprites: ' + err + '</div>';
});
