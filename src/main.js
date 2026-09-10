import "./style.css";
import {
  createIcons,
  House,
  Network,
  ChartNoAxesColumnIncreasing,
  Users,
  Plus,
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Search,
  SlidersHorizontal,
  Sun,
  Moon,
  Maximize,
  ZoomIn,
  ZoomOut,
  Pause,
  Play,
  X,
  Heart,
  Sparkles,
  Flame,
  Zap,
  Orbit,
  Coffee,
  Info,
  Download,
  Upload,
  Share2,
  Check,
  Leaf,
  MapPin,
  Compass,
  BookOpen,
  RefreshCw,
  Menu,
} from "lucide";
import { residents, elements, elementColors, archetypes } from "./data.js";
import {
  allRelations,
  relation,
  distribution,
  element,
  season,
  validateResident,
  typeMeta,
  hidden,
} from "./engine.js";
import { avatarData } from "./world.js";
import { createGame } from "./game.js";
import { designFor } from "./art.js";
const iconSet = {
  House,
  Network,
  ChartNoAxesColumnIncreasing,
  Users,
  Plus,
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Search,
  SlidersHorizontal,
  Sun,
  Moon,
  Maximize,
  ZoomIn,
  ZoomOut,
  Pause,
  Play,
  X,
  Heart,
  Sparkles,
  Flame,
  Zap,
  Orbit,
  Coffee,
  Info,
  Download,
  Upload,
  Share2,
  Check,
  Leaf,
  MapPin,
  Compass,
  BookOpen,
  RefreshCw,
  Menu,
};
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)],
  ico = (name, cls = "") => `<i data-lucide="${name}" class="${cls}"></i>`;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let people = structuredClone(residents),
  village = "운결마을",
  view = "village",
  active = "siyeon",
  filter = "전체",
  query = "",
  rankBy = "affinity",
  theme = "day",
  world,
  showLines = false,
  storyIndex = 0,
  toastTimer;
try {
  const saved = JSON.parse(localStorage.getItem("ungyeol-v1"));
  if (saved) {
    saved.people.forEach(validateResident);
    people = saved.people;
    village = String(saved.name || "운결마을").slice(0, 24);
    active = people[0].id;
  }
} catch {}
const initial = new URLSearchParams(location.search);
if (people.some((p) => p.id === initial.get("person")))
  active = initial.get("person");
if (["map", "ranking", "residents"].includes(initial.get("view")))
  view = initial.get("view");
const pairs = () => allRelations(people),
  person = () => people.find((p) => p.id === active) || people[0];
function save() {
  try {
    localStorage.setItem(
      "ungyeol-v1",
      JSON.stringify({ name: village, people }),
    );
  } catch {
    toast("브라우저 저장 공간이 부족해요. 마을 파일로 내려받아 주세요.");
  }
}
function iconize() {
  createIcons({ icons: iconSet, attrs: { "stroke-width": 1.65 } });
}
function toast(text) {
  clearTimeout(toastTimer);
  $("#toast").textContent = text;
  $("#toast").classList.add("show");
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 3500);
}
function avatar(p, cls = "") {
  return `<img class="avatar ${cls}" src="${avatarData(p)}" alt="${esc(p.name)} · ${esc(p.role)}"/>`;
}
function shell() {
  document.querySelector("#app").innerHTML =
    `<header class="header"><a class="brand" href="/" aria-label="운결마을 홈"><span class="brand-mark">${ico("house")}</span><span>${esc(village)}<small>UNGYEOL VILLAGE</small></span></a><nav aria-label="주요 메뉴">${[
      ["village", "house", "마을 플레이"],
      ["map", "network", "관계 지도"],
      ["ranking", "chart-no-axes-column-increasing", "케미 랭킹"],
      ["residents", "users", "주민 도감"],
    ]
      .map(
        ([id, icon, label]) =>
          `<button data-view="${id}" aria-label="${label}" class="nav-item ${view === id ? "active" : ""}">${ico(icon)}<span>${label}</span></button>`,
      )
      .join(
        "",
      )}</nav><div class="header-actions"><button class="icon-btn" id="guide" aria-label="마을 안내">${ico("info")}</button><button class="secondary share" id="share">${ico("share-2")}<span>공유하기</span></button><button class="primary" id="add">${ico("plus")}<span>주민 초대</span></button></div></header><main id="main"></main><footer><span class="footer-brand">✳ 우리의 인연이 사는 곳</span><span>명리의 상징으로 만든 창작 세계 · 실제 성격·감정·미래를 판정하지 않습니다.</span><button id="method">해석 기준 보기 ${ico("arrow-up-right")}</button><a href="https://github.com/aprilhan723/ungyeol-village" target="_blank" rel="noreferrer">오픈소스 ↗</a></footer><dialog id="dialog"><div id="modal-body"></div></dialog><div role="status" id="toast"></div><input type="file" id="import-file" accept="application/json,.json" hidden/>`;
  $$("[data-view]").forEach(
    (b) => (b.onclick = () => navigate(b.dataset.view)),
  );
  $("#add").onclick = addModal;
  $("#guide").onclick = guide;
  $("#method").onclick = method;
  $("#share").onclick = share;
  $("#import-file").onchange = importFile;
  $("#dialog").addEventListener("click", (e) => {
    if (e.target === $("#dialog")) $("#dialog").close();
  });
  render();
}
function navigate(v) {
  view = v;
  filter = "전체";
  query = "";
  $$("[data-view]").forEach((b) =>
    b.classList.toggle("active", b.dataset.view === v),
  );
  const url = new URL(location.href);
  url.searchParams.set("view", v);
  history.replaceState({}, "", url);
  render();
}
function render() {
  document.body.classList.toggle("playing", view === "village");
  world?.destroy();
  world = null;
  const p = person();
  if (view === "village") renderVillage(p);
  if (view === "map") renderMap();
  if (view === "ranking") renderRanking();
  if (view === "residents") renderResidents();
  iconize();
}
function renderVillage(p) {
  world = createGame($("#main"), {
    people,
    active,
    name: village,
    onSelect: select,
    onProfile: personModal,
    onPair: openPair,
    onManage: manage,
    onGuide: guide,
  });
}
function profile(p, rs) {
  const d = p.pillars[2],
    arch = archetypes[d[0]],
    dist = distribution(p),
    total = dist.reduce((a, b) => a + b, 0);
  return `<div class="profile-top"><span class="eyebrow">MEET YOUR NEIGHBOR</span><span class="small-tag">${esc(d)}일주</span></div><div class="profile-hero" style="--person:${p.color}">${avatar(p, "large")}<span class="orbit-one"></span><span class="orbit-two"></span><div class="nature-label">${arch.symbol} ${arch.nature}</div></div><div class="profile-name"><span>${esc(p.role)}</span><h2>${esc(p.name)} <small>${elements[element(d[0])]}${"木火土金水"[element(d[0])]}</small></h2><p>“${esc(p.quote)}”</p></div><div class="pillars">${p.pillars.map((v, i) => `<div><span>${["년주", "월주", "일주", "시주"][i]}</span><strong class="${i === 2 ? "day-pillar" : ""}">${v || "미상"}</strong></div>`).join("")}</div><div class="element-bar">${dist.map((n, i) => `<span style="width:${(n / total) * 100}%;background:${elementColors[i]}" title="${elements[i]} ${n}개"></span>`).join("")}</div><div class="element-legend">${dist.map((n, i) => `<span><i style="background:${elementColors[i]}"></i>${elements[i]} ${n}</span>`).join("")}</div><div class="profile-relations"><div class="section-title"><h3>이 이웃과의 연결</h3><span>창작 지수</span></div>${rs
    .slice(0, 2)
    .map((r) => {
      const other = r.a.id === p.id ? r.b : r.a;
      return `<button class="relation-mini" data-pair="${r.a.id}:${r.b.id}">${avatar(other)}<span><b>${esc(other.name)}</b><small style="color:${typeMeta[r.type].color}">${r.type}</small></span><strong>${r.affinity}<small>끌림</small></strong>${ico("chevron-right")}</button>`;
    })
    .join(
      "",
    )}</div><button class="profile-more" id="profile-more">캐릭터와 명식 자세히 ${ico("arrow-right")}</button>`;
}
function bindPeople() {
  $$("[data-person]").forEach(
    (b) => (b.onclick = () => select(b.dataset.person)),
  );
}
function bindProfile() {
  $$("[data-pair]").forEach(
    (b) => (b.onclick = () => openPair(...b.dataset.pair.split(":"))),
  );
  $("#profile-more")?.addEventListener("click", () => personModal(person()));
}
function select(id) {
  active = id;
  const url = new URL(location.href);
  url.searchParams.set("person", id);
  history.replaceState({}, "", url);
  if (view === "village") world?.select(id);
  else if (view === "map") render();
  else personModal(person());
}
function modal(title, body, cls = "") {
  const d = $("#dialog");
  $("#modal-body").innerHTML =
    `<div class="modal-header"><div><span class="eyebrow">UNGYEOL VILLAGE</span><h2>${title}</h2></div><button class="icon-btn" id="close-modal" aria-label="닫기">${ico("x")}</button></div><div class="modal-content ${cls}">${body}</div>`;
  $("#close-modal").onclick = () => d.close();
  if (!d.open) d.showModal();
  iconize();
}
function personModal(p) {
  const arch = archetypes[p.pillars[2][0]],
    dist = distribution(p);
  modal(
    `${esc(p.name)}의 이야기`,
    `<div class="detail-hero" style="background:${p.color}22">${avatar(p)}<div><span>${esc(p.role)} · ${esc(p.place)}</span><h3>${esc(designFor(p).name)}</h3><p>${esc(p.quote)}</p></div></div><div class="interpret-chain"><span>${p.pillars[2][0]} 일간</span>${ico("arrow-right")}<span>${arch.nature}</span>${ico("arrow-right")}<span>${arch.motif}</span></div><p><b>${esc(designFor(p).detail)}</b></p><p>${esc(p.story)}</p><p class="notice">자연물은 일간을 이해하는 비유입니다. ‘큰 물’이 성격의 크기나 우월함을 뜻하지 않으며, 캐릭터의 외모는 실제 외모와 무관한 창작입니다.</p><h3>명식의 네 기둥</h3><div class="pillar-details">${p.pillars.map((v, i) => `<div><small>${["년주", "월주", "일주", "시주"][i]}</small><strong>${v || "미상"}</strong><span>${v ? `지장간 ${hidden[v[1]]}` : "해석에서 제외"}</span></div>`).join("")}</div><p>${season(p)}의 ${p.pillars[2][0]}${elements[element(p.pillars[2][0])]} · 표면 여덟 글자 중 ${p.pillars[3] ? "8" : "6"}글자 확인</p><div class="element-list">${dist.map((n, i) => `<div><span style="color:${elementColors[i]}">${elements[i]}</span><progress value="${n}" max="8"></progress><b>${n}개</b></div>`).join("")}</div><p class="notice">이 수치는 천간과 지지의 대표 오행 단순 개수입니다. 지장간·월령 가중치를 합산한 세력이나 용신 판정이 아닙니다. ${p.pillars[3] ? "입력한 시주를 그대로 반영했습니다." : "출생 시간 미상: 시주는 추정하지 않았습니다."}</p><h3>이웃과의 이야기</h3><div class="pair-list">${pairs()
      .filter((r) => r.a.id === p.id || r.b.id === p.id)
      .sort((a, b) => b.affinity - a.affinity)
      .map(
        (r) =>
          `<button data-pair="${r.a.id}:${r.b.id}"><span>${esc(r.a.id === p.id ? r.b.name : r.a.name)}</span><span style="color:${typeMeta[r.type].color}">${r.type} ${ico("chevron-right")}</span></button>`,
      )
      .join("")}</div>`,
  );
  bindProfile();
  iconize();
}
function openPair(a, b) {
  const pa = people.find((p) => p.id === a),
    pb = people.find((p) => p.id === b);
  if (!pa || !pb || a === b) return;
  const r = relation(pa, pb),
    meta = typeMeta[r.type];
  modal(
    `${esc(pa.name)} & ${esc(pb.name)}`,
    `<div class="pair-hero">${avatar(pa)}<div style="color:${meta.color}">${ico(meta.icon)}<h3>${r.type}</h3><span>${meta.line}</span></div>${avatar(pb)}</div><div class="metrics">${[
      ["끌림", r.affinity],
      ["긴장", r.tension],
      ["도움", r.support],
    ]
      .map(
        ([name, v]) =>
          `<div><strong>${v}<small>/ 100</small></strong><span>${name} · 창작 지수</span></div>`,
      )
      .join(
        "",
      )}</div><p class="notice">궁합 확률이나 실제 호감도가 아닙니다. ${r.missing ? "두 사람 중 시주 미상인 주민이 있어, 알려진 글자만 반영했습니다." : "제공된 네 기둥을 반영했습니다."}</p><div class="story-box"><span class="eyebrow">IF THEY WERE IN A STORY</span><p>${esc(r.story)}</p><small>두 사람을 모티프로 만든 허구의 장면</small></div><h3>이 관계를 만든 근거</h3><p class="muted">${esc(pa.name)}이 ${esc(pb.name)}의 일간을 보면 <b>${r.gods[0]}</b>, 반대는 <b>${r.gods[1]}</b>. 십신은 관계적 분류이며 성격표가 아닙니다.</p>${r.evidence.length ? r.evidence.map((e) => `<details><summary><span class="evidence-tag">${e.kind}</span>${esc(e.text)}</summary><p>${esc(e.detail)}</p></details>`).join("") : "<p>현재 적용한 규칙에서 뚜렷한 합·충·상생 표지가 없습니다. 관계가 없다는 뜻은 아닙니다.</p>"}<button class="text-link" id="pair-method">지수 계산과 해석 범위 보기 ${ico("arrow-up-right")}</button>`,
  );
  $("#pair-method").onclick = method;
}
function pageIntro(kicker, title, text) {
  return `<section class="page-heading"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${text}</p></div></section>`;
}
function filters() {
  return `<div class="filter-row">${["전체", ...Object.keys(typeMeta)].map((t) => `<button data-filter="${t}" class="filter ${filter === t ? "active" : ""}">${t !== "전체" ? `<i style="background:${typeMeta[t].color}"></i>` : ""}${t}</button>`).join("")}</div>`;
}
function bindFilters(fn) {
  $$("[data-filter]").forEach(
    (b) =>
      (b.onclick = () => {
        filter = b.dataset.filter;
        fn();
        iconize();
      }),
  );
}
function renderMap() {
  let rs = pairs().filter(
    (r) =>
      (r.a.id === active || r.b.id === active) &&
      (filter === "전체" || r.type === filter),
  );
  $("#main").innerHTML =
    pageIntro(
      "THE THREADS BETWEEN US",
      "우리 사이, <em>보이지 않는 실.</em>",
      "주민을 선택하면 그 사람을 중심으로 연결됩니다. 선이나 관계 카드를 눌러 근거를 읽어 보세요.",
    ) +
    `<section class="map-layout"><div class="map-card">${filters()}<div class="graph" id="graph"><svg viewBox="0 0 800 590" role="img" aria-label="${esc(person().name)} 중심 인물 관계도"><defs><radialGradient id="graph-bg"><stop stop-color="#edf1e5"/><stop offset="1" stop-color="#faf9f3"/></radialGradient></defs><circle cx="400" cy="295" r="238" fill="url(#graph-bg)"/><circle cx="400" cy="295" r="222" fill="none" stroke="#e4e8dc" stroke-dasharray="3 7"/>${rs
      .map((r) => {
        const i = people.findIndex(
            (p) => p.id === (r.a.id === active ? r.b.id : r.a.id),
          ),
          a = (i / people.length) * Math.PI * 2 - Math.PI / 2,
          x = 400 + Math.cos(a) * 285,
          y = 295 + Math.sin(a) * 218;
        return `<path class="graph-line" data-pair="${r.a.id}:${r.b.id}" d="M400 295 Q${400 + (x - 400) * 0.55 - 25} ${295 + (y - 295) * 0.55 - 25} ${x} ${y}" stroke="${typeMeta[r.type].color}" stroke-width="3" fill="none" stroke-dasharray="${r.type === "티격태격" ? "7 5" : "none"}"/>`;
      })
      .join("")}</svg>${people
      .map((p, i) => {
        const a = (i / people.length) * Math.PI * 2 - Math.PI / 2,
          is = p.id === active;
        return `<button class="graph-person ${is ? "center" : ""}" data-person="${p.id}" style="left:${is ? 50 : (400 + Math.cos(a) * 285) / 8}%;top:${is ? 50 : (295 + Math.sin(a) * 218) / 5.9}%">${avatar(p)}<strong>${esc(p.name)}</strong><small>${archetypes[p.pillars[2][0]].nature}</small></button>`;
      })
      .join(
        "",
      )}</div><p class="graph-note">${ico("info")} ${esc(person().name)} 중심 · ${rs.length}개의 연결 · 실선은 연결, 점선은 티격태격 서사</p></div><aside class="map-aside"><span class="eyebrow">CONNECTIONS</span><h2>${esc(person().name)}의 인연</h2><label class="select-label">중심 주민<select id="focus-person">${people.map((p) => `<option value="${p.id}" ${p.id === active ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label><div class="map-relations">${
      rs.length
        ? rs
            .sort((a, b) => b.affinity - a.affinity)
            .map((r) => {
              const other = r.a.id === active ? r.b : r.a;
              return `<button data-pair="${r.a.id}:${r.b.id}" class="map-relation">${avatar(other)}<span><b>${esc(other.name)}</b><small style="color:${typeMeta[r.type].color}">${r.type}</small></span>${ico("chevron-right")}</button>`;
            })
            .join("")
        : '<p class="empty">이 유형의 연결은 아직 없어요. 다른 필터를 선택해 보세요.</p>'
    }</div><div class="notice">한 쌍에 여러 특징이 공존할 수 있어요. 대표 유형 하나를 표시하고, 상세 화면에서 모든 근거를 보여 줍니다.</div></aside></section>`;
  bindPeople();
  bindProfile();
  bindFilters(renderMap);
  $("#focus-person").onchange = (e) => select(e.target.value);
}
function renderRanking() {
  const rs = pairs()
    .filter((r) => filter === "전체" || r.type === filter)
    .sort((a, b) => b[rankBy] - a[rankBy] || a.a.name.localeCompare(b.a.name));
  $("#main").innerHTML =
    pageIntro(
      "A LITTLE CHEMISTRY",
      "우리 마을의 <em>케미 어워즈.</em>",
      "누가 더 좋은 사람이냐는 순위가 아니에요. 어떤 두 사람의 이야기에 상징이 많이 겹치는지 살펴보세요.",
    ) +
    `<div class="ranking-toolbar">${filters()}<label class="sort-label">기준<select id="sort"><option value="affinity" ${rankBy === "affinity" ? "selected" : ""}>끌림이 많은 조합</option><option value="support" ${rankBy === "support" ? "selected" : ""}>도움 표지가 많은 조합</option><option value="tension" ${rankBy === "tension" ? "selected" : ""}>긴장 표지가 많은 조합</option></select></label></div><div class="podium">${rs
      .slice(0, 3)
      .map(
        (r, i) =>
          `<button class="award-card award-${i}" data-pair="${r.a.id}:${r.b.id}"><span class="award-number">0${i + 1}</span><span class="small-tag" style="color:${typeMeta[r.type].color}">${r.type}</span><div class="award-avatars">${avatar(r.a)}<span>✧</span>${avatar(r.b)}</div><h2>${esc(r.a.name)} <span>&</span> ${esc(r.b.name)}</h2><p>${typeMeta[r.type].line}</p><div class="award-score"><strong>${r[rankBy]}</strong><span>${{ affinity: "끌림", support: "도움", tension: "긴장" }[rankBy]} 창작 지수</span>${ico("arrow-up-right")}</div></button>`,
      )
      .join(
        "",
      )}</div><section class="ranking-list"><div class="section-title"><h2>모든 조합을 천천히 살펴봐요</h2><span>${rs.length}쌍 · 동점은 동일 지수</span></div>${rs.length ? rs.map((r, i) => `<button class="rank-row" data-pair="${r.a.id}:${r.b.id}"><span class="rank-num">${rs.findIndex((x) => x[rankBy] === r[rankBy]) + 1}</span><span class="rank-people">${avatar(r.a)}${avatar(r.b)}<b>${esc(r.a.name)} <span>&</span> ${esc(r.b.name)}</b></span><span class="rank-type" style="color:${typeMeta[r.type].color}">${ico(typeMeta[r.type].icon)}${r.type}</span><span class="rank-bar"><i style="width:${r[rankBy]}%;background:${typeMeta[r.type].color}"></i></span><strong>${r[rankBy]}</strong>${ico("chevron-right")}</button>`).join("") : '<p class="empty">이 유형의 조합은 없어요. 다른 필터를 골라 주세요.</p>'}</section><p class="notice">세 지수는 합산한 총점이 아닙니다. 알려진 글자 수가 다르므로 시주 미상인 조합과의 엄밀한 비교는 불가능합니다. 해석 범위 안에서 즐기는 이야기용 정렬입니다.</p>`;
  bindProfile();
  bindFilters(renderRanking);
  $("#sort").onchange = (e) => {
    rankBy = e.target.value;
    renderRanking();
    iconize();
  };
}
function renderResidents() {
  const shown = people.filter((p) =>
    [p.name, p.role, p.pillars[2], archetypes[p.pillars[2][0]].nature].some(
      (v) => v.includes(query),
    ),
  );
  $("#main").innerHTML =
    pageIntro(
      "THE PEOPLE OF UNGYEOL",
      "각자의 빛으로, <em>함께 사는 우리.</em>",
      "일간의 자연 이미지를 따라 주민을 만나 보세요. 같은 바다도 저마다 다른 이야기를 품고 있어요.",
    ) +
    `<div class="directory-tools"><span>${people.length}명의 주민 · ${people.filter((p) => !p.pillars[3]).length}명 시주 미상</span><label class="search">${ico("search")}<input id="search" placeholder="이름, 일주, 자연 이미지 검색" value="${esc(query)}" aria-label="주민 검색"/></label></div><div class="directory-grid">${shown.map((p) => `<button class="person-card" data-person="${p.id}" style="--person:${p.color}"><div class="person-card-head"><span class="small-tag">${p.pillars[2]}일주</span><span>${archetypes[p.pillars[2][0]].symbol}</span></div><div class="card-art">${avatar(p)}</div><span class="person-role">${esc(p.role)}</span><h2>${esc(p.name)} ${ico("arrow-up-right")}</h2><p>${archetypes[p.pillars[2][0]].nature} · ${season(p)}의 ${elements[element(p.pillars[2][0])]}</p><div class="person-card-foot">${esc(p.place)}<span>${p.pillars[3] ? "시주 확인" : "시주 미상"}</span></div></button>`).join("") || '<p class="empty">일치하는 주민이 없어요. 다른 단어로 찾아보세요.</p>'}</div>`;
  bindPeople();
  $("#search").oninput = (e) => {
    const position = e.target.selectionStart;
    query = e.target.value;
    renderResidents();
    iconize();
    $("#search").focus();
    $("#search").setSelectionRange(position, position);
  };
}
function addModal() {
  modal(
    "새로운 이웃을 초대해요",
    `<p>연·월·일주만 있어도 좋아요. 시간은 모르면 비워 두세요.</p><form id="add-form"><label>이름<input name="name" maxlength="24" required placeholder="새 이웃의 이름"/></label><div class="form-pillars">${["년주", "월주", "일주", "시주"].map((l, i) => `<label>${l}${i === 3 ? " (선택)" : ""}<input name="p${i}" placeholder="${["경진", "계미", "임오", "경자"][i]}" maxlength="2" ${i < 3 ? "required" : ""}/></label>`).join("")}</div><label>캐릭터 별명 (선택)<input name="role" placeholder="예: 별빛 산책가" maxlength="24"/></label><p class="notice">이 기기에 저장됩니다. 다른 사람에게 추가 주민을 전달하려면 ‘마을 관리’에서 파일을 내보내세요. 원래 공개 마을은 바뀌지 않습니다.</p><p class="form-error" id="form-error" role="alert"></p><button class="primary submit" type="submit">${ico("plus")} 주민 초대하기</button></form>`,
  );
  $("#add-form").onsubmit = (e) => {
    e.preventDefault();
    if (people.length >= 40) {
      $("#form-error").textContent =
        "이 마을은 최대 40명까지 초대할 수 있어요.";
      return;
    }
    const f = new FormData(e.target),
      p = {
        id: crypto.randomUUID(),
        name: String(f.get("name")).trim(),
        pillars: [0, 1, 2, 3].map((i) => String(f.get("p" + i)).trim() || null),
        gender: "미입력",
      };
    try {
      validateResident(p);
      const el = element(p.pillars[2][0]),
        arch = archetypes[p.pillars[2][0]];
      Object.assign(p, {
        role: String(f.get("role")).trim() || arch.nature + " 여행자",
        place: arch.nature + " 쉼터",
        quote: "여기서 어떤 이야기를 만나게 될까?",
        story: `${season(p)}의 ${p.pillars[2][0]}${elements[el]}에서 가져온 ${arch.nature}의 이미지. 새로운 이웃들과 자기만의 이야기를 만들어 가는 마을의 여행자입니다.`,
        color: elementColors[el],
        hat: ["leaf", "lamp", "builder", "gem", "wizard"][el],
      });
      people.push(p);
      active = p.id;
      save();
      $("#dialog").close();
      render();
      toast(`${p.name}님이 마을에 도착했어요.`);
    } catch (err) {
      $("#form-error").textContent = err.message;
    }
  };
}
function manage() {
  modal(
    "우리 마을 관리",
    `<label>마을 이름<input id="village-name" maxlength="24" value="${esc(village)}"/></label><button class="primary" id="rename">이름 저장</button><div class="manage-actions"><button class="secondary" id="export">${ico("download")} 마을 파일 내려받기</button><button class="secondary" id="import">${ico("upload")} 다른 마을 불러오기</button></div><p class="notice">마을 파일에는 주민 이름과 입력 명식이 포함됩니다. 불러오면 현재 기기의 마을을 대체하며, 기존 마을은 자동으로 파일로 내려받아 보관합니다. 주민 추가·마을 이름은 현재 브라우저에 저장됩니다.</p><button class="text-link" id="restore">원래 12명의 마을로 돌아가기</button>`,
  );
  $("#rename").onclick = () => {
    const name = $("#village-name").value.trim();
    if (!name) return;
    village = name;
    save();
    $("#dialog").close();
    shell();
    toast("마을 이름을 저장했어요.");
  };
  $("#export").onclick = exportFile;
  $("#import").onclick = () => $("#import-file").click();
  $("#restore").onclick = () => {
    exportFile();
    people = structuredClone(residents);
    village = "운결마을";
    active = people[0].id;
    save();
    $("#dialog").close();
    shell();
    toast("현재 마을을 내려받고 원래 마을로 돌아왔어요.");
  };
}
function exportFile() {
  const blob = new Blob(
      [JSON.stringify({ version: 1, name: village, people }, null, 2)],
      { type: "application/json" },
    ),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = village + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function importFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    if (file.size > 250000)
      throw Error("250KB 이하의 마을 파일을 선택해 주세요.");
    const raw = JSON.parse(await file.text());
    if (
      !Array.isArray(raw.people) ||
      raw.people.length < 1 ||
      raw.people.length > 40
    )
      throw Error("주민 1~40명이 있는 마을 파일이 필요해요.");
    const ids = new Set();
    const clean = raw.people.map((p) => {
      validateResident(p);
      if (
        typeof p.id !== "string" ||
        !/^[a-zA-Z0-9-]{1,64}$/.test(p.id) ||
        ids.has(p.id)
      )
        throw Error("주민 식별자가 잘못되었거나 중복돼요.");
      ids.add(p.id);
      const el = element(p.pillars[2][0]);
      return {
        id: p.id,
        name: p.name,
        pillars: p.pillars,
        gender: String(p.gender || "미입력").slice(0, 8),
        role: String(p.role || "새로운 여행자").slice(0, 24),
        place: String(p.place || "작은 쉼터").slice(0, 24),
        quote: String(p.quote || "반가워요.").slice(0, 150),
        story: String(p.story || "새로운 이야기를 기다리고 있어요.").slice(
          0,
          1000,
        ),
        color: /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : elementColors[el],
        hat: [
          "moon",
          "lamp",
          "leaf",
          "adventure",
          "forge",
          "builder",
          "sailor",
          "tea",
          "gem",
          "artist",
          "cloud",
          "wizard",
        ].includes(p.hat)
          ? p.hat
          : "leaf",
      };
    });
    exportFile();
    people = clean;
    village = String(raw.name || "새로운 마을").slice(0, 24);
    active = people[0].id;
    save();
    $("#dialog").close();
    shell();
    toast("이전 마을을 보관하고 새 마을을 불러왔어요.");
  } catch (err) {
    toast("불러오지 못했어요: " + err.message);
  } finally {
    e.target.value = "";
  }
}
async function share() {
  const url = new URL(location.href);
  url.searchParams.set("view", view);
  url.searchParams.set("person", active);
  try {
    await navigator.clipboard.writeText(url.href);
    toast(
      "공개 마을 링크를 복사했어요. 추가한 주민은 마을 파일로 공유해 주세요.",
    );
  } catch {
    modal(
      "마을 링크 공유",
      `<label>아래 링크를 복사해 주세요<input readonly value="${esc(url.href)}"/></label><p>추가한 주민은 마을 파일로 공유할 수 있어요.</p>`,
    );
  }
}
function storyModal(r) {
  if (!r) {
    toast("이웃이 둘 이상이면 이야기가 생겨요.");
    return;
  }
  const episodes = [
    r.story,
    `${r.a.name}이 ${r.b.place} 앞에 작은 선물을 두고 간다. 이름 없는 쪽지를 본 ${r.b.name}은 한참 웃는다. 이것을 짝사랑 장면으로 쓸지, 감사의 표현으로 쓸지는 아직 열린 결말.`,
    `${r.a.name}과 ${r.b.name}이 하루 동안 서로의 일을 바꿔 보기로 한다. 해가 질 무렵, 둘은 같은 말을 한다. “네 하루는 이런 모양이었구나.”`,
  ];
  modal(
    "광장에 도착한 작은 이야기",
    `<div class="pair-hero">${avatar(r.a)}<span>✧</span>${avatar(r.b)}</div><div class="story-box"><span class="eyebrow">EPISODE ${String((storyIndex % 3) + 1).padStart(2, "0")}</span><p>${esc(episodes[storyIndex % 3])}</p><small>허구의 에피소드 · 실제 짝사랑이나 감정의 추정이 아닙니다.</small></div><button class="primary" id="next-story">다른 장면 읽기 ${ico("arrow-right")}</button>`,
  );
  $("#next-story").onclick = () => {
    storyIndex++;
    storyModal(r);
  };
}
function guide() {
  modal(
    "작은 마을의 하루를 살아 보세요",
    `<p class="lead">한 걸음 걷고, 눈을 맞추고,<br/>뜻밖의 인연을 만나세요.</p><div class="guide-steps">${[
      [
        "compass",
        "내 발로 산책하기",
        "땅을 클릭하거나 WASD·방향키로 걸어요. 건물과 연못은 돌아갑니다. 드래그로 시선을 돌리고, 전체 보기 버튼으로 마을을 한눈에 보세요.",
      ],
      [
        "users",
        "다른 주민의 하루",
        "아래 캐릭터를 누르면 그 주민으로 바뀝니다. 자동 산책을 켜면 기운의 이미지를 따라 스스로 길을 고르고 이웃을 만나요.",
      ],
      [
        "heart",
        "다가가서 만나기",
        "주민이나 이름을 클릭해 상대를 골라요. 인사·선물·춤을 누르면 실제로 다가가고, 만난 자리에서 대화와 효과가 시작됩니다.",
      ],
      [
        "sparkles",
        "함께 쌓는 마음",
        "하트는 끌림의 서사, 번개는 티격태격, 선물은 도움의 상징이에요. 함께한 마음은 플레이 중 행동으로 쌓이고, 발견한 인연과 함께 이 기기에 저장됩니다.",
      ],
      [
        "sun",
        "축제와 달빛",
        "마을 축제를 열면 모두 광장으로 걸어와 춤을 춥니다. 달빛 모드에서는 창에 불이 켜지고 반딧불이 떠다녀요.",
      ],
    ]
      .map(
        ([i, t, d]) =>
          `<div>${ico(i)}<span><b>${t}</b><p>${d}</p></span></div>`,
      )
      .join(
        "",
      )}</div><h3>모양만 봐도 알아보는 열 가지 기운</h3><div class="nature-grid">${Object.entries(
      archetypes,
    )
      .map(
        ([s, a]) =>
          `<div><span>${a.symbol}</span><b>${s} · ${a.nature}</b></div>`,
      )
      .join(
        "",
      )}</div><p class="notice">고전 명리의 상징을 바탕으로 만든 상상 속 시뮬레이션입니다. 캐릭터의 마음과 행동은 게임 속 이야기이며 실제 인물의 감정을 뜻하지 않습니다. 시주 미상은 추정하지 않습니다.</p><button class="text-link" id="guide-method">명식과 게임 연출의 연결 보기 ↗</button>`,
  );
  $("#guide-method").onclick = method;
}
function method() {
  modal(
    "해석은 이렇게 만들었어요",
    `<p class="lead">전통의 상징과 창작의 상상력을<br/>구분해서 보여 드립니다.</p><h3>1. 입력과 검증</h3><p>제공된 간지 명식을 원본으로 사용합니다. 간지의 음양 조합, 연간에 따른 월간, 일간에 따른 시간 조합을 확인합니다. 실제 생년월일·출생지·절입 시각을 받지 않았으므로 만세력 날짜 역산과 진태양시 보정은 하지 않습니다. 시주 미상은 그대로 남깁니다.</p><h3>2. 적용한 전통 규칙</h3><p>일간 오행과 음양, 월지의 계절, 지장간 표, 일간 간 십신, 천간 오합, 지지 육합·육충, 천을귀인 표를 사용합니다. 상생은 방향을 표시합니다. 합이 있다고 합화했다고 보지 않습니다.</p><h3>3. 창작 지수의 공개 계산식</h3><table><thead><tr><th>지수</th><th>부여 규칙</th></tr></thead><tbody><tr><td>끌림</td><td>기본 30 + 일간합 24 + 일지육합 20 + 그 외 지지육합 쌍당 4 + 동일 일간 오행 10 + 일간 상생 8</td></tr><tr><td>긴장</td><td>일지충 30 + 그 외 지지충 쌍당 6</td></tr><tr><td>도움</td><td>일간 상생 20 + 방향별 천을귀인 표 해당 12</td></tr></tbody></table><p>각 지수는 99에서 상한을 둡니다. ‘그 외 지지’는 일지끼리 비교를 제외한 교차 위치 비교에서, 같은 종류의 지지 쌍을 한 번만 셉니다. 대표 유형은 순서대로 끌림≥58·긴장≥18이면 불꽃 케미, 끌림≥58이면 끌림의 인연, 도움≥24이면 귀인 동행, 긴장≥24이면 티격태격, 같은 일간 오행이면 닮은 영혼, 나머지는 느긋한 이웃입니다.</p><p class="notice">위 가중치와 유형은 이 서비스의 창작 설계입니다. 검증된 궁합 점수·명리학의 정설·실제 사랑 확률이 아닙니다. 시주 유무에 따른 입력량 차이를 보정한 순위도 아닙니다.</p><h3>4. 해석하지 않는 범위</h3><p>신강·신약, 용신·희신, 조후·격국의 종합 감정, 대운·세운 예측, 삼합의 성국과 형·파·해 전체는 계산하지 않습니다. 실제 악연·사랑·짝사랑·인품을 판정하지 않습니다.</p><h3>5. 고전의 상징을 게임으로</h3><p><a href="https://zh.wikisource.org/zh/滴天髓/02" target="_blank" rel="noreferrer">적천수 · 천간론 ↗</a>의 십간과 자연·기운에 대한 비유, <a href="https://zh.wikisource.org/wiki/三命通會_(四庫全書本)/全覽" target="_blank" rel="noreferrer">삼명통회 ↗</a>의 간지 체계를 참고했습니다. 자연물은 고정된 실체가 아닌 이해를 돕는 디자인 언어입니다.</p><p>보폭·선호 장소·하트·선물·번개는 이 서비스의 게임 설계입니다. 관계 규칙의 끌림이 높은 조합은 하트, 긴장이 높은 조합은 티격태격, 도움 표지가 많은 조합은 선물로 연출합니다. 이후 ‘함께한 마음’은 선물·대화·춤 같은 실제 플레이 행동으로 쌓습니다. 고전의 완전한 감정법이나 실제 호감도 계산이 아닙니다.</p><h3>6. 다음 확장</h3><p>명식 데이터·규칙 엔진·3D 표현을 분리했습니다. 전문가가 검토한 규칙, 새로운 캐릭터 소품, 독립 마을 저장과 테마를 각각 확장할 수 있습니다. 현재 마을 파일은 JSON 형식으로 이동할 수 있습니다.</p>`,
  );
}
shell();
