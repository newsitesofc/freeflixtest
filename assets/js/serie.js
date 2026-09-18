(() => {
  const main = document.getElementById("conteudo");
  const serieSlug = new URLSearchParams(window.location.search).get("serie");
  let serieAtual = null;

  const escapeHTML = valor => String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const criarSlug = titulo => String(titulo || "serie")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  function mostrarErro(titulo, mensagem){
    main.setAttribute("aria-busy", "false");
    main.innerHTML = `<div class="serie-error"><strong>${escapeHTML(titulo)}</strong><span>${escapeHTML(mensagem)}</span><a href="series.html">Voltar às séries</a></div>`;
  }

  function playerHref(episodio, temporada){
    const provider = episodio.provider || temporada.provider || serieAtual.provider || "wistia";
    const server = episodio.server || temporada.server || serieAtual.server || "";
    const subfolder = episodio.subfolder || temporada.subfolder || serieAtual.subfolder || "";
    const numero = episodio.numero ?? "";
    const tituloCompleto = `${serieAtual.titulo} — T${temporada.numero} E${numero}: ${episodio.titulo}`;
    const params = new URLSearchParams({
      id: episodio.id,
      titulo: tituloCompleto,
      provider,
      serie: criarSlug(serieAtual.titulo)
    });
    if(server) params.set("server", server);
    if(subfolder) params.set("subfolder", subfolder);
    params.set("v", "4");
    return `serie-player.html?${params.toString()}`;
  }

  function renderEpisodios(indice){
    const temporada = serieAtual.temporadas[indice];
    const lista = document.getElementById("episodeList");
    const botoes = [...document.querySelectorAll(".season-btn")];
    botoes.forEach((botao, i) => {
      botao.classList.toggle("is-active", i === indice);
      botao.setAttribute("aria-selected", i === indice ? "true" : "false");
    });

    if(!temporada?.episodios?.length){
      lista.innerHTML = `<div class="episode-empty">Nenhum episódio cadastrado nesta temporada.</div>`;
      return;
    }

    lista.innerHTML = temporada.episodios.map(episodio => `
      <a class="episode-card" href="${playerHref(episodio, temporada)}">
        <span class="episode-number">${String(episodio.numero ?? "").padStart(2, "0")}</span>
        <span class="episode-info">
          <strong>${escapeHTML(episodio.titulo || `Episódio ${episodio.numero}`)}</strong>
          ${episodio.duracao ? `<small>${escapeHTML(episodio.duracao)}</small>` : ""}
        </span>
        <span class="episode-play" aria-hidden="true">▶</span>
      </a>`).join("");
  }

  function renderSerie(serie){
    serieAtual = serie;
    const temporadas = Array.isArray(serie.temporadas) ? serie.temporadas : [];
    const generos = Array.isArray(serie.generos) ? serie.generos.join(" • ") : (serie.genero || "");
    const totalEpisodios = temporadas.reduce((total, temporada) => total + (temporada.episodios?.length || 0), 0);

    document.title = `${serie.titulo} | FreeFlix`;
    main.setAttribute("aria-busy", "false");
    main.innerHTML = `
      <section class="serie-hero">
        <img class="serie-cover" src="assets/img/capas-series/${encodeURIComponent(serie.capa).replaceAll('%2F', '/')}" alt="Capa de ${escapeHTML(serie.titulo)}">
        <div class="serie-copy">
          <span class="serie-label">Série</span>
          <h1>${escapeHTML(serie.titulo)}</h1>
          <div class="serie-meta">
            ${serie.ano ? `<span>${escapeHTML(serie.ano)}</span>` : ""}
            <span>${temporadas.length} temporada${temporadas.length === 1 ? "" : "s"}</span>
            <span>${totalEpisodios} episódio${totalEpisodios === 1 ? "" : "s"}</span>
          </div>
          ${generos ? `<p class="serie-genres">${escapeHTML(generos)}</p>` : ""}
          <p class="serie-synopsis">${escapeHTML(serie.sinopse || "Escolha uma temporada e um episódio para assistir.")}</p>
        </div>
      </section>
      <section class="episodes-section">
        <div class="episodes-heading">
          <div>
            <span class="section-kicker">Lista de episódios</span>
            <h2>Temporadas</h2>
          </div>
          <div class="season-tabs" role="tablist" aria-label="Escolher temporada">
            ${temporadas.map((temporada, indice) => `<button class="season-btn${indice === 0 ? " is-active" : ""}" type="button" role="tab" aria-selected="${indice === 0}" data-index="${indice}">Temporada ${escapeHTML(temporada.numero)}</button>`).join("")}
          </div>
        </div>
        <div class="episode-list" id="episodeList"></div>
      </section>`;

    document.querySelectorAll(".season-btn").forEach(botao => {
      botao.addEventListener("click", () => renderEpisodios(Number(botao.dataset.index)));
    });

    if(temporadas.length) renderEpisodios(0);
    else document.getElementById("episodeList").innerHTML = `<div class="episode-empty">Nenhuma temporada cadastrada.</div>`;
  }

  async function carregar(){
    if(!serieSlug){
      mostrarErro("Série não encontrada", "Volte ao catálogo e escolha uma série.");
      return;
    }
    try{
      const res = await fetch("assets/js/series.json", { cache: "no-store" });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const series = await res.json();
      const serie = series.find(item => criarSlug(item.titulo) === serieSlug);
      if(!serie){
        mostrarErro("Série não encontrada", "Ela pode ter sido removida do catálogo.");
        return;
      }
      renderSerie(serie);
    }catch(error){
      console.error(error);
      mostrarErro("Não foi possível carregar a série", "Confira o arquivo series.json e tente novamente.");
    }
  }

  carregar();
})();
