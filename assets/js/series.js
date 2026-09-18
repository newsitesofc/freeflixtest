let SERIES_CACHE = [];

function escapeHTML(valor){
  const el = document.createElement("span");
  el.textContent = String(valor || "");
  return el.innerHTML;
}

function criarSlug(titulo){
  return String(titulo || "serie")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderSeries(lista){
  const grid = document.querySelector(".grid");
  if(!grid) return;

  const series = lista || [];
  grid.setAttribute("aria-busy", "false");

  if(!series.length){
    grid.innerHTML = `<div class="empty-state"><strong>Nenhuma série encontrada</strong><span>Adicione suas séries no arquivo assets/js/series.json.</span></div>`;
    atualizarContagem(0);
    return;
  }

  grid.innerHTML = series.map(serie => {
    const temporadas = Array.isArray(serie.temporadas) ? serie.temporadas.length : 0;
    return `
      <a class="card" href="serie.html?serie=${encodeURIComponent(criarSlug(serie.titulo))}" aria-label="Ver episódios de ${escapeHTML(serie.titulo)}">
        <img class="capa" src="assets/img/capas-series/${encodeURIComponent(serie.capa).replaceAll('%2F', '/')}" alt="Capa de ${escapeHTML(serie.titulo)}" loading="lazy" decoding="async">
        <span class="card-play" aria-hidden="true">▶</span>
        <span class="titulo">${escapeHTML(serie.titulo)}</span>
        <span class="card-meta">${temporadas} temporada${temporadas === 1 ? "" : "s"}</span>
      </a>`;
  }).join("");
  atualizarContagem(series.length);
}

function atualizarContagem(total, termo = ""){
  const el = document.getElementById("resultCount");
  if(!el) return;
  el.textContent = termo ? `${total} resultado${total === 1 ? "" : "s"} para “${termo}”` : `${total} série${total === 1 ? "" : "s"} disponíve${total === 1 ? "l" : "is"}`;
}

function filtrarPorTermo(termo){
  const busca = (termo || "").trim().toLowerCase();
  if(!busca){ renderSeries(SERIES_CACHE); return; }
  const filtradas = SERIES_CACHE.filter(serie => (serie.titulo || "").toLowerCase().includes(busca));
  renderSeries(filtradas);
  atualizarContagem(filtradas.length, termo.trim());
}

async function carregarSeries(){
  const grid = document.querySelector(".grid");
  if(!grid) return;
  try{
    const res = await fetch("assets/js/series.json", { cache: "no-store" });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    SERIES_CACHE = await res.json();
    renderSeries(SERIES_CACHE);
  }catch(error){
    console.error(error);
    grid.setAttribute("aria-busy", "false");
    grid.innerHTML = `<div class="empty-state"><strong>Não foi possível carregar as séries</strong><span>Confira o arquivo series.json e tente novamente.</span></div>`;
    const count = document.getElementById("resultCount");
    if(count) count.textContent = "Catálogo indisponível no momento";
  }
}

function setupSearch(){
  const wrap = document.querySelector(".search-inline");
  const btn = document.getElementById("searchBtn");
  const input = document.getElementById("searchInput");
  if(!wrap || !btn || !input) return;

  const open = () => {
    wrap.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
    setTimeout(() => input.focus(), 50);
  };
  const close = () => {
    wrap.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
    input.value = "";
    renderSeries(SERIES_CACHE);
  };

  btn.addEventListener("click", () => wrap.classList.contains("is-open") ? close() : open());
  input.addEventListener("input", () => filtrarPorTermo(input.value));
  input.addEventListener("keydown", event => { if(event.key === "Escape") close(); });
  document.addEventListener("click", event => {
    if(window.innerWidth > 768 && !wrap.contains(event.target)) close();
  });
}

function setupRemoteNavigation(){
  document.addEventListener("keydown", event => {
    if(!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    if(["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
    const cards = [...document.querySelectorAll(".card")];
    if(!cards.length) return;
    const atual = document.activeElement?.classList?.contains("card") ? document.activeElement : null;
    if(!atual){
      event.preventDefault();
      cards[0].focus({ preventScroll: true });
      cards[0].scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const origem = atual.getBoundingClientRect();
    const ox = origem.left + origem.width / 2;
    const oy = origem.top + origem.height / 2;
    const horizontal = event.key === "ArrowLeft" || event.key === "ArrowRight";
    const candidatos = cards.filter(card => card !== atual).map(card => {
      const rect = card.getBoundingClientRect();
      const dx = rect.left + rect.width / 2 - ox;
      const dy = rect.top + rect.height / 2 - oy;
      const valido = (event.key === "ArrowLeft" && dx < -8) || (event.key === "ArrowRight" && dx > 8) || (event.key === "ArrowUp" && dy < -8) || (event.key === "ArrowDown" && dy > 8);
      return { card, valido, distancia: horizontal ? Math.abs(dx) + Math.abs(dy) * 3 : Math.abs(dy) + Math.abs(dx) * 3 };
    }).filter(item => item.valido).sort((a, b) => a.distancia - b.distancia);
    if(candidatos[0]){
      event.preventDefault();
      candidatos[0].card.focus({ preventScroll: true });
      candidatos[0].card.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  carregarSeries();
  setupSearch();
  setupRemoteNavigation();
});
