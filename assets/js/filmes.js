let FILMES_CACHE = [];

function renderFilmes(lista){
  const grid = document.querySelector(".grid");
  if(!grid) return;

  const filmes = lista || [];
  grid.setAttribute("aria-busy", "false");
  grid.innerHTML = filmes.map(f => `
    <a class="card" href="player.html?id=${encodeURIComponent(f.id)}&titulo=${encodeURIComponent(f.titulo)}${f.provider ? `&provider=${encodeURIComponent(f.provider)}` : ""}${f.server ? `&server=${encodeURIComponent(f.server)}` : ""}${f.subfolder ? `&subfolder=${encodeURIComponent(f.subfolder)}` : ""}" aria-label="Assistir ${escapeHTML(f.titulo)}">
      <img class="capa" src="assets/img/capas/${encodeURIComponent(f.capa).replaceAll('%2F', '/')}" alt="Capa de ${escapeHTML(f.titulo)}" loading="lazy" decoding="async">
      <span class="card-play" aria-hidden="true">▶</span>
      <span class="titulo">${escapeHTML(f.titulo)}</span>
    </a>
  `).join("");
  atualizarContagem(filmes.length);
}

function escapeHTML(valor){
  const el = document.createElement("span");
  el.textContent = String(valor || "");
  return el.innerHTML;
}

function atualizarContagem(total, termo = ""){
  const el = document.getElementById("resultCount");
  if(!el) return;
  el.textContent = termo ? `${total} resultado${total === 1 ? "" : "s"} para “${termo}”` : `${total} filmes disponíveis`;
}

function filtrarPorTermo(termo){
  const t = (termo || "").trim().toLowerCase();
  if(!t){ renderFilmes(FILMES_CACHE); return; }
  const filtrados = FILMES_CACHE.filter(f => (f.titulo||"").toLowerCase().includes(t));
  if(filtrados.length===0){
    const grid=document.querySelector(".grid");
    if(grid) grid.innerHTML=`<div class="empty-state"><strong>Nenhum filme encontrado</strong><span>Tente pesquisar com outro nome.</span></div>`;
    atualizarContagem(0, termo.trim());
    return;
  }
  renderFilmes(filtrados);
  atualizarContagem(filtrados.length, termo.trim());
}

async function carregarFilmes(){
  const grid = document.querySelector(".grid");
  if(!grid) return;

  try{
    const res = await fetch("assets/js/filmes.json", { cache: "no-store" });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    FILMES_CACHE = await res.json();
    renderFilmes(FILMES_CACHE);
  }catch(e){
    console.error(e);
    grid.setAttribute("aria-busy", "false");
    grid.innerHTML = `<div class="empty-state"><strong>Não foi possível carregar o catálogo</strong><span>Atualize a página para tentar novamente.</span></div>`;
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
    renderFilmes(FILMES_CACHE);
  };

  btn.addEventListener("click", () => {
    if(!wrap.classList.contains("is-open")) open();
    else close();
  });

  input.addEventListener("input", () => filtrarPorTermo(input.value));
  input.addEventListener("keydown", (e) => { if(e.key==="Escape") close(); });

  // fechar clicando fora (desktop)
  document.addEventListener("click", (e) => {
    if(window.innerWidth <= 768) return;
    if(!wrap.contains(e.target)) close();
  });
}

function setupRemoteNavigation(){
  document.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
    const cards = [...document.querySelectorAll(".card")];
    if (!cards.length) return;
    const atual = document.activeElement?.classList?.contains("card") ? document.activeElement : null;
    if (!atual) {
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
    if (candidatos[0]) {
      event.preventDefault();
      candidatos[0].card.focus({ preventScroll: true });
      candidatos[0].card.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  carregarFilmes();
  setupSearch();
  setupRemoteNavigation();
});
