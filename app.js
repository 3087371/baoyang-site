/* 羊毛日报 · 前端逻辑
   数据源: products.json（由 D:\bargain-hunter\scripts\sync_site.py 每日从管道数据生成，
   随 git push 自动部署到 Vercel/Cloudflare Pages） */

const CAT_ICONS = { food:"🍜", home:"🧻", beauty:"💄", fashion:"👕", digital:"🎧", baby:"🍼", other:"🛒" };

let PRODUCTS = [];
let activeCat = "all";

async function loadData() {
  try {
    const r = await fetch("products.json?t=" + new Date().getTime());
    const data = await r.json();
    PRODUCTS = data.products || [];
    document.getElementById("update-time").textContent =
      "上次更新：" + (data.updated_at || "未知");
  } catch (e) {
    document.getElementById("empty").style.display = "block";
  }
}

function catOf(item) {
  return item.category || "other";
}

function render() {
  const grid = document.getElementById("grid");
  const empty = document.getElementById("empty");
  const list = PRODUCTS.filter(p => activeCat === "all" || catOf(p) === activeCat);
  document.getElementById("date-label").textContent = new Date().toLocaleDateString("zh-CN");
  grid.innerHTML = list.map((p, i) => cardHTML(p, i)).join("");
  empty.style.display = list.length ? "none" : "block";
  grid.querySelectorAll(".card").forEach((el, i) => {
    el.onclick = () => showItem(list[i]);
  });
  grid.querySelectorAll(".copy-mini").forEach((el, i) => {
    el.onclick = (e) => { e.stopPropagation(); copyToken(list[i]); };
  });
}

function cardHTML(p, i) {
  const save = p.original_price ? Math.round((1 - p.price / p.original_price) * 100) : 0;
  const img = p.image ? `background-image:url('${p.image}')` : "";
  return `<div class="card">
    <div class="img" ${img}>${CAT_ICONS[catOf(p)] || "🛒"}</div>
    <div class="body">
      <div class="title">${p.title}</div>
      <div class="price-row">
        <div class="price"><span class="cur">¥</span>${p.price}</div>
        ${p.original_price ? `<div class="orig">¥${p.original_price}</div>` : ""}
        ${save > 0 ? `<span class="save-tag">省${save}%</span>` : ""}
      </div>
      <div class="meta">${p.platform || ""}${p.reason ? " · " + p.reason : ""}</div>
      <div class="token"><span>口令 ${p.token || "—"}</span><span class="copy-mini">复制 ›</span></div>
    </div>
  </div>`;
}

function showItem(p) {
  document.getElementById("page-home").style.display = "none";
  document.getElementById("page-about").style.display = "none";
  const page = document.getElementById("page-item");
  page.style.display = "block";
  const save = p.original_price ? Math.round((1 - p.price / p.original_price) * 100) : 0;
  const img = p.image ? `background-image:url('${p.image}')` : "";
  document.getElementById("item-detail").innerHTML = `
    <div class="img" ${img}>${CAT_ICONS[catOf(p)] || "🛒"}</div>
    <h2>${p.title}</h2>
    <div class="price-row">
      <div class="price"><span class="cur">¥</span>${p.price}</div>
      ${p.original_price ? `<div class="orig">¥${p.original_price}</div>` : ""}
      ${save > 0 ? `<span class="save-tag">省${save}%</span>` : ""}
    </div>
    ${p.reason ? `<div class="reason">💡 ${p.reason}</div>` : ""}
    <button class="btn-copy" id="btnCopy">📋 复制口令去下单</button>
    <p class="cps-note">复制口令后打开${p.platform || "淘宝"}APP，自动识别并领券下单</p>`;
  document.getElementById("btnCopy").onclick = () => copyToken(p);
  window.scrollTo(0, 0);
}

function copyToken(p) {
  const token = p.token || "";
  const btn = document.getElementById("btnCopy");
  const done = () => {
    showToast("口令已复制，打开" + (p.platform || "淘宝") + "下单吧");
    if (btn && !btn.classList.contains("copied")) {
      btn.classList.add("copied");
      btn.textContent = "✅ 已复制，去下单吧";
      setTimeout(() => { btn.classList.remove("copied"); btn.textContent = "📋 复制口令去下单"; }, 2500);
    }
  };
  if (navigator.clipboard) navigator.clipboard.writeText(token).then(done).catch(() => legacyCopy(token, done));
  else legacyCopy(token, done);
}

function legacyCopy(text, cb) {
  const ta = document.createElement("textarea");
  ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(ta); cb();
}

let toastTimer;
function showToast(msg) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

// 路由
function router() {
  const hash = location.hash || "#/";
  const itemPage = document.getElementById("page-item");
  const homePage = document.getElementById("page-home");
  const aboutPage = document.getElementById("page-about");
  if (hash.startsWith("#/item/")) {
    const id = hash.replace("#/item/", "");
    const p = PRODUCTS.find(x => x.id === id);
    if (p) showItem(p);
    else homePage.style.display = "block";
  } else if (hash === "#/about") {
    homePage.style.display = "none"; itemPage.style.display = "none"; aboutPage.style.display = "block";
  } else {
    aboutPage.style.display = "none"; itemPage.style.display = "none";
    homePage.style.display = "block";
    render();
  }
}

// 分类筛选
document.getElementById("filters").addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;
  activeCat = btn.dataset.cat;
  document.querySelectorAll("#filters button").forEach(b => b.classList.toggle("on", b === btn));
  render();
});

window.addEventListener("hashchange", router);
loadData().then(router);
