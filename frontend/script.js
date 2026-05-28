const API_BASE_URL = "http://127.0.0.1:8000/api";

function formatarData(data) {
  if (!data) return "-";
  const partes = String(data).split("-");
  if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
  return data;
}

function atualizarTexto(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valor;
}

function mostrarMensagem(texto, tipo = "sucesso") {
  let msg = document.getElementById("mensagemSistema");
  if (!msg) {
    msg = document.createElement("div");
    msg.id = "mensagemSistema";
    document.body.appendChild(msg);
  }

  const classe = tipo === "erro" ? "alert-danger" : "alert-success";
  msg.textContent = texto;
  msg.className = `msg-sistema alert ${classe} shadow fw-semibold`;

  const feedbackFormulario = document.getElementById("feedbackFormulario");
  if (feedbackFormulario) {
    feedbackFormulario.textContent = texto;
    feedbackFormulario.className = `alert ${classe}`;
  }

  setTimeout(() => {
    msg.remove();
    if (feedbackFormulario) {
      feedbackFormulario.textContent = "";
      feedbackFormulario.className = "alert d-none";
    }
  }, 3500);
}

async function apiFetch(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
    headers: { "Content-Type": "application/json", ...(opcoes.headers || {}) },
    ...opcoes,
  });

  let dados = null;
  try {
    dados = await resposta.json();
  } catch (_) {}

  if (!resposta.ok) {
    throw new Error(dados?.erro || dados?.detail || "Erro ao conectar com o backend.");
  }
  return dados;
}

function criarEstadoVazio(texto) {
  const div = document.createElement("div");
  div.className = "alert alert-info mb-0";
  div.textContent = texto;
  return div;
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function classeStatus(status) {
  const valor = String(status || "").toLowerCase();
  if (valor.includes("recebido")) return "text-bg-success";
  if (valor.includes("repassado")) return "text-bg-primary";
  if (valor.includes("processado")) return "text-bg-warning";
  return "text-bg-secondary";
}

function iconeStatus(status) {
  const valor = String(status || "").toLowerCase();
  if (valor.includes("recebido")) return "bi-check-circle-fill";
  if (valor.includes("repassado")) return "bi-arrow-right-circle-fill";
  if (valor.includes("processado")) return "bi-hourglass-split";
  return "bi-info-circle-fill";
}

function normalizarDataInput(data) {
  if (!data) return "";
  const texto = String(data);
  if (texto.includes("T")) return texto.split("T")[0];
  if (texto.includes("/")) {
    const partes = texto.split("/");
    if (partes.length === 3) return `${partes[2]}-${partes[1]}-${partes[0]}`;
  }
  return texto;
}

function abrirModalEdicaoDoacao(d) {
  let modal = document.getElementById("modalEditarDoacao");

  if (!modal) {
    modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = "modalEditarDoacao";
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <form class="modal-content border-0 rounded-4 shadow" id="formEditarDoacao">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-pencil-square me-2"></i>Editar doação
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>

          <div class="modal-body">
            <input type="hidden" id="editarDoacaoId">

            <div class="mb-3">
              <label class="form-label fw-semibold" for="editarDoacaoItem">Doação</label>
              <input class="form-control" id="editarDoacaoItem" required>
            </div>

            <div class="mb-3">
              <label class="form-label fw-semibold" for="editarRemetente">Remetente</label>
              <input class="form-control" id="editarRemetente" required>
            </div>

            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-semibold" for="editarQuantidade">Quantidade</label>
                <input class="form-control" id="editarQuantidade" type="number" min="1" required>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-semibold" for="editarCpfCnpj">CPF/CNPJ</label>
                <input class="form-control" id="editarCpfCnpj">
              </div>

              <div class="col-md-6">
                <label class="form-label fw-semibold" for="editarStatus">Status</label>
                <select class="form-select" id="editarStatus" required>
                  <option value="Recebido">Recebido</option>
                  <option value="Processado">Processado</option>
                  <option value="Repassado">Repassado</option>
                </select>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-semibold" for="editarData">Data</label>
                <input class="form-control" id="editarData" type="date" required>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary fw-semibold">
              <i class="bi bi-check-lg me-1"></i>Salvar alterações
            </button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("formEditarDoacao").addEventListener("submit", async (evento) => {
      evento.preventDefault();

      const id = document.getElementById("editarDoacaoId").value;
      const dados = {
        doacao_item: document.getElementById("editarDoacaoItem").value.trim(),
        remetente: document.getElementById("editarRemetente").value.trim(),
        quantidade: Number(document.getElementById("editarQuantidade").value),
        cpf_cnpj: document.getElementById("editarCpfCnpj").value.trim(),
        status: document.getElementById("editarStatus").value,
        data: document.getElementById("editarData").value,
      };

      if (!dados.doacao_item || !dados.remetente || !dados.quantidade || dados.quantidade <= 0 || !dados.status || !dados.data) {
        mostrarMensagem("Preencha todos os campos obrigatórios.", "erro");
        return;
      }

      try {
        await apiFetch(`/doacoes/${id}/`, { method: "PATCH", body: JSON.stringify(dados) });
        bootstrap.Modal.getInstance(modal).hide();
        mostrarMensagem("Doação editada com sucesso.");
        carregarDoacoes();
        carregarEstoque();
      } catch (erro) {
        mostrarMensagem(erro.message, "erro");
      }
    });
  }

  document.getElementById("editarDoacaoId").value = d.id;
  document.getElementById("editarDoacaoItem").value = d.doacao_item || "";
  document.getElementById("editarRemetente").value = d.remetente || "";
  document.getElementById("editarQuantidade").value = d.quantidade || 1;
  document.getElementById("editarCpfCnpj").value = d.cpf_cnpj || "";
  document.getElementById("editarStatus").value = d.status || "Recebido";
  document.getElementById("editarData").value = normalizarDataInput(d.data);

  bootstrap.Modal.getOrCreateInstance(modal).show();
}


function criarCardDoacao(d) {
  const div = document.createElement("article");
  div.className = "record-card doacao-card card border-0 shadow-sm rounded-4";
  div.dataset.busca = `${d.doacao_item || ""} ${d.remetente || ""} ${d.status || ""}`.toLowerCase();

  const status = d.status || "Sem status";
  const statusClass = classeStatus(status);
  const statusIcon = iconeStatus(status);

  div.innerHTML = `
    <div class="card-body p-3 p-md-4">
      <div class="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3 mb-3">
        <div class="min-w-0">
          <h3 class="h5 fw-bold mb-1">${escaparHtml(d.doacao_item || "Doação sem nome")}</h3>
          <span class="text-secondary small">Registro #${escaparHtml(d.id || "-")}</span>
        </div>

        <div class="d-flex flex-wrap align-items-center gap-2">
          <span class="badge rounded-pill status-pill ${statusClass}">
            <i class="bi ${statusIcon} me-1"></i>${escaparHtml(status)}
          </span>

          <button class="btn btn-outline-primary btn-sm fw-semibold btn-editar-doacao" type="button">
            <i class="bi bi-pencil-square me-1"></i>Editar
          </button>

          <button class="btn btn-outline-danger btn-sm fw-semibold btn-apagar-doacao" type="button">
            <i class="bi bi-trash3-fill me-1"></i>Apagar
          </button>
        </div>
      </div>

      <div class="record-grid doacao-grid small">
        <div>
          <span class="text-secondary d-block">Doador</span>
          <strong>${escaparHtml(d.remetente || "-")}</strong>
        </div>
        <div>
          <span class="text-secondary d-block">Quantidade</span>
          <strong>${escaparHtml(d.quantidade || 0)}</strong>
        </div>
        <div>
          <span class="text-secondary d-block">CPF/CNPJ</span>
          <strong>${escaparHtml(d.cpf_cnpj || "-")}</strong>
        </div>
        <div>
          <span class="text-secondary d-block">Data</span>
          <strong>${escaparHtml(formatarData(d.data))}</strong>
        </div>
      </div>
    </div>
  `;

  const btnEditar = div.querySelector(".btn-editar-doacao");
  btnEditar.addEventListener("click", () => abrirModalEdicaoDoacao(d));

  const btnApagar = div.querySelector(".btn-apagar-doacao");
  btnApagar.addEventListener("click", async () => {
    if (!confirm("Apagar esta doação?")) return;
    try {
      await apiFetch(`/doacoes/${d.id}/`, { method: "DELETE" });
      mostrarMensagem("Registro apagado com sucesso.");
      carregarDoacoes();
      carregarEstoque();
    } catch (erro) {
      mostrarMensagem(erro.message, "erro");
    }
  });

  return div;
}

function criarCardEstoque(item) {
  const div = document.createElement("article");
  div.className = "record-card card border-0 shadow-sm rounded-4";
  div.dataset.busca = `${item.doacao_item || ""}`.toLowerCase();

  const saldo = Number(item.saldo || 0);
  const badge = saldo <= 0 ? "text-bg-danger" : saldo <= 3 ? "text-bg-warning" : "text-bg-success";
  const texto = saldo <= 0 ? "Sem saldo" : saldo <= 3 ? "Estoque baixo" : "Disponível";

  div.innerHTML = `
    <div class="card-body p-3 p-md-4">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <h3 class="h5 fw-bold mb-0 me-auto">${item.doacao_item || "Item sem nome"}</h3>
        <span class="badge rounded-pill status-pill ${badge}">${texto}</span>
      </div>
      <div class="record-grid small">
        <div><span class="text-secondary d-block">Recebido</span><strong>${item.recebido || 0}</strong></div>
        <div><span class="text-secondary d-block">Repassado</span><strong>${item.repassado || 0}</strong></div>
        <div><span class="text-secondary d-block">Processado</span><strong>${item.processado || 0}</strong></div>
        <div><span class="text-secondary d-block">Saldo</span><strong>${saldo}</strong></div>
      </div>
    </div>
  `;

  return div;
}

function ativarBusca() {
  const busca = document.getElementById("buscaItens");
  const lista = document.getElementById("acaoSocialEstoqueScrollbar");
  if (!busca || !lista) return;

  busca.addEventListener("input", () => {
    const termo = busca.value.trim().toLowerCase();
    lista.querySelectorAll(".record-card").forEach((card) => {
      card.style.display = card.dataset.busca.includes(termo) ? "" : "none";
    });
  });
}

async function carregarDoacoes() {
  const lista = document.getElementById("acaoSocialEstoqueScrollbar");
  if (!lista || !document.title.includes("Doação")) return;
  lista.innerHTML = "";

  try {
    const doacoes = await apiFetch("/doacoes/");
    atualizarTexto("totalDoacoes", doacoes.length);
    atualizarTexto("quantidadeDoada", doacoes.reduce((soma, d) => soma + Number(d.quantidade || 0), 0));

    if (!doacoes.length) {
      atualizarTexto("ultimaDoacao", "-");
      lista.appendChild(criarEstadoVazio("Nenhuma doação registrada ainda."));
      return;
    }

    const ultima = doacoes[doacoes.length - 1];
    atualizarTexto("ultimaDoacao", ultima?.doacao_item || "-");

    doacoes.forEach((d) => lista.appendChild(criarCardDoacao(d)));
    ativarBusca();
  } catch (erro) {
    lista.appendChild(criarEstadoVazio("Não foi possível carregar as doações. Verifique se o Django está rodando."));
  }
}

async function carregarEstoque() {
  const lista = document.getElementById("acaoSocialEstoqueScrollbar");
  if (!lista || !document.title.includes("Estoque")) return;
  lista.innerHTML = "";

  try {
    const itens = await apiFetch("/estoque/");
    const totalRecebido = itens.reduce((soma, item) => soma + Number(item.recebido || 0), 0);
    const totalRepassado = itens.reduce((soma, item) => soma + Number(item.repassado || 0), 0);
    const saldoGeral = itens.reduce((soma, item) => soma + Number(item.saldo || 0), 0);

    atualizarTexto("totalItens", itens.length);
    atualizarTexto("totalRecebido", totalRecebido);
    atualizarTexto("totalRepassado", totalRepassado);
    atualizarTexto("saldoGeral", saldoGeral);

    if (!itens.length) {
      lista.appendChild(criarEstadoVazio("Estoque vazio."));
      return;
    }

    itens.forEach((item) => lista.appendChild(criarCardEstoque(item)));
    ativarBusca();
  } catch (erro) {
    lista.appendChild(criarEstadoVazio("Não foi possível carregar o estoque. Verifique se o Django está rodando."));
  }
}

function prepararFormularioDoacao() {
  const form = document.getElementById("acaoSocialRegistrarDoacoesDiv");
  const botao = document.getElementById("registrarDoacaoBotao");
  if (!form || !botao) return;

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const dados = {
      doacao_item: document.getElementById("doacaoItem").value.trim(),
      remetente: document.getElementById("remetente").value.trim(),
      quantidade: Number(document.getElementById("quantidade").value),
      cpf_cnpj: document.getElementById("cpfCnpj").value.trim(),
      status: document.getElementById("status").value,
      data: document.getElementById("data").value,
    };

    if (!dados.doacao_item || !dados.remetente || !dados.quantidade || dados.quantidade <= 0 || dados.status === "null" || !dados.data) {
      mostrarMensagem("Preencha doação, remetente, quantidade, status e data.", "erro");
      return;
    }

    botao.disabled = true;
    botao.textContent = "Registrando...";

    try {
      await apiFetch("/doacoes/", { method: "POST", body: JSON.stringify(dados) });
      mostrarMensagem("Doação cadastrada com sucesso!");
      form.reset();
      document.getElementById("status").value = "null";
    } catch (erro) {
      mostrarMensagem(erro.message, "erro");
    } finally {
      botao.disabled = false;
      botao.textContent = "Registrar Doação";
    }
  });
}

function prepararLoginSimples() {
  const form = document.querySelector("#loginBody form");
  if (!form) return;

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const email = document.getElementById("loginUsuarioEmail").value.trim();
    const senha = document.getElementById("loginUsuarioSenha").value.trim();
    const msg = document.getElementById("loginMensagem");

    if (!email || !senha) {
      msg.textContent = "Preencha usuário e senha.";
      msg.className = "text-danger text-center fw-semibold mt-3 mb-0";
      return;
    }
    localStorage.setItem("usuarioLogado", email);
    msg.textContent = "Login feito com sucesso.";
    msg.className = "text-success text-center fw-semibold mt-3 mb-0";
    setTimeout(() => window.location.href = "index.html", 700);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  carregarDoacoes();
  carregarEstoque();
  prepararFormularioDoacao();
  prepararLoginSimples();
});
