import { allRelations, element } from "./engine.js";

export const WORLD_RADIUS = 11;
export const obstacles = [
  { x: 0, z: 0, r: 1.5 },
  { x: -6.8, z: -4.8, r: 2.15 },
  { x: 6.3, z: 3.2, r: 1.25 },
  { x: 5.8, z: -5.8, r: 1.0 },
  { x: -5.8, z: 5.5, r: 1.0 },
];
export const places = [
  { id: "plaza", name: "인연 광장", x: 2, z: 2.6 },
  { id: "tea", name: "봄비 피크닉", x: 5.2, z: 2.7 },
  { id: "lake", name: "소원 연못", x: -4.1, z: -4.2 },
  { id: "garden", name: "꽃바람 정원", x: -4.5, z: 3.4 },
  { id: "stage", name: "별빛 무대", x: 1.5, z: -5.5 },
];
export const behavior = {
  갑: { pace: 1.55, verb: "새 길을 발견하는 중", like: "garden" },
  을: { pace: 1.4, verb: "꽃길을 따라 걷는 중", like: "garden" },
  병: { pace: 1.8, verb: "친구를 찾아 성큼성큼", like: "stage" },
  정: { pace: 1.3, verb: "촛불을 나누러 가는 중", like: "tea" },
  무: { pace: 1.25, verb: "광장을 느긋하게 산책 중", like: "plaza" },
  기: { pace: 1.35, verb: "작은 정원을 돌보는 중", like: "tea" },
  경: { pace: 1.6, verb: "오늘의 길을 살피는 중", like: "plaza" },
  신: { pace: 1.45, verb: "반짝이는 것을 찾는 중", like: "garden" },
  임: { pace: 1.7, verb: "물결처럼 자유롭게 산책 중", like: "lake" },
  계: { pace: 1.4, verb: "작은 발견을 모으는 중", like: "lake" },
};
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const pairKey = (a, b) => [a, b].sort().join(":");
export function walkable(x, z) {
  return (
    Math.hypot(x, z) < WORLD_RADIUS &&
    obstacles.every((o) => Math.hypot(x - o.x, z - o.z) > o.r + 0.22)
  );
}

// A small grid keeps walking routes out of water and solid scenery.
export class Navigation {
  constructor() {
    this.nodes = new Map();
    for (let x = -22; x <= 22; x++)
      for (let z = -22; z <= 22; z++)
        if (walkable(x * 0.5, z * 0.5))
          this.nodes.set(`${x},${z}`, { x: x * 0.5, z: z * 0.5, gx: x, gz: z });
  }
  nearest(p) {
    let result,
      best = Infinity;
    for (const n of this.nodes.values()) {
      const d = distance(p, n);
      if (d < best) {
        best = d;
        result = n;
      }
    }
    return result;
  }
  route(start, end) {
    const a = this.nearest(start),
      b = this.nearest(end),
      key = (n) => `${n.gx},${n.gz}`;
    if (!a || !b) return [];
    const open = [a],
      came = new Map(),
      cost = new Map([[key(a), 0]]),
      closed = new Set();
    while (open.length) {
      open.sort(
        (p, q) =>
          cost.get(key(p)) +
          distance(p, b) -
          (cost.get(key(q)) + distance(q, b)),
      );
      const n = open.shift(),
        nk = key(n);
      if (closed.has(nk)) continue;
      if (nk === key(b)) {
        const path = [b];
        let cursor = nk;
        while (came.has(cursor)) {
          cursor = came.get(cursor);
          path.unshift(this.nodes.get(cursor));
        }
        return path.slice(1).map(({ x, z }) => ({ x, z }));
      }
      closed.add(nk);
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]) {
        const next = this.nodes.get(`${n.gx + dx},${n.gz + dz}`);
        if (!next || closed.has(key(next))) continue;
        if (
          dx &&
          dz &&
          (!this.nodes.has(`${n.gx + dx},${n.gz}`) ||
            !this.nodes.has(`${n.gx},${n.gz + dz}`))
        )
          continue;
        const candidate = cost.get(nk) + Math.hypot(dx, dz) * 0.5;
        if (candidate < (cost.get(key(next)) ?? Infinity)) {
          cost.set(key(next), candidate);
          came.set(key(next), nk);
          open.push(next);
        }
      }
    }
    return [];
  }
}
export function encounterStyle(r, action = "talk") {
  if (action === "gift")
    return {
      kind: "gift",
      icon: "🎁",
      title: "마음을 건넸어요",
      line: "이거, 네 생각이 나서.",
      reply: "고마워. 오래 간직할게!",
      gain: 8,
    };
  if (action === "dance")
    return {
      kind: "music",
      icon: "♪",
      title: "둘만의 작은 무대",
      line: "이 리듬, 같이 탈래?",
      reply: "좋아, 한 곡 더!",
      gain: 6,
    };
  if (r.affinity >= 58)
    return {
      kind: "heart",
      icon: "♥",
      title: r.tension >= 18 ? "밀고 당기는 두 사람" : "자꾸 눈이 마주쳐요",
      line:
        r.tension >= 18
          ? "아까는 투닥댔지만… 같이 갈래?"
          : "어, 또 만났네. 같이 걸을래?",
      reply: "너랑 있으면 시간이 빨라.",
      gain: 5,
    };
  if (r.tension >= 24)
    return {
      kind: "spark",
      icon: "ϟ",
      title: "티격태격, 그래도 함께",
      line: "잠깐, 그 길보단 이쪽이지!",
      reply: "그럼 네가 앞장서 봐!",
      gain: 2,
    };
  if (r.support >= 24)
    return {
      kind: "gift",
      icon: "✦",
      title: "필요할 때 나타나는 이웃",
      line: "혹시 이거 필요하지 않아?",
      reply: "어떻게 알았어? 딱 필요했는데.",
      gain: 5,
    };
  if (element(r.a.pillars[2][0]) === element(r.b.pillars[2][0]))
    return {
      kind: "resonance",
      icon: "✧",
      title: "우리, 같은 생각 했지?",
      line: "이 풍경, 왠지 익숙하지 않아?",
      reply: "나도 방금 그 생각 했어.",
      gain: 4,
    };
  return {
    kind: "chat",
    icon: "☁",
    title: "인사에서 시작된 이야기",
    line: "오늘 마을 산책하기 좋다.",
    reply: "같이 한 바퀴 돌까?",
    gain: 3,
  };
}
export class VillageSimulation {
  constructor(
    people,
    { onEvent = () => {}, bonds = {}, discovered = [] } = {},
  ) {
    this.people = people;
    this.onEvent = onEvent;
    this.nav = new Navigation();
    this.time = 0;
    this.paused = false;
    this.speed = 1;
    this.seed = Date.now() % 2147483647 || 1;
    this.bonds = { ...bonds };
    this.discovered = new Set(discovered);
    this.events = [];
    this.cooldowns = new Map();
    this.selected = people[0]?.id;
    this.manualUntil = 0;
    this.festivalUntil = 0;
    this.nextSocial = 3;
    this.visited = new Set();
    this.gifts = 0;
    this.relations = new Map(
      allRelations(people).map((r) => [pairKey(r.a.id, r.b.id), r]),
    );
    this.agents = people.map((p, i) => {
      const angle = (i / people.length) * Math.PI * 2;
      const pos =
        i === 0
          ? { x: 2.5, z: 4 }
          : this.nav.nearest({
              x: Math.cos(angle) * 6.1,
              z: Math.sin(angle) * 6.1,
            });
      return {
        id: p.id,
        person: p,
        x: pos.x,
        z: pos.z,
        angle: 0,
        path: [],
        state: "idle",
        wait: 0.2 + i * 0.16,
        targetId: null,
        action: "talk",
        until: 0,
        partner: null,
        steps: 0,
        mood: "느긋함",
        auto: true,
      };
    });
  }
  random() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  get(id) {
    return this.agents.find((a) => a.id === id);
  }
  player() {
    return this.get(this.selected);
  }
  select(id) {
    if (!this.get(id)) return;
    this.selected = id;
    this.manualUntil = 0;
  }
  release(a) {
    if (!a) return;
    const other = this.get(a.targetId || a.partner);
    if (other && (other.targetId === a.id || other.partner === a.id)) {
      other.targetId = null;
      other.partner = null;
      other.state = "idle";
      other.wait = 2;
      other.path = [];
    }
    a.targetId = null;
    a.partner = null;
  }
  moveTo(id, point) {
    const a = this.get(id);
    if (!a) return false;
    const route = this.nav.route(a, point);
    if (!route.length && distance(a, this.nav.nearest(point)) > 0.8)
      return false;
    this.release(a);
    a.path = route;
    a.state = "moving";
    a.wait = 2;
    if (id === this.selected) {
      a.auto = false;
      this.manualUntil = this.time + 3600;
    }
    return true;
  }
  toggleAuto() {
    const a = this.player();
    a.auto = !a.auto;
    this.release(a);
    a.path = [];
    a.state = "idle";
    a.wait = 0;
    return a.auto;
  }
  manual(dx, dz, dt) {
    const a = this.player();
    if (!a || this.paused || (!dx && !dz)) return;
    this.release(a);
    a.path = [];
    a.auto = false;
    a.state = "moving";
    const len = Math.hypot(dx, dz),
      step = dt * 2.7;
    const x = a.x + (dx / len) * step,
      z = a.z + (dz / len) * step;
    if (walkable(x, a.z)) a.x = x;
    if (walkable(a.x, z)) a.z = z;
    a.angle = Math.atan2(dx, dz);
    a.steps += step;
    a.manualFrame = true;
  }
  nearest(id = this.selected) {
    const a = this.get(id);
    return this.agents
      .filter((b) => b !== a)
      .sort((x, y) => distance(a, x) - distance(a, y))[0];
  }
  meet(targetId, action = "talk", actorId = this.selected) {
    const a = this.get(actorId),
      b = this.get(targetId);
    if (!a || !b || a === b || this.paused) return false;
    this.release(a);
    this.release(b);
    const candidates = [
      { x: b.x + 1.1, z: b.z },
      { x: b.x - 1.1, z: b.z },
      { x: b.x, z: b.z + 1.1 },
      { x: b.x, z: b.z - 1.1 },
    ]
      .filter((p) => walkable(p.x, p.z))
      .sort((p, q) => distance(a, p) - distance(a, q));
    const destination = candidates[0] || this.nav.nearest(b);
    a.path = this.nav.route(a, destination);
    a.targetId = b.id;
    a.action = action;
    a.state = "approaching";
    a.until = this.time + 35;
    b.path = [];
    b.state = "waiting";
    b.targetId = a.id;
    b.until = this.time + 35;
    if (actorId === this.selected) a.auto = false;
    return true;
  }
  interact(a, b, action) {
    const r = this.relations.get(pairKey(a.id, b.id));
    if (!r) return;
    const style = encounterStyle(r, action),
      key = pairKey(a.id, b.id);
    this.bonds[key] = Math.min(100, (this.bonds[key] || 0) + style.gain);
    this.discovered.add(key);
    this.cooldowns.set(key, this.time + 28);
    if (action === "gift") this.gifts++;
    for (const who of [a, b]) {
      who.path = [];
      who.state = action === "dance" ? "dancing" : "interacting";
      who.until = this.time + 6;
      who.partner = who === a ? b.id : a.id;
      who.targetId = null;
      who.mood = style.title;
      who.angle = Math.atan2(
        (who === a ? b : a).x - who.x,
        (who === a ? b : a).z - who.z,
      );
    }
    const event = {
      id: this.events.length + Date.now(),
      a: a.id,
      b: b.id,
      names: [a.person.name, b.person.name],
      x: (a.x + b.x) / 2,
      z: (a.z + b.z) / 2,
      time: this.time,
      action,
      relation: r.type,
      ...style,
      bond: this.bonds[key],
      reason:
        r.evidence
          .slice(0, 3)
          .map((e) => e.text)
          .join(" · ") || "새로운 이웃의 첫 인사",
    };
    this.events.unshift(event);
    this.events = this.events.slice(0, 60);
    this.onEvent(event);
    return event;
  }
  roam(a) {
    const trait = behavior[a.person.pillars[2][0]],
      favorite = places.find((p) => p.id === trait.like);
    let p;
    if (this.random() < 0.4)
      p = {
        x: favorite.x + (this.random() - 0.5) * 2,
        z: favorite.z + (this.random() - 0.5) * 2,
      };
    else {
      const angle = this.random() * Math.PI * 2,
        r = 3 + this.random() * 6;
      p = { x: Math.cos(angle) * r, z: Math.sin(angle) * r };
    }
    a.path = this.nav.route(a, p);
    a.state = "moving";
    a.mood = trait.verb;
  }
  festival() {
    if (this.paused) return;
    this.festivalUntil = this.time + 24;
    this.agents.forEach((a, i) => {
      this.release(a);
      const angle = (i / this.agents.length) * Math.PI * 2;
      const p = this.nav.nearest({
        x: Math.cos(angle) * 3.7,
        z: Math.sin(angle) * 3.7,
      });
      a.path = this.nav.route(a, p);
      a.state = "festival-walk";
      a.mood = "축제로 가는 중";
    });
  }
  update(dt) {
    if (this.paused) return;
    dt = Math.min(0.1, dt) * this.speed;
    this.time += dt;
    for (const a of this.agents) {
      if (a.manualFrame) {
        a.manualFrame = false;
        continue;
      }
      if (a.state === "interacting" || a.state === "dancing") {
        if (this.time >= a.until) {
          this.release(a);
          a.state = "idle";
          a.wait = 2 + this.random() * 2;
        }
        continue;
      }
      if (a.state === "waiting") {
        if (this.time > a.until) {
          this.release(a);
          a.state = "idle";
          a.wait = 1;
        }
        continue;
      }
      if (a.path.length) {
        const p = a.path[0],
          dist = distance(a, p),
          step =
            behavior[a.person.pillars[2][0]].pace *
            dt *
            (a.id === this.selected ? 1.3 : 1);
        a.angle = Math.atan2(p.x - a.x, p.z - a.z);
        if (dist <= step) {
          a.x = p.x;
          a.z = p.z;
          a.path.shift();
        } else {
          a.x += ((p.x - a.x) / dist) * step;
          a.z += ((p.z - a.z) / dist) * step;
        }
        a.steps += step;
      }
      if (!a.path.length) {
        if (a.state === "approaching") {
          const b = this.get(a.targetId);
          if (b && distance(a, b) < 2) {
            this.interact(a, b, a.action);
            continue;
          }
          if (this.time > a.until) {
            this.release(a);
            a.state = "idle";
            a.wait = 1;
          } else if (b) a.path = this.nav.route(a, { x: b.x + 1, z: b.z });
        } else if (a.state === "festival-walk") {
          a.state = "dancing";
          a.until = this.festivalUntil;
          a.mood = "축제에서 춤추는 중";
        } else {
          a.state = "idle";
          a.wait -= dt;
          if (a.wait <= 0 && a.auto && this.time > this.festivalUntil) {
            this.roam(a);
            a.wait = 2 + this.random() * 4;
          }
        }
      }
    }
    // Close encounters happen in the scene, after both agents have arrived.
    if (this.time > this.festivalUntil) {
      for (let i = 0; i < this.agents.length; i++) {
        const a = this.agents[i];
        if (!a.auto || !["moving", "idle"].includes(a.state)) continue;
        for (const b of this.agents.slice(i + 1)) {
          if (
            !b.auto ||
            !["moving", "idle"].includes(b.state) ||
            distance(a, b) > 1.25
          )
            continue;
          const key = pairKey(a.id, b.id);
          if ((this.cooldowns.get(key) || 0) > this.time) continue;
          this.interact(a, b, "talk");
          break;
        }
      }
    }
    // Plan meetings using the chart's narrative affinity, while leaving room for chance.
    if (this.time > this.nextSocial && this.time > this.festivalUntil) {
      this.nextSocial = this.time + 7;
      const available = this.agents.filter(
        (a) => a.auto && ["idle", "moving"].includes(a.state),
      );
      if (available.length > 1) {
        const a = available[Math.floor(this.random() * available.length)],
          candidates = available
            .filter((b) => b !== a)
            .map((b) => ({ b, r: this.relations.get(pairKey(a.id, b.id)) }))
            .filter(
              ({ b }) =>
                (this.cooldowns.get(pairKey(a.id, b.id)) || 0) < this.time,
            );
        candidates.sort(
          (x, y) =>
            y.r.affinity +
            y.r.support * 0.5 -
            (x.r.affinity + x.r.support * 0.5),
        );
        const b =
          candidates[Math.floor(this.random() * Math.min(3, candidates.length))]
            ?.b;
        if (b) {
          const auto = a.auto;
          this.meet(b.id, "talk", a.id);
          a.auto = auto;
        }
      }
    }
    const player = this.player();
    for (const place of places)
      if (player && distance(player, place) < 1.8) this.visited.add(place.id);
  }
  snapshot() {
    return {
      time: this.time,
      paused: this.paused,
      speed: this.speed,
      selected: this.selected,
      auto: this.player()?.auto,
      discovered: this.discovered.size,
      visits: this.visited.size,
      gifts: this.gifts,
      festival: this.time < this.festivalUntil,
      agents: this.agents.map((a) => ({
        id: a.id,
        x: +a.x.toFixed(2),
        z: +a.z.toFixed(2),
        state: a.state,
        mood: a.mood,
      })),
      events: this.events.slice(0, 6),
      bonds: { ...this.bonds },
    };
  }
}
