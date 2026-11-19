import test from 'node:test';
import assert from 'node:assert/strict';

class ClassList {
  values = new Set();
  add(...names) { names.forEach((n) => this.values.add(n)); }
  remove(...names) { names.forEach((n) => this.values.delete(n)); }
  contains(n) { return this.values.has(n); }
  toggle(n, force) {
    const on = force === undefined ? !this.values.has(n) : Boolean(force);
    on ? this.values.add(n) : this.values.delete(n);
    return on;
  }
}

let nonFiniteRects = 0;
const context2d = new Proxy({
  imageSmoothingEnabled: false,
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  fillStyle: '#000',
  fillRect(x, y, w, h) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) {
      nonFiniteRects += 1;
    }
  },
  clearRect() {},
  drawImage() {},
  measureText: () => ({ width: 10 }),
  createLinearGradient: () => ({ addColorStop() {} }),
  createRadialGradient: () => ({ addColorStop() {} }),
}, {
  get: (o, k) => (k in o ? o[k] : () => {}),
  set: (o, k, v) => ((o[k] = v), true),
});

class FakeElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.dataset = {};
    this.style = new Proxy({ cursor: '' }, { get: (o, k) => o[k] ?? '', set: (o, k, v) => ((o[k] = v), true) });
    this.classList = new ClassList();
    this.attributes = {};
    this.listeners = new Map();
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.width = 640;
    this.height = 360;
    this.files = [];
    this.parentElement = null;
    this.isConnected = true;
    this.checked = false;
  }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }
  removeEventListener() {}
  dispatch(type, event) {
    for (const fn of this.listeners.get(type) ?? []) {
      fn(event);
    }
  }
  appendChild(c) { this.children.push(c); c.parentElement = this; return c; }
  append(...cs) { cs.forEach((c) => this.appendChild(c)); }
  replaceChildren(...cs) { this.children = []; this.append(...cs); }
  remove() {}
  click() {}
  focus() {}
  blur() {}
  reset() {}
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] ?? null; }
  removeAttribute(k) { delete this.attributes[k]; }
  setCustomValidity() {}
  reportValidity() { return true; }
  contains() { return false; }
  closest() { return null; }
  querySelector() { return new FakeElement(); }
  querySelectorAll() { return []; }
  getBoundingClientRect() {
    return this.id === 'habitatCanvas'
      ? { left: 0, top: 0, right: 1920, bottom: 1080, width: 1920, height: 1080 }
      : { left: 0, top: 0, right: 100, bottom: 40, width: 100, height: 40 };
  }
  getClientRects() { return [{ width: 1, height: 1 }]; }
  getContext() { return context2d; }
  get className() { return [...this.classList.values].join(' '); }
  set className(v) { this.classList.values = new Set(String(v).split(/\s+/).filter(Boolean)); }
}

const elements = new Map();
const getElement = (id) => {
  if (!elements.has(id)) {
    const el = new FakeElement(id === 'habitatCanvas' ? 'canvas' : 'div');
    el.id = id;
    elements.set(id, el);
  }
  return elements.get(id);
};

const storage = new Map();
const media = { matches: false, addEventListener() {}, addListener() {} };
const windowMock = {
  innerWidth: 1920,
  innerHeight: 1080,
  devicePixelRatio: 1,
  __weArcticChristmas: true,
  addEventListener() {},
  removeEventListener() {},
  matchMedia: () => media,
  location: { reload() {} },
  confirm: () => true,
};
const documentMock = {
  body: getElement('body'),
  hidden: false,
  documentElement: new FakeElement('html'),
  getElementById: getElement,
  querySelectorAll: () => [],
  querySelector: () => new FakeElement(),
  createElement: (tag) => new FakeElement(tag),
  createDocumentFragment: () => new FakeElement('fragment'),
  addEventListener() {},
  removeEventListener() {},
};

Object.assign(globalThis, {
  document: documentMock,
  window: windowMock,
  localStorage: {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    key: (i) => [...storage.keys()][i] ?? null,
    get length() { return storage.size; },
  },
  requestAnimationFrame: () => 1,
  cancelAnimationFrame() {},
  matchMedia: () => media,
  fetch: () => new Promise(() => {}),
  setInterval: () => 1,
  clearInterval() {},
  setTimeout: () => 1,
  clearTimeout() {},
  URL: globalThis.URL,
  Blob: globalThis.Blob,
});

const stateMod = await import('../js/07-habitat-state.js');
const sceneryMod = await import('../js/09-scenery.js');
await import('../js/habitat-interactions.js');
const wildlifeMod = await import('../js/habitat-ambient-wildlife.js');
const { getGroundY } = await import('../js/habitat-geometry.js');
const { getArcticLedges } = await import('../js/arctic-geometry.js');

const { HABITATS, PIXEL_SCALE, pw, ph, canvas, stimuli, setCurrentHabitatIndex } = stateMod;
const { drawHabitatEnvironment } = sceneryMod;
const { hasAmbientWildlifeAt, getAmbientReaction } = wildlifeMod;

test('clicking ambient wildlife triggers reaction without dropping food while open clicks still drop food across all 8 biomes', () => {
  nonFiniteRects = 0;

  const scenarios = [
    {
      id: 'bees',
      reactionId: 'meadow_bear',
      target: () => {
        const x = Math.max(Math.round(pw * 0.27), 146);
        const gy = getGroundY(x, 'meadow', pw, ph) + 1;
        return { x, y: gy - 18 };
      },
      open: { x: 340, y: 60 },
    },
    {
      id: 'betta',
      reactionId: 'betta_axolotl',
      target: () => {
        const x = Math.min(Math.round(pw * 0.69), pw - 142);
        return { x, y: ph - 26 };
      },
      open: { x: 320, y: 120 },
    },
    {
      id: 'dragonfly',
      reactionId: 'wetland_heron',
      target: () => ({ x: Math.max(Math.round(pw * 0.30), 146), y: ph - 34 }),
      open: { x: 380, y: 90 },
    },
    {
      id: 'butterfly',
      reactionId: 'botanical_cat',
      target: () => {
        const x = Math.min(Math.round(pw * 0.68), pw - 142);
        const gy = getGroundY(x, 'botanical', pw, ph) + 1;
        return { x, y: gy - 12 };
      },
      open: { x: 320, y: 70 },
    },
    {
      id: 'jellyfish',
      reactionId: 'reef_octopus',
      target: () => {
        const x = Math.max(Math.round(pw * 0.30), 146);
        const nx = x / Math.max(1, pw);
        const mound = nx < 0.26 ? Math.pow((0.26 - nx) / 0.26, 1.5) * 34 : 0;
        const gy = Math.round(getGroundY(x, 'reef', pw, ph) - mound) - 2;
        return { x, y: gy - 14 };
      },
      open: { x: 320, y: 100 },
    },
    {
      id: 'koi',
      reactionId: 'koi_loch_ness',
      target: () => ({
        x: Math.round(pw * 0.16) - 10,
        y: Math.round(ph * 0.46) + 8,
      }),
      open: { x: 240, y: 120 },
    },
    {
      id: 'rainforest',
      reactionId: 'rainforest_toucan',
      target: () => ({
        x: Math.floor(pw * 0.22) + 8,
        y: Math.floor(ph * 0.36) + 22 - 8,
      }),
      open: { x: 320, y: 90 },
    },
    {
      id: 'arctic-aurora',
      reactionId: 'arctic_bear',
      target: () => {
        const x = Math.max(Math.round(pw * 0.24), 146);
        const gy = getArcticLedges(pw, ph)[2].yFn(x) + 1;
        return { x, y: gy - 16 };
      },
      open: { x: 520, y: 38 },
    },
  ];

  for (const s of scenarios) {
    const idx = HABITATS.findIndex((h) => h.id === s.id);
    assert.ok(idx !== -1, `Habitat missing: ${s.id}`);
    setCurrentHabitatIndex(idx);
    stimuli.length = 0;

    // Render frame 1 to register live hitboxes for this biome
    drawHabitatEnvironment(1000);
    const hab = HABITATS[idx];
    const hit = s.target();

    assert.equal(
      hasAmbientWildlifeAt(hab.sceneProfile, hit.x, hit.y),
      true,
      `Expected hitbox coverage for ${s.reactionId} at (${hit.x}, ${hit.y})`,
    );

    canvas.dispatch('pointermove', { clientX: hit.x * PIXEL_SCALE, clientY: hit.y * PIXEL_SCALE });
    assert.equal(canvas.style.cursor, 'pointer', `Cursor should show pointer over ${s.reactionId}`);

    // Direct click on animal triggers reaction AND suppresses food/stimulus drop
    canvas.dispatch('pointerdown', { clientX: hit.x * PIXEL_SCALE, clientY: hit.y * PIXEL_SCALE });
    assert.equal(stimuli.length, 0, `Food stimulus must NOT spawn when clicking ${s.reactionId}`);

    drawHabitatEnvironment(1200);
    const activeReact = getAmbientReaction(s.reactionId, 1200);
    assert.ok(activeReact, `Expected active reaction for ${s.reactionId}`);

    // Advance cleanly through reaction trajectory and completion
    for (const t of [1700, 2600, 3800, 6200]) {
      drawHabitatEnvironment(t);
    }
    assert.equal(getAmbientReaction(s.reactionId, 6200), null, `Reaction should complete and reset for ${s.reactionId}`);

    // Clicking empty open habitat space STILL spawns food/stimuli normally
    canvas.dispatch('pointermove', { clientX: s.open.x * PIXEL_SCALE, clientY: s.open.y * PIXEL_SCALE });
    assert.equal(canvas.style.cursor, '', `Cursor should clear on empty space in ${s.id}`);

    canvas.dispatch('pointerdown', { clientX: s.open.x * PIXEL_SCALE, clientY: s.open.y * PIXEL_SCALE });
    assert.ok(stimuli.length > 0, `Open space click in ${s.id} should still drop food/stimulus`);
  }

  assert.equal(nonFiniteRects, 0, 'Zero non-finite pixel coordinates across all interactive reaction frames');
});

test('koi-pond Loch Ness patrols outer water perimeter without entering center search UI and terrapin reacts to mousedown', () => {
  const koiIdx = HABITATS.findIndex((h) => h.id === 'koi');
  setCurrentHabitatIndex(koiIdx);
  stimuli.length = 0;

  const startX = Math.round(pw * 0.16);
  const startY = Math.round(ph * 0.46);

  drawHabitatEnvironment(1000);
  assert.equal(hasAmbientWildlifeAt('koi-pond', startX - 10, startY + 8), true);

  // Test grounded shoreline Zen Terrapin accepts left-button mousedown fallback without dropping food
  const rockX = pw >= 400 ? Math.min(Math.round(pw * 0.75), pw - 152) : Math.round(pw * 0.75);
  const terrY = ph - 14;
  assert.equal(hasAmbientWildlifeAt('koi-pond', rockX, terrY), true, 'Shoreline terrapin hitbox should be active');
  canvas.dispatch('mousedown', { type: 'mousedown', button: 0, clientX: rockX * PIXEL_SCALE, clientY: terrY * PIXEL_SCALE });
  assert.equal(stimuli.length, 0, 'Clicking terrapin via mousedown must not drop fish pellets');
  drawHabitatEnvironment(1050);
  assert.ok(getAmbientReaction('koi_terrapin', 1050), 'Terrapin should start swim-loop reaction on click');

  const centerChecks = [
    { x: Math.round(pw * 0.36), y: Math.round(ph * 0.46) },
    { x: Math.round(pw * 0.50), y: Math.round(ph * 0.54) },
    { x: Math.round(pw * 0.63), y: Math.round(ph * 0.64) },
  ];

  for (let t = 1100; t <= 26000; t += 50) {
    drawHabitatEnvironment(t);
    for (const pt of centerChecks) {
      assert.equal(
        hasAmbientWildlifeAt('koi-pond', pt.x, pt.y),
        false,
        `Loch Ness must stay outside Center UI band (${pt.x}, ${pt.y}) at t=${t}`,
      );
    }
  }

  // After patrolling along the perimeter ring, spawn point in left-mid pond should no longer hold Loch Ness
  assert.equal(
    hasAmbientWildlifeAt('koi-pond', startX - 10, startY + 8),
    false,
    'Loch Ness serpent must travel away from its spawn point along the perimeter ring',
  );
});
