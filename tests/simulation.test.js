import test from "node:test";
import assert from "node:assert/strict";
import { residents } from "../src/data.js";
import {
  VillageSimulation,
  Navigation,
  walkable,
  encounterStyle,
  pairKey,
} from "../src/simulation.js";
import { relation } from "../src/engine.js";
const run = (s, seconds) => {
  for (let t = 0; t < seconds; t += 0.05) s.update(0.05);
};
test("routes go around the fountain and lake without leaving walkable ground", () => {
  const nav = new Navigation();
  for (const [a, b] of [
    [
      { x: -4, z: 0 },
      { x: 4, z: 0 },
    ],
    [
      { x: -9, z: -5 },
      { x: -4, z: -5 },
    ],
    [
      { x: 2, z: 2 },
      { x: 100, z: 100 },
    ],
  ]) {
    const route = nav.route(a, b);
    assert.ok(route.length > 0);
    for (const p of route) assert.ok(walkable(p.x, p.z));
  }
});
test("residents physically move, meet and emit chart-based encounters", () => {
  const events = [],
    s = new VillageSimulation(residents, { onEvent: (e) => events.push(e) });
  s.seed = 42;
  const before = s.snapshot();
  run(s, 60);
  assert.ok(
    s.agents.some(
      (a, i) =>
        Math.hypot(a.x - before.agents[i].x, a.z - before.agents[i].z) > 1,
    ),
  );
  assert.ok(events.length > 0);
  assert.ok(s.discovered.size > 0);
  for (const a of s.agents) assert.ok(walkable(a.x, a.z));
});
test("requested gift only happens after walking to the target; bonds persist", () => {
  const events = [],
    s = new VillageSimulation(residents, { onEvent: (e) => events.push(e) });
  s.agents.forEach((a) => (a.auto = false));
  s.meet(residents[1].id, "gift");
  assert.equal(events.length, 0);
  run(s, 30);
  const event = events.find((e) => e.action === "gift");
  assert.ok(event);
  assert.equal(event.kind, "gift");
  assert.equal(s.bonds[pairKey(residents[0].id, residents[1].id)], 8);
  assert.equal(s.gifts, 1);
  const restored = new VillageSimulation(residents, {
    bonds: s.bonds,
    discovered: [...s.discovered],
  });
  assert.deepEqual(restored.bonds, s.bonds);
  assert.equal(restored.discovered.size, s.discovered.size);
});
test("pause freezes simulation and keyboard movement cannot pass into fountain", () => {
  const s = new VillageSimulation(residents);
  s.paused = true;
  const before = s.snapshot();
  s.manual(1, 0, 0.05);
  run(s, 10);
  assert.deepEqual(s.snapshot(), before);
  s.paused = false;
  const a = s.player();
  a.x = 2;
  a.z = 0;
  for (let i = 0; i < 50; i++) s.manual(-1, 0, 0.05);
  assert.ok(walkable(a.x, a.z));
  assert.ok(a.x > 1.7);
});
test("festival brings residents together and starts dancing after arrival", () => {
  const s = new VillageSimulation(residents);
  s.festival();
  run(s, 12);
  assert.ok(s.agents.filter((a) => a.state === "dancing").length > 5);
  run(s, 30);
  assert.ok(s.agents.some((a) => a.state !== "dancing"));
});
test("heart effects follow attraction, gift and dance are player choices", () => {
  const r = relation(residents[0], residents[1]);
  assert.equal(encounterStyle(r).kind, "heart");
  assert.equal(encounterStyle(r, "gift").kind, "gift");
  assert.equal(encounterStyle(r, "dance").kind, "music");
});
test("single resident and repeated player target changes remain valid", () => {
  const s = new VillageSimulation(residents.slice(0, 1));
  run(s, 45);
  assert.equal(s.nearest(), undefined);
  assert.equal(s.meet(residents[0].id), false);
  assert.ok(walkable(s.player().x, s.player().z));
  const t = new VillageSimulation(residents);
  t.meet(residents[1].id);
  t.meet(residents[2].id);
  assert.equal(t.get(residents[1].id).state, "idle");
  assert.equal(t.player().targetId, residents[2].id);
});
