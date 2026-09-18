/* Pedidos de filmes via o mesmo Firestore usado nos comentários */
(() => {
  const $ = (id) => document.getElementById(id);
  const listaEl = $("listaPedidos");
  const nomeEl = $("nomePedido");
  const textoEl = $("textoPedido");
  const btn = $("btnEnviarPedido");
  if (!listaEl) return;

  const FIREBASE_PROJECT_ID = "freeflix-82019";
  const FIREBASE_API_KEY = "AIzaSyAP6Y1uiOEafLGfry27UiBso1ShV1C2uJk";
  const PEDIDOS_ID = "__freeflix_pedidos_de_filmes__";
  const endpoint = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/comments?key=${FIREBASE_API_KEY}`;
  const escapeHTML = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

  function status(message, error = false) {
    listaEl.innerHTML = `<div class="pedido-item"${error ? ' style="border-color:rgba(255,0,0,.25)"' : ""}>${escapeHTML(message)}</div>`;
  }

  function render(docs) {
    if (!docs.length) return status("Nenhum pedido ainda. Seja o primeiro a pedir um filme!");
    listaEl.innerHTML = docs.map((doc) => {
      const fields = doc.fields || {};
      const nome = fields.name?.stringValue || "Anônimo";
      const texto = fields.text?.stringValue || "";
      const iso = fields.createdAt?.timestampValue || "";
      const data = iso ? new Date(iso).toLocaleString("pt-BR") : "";
      return `<div class="pedido-item"><div class="pedido-topo"><div class="pedido-nome">${escapeHTML(nome)}</div><div>${escapeHTML(data)}</div></div><div class="pedido-texto">${escapeHTML(texto)}</div></div>`;
    }).join("");
  }

  async function carregar() {
    try {
      status("Carregando pedidos...");
      const response = await fetch(endpoint);
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.error) throw new Error(data?.error?.message || `Falha ao carregar (HTTP ${response.status})`);
      const docs = (Array.isArray(data?.documents) ? data.documents : [])
        .filter((doc) => doc.fields?.filmId?.stringValue === PEDIDOS_ID)
        .sort((a, b) => (b.fields?.createdAt?.timestampValue || "").localeCompare(a.fields?.createdAt?.timestampValue || ""));
      render(docs);
    } catch (error) {
      status(`Erro ao carregar pedidos: ${error.message || error}`, true);
    }
  }

  let enviando = false;
  async function enviar() {
    if (enviando) return;
    const texto = (textoEl?.value || "").trim().slice(0, 300);
    if (!texto) {
      textoEl?.focus();
      return;
    }
    const agora = Date.now();
    const ultimo = Number(localStorage.getItem("ff_last_request_ts") || "0");
    if (agora - ultimo < 4000) return alert("Aguarde alguns segundos antes de enviar outro pedido.");
    const nome = (nomeEl?.value || "").trim().slice(0, 25) || "Anônimo";
    const payload = { fields: { filmId: { stringValue: PEDIDOS_ID }, name: { stringValue: nome }, text: { stringValue: texto }, createdAt: { timestampValue: new Date().toISOString() } } };

    enviando = true;
    if (btn) { btn.disabled = true; btn.textContent = "Enviando..."; }
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.error) throw new Error(data?.error?.message || `Falha ao enviar (HTTP ${response.status})`);
      localStorage.setItem("ff_last_request_ts", String(Date.now()));
      textoEl.value = "";
      await carregar();
    } catch (error) {
      alert("Não foi possível enviar o pedido agora.\n\n" + (error.message || error));
      await carregar();
    } finally {
      enviando = false;
      if (btn) { btn.disabled = false; btn.textContent = "Enviar pedido"; }
    }
  }

  btn?.addEventListener("click", enviar);
  textoEl?.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") enviar();
  });
  carregar();
})();
