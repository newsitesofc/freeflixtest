/* Player FreeFlix (fix definitivo comments via Firestore REST) */
(() => {
  // ====== Helpers ======
  const $ = (id) => document.getElementById(id);

  const escapeHTML = (str) =>
    String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const setStatus = (msg, isError = false) => {
    if (!listaEl) return;
    listaEl.innerHTML = `
      <div class="comentario-item" style="opacity:.9; ${isError ? "border:1px solid rgba(255,0,0,.25);" : ""}">
        ${escapeHTML(msg)}
      </div>
    `;
  };

  // ====== Query params / player ======
  const params = new URLSearchParams(window.location.search);
  const videoId = params.get("id");
  const provider = params.get("provider") || "wistia";
  const server = params.get("server");
  const subfolder = params.get("subfolder");
  const serieRef = params.get("serie");
  const titulo = params.get("titulo") || "Assistir";
  const voltarHref = serieRef ? `serie.html?serie=${encodeURIComponent(serieRef)}` : "filmes.html";
  const voltarTexto = serieRef ? "Voltar à série" : "Voltar ao catálogo";

  // Compatibilidade com links antigos: episódios nunca usam o player de filmes.
  if (serieRef) {
    const destino = new URL("serie-player.html", window.location.href);
    destino.search = window.location.search;
    window.location.replace(destino.toString());
    return;
  }

  const tituloEl = $("tituloFilme");
  if (tituloEl) tituloEl.innerText = titulo;
  document.title = `${titulo} | FreeFlix`;

  if (videoId) {
    const iframe = $("playerIframe");
    if (iframe) {
      if (provider === "rede-canais") {
        if (!/^(?:RCFServer\d+|RCServer\d+)$/i.test(server || "") || !/^[a-z0-9_-]+$/i.test(subfolder || "")) {
          const wrapper = document.querySelector(".player-wrapper");
          if (wrapper) wrapper.innerHTML = `<div class="player-error"><strong>Servidor deste vídeo ainda não foi configurado.</strong><a href="${voltarHref}">${voltarTexto}</a></div>`;
          return;
        }
        const url = new URL("https://redecanais.af/player3/server.php");
        url.searchParams.set("server", server);
        url.searchParams.set("subfolder", subfolder);
        url.searchParams.set("vid", videoId);
        iframe.src = url.toString();
      } else {
        iframe.src = `https://fast.wistia.net/embed/iframe/${encodeURIComponent(videoId)}`;
      }
      iframe.title = `Reproduzir ${titulo}`;
    }
  } else {
    if (tituloEl) tituloEl.innerText = "Vídeo não encontrado";
    const wrapper = document.querySelector(".player-wrapper");
    if(wrapper) wrapper.innerHTML = `<div class="player-error"><strong>Não foi possível abrir este vídeo.</strong><a href="${voltarHref}">${voltarTexto}</a></div>`;
  }

  // ====== Firestore REST config ======
  const FIREBASE_PROJECT_ID = "freeflix-82019";
  const FIREBASE_API_KEY = "AIzaSyAP6Y1uiOEafLGfry27UiBso1ShV1C2uJk";

  const listUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/comments?key=${FIREBASE_API_KEY}`;
  const createUrl = listUrl; // POST no mesmo endpoint cria doc com id aleatório

  // ====== DOM ======
  const listaEl = $("listaComentarios");
  const nomeEl = $("nomeComentario");
  const textoEl = $("textoComentario");
  const btn = $("btnEnviarComentario");

  // Sem videoId ou sem lista, não faz nada
  if (!videoId || !listaEl) return;

  // ====== Render ======
  function renderComentarios(docs) {
    if (!docs || docs.length === 0) {
      setStatus("Sem comentários ainda.");
      return;
    }

    listaEl.innerHTML = docs
      .map((d) => {
        const f = d.fields || {};
        const name = f.name?.stringValue || "Anônimo";
        const text = f.text?.stringValue || "";

        const whenIso = f.createdAt?.timestampValue || "";
        const when = whenIso ? new Date(whenIso).toLocaleString("pt-BR") : "";

        return `
          <div class="comentario-item">
            <div class="comentario-topo">
              <div class="comentario-nome">${escapeHTML(name)}</div>
              <div>${escapeHTML(when)}</div>
            </div>
            <div class="comentario-texto">${escapeHTML(text)}</div>
          </div>
        `;
      })
      .join("");
  }

  // ====== Load (LIST + filter no front) ======
  async function carregarComentarios() {
    try {
      setStatus("Carregando comentários...");

      const res = await fetch(listUrl, { method: "GET" });
      const data = await res.json().catch(() => null);

      if (!res.ok || data?.error) {
        const msg =
          data?.error?.message ||
          `Falha ao carregar (HTTP ${res.status}). Verifique regras do Firestore.`;
        setStatus(`Erro ao carregar comentários: ${msg}`, true);
        return;
      }

      const docs = Array.isArray(data?.documents) ? data.documents : [];

      // filtra pelo filmId
      const filtrados = docs.filter((d) => (d.fields?.filmId?.stringValue || "") === videoId);

      // ordena por createdAt desc
      filtrados.sort((a, b) => {
        const at = a.fields?.createdAt?.timestampValue || "";
        const bt = b.fields?.createdAt?.timestampValue || "";
        return bt.localeCompare(at);
      });

      renderComentarios(filtrados);
    } catch (e) {
      setStatus(`Erro ao carregar comentários: ${e?.message || e}`, true);
    }
  }

  // ====== Send ======
  let sending = false;

  async function enviarComentario() {
    if (sending) return;
    if (!textoEl) return;

    const text = (textoEl.value || "").trim();
    if (!text) return;

    // limites básicos
    const name = (nomeEl?.value || "").trim().slice(0, 25) || "Anônimo";
    const safeText = text.slice(0, 300);

    // anti-spam simples (1 a cada 4s por navegador)
    const now = Date.now();
    const last = Number(localStorage.getItem("ff_last_comment_ts") || "0");
    if (now - last < 4000) {
      alert("Aguarde alguns segundos antes de enviar outro comentário.");
      return;
    }

    const payload = {
      fields: {
        filmId: { stringValue: videoId },
        name: { stringValue: name },
        text: { stringValue: safeText },
        createdAt: { timestampValue: new Date().toISOString() },
      },
    };

    // optimistic UI: mostra na hora
    const optimisticDoc = { fields: payload.fields };
    const currentHTML = listaEl.innerHTML;
    listaEl.innerHTML =
      `
      <div class="comentario-item" style="opacity:.75">
        <div class="comentario-topo">
          <div class="comentario-nome">${escapeHTML(name)}</div>
          <div>${escapeHTML(new Date().toLocaleString("pt-BR"))}</div>
        </div>
        <div class="comentario-texto">${escapeHTML(safeText)}</div>
      </div>
    ` + currentHTML;

    sending = true;
    if (btn) btn.disabled = true;

    try {
      const res = await fetch(createUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || data?.error) {
        const msg =
          data?.error?.message ||
          `Falha ao enviar (HTTP ${res.status}). Verifique regras do Firestore.`;

        // volta UI (remove optimistic)
        await carregarComentarios();
        alert("Não foi possível enviar seu comentário agora.\n\n" + msg);
        return;
      }

      // ok
      localStorage.setItem("ff_last_comment_ts", String(Date.now()));
      textoEl.value = "";
      await carregarComentarios();
    } catch (e) {
      await carregarComentarios();
      alert("Não foi possível enviar seu comentário agora.\n\n" + (e?.message || e));
    } finally {
      sending = false;
      if (btn) btn.disabled = false;
    }
  }

  if (btn) btn.addEventListener("click", enviarComentario);

  // load inicial
  carregarComentarios();
})();
