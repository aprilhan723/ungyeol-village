import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { character, mesh, sphere, box, cylinder } from "./art.js";
import { VillageSimulation, places, obstacles } from "./simulation.js";
export { character, avatarData } from "./art.js";

function makeTexture(kind) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d");
  x.clearRect(0, 0, 128, 128);
  x.shadowColor = "#ffffff99";
  x.shadowBlur = 8;
  if (kind === "heart") {
    x.fillStyle = "#ee769b";
    x.beginPath();
    x.moveTo(64, 108);
    x.bezierCurveTo(4, 70, 8, 20, 39, 22);
    x.bezierCurveTo(54, 22, 64, 34, 64, 39);
    x.bezierCurveTo(90, -3, 145, 42, 107, 77);
    x.closePath();
    x.fill();
    x.fillStyle = "#ffc2d2";
    x.beginPath();
    x.ellipse(36, 40, 8, 12, 0.5, 0, 7);
    x.fill();
  } else if (kind === "drop") {
    x.fillStyle = "#91d9e3";
    x.beginPath();
    x.moveTo(64, 13);
    x.bezierCurveTo(14, 72, 28, 111, 64, 112);
    x.bezierCurveTo(106, 111, 114, 74, 64, 13);
    x.fill();
  } else if (kind === "leaf") {
    x.fillStyle = "#a2c582";
    x.beginPath();
    x.moveTo(24, 101);
    x.quadraticCurveTo(6, 20, 104, 18);
    x.quadraticCurveTo(122, 100, 24, 101);
    x.fill();
  } else if (kind === "ember" || kind === "dust") {
    x.fillStyle = kind === "ember" ? "#f2bc78" : "#c4b496";
    x.beginPath();
    x.arc(64, 64, 32, 0, 7);
    x.fill();
  } else if (kind === "gift") {
    x.fillStyle = "#90c6b0";
    x.fillRect(28, 49, 72, 57);
    x.fillStyle = "#b7dfce";
    x.fillRect(21, 42, 86, 18);
    x.fillStyle = "#fff0b8";
    x.fillRect(57, 42, 14, 65);
    x.lineWidth = 9;
    x.strokeStyle = "#fff0b8";
    x.beginPath();
    x.ellipse(46, 32, 16, 10, 0.45, 0, 7);
    x.ellipse(80, 32, 16, 10, -0.45, 0, 7);
    x.stroke();
  } else if (kind === "spark") {
    x.fillStyle = "#f7b15c";
    x.beginPath();
    for (const [a, b] of [
      [75, 8],
      [30, 70],
      [59, 67],
      [49, 121],
      [102, 47],
      [70, 53],
    ])
      x.lineTo(a, b);
    x.closePath();
    x.fill();
  } else if (kind === "music") {
    x.font = "bold 100px serif";
    x.fillStyle = "#c397d6";
    x.textAlign = "center";
    x.fillText("♪", 64, 100);
  } else {
    x.fillStyle = kind === "resonance" ? "#9dcce3" : "#ffe9a4";
    x.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2,
        r = i % 2 ? 15 : 48;
      x.lineTo(64 + Math.sin(a) * r, 64 + Math.cos(a) * r);
    }
    x.closePath();
    x.fill();
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function tree(group, x, z, s = 1, pink = false) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(s);
  group.add(g);
  cylinder(g, "#9a7d59", 0, 0.8, 0, 0.12, 0.2, 1.6, 8);
  for (const [dx, dy, dz, r] of [
    [0, 2, 0, 0.86],
    [-0.45, 1.7, 0, 0.65],
    [0.4, 1.75, 0.1, 0.65],
  ])
    sphere(g, pink ? "#dcb8bd" : "#a2bc88", dx, dy, dz, r);
  return g;
}

export function createWorld(
  container,
  people,
  {
    selected,
    onEvent = () => {},
    onChoose = () => {},
    onTick = () => {},
    saved = {},
  } = {},
) {
  let disposed = false,
    night = false,
    follow = true,
    clock = 0,
    lastTime = 0,
    lastHud = 0,
    lastTrail = 0,
    dragStart = null,
    pointerDown = false;
  const keys = new Set(),
    particles = [],
    bubbles = [],
    textures = new Map();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#d8e5dd");
  scene.fog = new THREE.Fog("#d8e5dd", 48, 95);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch {
    return {
      failed: true,
      destroy() {},
      select() {},
      getState() {
        return null;
      },
    };
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute(
    "aria-label",
    "운결마을 게임. 땅을 클릭하면 걷고, 주민을 클릭하면 만납니다. WASD 또는 방향키로 이동할 수 있습니다.",
  );
  renderer.domElement.tabIndex = 0;
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 120);
  camera.position.set(16, 19, 23);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 10;
  controls.maxDistance = 54;
  controls.minPolarAngle = 0.3;
  controls.maxPolarAngle = 1.18;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE,
  };
  const ambient = new THREE.HemisphereLight("#fff5df", "#91b4ac", 2.8);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight("#fff0cf", 3);
  sun.position.set(-12, 22, 17);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -22,
    right: 22,
    top: 22,
    bottom: -22,
    far: 65,
  });
  sun.shadow.normalBias = 0.04;
  scene.add(sun);
  const ground = new THREE.Group();
  scene.add(ground);
  cylinder(ground, "#b6a98b", 0, -1.1, 0, 16.5, 15.3, 2, 80);
  cylinder(ground, "#c8d5a7", 0, -0.12, 0, 16.6, 16.5, 0.3, 80);
  const floor = mesh(
    scene,
    new THREE.PlaneGeometry(300, 300),
    "#d8e5dd",
    0,
    -2.15,
    0,
  );
  floor.rotation.x = -Math.PI / 2;
  const ring = mesh(
    ground,
    new THREE.RingGeometry(7.5, 9.3, 90),
    "#e9dab7",
    0,
    0.045,
    0,
  );
  ring.rotation.x = -Math.PI / 2;
  cylinder(ground, "#ecdfbc", 0, 0.06, 0, 4.1, 4.1, 0.1, 64);
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const path = box(
      ground,
      "#e9dab7",
      Math.sin(a) * 5,
      0.06,
      Math.cos(a) * 5,
      1.7,
      0.08,
      8,
    );
    path.rotation.y = a;
  }
  // Centerpiece: a glowing tree on a low circular fountain, kept out of walking routes.
  cylinder(ground, "#b9c6b1", 0, 0.2, 0, 1.25, 1.4, 0.34, 48);
  cylinder(ground, "#91bfbd", 0, 0.4, 0, 1.04, 1.04, 0.1, 48);
  cylinder(ground, "#bd9d74", 0, 1.05, 0, 0.16, 0.24, 1.45, 10);
  for (const [x, y, z, r] of [
    [0, 2.4, 0, 0.84],
    [-0.58, 2.1, 0.1, 0.6],
    [0.6, 2.2, 0, 0.6],
  ])
    sphere(ground, "#d5c99d", x, y, z, r);
  const lake = cylinder(
    ground,
    "#8bc1c7",
    -6.8,
    0.025,
    -4.8,
    2.15,
    2.15,
    0.1,
    48,
  );
  const lakeRim = mesh(
    ground,
    new THREE.TorusGeometry(2.13, 0.11, 6, 64),
    "#dbd3b4",
    -6.8,
    0.08,
    -4.8,
  );
  lakeRim.rotation.x = Math.PI / 2;
  for (let i = 0; i < 7; i++)
    box(ground, "#bba07b", -4.9 + i * 0.16, 0.15, -4.8, 0.13, 0.14, 0.75);
  const stage = cylinder(
    ground,
    "#b8a383",
    1.5,
    0.13,
    -5.5,
    1.7,
    1.7,
    0.25,
    32,
  );
  stage.receiveShadow = true;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const light = sphere(
      ground,
      "#f6dc9c",
      1.5 + Math.sin(a) * 1.7,
      0.3,
      -5.5 + Math.cos(a) * 1.7,
      0.07,
      { emissive: "#f6dc9c", emissiveIntensity: 0.5 },
    );
  }
  // Café tables and a flower patch are set beside the playable paths.
  box(ground, "#c59b74", 6.3, 0.65, 3.2, 1.1, 0.13, 0.9);
  for (const z of [2.4, 4])
    box(ground, "#ccb48d", 6.3, 0.35, z, 1.25, 0.12, 0.25);
  cylinder(ground, "#f2e5bd", 6.3, 1.65, 3.2, 0, 1.15, 0.6, 8);
  cylinder(ground, "#ae926d", 6.3, 1, 3.2, 0.04, 0.04, 1.4);
  const windows = [];
  people.forEach((p, i) => {
    const a = (i / people.length) * Math.PI * 2 + 0.1,
      x = Math.cos(a) * 13.3,
      z = Math.sin(a) * 13.3;
    const h = new THREE.Group();
    h.position.set(x, 0, z);
    h.rotation.y = Math.atan2(x, z) + Math.PI;
    ground.add(h);
    box(h, "#f0e4c9", 0, 1, 0, 2.15, 2, 1.9);
    const roof = mesh(
      h,
      new THREE.ConeGeometry(1.8, 1.15, 4),
      p.color,
      0,
      2.55,
      0,
    );
    roof.rotation.y = Math.PI / 4;
    roof.scale.z = 0.96;
    box(h, "#988064", 0, 0.69, 0.96, 0.6, 1.4, 0.06);
    sphere(h, "#e7cc8f", 0.18, 0.7, 1.02, 0.045);
    for (const sx of [-0.74, 0.74]) {
      box(h, "#bea681", sx, 1.25, 0.98, 0.45, 0.57, 0.05);
      const w = box(h, "#ffe2a0", sx, 1.25, 1.015, 0.34, 0.46, 0.045);
      windows.push(w);
      box(h, "#efdfbd", sx, 1.25, 1.05, 0.04, 0.5, 0.04);
    }
    box(h, "#c7b494", 0, 0.08, 1.16, 0.9, 0.15, 0.46);
    for (let k = 0; k < 3; k++) {
      cylinder(h, "#baa17c", 1.2, 0.17, -0.4 + k * 0.35, 0.16, 0.11, 0.3);
      sphere(
        h,
        ["#d6b4c4", "#d9cf94", "#b0c292"][k],
        1.2,
        0.45,
        -0.4 + k * 0.35,
        0.21,
      );
    }
  });
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2,
      r = 15.2 + (i % 3) * 0.2;
    tree(
      ground,
      Math.cos(a) * r,
      Math.sin(a) * r,
      0.75 + (i % 4) * 0.1,
      i % 7 === 0,
    );
  }
  tree(ground, 5.8, -5.8, 0.8, true);
  tree(ground, -5.8, 5.5, 0.85, true);
  for (let i = 0; i < 35; i++) {
    const a = i * 2.39,
      r = 10.6 + (i % 4) * 0.16;
    const flower = sphere(
      ground,
      ["#e7bbbf", "#efe1ad", "#b5ca94"][i % 3],
      Math.sin(a) * r,
      0.14,
      Math.cos(a) * r,
      0.11,
    );
    flower.scale.y = 0.6;
  }
  // Strings of flags, lanterns and fireflies make the space feel inhabited.
  for (const x of [-2.2, 5.2]) {
    cylinder(ground, "#a48f6d", x, 2.3, -7, 0.05, 0.07, 4.6, 8);
  }
  const flagCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.2, 4.3, -7),
    new THREE.Vector3(1.5, 3.7, -7),
    new THREE.Vector3(5.2, 4.3, -7),
  ]);
  mesh(
    ground,
    new THREE.TubeGeometry(flagCurve, 32, 0.017, 5, false),
    "#978977",
  );
  for (let i = 0; i < 9; i++) {
    const p = flagCurve.getPoint(i / 8);
    const flag = mesh(
      ground,
      new THREE.ConeGeometry(0.16, 0.35, 3),
      ["#daa6af", "#adc9b8", "#e3c986"][i % 3],
      p.x,
      p.y - 0.17,
      p.z,
    );
    flag.rotation.z = Math.PI;
  }
  const fireflies = new THREE.Group();
  scene.add(fireflies);
  for (let i = 0; i < 30; i++) {
    const a = i * 2.399,
      r = 2 + (i % 9) * 1.2;
    const s = sphere(
      fireflies,
      "#f9e7a0",
      Math.sin(a) * r,
      0.8 + (i % 5) * 0.5,
      Math.cos(a) * r,
      0.04,
      { emissive: "#ffdd7c", emissiveIntensity: 2 },
    );
    s.userData.base = s.position.clone();
  }
  fireflies.visible = false;
  const models = new Map(),
    labels = new Map();
  let sim;
  function emit(e) {
    const a = sim.get(e.a),
      b = sim.get(e.b);
    for (let i = 0; i < 7; i++) {
      const material = new THREE.SpriteMaterial({
        map:
          textures.get(e.kind) ||
          (() => {
            const t = makeTexture(e.kind);
            textures.set(e.kind, t);
            return t;
          })(),
        transparent: true,
        depthTest: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.set(e.x + ((i % 3) - 1) * 0.36, 1.6 + (i % 2) * 0.2, e.z);
      sprite.scale.setScalar(0.43 + (i % 3) * 0.1);
      scene.add(sprite);
      particles.push({
        sprite,
        born: clock + i * 0.2,
        life: 3.8,
        x: sprite.position.x,
        z: sprite.position.z,
        kind: e.kind,
      });
    }
    for (const [agent, text, index] of [
      [a, e.line, 0],
      [b, e.reply, 1],
    ]) {
      const label = document.createElement("div");
      label.className = `speech-bubble ${e.kind}`;
      label.textContent = text;
      container.appendChild(label);
      bubbles.push({
        element: label,
        agent: agent.id,
        born: clock + index * 1.5,
        life: 6 - index * 1.5,
      });
    }
    onEvent(e);
  }
  sim = new VillageSimulation(people, {
    onEvent: emit,
    bonds: saved.bonds || {},
    discovered: saved.discovered || [],
  });
  if (selected) sim.select(selected);
  people.forEach((p) => {
    const c = character(p, 1.05);
    c.userData.id = p.id;
    ground.add(c);
    models.set(p.id, c);
    const label = document.createElement("button");
    label.className = "world-label game-name";
    label.textContent = p.name;
    label.setAttribute("aria-label", `${p.name} 만나기`);
    label.onclick = (e) => {
      e.stopPropagation();
      onChoose(p.id);
    };
    container.appendChild(label);
    labels.set(p.id, label);
  });
  const highlight = mesh(
    ground,
    new THREE.RingGeometry(0.72, 0.81, 48),
    "#fff0ae",
    0,
    0.08,
    0,
  );
  highlight.rotation.x = -Math.PI / 2;
  const marker = mesh(
    ground,
    new THREE.RingGeometry(0.27, 0.36, 36),
    "#fff4c7",
    0,
    0.075,
    0,
  );
  marker.rotation.x = -Math.PI / 2;
  marker.visible = false;
  let markerUntil = 0;
  const raycaster = new THREE.Raycaster(),
    ndc = new THREE.Vector2(),
    plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    groundHit = new THREE.Vector3();
  const down = (e) => {
    pointerDown = true;
    dragStart = { x: e.clientX, y: e.clientY };
  };
  const up = (e) => {
    if (!pointerDown) return;
    pointerDown = false;
    if (
      !dragStart ||
      Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y) > 7
    )
      return;
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      (-(e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects([...models.values()], true)[0];
    if (hit) {
      let obj = hit.object;
      while (obj && !obj.userData.id) obj = obj.parent;
      if (obj) onChoose(obj.userData.id);
      return;
    }
    if (
      raycaster.ray.intersectPlane(plane, groundHit) &&
      Math.hypot(groundHit.x, groundHit.z) < 16
    ) {
      if (sim.moveTo(sim.selected, groundHit)) {
        const dest = sim.nav.nearest(groundHit);
        marker.position.set(dest.x, 0.08, dest.z);
        marker.visible = true;
        markerUntil = clock + 2;
      }
      renderer.domElement.focus({ preventScroll: true });
    }
  };
  renderer.domElement.addEventListener("pointerdown", down);
  renderer.domElement.addEventListener("pointerup", up);
  function keydown(e) {
    if (
      document.querySelector("dialog[open]") ||
      /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)
    )
      return;
    const key = e.key.toLowerCase();
    if (
      [
        "w",
        "a",
        "s",
        "d",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        " ",
      ].includes(key)
    ) {
      e.preventDefault();
      keys.add(key);
    }
    if (key === "e") {
      const n = sim.nearest();
      if (n) {
        onChoose(n.id);
        sim.meet(n.id, "talk");
      }
    }
  }
  const keyup = (e) => keys.delete(e.key.toLowerCase()),
    blur = () => keys.clear();
  window.addEventListener("keydown", keydown);
  window.addEventListener("keyup", keyup);
  window.addEventListener("blur", blur);
  const resize = () => {
    const w = container.clientWidth,
      h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  const initialPlayer = sim.player();
  controls.target.set(initialPlayer.x, 0.5, initialPlayer.z);
  camera.position.copy(controls.target).add(new THREE.Vector3(13, 16, 18));
  controls.update();
  const project = (pos, element, offset = 0) => {
    const v = pos.clone();
    v.y += offset;
    v.project(camera);
    element.style.transform = `translate(-50%,-50%) translate(${Math.round((v.x * 0.5 + 0.5) * container.clientWidth)}px,${Math.round((-v.y * 0.5 + 0.5) * container.clientHeight)}px)`;
    element.style.visibility =
      Math.abs(v.x) > 1.12 || Math.abs(v.y) > 1.1 || v.z > 1
        ? "hidden"
        : "visible";
  };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let raf;
  function animate(t) {
    if (disposed) return;
    raf = requestAnimationFrame(animate);
    const dt = lastTime ? Math.min((t - lastTime) / 1000, 0.05) : 0.016;
    lastTime = t;
    const modalOpen = !!document.querySelector("dialog[open]");
    if (!sim.paused && !modalOpen) clock += dt * sim.speed;
    if (!modalOpen) {
      const horizontal =
          (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
          (keys.has("a") || keys.has("arrowleft") ? 1 : 0),
        vertical =
          (keys.has("s") || keys.has("arrowdown") ? 1 : 0) -
          (keys.has("w") || keys.has("arrowup") ? 1 : 0);
      if (horizontal || vertical) {
        const f = new THREE.Vector3();
        camera.getWorldDirection(f);
        f.y = 0;
        f.normalize();
        const right = new THREE.Vector3(-f.z, 0, f.x);
        sim.manual(
          right.x * horizontal - f.x * vertical,
          right.z * horizontal - f.z * vertical,
          dt * sim.speed,
        );
      }
      sim.update(dt);
    }
    const player = sim.player();
    if (follow && player) {
      const next = new THREE.Vector3(player.x, 0.5, player.z);
      const delta = next
        .sub(controls.target)
        .multiplyScalar(1 - Math.exp(-dt * 3));
      camera.position.add(delta);
      controls.target.add(delta);
    }
    controls.update();
    for (const a of sim.agents) {
      const c = models.get(a.id),
        rig = c.userData.rig,
        moving = a.path.length > 0 || a.state === "moving",
        dancing = a.state === "dancing",
        interacting = a.state === "interacting";
      c.position.set(
        a.x,
        moving && !reduced ? Math.abs(Math.sin(a.steps * 6)) * 0.085 : 0,
        a.z,
      );
      let diff =
        ((a.angle - c.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      c.rotation.y += diff * Math.min(dt * 10, 1);
      if (dancing && !reduced) {
        c.rotation.y = Math.sin(clock * 2) * 0.65;
        c.position.y = Math.abs(Math.sin(clock * 5)) * 0.16;
      }
      rig.legs.forEach(
        (leg, i) =>
          (leg.rotation.x =
            moving && !reduced ? Math.sin(a.steps * 6 + i * Math.PI) * 0.6 : 0),
      );
      rig.arms.forEach((arm, i) => {
        arm.rotation.x =
          moving && !reduced
            ? Math.sin(a.steps * 6 + (i + 1) * Math.PI) * 0.5
            : 0;
        arm.rotation.z = dancing
          ? (i ? 1 : -1) * 1.8 + (reduced ? 0 : Math.sin(clock * 5) * 0.3)
          : interacting
            ? i
              ? -0.2
              : -0.9
            : 0;
      });
      rig.waves.forEach((o, i) => {
        if (!reduced) o.rotation.y = Math.sin(clock * 1.3 + i) * 0.12;
      });
      rig.floaters.forEach(
        (o, i) =>
          (o.position.y =
            o.userData.baseY + (reduced ? 0 : Math.sin(clock * 2 + i) * 0.1)),
      );
      rig.flames.forEach((o, i) => {
        const base = o.userData.baseScale;
        o.scale.y =
          base.y * (1 + (reduced ? 0 : Math.sin(clock * 6 + i) * 0.06));
      });
      const label = labels.get(a.id);
      label.classList.toggle("selected", a.id === sim.selected);
      label.dataset.state = a.state;
      project(c.position, label, 2.65);
      if (a.id === sim.selected) highlight.position.set(a.x, 0.085, a.z);
    }
    if (!reduced && !sim.paused && !modalOpen && clock - lastTrail > 0.32) {
      lastTrail = clock;
      for (const a of sim.agents) {
        if (!a.path.length) continue;
        const stem = a.person.pillars[2][0],
          kind = "임계".includes(stem)
            ? "drop"
            : "갑을".includes(stem)
              ? "leaf"
              : "병정".includes(stem)
                ? "ember"
                : "무기".includes(stem)
                  ? "dust"
                  : "resonance";
        if (!textures.has(kind)) textures.set(kind, makeTexture(kind));
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: textures.get(kind),
            transparent: true,
            depthWrite: false,
            opacity: 0.5,
          }),
        );
        sprite.position.set(a.x, 0.16, a.z);
        sprite.scale.setScalar(0.15);
        scene.add(sprite);
        particles.push({
          sprite,
          born: clock,
          life: 0.9,
          x: a.x,
          z: a.z,
          startY: 0.1,
          rise: 0.12,
        });
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i],
        age = clock - p.born;
      p.sprite.visible = age >= 0;
      if (age > p.life) {
        scene.remove(p.sprite);
        p.sprite.material.dispose();
        particles.splice(i, 1);
        continue;
      }
      if (age >= 0) {
        p.sprite.position.y = (p.startY ?? 2) + age * (p.rise ?? 0.48);
        p.sprite.position.x = p.x + Math.sin(age * 2 + i) * 0.17;
        p.sprite.material.opacity = Math.min(1, (p.life - age) * 1.2);
      }
    }
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i],
        age = clock - b.born;
      if (age > b.life) {
        b.element.remove();
        bubbles.splice(i, 1);
        continue;
      }
      b.element.style.display = age < 0 ? "none" : "";
      const a = sim.get(b.agent);
      project(new THREE.Vector3(a.x, 0, a.z), b.element, 3.28);
    }
    marker.visible = clock < markerUntil;
    marker.scale.setScalar(1 + Math.sin(clock * 6) * 0.12);
    fireflies.children.forEach((s, i) => {
      if (!reduced) {
        s.position.y = s.userData.base.y + Math.sin(clock + i) * 0.28;
        s.position.x = s.userData.base.x + Math.cos(clock * 0.6 + i) * 0.25;
      }
    });
    if (clock - lastHud > 0.25 || !lastHud) {
      lastHud = clock;
      onTick(sim.snapshot());
    }
    renderer.render(scene, camera);
  }
  animate(0);
  return {
    failed: false,
    select(id) {
      sim.select(id);
      follow = true;
    },
    meet(id, action) {
      return sim.meet(id, action);
    },
    auto() {
      return sim.toggleAuto();
    },
    festival() {
      sim.festival();
      for (const a of sim.agents) {
        const kind = "music";
        if (!textures.has(kind)) textures.set(kind, makeTexture(kind));
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: textures.get(kind),
            depthTest: false,
            transparent: true,
          }),
        );
        sprite.position.set(a.x, 2, a.z);
        sprite.scale.setScalar(0.6);
        scene.add(sprite);
        particles.push({ sprite, born: clock, life: 4, x: a.x, z: a.z });
      }
    },
    pause() {
      sim.paused = !sim.paused;
      onTick(sim.snapshot());
      return sim.paused;
    },
    speed() {
      sim.speed = sim.speed === 1 ? 2 : 1;
      return sim.speed;
    },
    overview() {
      follow = !follow;
      if (!follow) {
        controls.target.set(0, 0, 0);
        camera.position.set(22, 29, 34);
      }
      return follow;
    },
    zoom(f) {
      camera.position
        .sub(controls.target)
        .multiplyScalar(f)
        .add(controls.target);
    },
    theme(mode) {
      night = mode === "night";
      scene.background.set(night ? "#253e51" : "#d8e5dd");
      scene.fog.color.copy(scene.background);
      floor.material.color.copy(scene.background);
      ambient.intensity = night ? 0.75 : 2.8;
      sun.intensity = night ? 0.7 : 3;
      windows.forEach((w) => {
        w.material.emissive.set(night ? "#ffd080" : "#000000");
        w.material.emissiveIntensity = night ? 1.3 : 0;
      });
      fireflies.visible = night;
    },
    getState() {
      return sim.snapshot();
    },
    persist() {
      return { bonds: { ...sim.bonds }, discovered: [...sim.discovered] };
    },
    destroy() {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointerup", up);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
      scene.traverse((o) => {
        o.geometry?.dispose();
        if (o.material)
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            m.dispose(),
          );
      });
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      container.replaceChildren();
    },
  };
}
