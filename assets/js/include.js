async function includeInto(selector, url){
  const el = document.querySelector(selector);
  if(!el) return;
  try{
    const res = await fetch(url);
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    el.innerHTML = await res.text();
  }catch(error){
    console.error(`Não foi possível carregar ${url}:`, error);
  }
}

function setupHeaderButtons(){
  const actions = document.getElementById("header-actions");
  if(!actions) return;

  const page = document.body.getAttribute("data-page") || "";
  // default: no button
  let btn = "";

  if(page === "index"){
    btn = `<a class="btn-top" href="comentarios.html">Peça um filme ou série</a>`;
  } else if(page === "filmes"){
    btn = `<a class="btn-top btn-top-secondary" href="series.html">Séries</a><a class="btn-top" href="index.html">Voltar</a>`;
  } else if(page === "series"){
    btn = `<a class="btn-top btn-top-secondary" href="filmes.html">Filmes</a><a class="btn-top" href="index.html">Voltar</a>`;
  } else if(page === "serie"){
    btn = `<a class="btn-top" href="series.html">Voltar às séries</a>`;
  } else if(page === "serie-player"){
    const params = new URLSearchParams(window.location.search);
    const serieRef = params.get("serie");
    const backHref = serieRef ? `serie.html?serie=${encodeURIComponent(serieRef)}` : "series.html";
    btn = `<a class="btn-top" href="${backHref}">Voltar à série</a>`;
  } else if(page === "player"){
    const params = new URLSearchParams(window.location.search);
    const serieRef = params.get("serie");
    const backHref = serieRef ? `serie.html?serie=${encodeURIComponent(serieRef)}` : "filmes.html";
    const backText = serieRef ? "Voltar à série" : "Voltar aos filmes";
    btn = `<a class="btn-top" href="${backHref}">${backText}</a>`;
  } else if(page === "apoio"){
    btn = `<a class="btn-top" href="index.html">Voltar</a>`;
  } else if(page === "comentarios"){
    btn = `<a class="btn-top" href="index.html">Voltar</a>`;
  }

  actions.innerHTML = btn;
}

async function bootLayout(){
  await includeInto("#header-slot", "components/header.html");
  await includeInto("#footer-slot", "components/footer.html");
  setupHeaderButtons();
  const year = document.getElementById("current-year");
  if(year) year.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", bootLayout);
