import * as THREE from "three";
import { archetypes } from "./data.js";

export const designs = {
  siyeon: {
    name: "달바다 정령",
    body: "#518fad",
    light: "#b1edf1",
    accent: "#ffe3a0",
    detail: "커다란 파도 망토 · 초승달 왕관 · 소용돌이 발자국",
  },
  jaehwan: {
    name: "꼬마 촛불 정령",
    body: "#f2d29b",
    light: "#ffca64",
    accent: "#ff7854",
    detail: "촛농 몸 · 두 겹의 불꽃 · 온기를 남기는 발자국",
  },
  sihyeon: {
    name: "이끼산 수호자",
    body: "#a0b884",
    light: "#d7e6aa",
    accent: "#77947a",
    detail: "삼각 산봉우리 · 이끼 어깨 · 자라나는 새싹",
  },
  yeonjae: {
    name: "햇살나무 탐험가",
    body: "#98714d",
    light: "#9eb765",
    accent: "#eed279",
    detail: "나무줄기 몸 · 커다란 나뭇가지 · 햇살 잎사귀",
  },
  kangmin: {
    name: "은철 수호 기사",
    body: "#8fa8af",
    light: "#dfe7df",
    accent: "#e0b377",
    detail: "각진 은빛 갑옷 · 대장장이 망치 · 철광석 어깨",
  },
  kanghyeon: {
    name: "돌산 골렘",
    body: "#aaa089",
    light: "#ded4b6",
    accent: "#808b72",
    detail: "넓은 바위 몸 · 계단형 머리 · 묵직한 돌 발",
  },
  hyeonjeong: {
    name: "바람칼날 항해사",
    body: "#709bab",
    light: "#c2e1d7",
    accent: "#e5d397",
    detail: "초승달 금속 날개 · 바람 스카프 · 은빛 나침반",
  },
  seyeong: {
    name: "새싹 화분 정령",
    body: "#b78662",
    light: "#e7c69a",
    accent: "#93b27c",
    detail: "동그란 화분 몸 · 차꽃 머리 · 씨앗 주머니",
  },
  inha: {
    name: "자수정 별요정",
    body: "#a899c6",
    light: "#e5d9f6",
    accent: "#ddafc7",
    detail: "커다란 보석 왕관 · 수정 날개 · 별빛 꼬리",
  },
  garyeong: {
    name: "새벽 태양 정령",
    body: "#e99160",
    light: "#ffe3a4",
    accent: "#d76f76",
    detail: "넓게 퍼진 태양 갈기 · 불꽃 망토 · 반짝이는 광륜",
  },
  jinha: {
    name: "구름바다 유랑자",
    body: "#798fb5",
    light: "#c9e1eb",
    accent: "#aeb5d8",
    detail: "풍성한 구름 머리 · 긴 바다 로브 · 둥근 파도 고리",
  },
  doyun: {
    name: "이슬방울 연금술사",
    body: "#79c2c3",
    light: "#d0f3e8",
    accent: "#bad8df",
    detail: "물방울 머리 · 반투명 물옷 · 구불구불한 시냇물 꼬리",
  },
};
export const designFor = (p) =>
  designs[p.id] || {
    name: archetypes[p.pillars[2][0]].nature + " 정령",
    body: p.color,
    light: "#e9f0d1",
    accent: "#e1c99d",
    detail: archetypes[p.pillars[2][0]].motif,
  };
const material = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra });
export function mesh(g, geo, color, x = 0, y = 0, z = 0, extra) {
  const o = new THREE.Mesh(geo, material(color, extra));
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  g.add(o);
  return o;
}
export const sphere = (g, c, x, y, z, r, extra) =>
  mesh(g, new THREE.SphereGeometry(r, 20, 16), c, x, y, z, extra);
export const box = (g, c, x, y, z, w, h, d, extra) =>
  mesh(g, new THREE.BoxGeometry(w, h, d), c, x, y, z, extra);
export const cylinder = (g, c, x, y, z, a, b, h, n = 16, extra) =>
  mesh(g, new THREE.CylinderGeometry(a, b, h, n), c, x, y, z, extra);
const torus = (g, c, x, y, z, r, t = 0.035) =>
  mesh(g, new THREE.TorusGeometry(r, t, 8, 48), c, x, y, z);
const leaf = (g, c, x, y, z, r = 0.22) => {
  const o = sphere(g, c, x, y, z, r);
  o.scale.set(0.55, 1.35, 0.55);
  o.rotation.z = 0.5;
  return o;
};

export function character(p, scale = 1) {
  const g = new THREE.Group(),
    d = designFor(p),
    stem = p.pillars[2][0],
    rig = { arms: [], legs: [], floaters: [], waves: [], flames: [] };
  const water = stem === "임" || stem === "계",
    stone = stem === "무" || stem === "경",
    fire = stem === "병" || stem === "정";
  // Every spirit has articulated limbs. The torso, crown, and silhouette differ by element.
  const width =
    stem === "무" ? 0.57 : stem === "정" ? 0.3 : stem === "갑" ? 0.34 : 0.4;
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * width * 0.45, 0.34, 0);
    g.add(leg);
    const foot = box(
      leg,
      stone ? d.body : d.accent,
      0,
      -0.16,
      0.06,
      stone ? 0.31 : 0.22,
      0.32,
      0.3,
    );
    if (water) foot.material.color.set(d.light);
    rig.legs.push(leg);
    const arm = new THREE.Group();
    arm.position.set(side * (width + 0.08), 0.9, 0);
    g.add(arm);
    const limb = cylinder(
      arm,
      d.body,
      0,
      -0.18,
      0,
      0.105,
      0.1,
      0.42,
      stone ? 6 : 16,
    );
    limb.rotation.z = side * 0.15;
    sphere(arm, d.light, 0, -0.42, 0.015, 0.12);
    rig.arms.push(arm);
  }
  let body;
  if (stem === "무") {
    body = box(g, d.body, 0, 0.76, 0, 1.06, 0.93, 0.7);
    for (const side of [-1, 1]) {
      mesh(
        g,
        new THREE.DodecahedronGeometry(0.33, 0),
        d.accent,
        side * 0.56,
        1,
        0,
      );
      box(g, d.light, side * 0.27, 0.53, 0.38, 0.35, 0.05, 0.03);
    }
    if (p.id === "sihyeon") {
      const skirt = cylinder(g, d.body, 0, 0.58, 0, 0.43, 0.64, 0.65, 5);
      skirt.rotation.y = 0.6;
    }
  } else if (stem === "기") {
    body = cylinder(g, d.body, 0, 0.73, 0, 0.48, 0.29, 0.75, 20);
    cylinder(g, d.light, 0, 1.08, 0, 0.51, 0.51, 0.11);
    box(g, d.accent, 0, 0.77, 0.42, 0.18, 0.23, 0.05);
  } else if (stem === "갑") {
    body = cylinder(g, d.body, 0, 0.77, 0, 0.29, 0.4, 0.91, 9);
    for (let k = -1; k <= 1; k++)
      box(g, "#71583f", k * 0.15, 0.75, 0.3, 0.035, 0.57, 0.035);
  } else if (stem === "경") {
    body = mesh(
      g,
      new THREE.CylinderGeometry(0.43, 0.48, 0.9, 6),
      d.body,
      0,
      0.8,
      0,
    );
    mesh(g, new THREE.OctahedronGeometry(0.18), d.accent, 0, 0.95, 0.42);
    for (const arm of rig.arms)
      mesh(arm, new THREE.OctahedronGeometry(0.23), d.light, 0, 0, 0);
  } else if (stem === "신") {
    body = mesh(g, new THREE.OctahedronGeometry(0.53), d.body, 0, 0.75, 0, {
      metalness: 0.35,
      roughness: 0.2,
    });
    body.scale.set(0.85, 1, 0.7);
  } else if (stem === "정") {
    body = cylinder(g, d.body, 0, 0.84, 0, 0.31, 0.38, 1.05, 24);
    for (let i = 0; i < 4; i++) {
      const melt = sphere(
        g,
        d.light,
        Math.cos(i * 1.8) * 0.31,
        1.1 - i * 0.05,
        Math.sin(i * 1.8) * 0.31,
        0.085,
      );
      melt.scale.y = 2;
    }
  } else {
    body = cylinder(
      g,
      d.body,
      0,
      0.76,
      0,
      0.3,
      water ? 0.55 : 0.46,
      0.94,
      24,
      water ? { metalness: 0.12, roughness: 0.28 } : {},
    );
  }
  // Expressive face is integrated into the material of each elemental creature.
  const headColor = water
    ? d.light
    : stem === "무"
      ? d.light
      : stem === "갑"
        ? "#d3b785"
        : stem === "기"
          ? "#ecd5ad"
          : fire
            ? "#fff0bf"
            : d.light;
  const head = stone
    ? mesh(g, new THREE.DodecahedronGeometry(0.4, 1), headColor, 0, 1.37, 0)
    : sphere(g, headColor, 0, 1.38, 0, 0.4);
  for (const side of [-1, 1]) {
    const eye = sphere(g, "#384b49", side * 0.135, 1.41, 0.365, 0.038);
    eye.scale.y = 1.25;
    sphere(g, "#ffffff", side * 0.135 + 0.009, 1.425, 0.397, 0.011);
    const blush = sphere(
      g,
      fire ? "#ef9a77" : "#d7a99e",
      side * 0.255,
      1.31,
      0.305,
      0.059,
    );
    blush.scale.set(1, 0.45, 0.25);
  }
  const smile = torus(g, "#996f60", 0, 1.285, 0.378, 0.057, 0.011);
  smile.scale.y = 0.55;
  smile.geometry.dispose();
  smile.geometry = new THREE.TorusGeometry(0.057, 0.011, 5, 16, Math.PI);
  smile.rotation.z = Math.PI;
  if (stem === "임") {
    // Broad water cloak, visible even from behind.
    const cape = sphere(g, d.body, 0, 0.85, -0.28, 0.7, {
      roughness: 0.18,
      metalness: 0.16,
    });
    cape.scale.set(1.1, 1.03, 0.32);
    for (let k = 0; k < 3; k++) {
      const wave = torus(
        g,
        k === 1 ? d.light : d.body,
        0,
        0.16 + k * 0.16,
        0,
        0.64 + k * 0.06,
        0.055,
      );
      wave.rotation.x = Math.PI / 2;
      wave.geometry.dispose();
      wave.geometry = new THREE.TorusGeometry(
        0.64 + k * 0.06,
        0.055,
        8,
        50,
        Math.PI * 1.65,
      );
      wave.rotation.z = k * 2;
      rig.waves.push(wave);
    }
    if (p.id === "jinha") {
      for (const [x, y, r] of [
        [0, 1.88, 0.28],
        [-0.28, 1.75, 0.22],
        [0.28, 1.77, 0.24],
        [-0.08, 1.7, 0.25],
      ])
        sphere(g, "#e1edf2", x, y, -0.04, r);
    } else {
      for (let i = -1; i <= 1; i++) {
        const crest = mesh(
          g,
          new THREE.ConeGeometry(0.13, 0.48, 5),
          d.body,
          i * 0.23,
          1.88,
          -0.04,
        );
        crest.rotation.z = -i * 0.2;
      }
      const moon = torus(g, d.accent, 0, 2.15, 0, 0.18, 0.045);
      moon.geometry.dispose();
      moon.geometry = new THREE.TorusGeometry(
        0.18,
        0.045,
        8,
        30,
        Math.PI * 1.6,
      );
      moon.rotation.z = -0.5;
    }
  }
  if (stem === "계") {
    const drop = mesh(
      g,
      new THREE.SphereGeometry(0.44, 24, 20),
      d.body,
      0,
      1.52,
      -0.1,
      { transparent: true, opacity: 0.45, roughness: 0.08, metalness: 0.12 },
    );
    drop.scale.set(1, 1.38, 1);
    mesh(g, new THREE.ConeGeometry(0.28, 0.54, 24), d.body, 0, 2, -0.1, {
      transparent: true,
      opacity: 0.8,
      roughness: 0.1,
    });
    const points = [];
    for (let i = 0; i <= 24; i++)
      points.push(
        new THREE.Vector3(Math.sin(i * 0.24) * 0.22, 0.12, -0.22 - i * 0.047),
      );
    const tail = mesh(
      g,
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        32,
        0.09,
        8,
        false,
      ),
      d.body,
    );
    rig.waves.push(tail);
    for (const side of [-1, 1]) {
      const droplet = sphere(g, d.light, side * 0.6, 1.15, -0.1, 0.12, {
        transparent: true,
        opacity: 0.8,
      });
      droplet.scale.y = 1.5;
      rig.floaters.push(droplet);
    }
  }
  if (stem === "병") {
    const sun = sphere(g, d.light, 0, 1.45, -0.32, 0.65, {
      emissive: d.accent,
      emissiveIntensity: 0.22,
    });
    sun.scale.z = 0.2;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const ray = mesh(
        g,
        new THREE.ConeGeometry(0.14, 0.44, 5),
        i % 2 ? d.accent : d.body,
        Math.sin(a) * 0.76,
        1.45 + Math.cos(a) * 0.76,
        -0.3,
      );
      ray.rotation.z = -a;
      rig.flames.push(ray);
    }
    for (let i = -1; i <= 1; i++) {
      const flare = mesh(
        g,
        new THREE.ConeGeometry(0.2, 0.6, 6),
        d.accent,
        i * 0.24,
        0.58,
        -0.4,
      );
      flare.rotation.z = i * 0.3;
    }
  }
  if (stem === "정") {
    cylinder(g, "#76634d", 0, 1.78, 0, 0.025, 0.025, 0.17);
    const flame = sphere(g, d.accent, 0, 2.02, 0, 0.24, {
      emissive: d.accent,
      emissiveIntensity: 0.5,
    });
    flame.scale.set(0.82, 1.7, 0.8);
    const core = sphere(g, d.light, 0, 1.98, 0.14, 0.13, {
      emissive: d.light,
      emissiveIntensity: 0.9,
    });
    core.scale.y = 1.5;
    rig.flames.push(flame, core);
    cylinder(g, d.accent, 0, 0.34, 0, 0.45, 0.4, 0.08);
  }
  if (stem === "무") {
    if (p.id === "sihyeon") {
      mesh(g, new THREE.ConeGeometry(0.44, 0.6, 4), d.body, 0, 1.91, -0.07);
      for (let k = 0; k < 4; k++)
        sphere(g, d.accent, -0.34 + k * 0.19, 1.67, -0.2, 0.17);
      leaf(g, "#82a768", 0.15, 2.2, -0.1, 0.15);
    } else {
      box(g, d.body, -0.18, 1.75, -0.1, 0.42, 0.3, 0.55);
      box(g, d.accent, 0.24, 1.71, -0.1, 0.28, 0.25, 0.48);
      box(g, d.body, 0, 1.92, -0.12, 0.33, 0.13, 0.35);
    }
  }
  if (stem === "갑" || stem === "을") {
    for (const side of [-1, 1]) {
      const branch = cylinder(
        g,
        d.body,
        side * 0.27,
        1.9,
        -0.1,
        0.055,
        0.09,
        0.75,
        8,
      );
      branch.rotation.z = -side * 0.42;
      for (let k = 0; k < 3; k++) {
        const foliage = sphere(
          g,
          k % 2 ? d.accent : d.light,
          side * (0.2 + k * 0.19),
          2.03 + k * 0.08,
          -0.08,
          0.27,
        );
        foliage.scale.set(1.3, 0.64, 0.8);
      }
    }
    leaf(g, d.light, 0, 2.22, -0.08, 0.22);
  }
  if (stem === "기") {
    cylinder(g, d.body, 0, 1.72, 0, 0.39, 0.34, 0.09);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const petal = sphere(
        g,
        "#f6e7bc",
        Math.sin(a) * 0.17,
        1.91 + Math.cos(a) * 0.14,
        0,
        0.12,
      );
      petal.scale.z = 0.5;
    }
    sphere(g, d.accent, 0, 1.91, 0.09, 0.09);
    for (const side of [-1, 1]) leaf(g, d.accent, side * 0.29, 1.82, 0, 0.18);
  }
  if (stem === "경") {
    if (p.id === "hyeonjeong") {
      for (const side of [-1, 1]) {
        const wing = mesh(
          g,
          new THREE.ConeGeometry(0.18, 0.95, 3),
          d.light,
          side * 0.62,
          1.37,
          -0.21,
          { metalness: 0.4, roughness: 0.3 },
        );
        wing.rotation.z = -side * 0.6;
      }
      box(g, d.accent, 0, 1.09, 0.25, 0.78, 0.12, 0.16);
    } else {
      mesh(g, new THREE.ConeGeometry(0.46, 0.37, 6), d.body, 0, 1.78, 0);
      const hammer = new THREE.Group();
      rig.arms[1].add(hammer);
      box(hammer, "#8b6c4e", 0.1, -0.25, 0.2, 0.07, 0.63, 0.07);
      box(hammer, d.light, 0.1, 0.03, 0.2, 0.44, 0.23, 0.23);
    }
  }
  if (stem === "신") {
    for (const [x, h] of [
      [-0.25, 0.4],
      [0, 0.72],
      [0.25, 0.4],
    ]) {
      const gem = mesh(
        g,
        new THREE.OctahedronGeometry(0.23),
        d.body,
        x,
        1.89 + h * 0.2,
        0,
        { metalness: 0.3, roughness: 0.14 },
      );
      gem.scale.y = h * 2;
    }
    for (const side of [-1, 1]) {
      const wing = mesh(
        g,
        new THREE.OctahedronGeometry(0.42),
        d.accent,
        side * 0.54,
        1.13,
        -0.25,
        { transparent: true, opacity: 0.7, metalness: 0.2, roughness: 0.2 },
      );
      wing.scale.set(0.7, 1.5, 0.2);
      wing.rotation.z = -side * 0.55;
    }
    const star = mesh(
      g,
      new THREE.OctahedronGeometry(0.09),
      d.light,
      0.68,
      1.75,
      0,
      { emissive: d.light, emissiveIntensity: 0.6 },
    );
    rig.floaters.push(star);
  }
  rig.floaters.forEach((o) => (o.userData.baseY = o.position.y));
  rig.flames.forEach((o) => (o.userData.baseScale = o.scale.clone()));
  g.userData.rig = rig;
  g.scale.setScalar(scale);
  return g;
}

const portraits = new Map();
let portraitRenderer;
export function avatarData(p) {
  const key = JSON.stringify([p.id, p.pillars, p.color]);
  if (portraits.has(key)) return portraits.get(key);
  try {
    if (!portraitRenderer) {
      portraitRenderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
      });
      portraitRenderer.setSize(230, 270);
      portraitRenderer.setPixelRatio(1);
      portraitRenderer.toneMapping = THREE.ACESFilmicToneMapping;
      portraitRenderer.toneMappingExposure = 1.2;
    }
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight("#fff5dc", "#a6bbbf", 3));
    const sun = new THREE.DirectionalLight("#fff7dc", 3);
    sun.position.set(-3, 5, 7);
    scene.add(sun);
    const model = character(p);
    scene.add(model);
    model.rotation.y = -0.2;
    const bounds = new THREE.Box3().setFromObject(model),
      size = bounds.getSize(new THREE.Vector3()),
      center = bounds.getCenter(new THREE.Vector3());
    const height = Math.max(size.y * 1.18, size.x * 1.35),
      width = (height * 230) / 270;
    const camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.1,
      30,
    );
    camera.position.set(3, 2.4, 9);
    camera.lookAt(center);
    camera.position.add(center.clone().sub(new THREE.Vector3(0, 1, 0)));
    camera.lookAt(center);
    portraitRenderer.render(scene, camera);
    const url = portraitRenderer.domElement.toDataURL("image/png");
    portraits.set(key, url);
    model.traverse((o) => {
      o.geometry?.dispose();
      o.material?.dispose();
    });
    return url;
  } catch {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="130"><circle cx="60" cy="65" r="45" fill="${/^#[\da-f]{6}$/i.test(p.color) ? p.color : "#83a295"}"/><text x="60" y="82" font-size="42" text-anchor="middle">${archetypes[p.pillars[2][0]].symbol}</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
}
