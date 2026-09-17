/* 羊毛日报 · 前端逻辑
   数据源: products.json（管道每日生成并自动推 GitHub）
   { products: [{id,title,price,original_price,platform,reason,category,image,short_url,token}],
     activities: [{id,channel,title,body,link,time}] } */

const CAT_LABELS = { food: "食品", home: "家居日用", beauty: "美妆个护", fashion: "服饰", digital: "数码家电", baby: "母婴", other: "其他" };
const CH_LABELS = { bank: "银行", credit: "信用卡", local: "本地优惠", alipay: "支付宝", jd: "京东" };
const CH_ICONS = { bank: "🏦", credit: "💳", local: "📍", alipay: "🔵", jd: "🛒" };

let DATA = { products: [], activities: [] };
let activeCat = "all";
let activeCh = "all";

async function loadData() {
  try {
    const r = await fetch("products.json?t=" + Date.now());
    DATA = await r.json();
    document.getElementById("update-time").textContent = "上次更新：" + (DATA.updated_at || "未知");
  } catch (e) { console.error(e); }
}

/* ---------- 活动线报 ---------- */
function actCard(a, mini) {
  const ch = CH_LABELS[a.channel] || a.channel;
  const icon = CH_ICONS[a.channel] || "📌";
  const time = (a.time || "").slice(5, 16);
  if (mini) {
    return `<div class="act-mini" onclick="location.hash='#/activities'">
      <span class="act-ch">${icon} ${ch}</span>
      <span class="act-mini-title">${esc(a.title)}</span>
    </div>`;
  }
  const linkBtn = a.link ? `<a class="act-linkbtn" href="${a.link}" target="_blank" rel="nofollow noopener">查看活动 ›</a>` : "";
  return `<div class="act-card">
    <div class="act-head">
      <span class="act-ch">${icon} ${ch}</span>
      <span class="act-time">${time}</span>
    </div>
    <h3 class="act-title">${a.title}</h3>
    <div class="act-body">${a.body || ""}</div>
    ${linkBtn}
  </div>`;
}

function renderHomeActs() {
  const strip = document.getElementById("act-strip");
  const acts = DATA.activities.slice(0, 4);
  strip.innerHTML = acts.length ? acts.map(a => actCard(a, true)).join("") : '<div class="act-empty">暂无活动线报，敬请期待</div>';
}

function renderActsPage() {
  const list = document.getElementById("act-list");
  const acts = DATA.activities.filter(a => activeCh === "all" || a.channel === activeCh);
  list.innerHTML = acts.length ? acts.map(a => actCard(a, false)).join("") : '<div class="act-empty">暂无「' + (activeCh === "all" ? "" : CH_LABELS[activeCh]) + '」线报</div>';
}

function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

/* ---------- 商品 ---------- */
function productImg(p) {
  if (!p.image) return `<div class="img noimg"><span class="cat-chip">${CAT_LABELS[p.category] || "好物"}</span></div>`;
  return `<div class="imgwrap"><span class="cat-chip">${CAT_LABELS[p.category] || "好物"}</span>
    <img src="${p.image}" alt="${esc(p.title)}" loading="lazy" referrerpolicy="no-referrer"></div>`;
}

function cardHTML(p) {
  const save = p.original_price ? Math.round((1 - p.price / p.original_price) * 100) : 0;
  const buyLink = p.short_url
    ? `<a class="btn-go" href="${p.short_url}" target="_blank" rel="nofollow noopener" onclick="event.stopPropagation()">🛒 点击进入购买</a>`
    : `<button class="btn-go" onclick="copyToken('${esc(p.id)}',event)">复制口令去淘宝购买</button>`;
  return `<div class="card" onclick="showItem('${esc(p.id)}')">
    ${productImg(p)}
    <div class="body">
      <div class="title">${esc(p.title)}</div>
      <div class="price-row">
        <div class="price"><span class="cur">¥</span>${p.price}</div>
        ${p.original_price ? `<div class="orig">¥${p.original_price}</div>` : ""}
        ${save > 0 ? `<span class="save-tag">省${save}%</span>` : ""}
      </div>
      <div class="meta">${p.platform || ""}${p.reason ? " · " + esc(p.reason) : ""}</div>
      ${p.token ? `<div class="token">口令 ${esc(p.token)} <span class="copy-mini" onclick="copyToken('${esc(p.id)}',event)">复制 ›</span></div>` : ""}
      ${buyLink}
    </div>
  </div>`;
}

function render() {
  const grid = document.getElementById("grid");
  const empty = document.getElementById("empty");
  const list = DATA.products.filter(p => activeCat === "all" || p.category === activeCat);
  document.getElementById("date-label").textContent = new Date().toLocaleDateString("zh-CN");
  grid.innerHTML = list.map(cardHTML).join("");
  empty.style.display = list.length ? "none" : "block";
}

function findProduct(id) { return DATA.products.find(p => p.id === id); }

function showItem(id) {
  const p = findProduct(id); if (!p) return;
  const page = document.getElementById("page-item");
  showSection(page);
  const save = p.original_price ? Math.round((1 - p.price / p.original_price) * 100) : 0;
  const detailImg = p.image
    ? `<div class="dimgwrap"><img src="${p.image}" alt="${esc(p.title)}" referrerpolicy="no-referrer"></div>`
    : `<div class="dimgwrap empty-img"></div>`;
  const tokenRow = p.token
    ? `<div class="dtoken">口令 <b>${esc(p.token)}</b><span class="copy-mini" onclick="copyById('${esc(p.id)}')">复制 ›</span></div>`
    : "";
  const buyRow = p.short_url
    ? `<a class="btn-copy" href="${p.short_url}" target="_blank" rel="nofollow noopener">🛒 点击进入购买（自动领佣下单）</a>
       <p class="cps-note">新标签页打开「${p.platform || "淘宝"}」领券页，页内一键领券后下单</p>`
    : "";
  document.getElementById("item-detail").innerHTML = `
    ${detailImg}
    <h2>${esc(p.title)}</h2>
    <div class="price-row">
      <div class="price"><span class="cur">¥</span>${p.price}</div>
      ${p.original_price ? `<div class="orig">¥${p.original_price}</div>` : ""}
      ${save > 0 ? `<span class="save-tag">省${save}%</span>` : ""}
    </div>
    ${p.reason ? `<div class="reason">💡 ${esc(p.reason)}</div>` : ""}
    ${tokenRow}
    ${buyRow}`;
  window.scrollTo(0, 0);
}

function copyToken(id, ev) {
  if (ev) ev.stopPropagation();
  copyById(id);
}
function copyById(id) {
  const p = findProduct(id); if (!p) return;
  const t = p.token || "";
  const done = () => showToast("口令已复制，打开" + (p.platform || "淘宝") + "下单");
  if (navigator.clipboard) navigator.clipboard.writeText(t).then(done).catch(() => legacyCopy(t, done));
  else legacyCopy(t, done);
}
function legacyCopy(text, cb) {
  const ta = document.createElement("textarea");
  ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(ta); cb();
}

function showSection(page) {
  ["page-home", "page-item", "page-activities", "page-about"].forEach(id => {
    document.getElementById(id).style.display = (id === page.id) ? "block" : "none";
  });
}

let toastTimer;
function showToast(msg) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- 路由 ---------- */
function router() {
  const hash = location.hash || "#/";
  if (hash === "#/activities") {
    showSection(document.getElementById("page-activities"));
    renderActsPage();
  } else if (hash === "#/about") {
    showSection(document.getElementById("page-about"));
  } else {
    showSection(document.getElementById("page-home"));
    renderHomeActs();
    render();
  }
  window.scrollTo(0, 0);
}

document.getElementById("filters").addEventListener("click", e => {
  const btn = e.target.closest("button"); if (!btn) return;
  activeCat = btn.dataset.cat;
  document.querySelectorAll("#filters button").forEach(b => b.classList.toggle("on", b === btn));
  render();
});
document.getElementById("act-filters").addEventListener("click", e => {
  const btn = e.target.closest("button"); if (!btn) return;
  activeCh = btn.dataset.ch;
  document.querySelectorAll("#act-filters button").forEach(b => b.classList.toggle("on", b === btn));
  renderActsPage();
});

window.addEventListener("hashchange", router);
loadData().then(router);
