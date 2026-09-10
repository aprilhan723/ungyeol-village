import { createWorld } from "./world.js";
import { avatarData, designFor } from "./art.js";
import { archetypes } from "./data.js";
import { relation } from "./engine.js";
import { places } from "./simulation.js";
import "./game.css";
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function createGame(
  root,
  { people, active, name, onSelect, onProfile, onPair, onManage, onGuide },
) {
  let world,
    selected = active,
    target = people.find((p) => p.id !== active)?.id,
    snapshot,
    night = false,
    eventTimer,
    playerBannerUntil = 0;
  const $ = (s) => root.querySelector(s);
  const image = (p) =>
    `<img src="${avatarData(p)}" alt="${esc(designFor(p).name)}"/>`;
  const storageKey =
    "ungyeol-play-v2:" +
    people
      .map((p) => p.id)
      .sort()
      .join("-");
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
  } catch {}
  const p = people.find((p) => p.id === active) || people[0];
  root.innerHTML = `<section class="game-stage" aria-label="운결마을 인터랙티브 게임"><div id="world" class="game-world"></div><div class="game-vignette"></div><div class="game-hud"><div class="player-column"><button class="player-card" id="player-detail">${image(p)}<span><small>지금, 나의 캐릭터</small><strong id="player-name">${esc(p.name)}</strong><span id="player-design">${esc(designFor(p).name)}</span></span><b>↗</b></button><div class="play-status"><i></i><span id="walk-status">이웃들이 산책을 시작했어요</span></div><div class="quest-card"><div><span>✧ 오늘의 작은 모험</span><button id="game-help" aria-label="게임 조작 안내">?</button></div><p><i id="quest-meet">○</i> 새로운 만남 지켜보기 <b id="quest-count">0 / 3</b></p><p><i id="quest-gift">○</i> 마음을 담은 선물 건네기 <b id="gift-count">0 / 1</b></p><p><i id="quest-visit">○</i> 마을의 숨은 장소 산책 <b id="visit-count">0 / 3</b></p></div></div><div class="game-title"><span>A LITTLE LIFE IN UNGYEOL</span><h1>오늘은 누구와 마주칠까?</h1><p>땅을 톡, 누르면 걸어요.</p></div><div class="game-right"><div class="game-toolbar"><button id="theme" aria-label="햇살 달빛 전환">☀</button><button id="camera-mode" aria-label="마을 전체 보기" title="전체 보기 / 따라가기">⊞</button><button id="zoom-in" aria-label="확대">＋</button><button id="zoom-out" aria-label="축소">−</button><button id="pause" aria-label="마을 일시정지">Ⅱ</button><button id="speed" aria-label="산책 속도 변경">1×</button><button id="manage" aria-label="마을 관리">⚙</button></div><div class="day-badge"><span id="time-icon">☀</span><div><strong id="day-time">산들바람 부는 오후</strong><small>${esc(name)} · <span id="encounter-count">0</span>번의 만남</small></div></div><div class="live-journal"><div><i></i><span>방금, 마을에서는</span></div><ul id="event-list"><li class="waiting-event">이웃들이 만나면<br/>작은 이야기가 도착해요.</li></ul></div></div></div><div class="encounter-banner" id="event-banner" aria-live="polite"></div><div class="place-markers"><span>✿ 꽃바람 정원</span><span>✧ 인연 광장</span><span>☕ 봄비 피크닉</span></div><div class="game-bottom"><div class="interaction-panel"><div class="target-picker"><span id="target-avatar"></span><label>누구에게 다가갈까요?<select id="meet-target">${people
    .filter((a) => a.id !== active)
    .map(
      (a) =>
        `<option value="${a.id}">${esc(a.name)} · ${esc(designFor(a).name)}</option>`,
    )
    .join(
      "",
    )}</select></label><span class="chemistry-hint" id="chemistry-hint"></span></div><div class="action-buttons"><button id="action-talk" class="main-action"><span>☁</span><b>다가가서 인사</b><kbd>E</kbd></button><button id="action-gift"><span>🎁</span><b>선물 건네기</b></button><button id="action-dance"><span>♫</span><b>같이 춤추기</b></button><button id="auto-walk" aria-pressed="true"><span>⌁</span><b>자동 산책 중</b></button><button id="festival"><span>✦</span><b>마을 축제</b></button></div><div class="action-status" id="action-status" role="status">만나고 싶은 이웃을 골라 보세요. 서로 다가간 뒤 반응이 시작됩니다.</div></div><div class="character-switcher"><span class="switcher-label">누구의 하루를<br/>살아 볼까요?</span><div class="character-roster">${people.map((a) => `<button class="resident-choice ${a.id === active ? "active" : ""}" data-character="${a.id}" aria-label="${esc(a.name)} 캐릭터로 플레이">${image(a)}<span>${esc(a.name)}</span></button>`).join("")}</div></div><div class="game-footnote"><span><kbd>W A S D</kbd> / 방향키 이동 <b>·</b> 땅 클릭으로 걷기 <b>·</b> 드래그로 둘러보기</span><button id="game-rules">명리 상징으로 만든 상상 속 마을 ⓘ</button></div></div><div class="paused-overlay" id="paused-label" hidden>잠깐, 쉬어 가는 중 <button id="resume">계속 산책하기 ▶</button></div></section>`;
  function persist() {
    if (!world) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(world.persist()));
    } catch {}
  }
  function updateTarget() {
    const a = people.find((p) => p.id === selected),
      b = people.find((p) => p.id === target);
    if (!b) {
      $("#target-avatar").innerHTML = "";
      $("#chemistry-hint").textContent = "이웃을 초대해 주세요";
      for (const id of ["talk", "gift", "dance"])
        $("#action-" + id).disabled = true;
      return;
    }
    for (const id of ["talk", "gift", "dance"])
      $("#action-" + id).disabled = false;
    $("#target-avatar").innerHTML = image(b);
    const r = relation(a, b);
    const icon =
      r.affinity >= 58
        ? "♥"
        : r.tension >= 24
          ? "ϟ"
          : r.support >= 24
            ? "✦"
            : "✧";
    $("#chemistry-hint").textContent = icon + " " + r.type;
    $("#chemistry-hint").style.color =
      r.affinity >= 58 ? "#c8708e" : r.tension >= 24 ? "#bc925f" : "#718d78";
    $("#meet-target").value = b.id;
  }
  function choose(id) {
    if (id === selected) {
      onProfile(people.find((p) => p.id === id));
      return;
    }
    target = id;
    updateTarget();
    $("#action-status").textContent =
      `${people.find((p) => p.id === id).name}에게 인사하거나 선물을 건네 보세요.`;
    $(".interaction-panel").classList.add("attention");
    setTimeout(
      () => $(".interaction-panel")?.classList.remove("attention"),
      600,
    );
  }
  function drawEvent(e) {
    const playerEvent = e.a === selected || e.b === selected;
    if (playerEvent) playerBannerUntil = performance.now() + 4500;
    if (playerEvent || performance.now() >= playerBannerUntil) {
      clearTimeout(eventTimer);
      const el = $("#event-banner");
      el.replaceChildren();
      const mark = document.createElement("span");
      mark.className = "event-symbol " + e.kind;
      mark.textContent = e.icon;
      const text = document.createElement("div");
      const names = document.createElement("small");
      names.textContent = e.names.join(" & ");
      const title = document.createElement("strong");
      title.textContent = e.title;
      const bond = document.createElement("small");
      bond.textContent = `함께한 마음 +${e.gain} · ${e.bond}점`;
      text.append(names, title, bond);
      el.append(mark, text);
      el.classList.add("visible");
      el.onclick = () => onPair(e.a, e.b);
      eventTimer = setTimeout(() => el.classList.remove("visible"), 4800);
    }
    const list = $("#event-list");
    list.querySelector(".waiting-event")?.remove();
    const li = document.createElement("li"),
      button = document.createElement("button"),
      badge = document.createElement("span"),
      description = document.createElement("span");
    badge.textContent = e.icon;
    badge.className = e.kind;
    const who = document.createElement("b");
    who.textContent = e.names.join(" · ");
    const what = document.createElement("small");
    what.textContent = e.title;
    description.append(who, what);
    button.append(badge, description);
    button.onclick = () => onPair(e.a, e.b);
    li.append(button);
    list.prepend(li);
    while (list.children.length > 3) list.lastChild.remove();
    if (e.a === selected || e.b === selected)
      $("#action-status").textContent = `${e.title} · ${e.line}`;
    persist();
  }
  function tick(s) {
    snapshot = s;
    const current = s.agents.find((a) => a.id === selected);
    if (!current) return;
    $("#walk-status").textContent = s.paused
      ? "잠깐 쉬는 중"
      : current.state === "approaching"
        ? "이웃에게 다가가는 중"
        : current.state === "waiting"
          ? "이웃을 기다리는 중"
          : current.state === "interacting" || current.state === "dancing"
            ? current.mood
            : current.state === "moving"
              ? s.auto
                ? "마음 가는 대로 자동 산책"
                : "원하는 곳으로 걷는 중"
              : "풍경을 바라보는 중";
    $("#auto-walk").setAttribute("aria-pressed", String(s.auto));
    $("#auto-walk b").textContent = s.auto ? "자동 산책 중" : "자동 산책";
    $("#encounter-count").textContent = s.events.length;
    $("#quest-count").textContent = `${Math.min(s.discovered, 3)} / 3`;
    $("#gift-count").textContent = `${Math.min(s.gifts, 1)} / 1`;
    $("#visit-count").textContent = `${Math.min(s.visits, 3)} / 3`;
    $("#quest-meet").textContent = s.discovered >= 3 ? "✓" : "○";
    $("#quest-gift").textContent = s.gifts >= 1 ? "✓" : "○";
    $("#quest-visit").textContent = s.visits >= 3 ? "✓" : "○";
    $("#festival").disabled = s.festival;
    $("#festival b").textContent = s.festival ? "축제 진행 중" : "마을 축제";
    $("#world").dataset.moving = String(
      s.agents.filter((a) =>
        ["moving", "approaching", "festival-walk"].includes(a.state),
      ).length,
    );
    $("#world").dataset.encounters = String(s.events.length);
  }
  world = createWorld($("#world"), people, {
    selected: active,
    onChoose: choose,
    onEvent: drawEvent,
    onTick: tick,
    saved,
  });
  if (world.failed) {
    $("#world").innerHTML =
      '<div class="webgl-fallback"><h2>3D 마을을 시작하지 못했어요</h2><p>브라우저의 그래픽 가속을 켜거나 다른 브라우저에서 열어 주세요. 주민 도감과 관계 지도는 계속 볼 수 있어요.</p></div>';
    return { failed: true, destroy() {}, select() {} };
  }
  updateTarget();
  $("#meet-target").onchange = (e) => {
    target = e.target.value;
    updateTarget();
  };
  for (const action of ["talk", "gift", "dance"])
    $("#action-" + action).onclick = () => {
      if (!target) return;
      if (world.meet(target, action))
        $("#action-status").textContent =
          `${people.find((p) => p.id === target).name}에게 걸어가고 있어요. 곧 ${action === "gift" ? "선물을 건넵니다" : action === "dance" ? "함께 춤춥니다" : "이야기가 시작됩니다"}.`;
      else
        $("#action-status").textContent = "일시정지를 풀고 다시 만나 보세요.";
    };
  $("#auto-walk").onclick = () => {
    world.auto();
    tick(world.getState());
  };
  $("#festival").onclick = () => {
    world.festival();
    $("#action-status").textContent =
      "광장에 모두 모여요! 도착한 주민부터 춤을 춥니다.";
  };
  $("#player-detail").onclick = () =>
    onProfile(people.find((p) => p.id === selected));
  $("#game-help").onclick = onGuide;
  $("#game-rules").onclick = onGuide;
  $("#manage").onclick = onManage;
  const pause = () => {
    const paused = world.pause();
    $("#pause").textContent = paused ? "▶" : "Ⅱ";
    $("#paused-label").hidden = !paused;
  };
  $("#pause").onclick = pause;
  $("#resume").onclick = pause;
  $("#speed").onclick = () => ($("#speed").textContent = world.speed() + "×");
  $("#camera-mode").onclick = () => {
    const follow = world.overview();
    $("#camera-mode").textContent = follow ? "⊞" : "◎";
    $("#camera-mode").setAttribute(
      "aria-label",
      follow ? "마을 전체 보기" : "내 캐릭터 따라가기",
    );
  };
  $("#zoom-in").onclick = () => world.zoom(0.84);
  $("#zoom-out").onclick = () => world.zoom(1.16);
  $("#theme").onclick = () => {
    night = !night;
    world.theme(night ? "night" : "day");
    $(".game-stage").classList.toggle("night", night);
    $("#theme").textContent = night ? "☾" : "☀";
    $("#time-icon").textContent = night ? "☾" : "☀";
    $("#day-time").textContent = night
      ? "반딧불이 깨어나는 밤"
      : "산들바람 부는 오후";
  };
  root
    .querySelectorAll("[data-character]")
    .forEach(
      (button) => (button.onclick = () => onSelect(button.dataset.character)),
    );
  const hidden = () => {
    if (document.hidden) persist();
  };
  document.addEventListener("visibilitychange", hidden);
  return {
    select(id) {
      selected = id;
      world.select(id);
      const p = people.find((a) => a.id === id);
      $("#player-name").textContent = p.name;
      $("#player-design").textContent = designFor(p).name;
      $("#player-detail img").src = avatarData(p);
      $("#player-detail img").alt = designFor(p).name;
      root
        .querySelectorAll("[data-character]")
        .forEach((b) =>
          b.classList.toggle("active", b.dataset.character === id),
        );
      if (target === id) target = people.find((a) => a.id !== id)?.id;
      $("#meet-target").innerHTML = people
        .filter((a) => a.id !== id)
        .map(
          (a) =>
            `<option value="${a.id}">${esc(a.name)} · ${esc(designFor(a).name)}</option>`,
        )
        .join("");
      updateTarget();
      tick(world.getState());
    },
    getState: () => world.getState(),
    destroy() {
      persist();
      clearTimeout(eventTimer);
      document.removeEventListener("visibilitychange", hidden);
      world.destroy();
    },
  };
}
