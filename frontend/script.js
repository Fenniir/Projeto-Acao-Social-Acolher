const API_BASE_URL = "http://127.0.0.1:8000/api";

// FUNÇÕES AUXILIARES ----------------------------------------------------------------------

function formatarData(data) {
  if (!data) {
    return "-";
  }

  let partes = String(data).split("-");

  if (partes.length === 3) {
    return partes[2] + "/" + partes[1] + "/" + partes[0];
  }

  return data;
}

function atualizarTexto(id, texto) {
  let elemento = document.getElementById(id);

  if (elemento) {
    elemento.textContent = texto;
  }
}

function mostrarMensagem(texto, tipo) {
  let mensagem = document.getElementById("mensagemSistema");

  if (!mensagem) {
    mensagem = document.createElement("div");
    mensagem.id = "mensagemSistema";
    document.body.appendChild(mensagem);
  }

  if (tipo === "erro") {
    mensagem.className = "msg-sistema alert alert-danger shadow fw-semibold";
  } else {
    mensagem.className = "msg-sistema alert alert-success shadow fw-semibold";
  }

  mensagem.textContent = texto;

  setTimeout(function () {
    mensagem.remove();
  }, 3500);
}

async function apiFetch(caminho, opcoes = {}) {
  let resposta = await fetch(API_BASE_URL + caminho, {
    headers: {
      "Content-Type": "application/json"
    },
    ...opcoes
  });

  if (!resposta.ok) {
    throw new Error("Erro ao conectar com o backend.");
  }

  if (resposta.status === 204) {
    return null;
  }

  return await resposta.json();
}

function criarEstadoVazio(texto) {
  let div = document.createElement("div");
  div.className = "alert alert-info mb-0";
  div.textContent = texto;
  return div;
}

function classeStatus(status) {
  if (status === "Recebido") {
    return "text-bg-success";
  }

  if (status === "Repassado") {
    return "text-bg-primary";
  }

  if (status === "Processado") {
    return "text-bg-warning";
  }

  return "text-bg-secondary";
}

function iconeStatus(status) {
  if (status === "Recebido") {
    return "bi-check-circle-fill";
  }

  if (status === "Repassado") {
    return "bi-arrow-right-circle-fill";
  }

  if (status === "Processado") {
    return "bi-hourglass-split";
  }

  return "bi-info-circle-fill";
}

function normalizarDataInput(data) {
  if (!data) {
    return "";
  }

  let texto = String(data);

  if (texto.includes("T")) {
    return texto.split("T")[0];
  }

  if (texto.includes("/")) {
    let partes = texto.split("/");
    return partes[2] + "-" + partes[1] + "-" + partes[0];
  }

  return texto;
}

// DOAÇÕES ----------------------------------------------------------------------

function pegarDadosFormularioDoacao() {
  return {
    doacao_item: document.getElementById("doacaoItem").value.trim(),
    remetente: document.getElementById("remetente").value.trim(),
    quantidade: Number(document.getElementById("quantidade").value),
    cpf_cnpj: document.getElementById("cpfCnpj").value.trim(),
    status: document.getElementById("status").value,
    data: document.getElementById("data").value
  };
}

function validarDoacao(doacao) {
  if (!doacao.doacao_item) {
    return false;
  }

  if (!doacao.remetente) {
    return false;
  }

  if (!doacao.quantidade || doacao.quantidade <= 0) {
    return false;
  }

  if (!doacao.status || doacao.status === "null") {
    return false;
  }

  if (!doacao.data) {
    return false;
  }

  return true;
}

function criarCardDoacao(doacao) {
  let div = document.createElement("article");

  div.className = "record-card doacao-card card border-0 shadow-sm rounded-4";

  div.dataset.busca = (
    doacao.doacao_item + " " +
    doacao.remetente + " " +
    doacao.status
  ).toLowerCase();

  let status = doacao.status || "Sem status";
  let statusClass = classeStatus(status);
  let statusIcon = iconeStatus(status);

  div.innerHTML = `
    <div class="card-body p-3 p-md-4">

      <div class="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3 mb-3">

        <div>
          <h3 class="h5 fw-bold mb-1">
            ${doacao.doacao_item || "Doação sem nome"}
          </h3>

          <span class="text-secondary small">
            Registro #${doacao.id || "-"}
          </span>
        </div>

        <div class="d-flex flex-wrap align-items-center gap-2">

          <span class="badge rounded-pill status-pill ${statusClass}">
            <i class="bi ${statusIcon} me-1"></i>
            ${status}
          </span>

          <button class="btn btn-outline-primary btn-sm fw-semibold btn-editar-doacao" type="button">
            <i class="bi bi-pencil-square me-1"></i>
            Editar
          </button>

          <button class="btn btn-outline-danger btn-sm fw-semibold btn-apagar-doacao" type="button">
            <i class="bi bi-trash3-fill me-1"></i>
            Apagar
          </button>

        </div>
      </div>

      <div class="record-grid doacao-grid small">

        <div>
          <span class="text-secondary d-block">Doador</span>
          <strong>${doacao.remetente || "-"}</strong>
        </div>

        <div>
          <span class="text-secondary d-block">Quantidade</span>
          <strong>${doacao.quantidade || 0}</strong>
        </div>

        <div>
          <span class="text-secondary d-block">CPF/CNPJ</span>
          <strong>${doacao.cpf_cnpj || "-"}</strong>
        </div>

        <div>
          <span class="text-secondary d-block">Data</span>
          <strong>${formatarData(doacao.data)}</strong>
        </div>

      </div>
    </div>
  `;

  let botaoEditar = div.querySelector(".btn-editar-doacao");
  let botaoApagar = div.querySelector(".btn-apagar-doacao");

  botaoEditar.addEventListener("click", function () {
    abrirModalEdicaoDoacao(doacao);
  });

  botaoApagar.addEventListener("click", async function () {
    let confirmar = confirm("Apagar esta doação?");

    if (!confirmar) {
      return;
    }

    try {
      await apiFetch("/doacoes/" + doacao.id + "/", {
        method: "DELETE"
      });

      mostrarMensagem("Registro apagado com sucesso.");
      carregarDoacoes();
      carregarEstoque();

    } catch (erro) {
      mostrarMensagem(erro.message, "erro");
    }
  });

  return div;
}

async function carregarDoacoes() {
  let lista = document.getElementById("acaoSocialEstoqueScrollbar");

  if (!lista) {
    return;
  }

  if (!document.title.includes("Doação")) {
    return;
  }

  lista.innerHTML = "";

  try {
    let doacoes = await apiFetch("/doacoes/");

    atualizarTexto("totalDoacoes", doacoes.length);

    let quantidadeTotal = 0;

    for (let i = 0; i < doacoes.length; i++) {
      quantidadeTotal += Number(doacoes[i].quantidade || 0);
    }

    atualizarTexto("quantidadeDoada", quantidadeTotal);

    if (doacoes.length === 0) {
      atualizarTexto("ultimaDoacao", "-");
      lista.appendChild(criarEstadoVazio("Nenhuma doação registrada ainda."));
      return;
    }

    let ultimaDoacao = doacoes[doacoes.length - 1];

    atualizarTexto("ultimaDoacao", ultimaDoacao.doacao_item || "-");

    for (let i = 0; i < doacoes.length; i++) {
      let card = criarCardDoacao(doacoes[i]);
      lista.appendChild(card);
    }

    ativarBusca();

  } catch (erro) {
    lista.appendChild(
      criarEstadoVazio("Não foi possível carregar as doações. Verifique se o Django está rodando.")
    );
  }
}

function prepararFormularioDoacao() {
  let formulario = document.getElementById("acaoSocialRegistrarDoacoesDiv");
  let botao = document.getElementById("registrarDoacaoBotao");

  if (!formulario || !botao) {
    return;
  }

  formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    let dados = pegarDadosFormularioDoacao();

    if (!validarDoacao(dados)) {
      mostrarMensagem("Preencha doação, remetente, quantidade, status e data.", "erro");
      return;
    }

    botao.disabled = true;
    botao.textContent = "Registrando...";

    try {
      await apiFetch("/doacoes/", {
        method: "POST",
        body: JSON.stringify(dados)
      });

      mostrarMensagem("Doação cadastrada com sucesso!");
      formulario.reset();
      document.getElementById("status").value = "null";

    } catch (erro) {
      mostrarMensagem(erro.message, "erro");

    } finally {
      botao.disabled = false;
      botao.textContent = "Registrar Doação";
    }
  });
}

// MODAL DE EDIÇÃO ----------------------------------------------------------------------

function abrirModalEdicaoDoacao(doacao) {
  let modal = document.getElementById("modalEditarDoacao");

  if (!modal) {
    modal = criarModalEdicaoDoacao();
    document.body.appendChild(modal);
    configurarFormularioEdicao(modal);
  }

  preencherModalEdicao(doacao);

  let modalBootstrap = bootstrap.Modal.getOrCreateInstance(modal);
  modalBootstrap.show();
}

function criarModalEdicaoDoacao() {
  let modal = document.createElement("div");

  modal.className = "modal fade";
  modal.id = "modalEditarDoacao";
  modal.tabIndex = -1;

  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">

      <form class="modal-content border-0 rounded-4 shadow" id="formEditarDoacao">

        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-pencil-square me-2"></i>
            Editar doação
          </h5>

          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
        </div>

        <div class="modal-body">

          <input type="hidden" id="editarDoacaoId">

          <div class="mb-3">
            <label class="form-label fw-semibold" for="editarDoacaoItem">
              Doação
            </label>

            <input class="form-control" id="editarDoacaoItem" required>
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold" for="editarRemetente">
              Remetente
            </label>

            <input class="form-control" id="editarRemetente" required>
          </div>

          <div class="row g-3">

            <div class="col-md-6">
              <label class="form-label fw-semibold" for="editarQuantidade">
                Quantidade
              </label>

              <input class="form-control" id="editarQuantidade" type="number" min="1" required>
            </div>

            <div class="col-md-6">
              <label class="form-label fw-semibold" for="editarCpfCnpj">
                CPF/CNPJ
              </label>

              <input class="form-control" id="editarCpfCnpj">
            </div>

            <div class="col-md-6">
              <label class="form-label fw-semibold" for="editarStatus">
                Status
              </label>

              <select class="form-select" id="editarStatus" required>
                <option value="Recebido">Recebido</option>
                <option value="Processado">Processado</option>
                <option value="Repassado">Repassado</option>
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label fw-semibold" for="editarData">
                Data
              </label>

              <input class="form-control" id="editarData" type="date" required>
            </div>

          </div>
        </div>

        <div class="modal-footer">

          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
            Cancelar
          </button>

          <button type="submit" class="btn btn-primary fw-semibold">
            <i class="bi bi-check-lg me-1"></i>
            Salvar alterações
          </button>

        </div>
      </form>
    </div>
  `;

  return modal;
}

function preencherModalEdicao(doacao) {
  document.getElementById("editarDoacaoId").value = doacao.id;
  document.getElementById("editarDoacaoItem").value = doacao.doacao_item || "";
  document.getElementById("editarRemetente").value = doacao.remetente || "";
  document.getElementById("editarQuantidade").value = doacao.quantidade || 1;
  document.getElementById("editarCpfCnpj").value = doacao.cpf_cnpj || "";
  document.getElementById("editarStatus").value = doacao.status || "Recebido";
  document.getElementById("editarData").value = normalizarDataInput(doacao.data);
}

function pegarDadosModalEdicao() {
  return {
    doacao_item: document.getElementById("editarDoacaoItem").value.trim(),
    remetente: document.getElementById("editarRemetente").value.trim(),
    quantidade: Number(document.getElementById("editarQuantidade").value),
    cpf_cnpj: document.getElementById("editarCpfCnpj").value.trim(),
    status: document.getElementById("editarStatus").value,
    data: document.getElementById("editarData").value
  };
}

function configurarFormularioEdicao(modal) {
  let formulario = document.getElementById("formEditarDoacao");

  formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    let id = document.getElementById("editarDoacaoId").value;
    let dados = pegarDadosModalEdicao();

    if (!validarDoacao(dados)) {
      mostrarMensagem("Preencha todos os campos obrigatórios.", "erro");
      return;
    }

    try {
      await apiFetch("/doacoes/" + id + "/", {
        method: "PATCH",
        body: JSON.stringify(dados)
      });

      bootstrap.Modal.getInstance(modal).hide();

      mostrarMensagem("Doação editada com sucesso.");

      carregarDoacoes();
      carregarEstoque();

    } catch (erro) {
      mostrarMensagem(erro.message, "erro");
    }
  });
}

// ESTOQUE ----------------------------------------------------------------------

function criarCardEstoque(item) {
  let div = document.createElement("article");

  div.className = "record-card card border-0 shadow-sm rounded-4";
  div.dataset.busca = String(item.doacao_item || "").toLowerCase();

  let saldo = Number(item.saldo || 0);

  let classeBadge = "";
  let textoBadge = "";

  if (saldo <= 0) {
    classeBadge = "text-bg-danger";
    textoBadge = "Sem saldo";
  } else if (saldo <= 3) {
    classeBadge = "text-bg-warning";
    textoBadge = "Estoque baixo";
  } else {
    classeBadge = "text-bg-success";
    textoBadge = "Disponível";
  }

  div.innerHTML = `
    <div class="card-body p-3 p-md-4">

      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">

        <h3 class="h5 fw-bold mb-0 me-auto">
          ${item.doacao_item || "Item sem nome"}
        </h3>

        <span class="badge rounded-pill status-pill ${classeBadge}">
          ${textoBadge}
        </span>

      </div>

      <div class="record-grid small">

        <div>
          <span class="text-secondary d-block">Recebido</span>
          <strong>${item.recebido || 0}</strong>
        </div>

        <div>
          <span class="text-secondary d-block">Repassado</span>
          <strong>${item.repassado || 0}</strong>
        </div>

        <div>
          <span class="text-secondary d-block">Processado</span>
          <strong>${item.processado || 0}</strong>
        </div>

        <div>
          <span class="text-secondary d-block">Saldo</span>
          <strong>${saldo}</strong>
        </div>

      </div>
    </div>
  `;

  return div;
}

async function carregarEstoque() {
  let lista = document.getElementById("acaoSocialEstoqueScrollbar");

  if (!lista) {
    return;
  }

  if (!document.title.includes("Estoque")) {
    return;
  }

  lista.innerHTML = "";

  try {
    let itens = await apiFetch("/estoque/");

    let totalRecebido = 0;
    let totalRepassado = 0;
    let saldoGeral = 0;

    for (let i = 0; i < itens.length; i++) {
      totalRecebido += Number(itens[i].recebido || 0);
      totalRepassado += Number(itens[i].repassado || 0);
      saldoGeral += Number(itens[i].saldo || 0);
    }

    atualizarTexto("totalItens", itens.length);
    atualizarTexto("totalRecebido", totalRecebido);
    atualizarTexto("totalRepassado", totalRepassado);
    atualizarTexto("saldoGeral", saldoGeral);

    if (itens.length === 0) {
      lista.appendChild(criarEstadoVazio("Estoque vazio."));
      return;
    }

    for (let i = 0; i < itens.length; i++) {
      let card = criarCardEstoque(itens[i]);
      lista.appendChild(card);
    }

    ativarBusca();

  } catch (erro) {
    lista.appendChild(
      criarEstadoVazio("Não foi possível carregar o estoque. Verifique se o Django está rodando.")
    );
  }
}


// BUSCA ----------------------------------------------------------------------

function ativarBusca() {
  let campoBusca = document.getElementById("buscaItens");
  let lista = document.getElementById("acaoSocialEstoqueScrollbar");

  if (!campoBusca || !lista) {
    return;
  }

  campoBusca.addEventListener("input", function () {
    let termo = campoBusca.value.trim().toLowerCase();

    let cards = lista.querySelectorAll(".record-card");

    for (let i = 0; i < cards.length; i++) {
      let card = cards[i];

      if (card.dataset.busca.includes(termo)) {
        card.style.display = "";
      } else {
        card.style.display = "none";
      }
    }
  });
}

// LOGIN SIMPLES ----------------------------------------------------------------------

function prepararLoginSimples() {
  let formulario = document.querySelector("#loginBody form");

  if (!formulario) {
    return;
  }

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    let email = document.getElementById("loginUsuarioEmail").value.trim();
    let senha = document.getElementById("loginUsuarioSenha").value.trim();
    let mensagem = document.getElementById("loginMensagem");

    if (!email || !senha) {
      mensagem.textContent = "Preencha usuário e senha.";
      mensagem.className = "text-danger text-center fw-semibold mt-3 mb-0";
      return;
    }

    localStorage.setItem("usuarioLogado", email);

    mensagem.textContent = "Login feito com sucesso.";
    mensagem.className = "text-success text-center fw-semibold mt-3 mb-0";

    setTimeout(function () {
      window.location.href = "index.html";
    }, 700);
  });
}

// INICIALIZAÇÃO ----------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
  carregarDoacoes();
  carregarEstoque();
  prepararFormularioDoacao();
  prepararLoginSimples();
});