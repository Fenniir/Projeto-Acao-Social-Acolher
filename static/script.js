const API_BASE_URL = "/api";
const LIMITE_DESCRICAO = 250;


// FUNÇÕES BÁSICAS --------------------------------------------------------------------------------

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

function pegarDataHoje() {
  let hoje = new Date();
  let ano = hoje.getFullYear();
  let mes = String(hoje.getMonth() + 1).padStart(2, "0");
  let dia = String(hoje.getDate()).padStart(2, "0");

  return ano + "-" + mes + "-" + dia;
}

function mostrarDataAtualNoFormulario() {
  let campo = document.getElementById("dataAtualTexto");

  if (campo) {
    campo.textContent = formatarData(pegarDataHoje());
  }
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

async function apiFetch(caminho, metodo, dados) {
  let opcoes = {
    method: metodo || "GET",
    headers: {
      "Content-Type": "application/json"
    }
  };

  if (dados) {
    opcoes.body = JSON.stringify(dados);
  }

  let resposta = await fetch(API_BASE_URL + caminho, opcoes);

  if (resposta.status === 401) {
    window.location.href = "/login/";
    return;
  }

  if (!resposta.ok) {
    let dadosErro = null;
    try { dadosErro = await resposta.json(); } catch (e) {}
    throw new Error(dadosErro && dadosErro.erro ? dadosErro.erro : "Erro ao conectar com o backend.");
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

  if (status === "Processando") {
    return "text-bg-warning";
  }

  return "text-bg-secondary";
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

// MODAL DE CONFIRMAÇÃO -----------------------------------------------------------------------

function abrirModalConfirmacao(titulo, texto, funcaoConfirmar) {
  let modal = document.getElementById("modalConfirmacaoSistema");

  if (!modal) {
    modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = "modalConfirmacaoSistema";

    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 rounded-4 shadow">
          <div class="modal-header">
            <h5 class="modal-title" id="confirmacaoTitulo">Confirmação</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">
            <p id="confirmacaoTexto" class="mb-0"></p>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
              Cancelar
            </button>

            <button type="button" class="btn btn-primary" id="confirmacaoBotao">
              Confirmar
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  document.getElementById("confirmacaoTitulo").textContent = titulo;
  document.getElementById("confirmacaoTexto").textContent = texto;

  document.getElementById("confirmacaoBotao").onclick = async function () {
    await funcaoConfirmar();
    bootstrap.Modal.getInstance(modal).hide();
  };

  bootstrap.Modal.getOrCreateInstance(modal).show();
}

// REPASSAR ITEM ----------------------------------------------------------------------------------

function abrirModalRepassar(item) {
  let modal = document.getElementById("modalRepassarItem");

  if (!modal) {
    modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = "modalRepassarItem";

    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <form class="modal-content border-0 rounded-4 shadow" id="formRepassarItem">
          <div class="modal-header">
            <h5 class="modal-title">Repassar item</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">
            <input type="hidden" id="repassarId">

            <p>Item: <strong id="repassarNome"></strong></p>
            <p class="text-secondary small">
              Saldo disponível: <strong id="repassarSaldo"></strong>
            </p>

            <label for="repassarQuantidade" class="form-label fw-semibold">
              Quantidade repassada
            </label>

            <input type="number" min="1" id="repassarQuantidade" class="form-control" required>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
              Cancelar
            </button>

            <button type="submit" class="btn btn-success fw-semibold">
              Confirmar repasse
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("formRepassarItem").addEventListener("submit", async function (evento) {
      evento.preventDefault();

      let id = document.getElementById("repassarId").value;
      let quantidade = Number(document.getElementById("repassarQuantidade").value);

      if (quantidade <= 0) {
        mostrarMensagem("Informe uma quantidade válida.", "erro");
        return;
      }

      try {
        await apiFetch("/doacoes/" + id + "/repassar/", "POST", {
          quantidade: quantidade
        });

        bootstrap.Modal.getInstance(modal).hide();
        mostrarMensagem("Repasse registrado com sucesso.");

        carregarEstoque();
        carregarDoacoes();
        carregarPainelInicial();

      } catch (erro) {
        mostrarMensagem(erro.message, "erro");
      }
    });
  }

  document.getElementById("repassarId").value = item.id;
  document.getElementById("repassarNome").textContent = item.doacao_item || "-";
  document.getElementById("repassarSaldo").textContent = item.saldo || 0;
  document.getElementById("repassarQuantidade").value = 1;
  document.getElementById("repassarQuantidade").max = item.saldo || 1;

  bootstrap.Modal.getOrCreateInstance(modal).show();
}

// FORMULÁRIO DE DOAÇÃO -----------------------------------------------------------------------------------

function pegarDadosFormularioDoacao() {
  return {
    doacao_item: document.getElementById("doacaoItem").value.trim(),
    remetente: document.getElementById("remetente").value.trim(),
    quantidade: Number(document.getElementById("quantidade").value),
    cpf_cnpj: document.getElementById("cpfCnpj").value.trim(),
    tipo: document.getElementById("tipo").value,
    descricao: document.getElementById("descricao").value.trim(),
    data: pegarDataHoje()
  };
}

function validarDoacao(doacao) {
  if (doacao.doacao_item === "") {
    return false;
  }

  if (doacao.remetente === "") {
    return false;
  }

  if (doacao.quantidade <= 0) {
    return false;
  }

  if (doacao.tipo === "") {
    return false;
  }

  if (doacao.descricao.length > LIMITE_DESCRICAO) {
    return false;
  }

  return true;
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
      mostrarMensagem("Preencha doação, remetente, quantidade e tipo. A descrição deve ter até 250 caracteres.", "erro");
      return;
    }

    botao.disabled = true;
    botao.textContent = "Registrando...";

    try {
      await apiFetch("/doacoes/", "POST", dados);

      mostrarMensagem("Doação cadastrada com sucesso!");
      formulario.reset();
      document.getElementById("tipo").value = "Outros";

    } catch (erro) {
      mostrarMensagem(erro.message, "erro");

    } finally {
      botao.disabled = false;
      botao.textContent = "Registrar Doação";
    }
  });
}

// TABELA DE DOAÇÕES ----------------------------------------------------------------------

function criarTabelaDoacoes() {
  let tabela = document.createElement("table");
  tabela.className = "table table-hover align-middle mb-0 planilha-table";

  tabela.innerHTML = `
    <thead>
      <tr>
        <th class="col-id">ID</th>
        <th class="col-item">Doação</th>
        <th>Tipo</th>
        <th>Doador</th>
        <th>Quantidade</th>
        <th>Repassado</th>
        <th>Saldo</th>
        <th>Status</th>
        <th>Cadastro</th>
        <th class="col-desc">Descrição</th>
      </tr>
    </thead>

    <tbody id="corpoTabelaDoacoes"></tbody>
  `;

  return tabela;
}

function criarLinhaDoacao(doacao) {
  let linha = document.createElement("tr");
  linha.className = "record-card";

  let busca =
    doacao.id + " " +
    doacao.doacao_item + " " +
    doacao.remetente + " " +
    doacao.cpf_cnpj + " " +
    doacao.status + " " +
    doacao.tipo + " " +
    doacao.descricao;

  linha.setAttribute("data-busca", busca.toLowerCase());
  linha.setAttribute("data-status", doacao.status || "");
  linha.setAttribute("data-tipo", doacao.tipo || "");

  let status = doacao.status || "Sem status";
  let statusClass = classeStatus(status);

  linha.innerHTML = `
    <td class="col-id">#${doacao.id || "-"}</td>

    <td class="col-item">
      ${doacao.doacao_item || "Doação sem nome"}
      <span class="item-subtext">CPF/CNPJ: ${doacao.cpf_cnpj || "-"}</span>
    </td>

    <td>${doacao.tipo || "Outros"}</td>
    <td>${doacao.remetente || "-"}</td>
    <td>${doacao.quantidade || 0}</td>
    <td>${doacao.quantidade_repassada || 0}</td>
    <td>${doacao.saldo || 0}</td>
    <td><span class="badge status-pill ${statusClass}">${status}</span></td>
    <td>${formatarData(doacao.data)}</td>
    <td class="col-desc">${doacao.descricao || "-"}</td>
  `;

  return linha;
}

async function carregarDoacoes() {
  let lista = document.getElementById("acaoSocialEstoqueScrollbar");

  if (!lista) {
    return;
  }

  if (!document.title.includes("Doações") && !document.title.includes("Doação")) {
    return;
  }

  lista.innerHTML = "";

  try {
    let doacoes = await apiFetch("/doacoes/");

    let quantidadeTotal = 0;
    let totalRepasses = 0;

    for (let i = 0; i < doacoes.length; i++) {
      quantidadeTotal += Number(doacoes[i].quantidade || 0);
      totalRepasses += Number(doacoes[i].quantidade_repassada || 0);
    }

    atualizarTexto("totalDoacoes", doacoes.length);
    atualizarTexto("quantidadeDoada", quantidadeTotal);
    atualizarTexto("totalRepasses", totalRepasses);

    if (doacoes.length === 0) {
      atualizarTexto("ultimaDoacao", "-");
      lista.appendChild(criarEstadoVazio("Nenhuma doação registrada ainda."));
      return;
    }

    atualizarTexto("ultimaDoacao", doacoes[0].doacao_item || "-");

    let tabela = criarTabelaDoacoes();
    lista.appendChild(tabela);

    let corpo = document.getElementById("corpoTabelaDoacoes");

    for (let i = 0; i < doacoes.length; i++) {
      corpo.appendChild(criarLinhaDoacao(doacoes[i]));
    }

    ativarBusca();

  } catch (erro) {
    lista.appendChild(criarEstadoVazio("Não foi possível carregar as doações."));
  }
}

// MODAL DE EDIÇÃO DO ESTOQUE --------------------------------------------------------------------

function abrirModalEdicaoDoacao(doacao) {
  let modal = document.getElementById("modalEditarDoacao");

  if (!modal) {
    modal = criarModalEdicaoDoacao();
    document.body.appendChild(modal);
    configurarFormularioEdicao(modal);
  }

  document.getElementById("editarDoacaoId").value = doacao.id;
  document.getElementById("editarDoacaoItem").value = doacao.doacao_item || "";
  document.getElementById("editarRemetente").value = doacao.remetente || "";
  document.getElementById("editarQuantidade").value = doacao.quantidade || 1;
  document.getElementById("editarCpfCnpj").value = doacao.cpf_cnpj || "";
  document.getElementById("editarTipo").value = doacao.tipo || "Outros";
  document.getElementById("editarDescricao").value = doacao.descricao || "";

  bootstrap.Modal.getOrCreateInstance(modal).show();
}

function criarModalEdicaoDoacao() {
  let modal = document.createElement("div");
  modal.className = "modal fade";
  modal.id = "modalEditarDoacao";

  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <form class="modal-content border-0 rounded-4 shadow" id="formEditarDoacao">

        <div class="modal-header">
          <h5 class="modal-title">Editar item do estoque</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <input type="hidden" id="editarDoacaoId">

          <div class="mb-3">
            <label class="form-label fw-semibold">Doação</label>
            <input class="form-control" id="editarDoacaoItem" required>
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold">Remetente</label>
            <input class="form-control" id="editarRemetente" required>
          </div>

          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label fw-semibold">Quantidade</label>
              <input class="form-control" id="editarQuantidade" type="number" min="1" required>
            </div>

            <div class="col-md-6">
              <label class="form-label fw-semibold">CPF/CNPJ</label>
              <input class="form-control" id="editarCpfCnpj">
            </div>

            <div class="col-md-6">
              <label class="form-label fw-semibold">Tipo</label>
              <select class="form-select" id="editarTipo" required>
                <option value="Alimento">Alimento</option>
                <option value="Roupa">Roupa</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div class="col-12">
              <label class="form-label fw-semibold">Descrição</label>
              <textarea class="form-control" id="editarDescricao" rows="3" maxlength="250"></textarea>
              <small class="text-secondary">Máximo de 250 caracteres.</small>
            </div>
          </div>

          <p class="text-secondary small mt-3 mb-0">
            O status muda sozinho de acordo com os repasses.
          </p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
            Cancelar
          </button>

          <button type="submit" class="btn btn-primary fw-semibold">
            Salvar alterações
          </button>
        </div>

      </form>
    </div>
  `;

  return modal;
}

function configurarFormularioEdicao(modal) {
  let formulario = document.getElementById("formEditarDoacao");

  formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    let id = document.getElementById("editarDoacaoId").value;

    let dados = {
      doacao_item: document.getElementById("editarDoacaoItem").value.trim(),
      remetente: document.getElementById("editarRemetente").value.trim(),
      quantidade: Number(document.getElementById("editarQuantidade").value),
      cpf_cnpj: document.getElementById("editarCpfCnpj").value.trim(),
      tipo: document.getElementById("editarTipo").value,
      descricao: document.getElementById("editarDescricao").value.trim()
    };

    if (!validarDoacao(dados)) {
      mostrarMensagem("Preencha todos os campos obrigatórios.", "erro");
      return;
    }

    try {
      await apiFetch("/doacoes/" + id + "/", "PATCH", dados);

      bootstrap.Modal.getInstance(modal).hide();

      mostrarMensagem("Item editado com sucesso.");

      carregarEstoque();
      carregarDoacoes();
      carregarPainelInicial();

    } catch (erro) {
      mostrarMensagem(erro.message, "erro");
    }
  });
}

// TABELA DE ESTOQUE -------------------------------------------------------------------------------

function criarTabelaEstoque() {
  let tabela = document.createElement("table");
  tabela.className = "table table-hover align-middle mb-0 planilha-table";

  tabela.innerHTML = `
    <thead>
      <tr>
        <th class="col-id">ID</th>
        <th class="col-item">Item</th>
        <th>Tipo</th>
        <th>Doador</th>
        <th>Qtd.</th>
        <th>Repassado</th>
        <th>Saldo</th>
        <th>Status</th>
        <th>Data</th>
        <th class="col-desc">Descrição</th>
        <th class="col-actions">Ações</th>
      </tr>
    </thead>

    <tbody id="corpoTabelaEstoque"></tbody>
  `;

  return tabela;
}

function criarLinhaEstoque(item) {
  let linha = document.createElement("tr");
  linha.className = "record-card";

  let busca =
    item.id + " " +
    item.doacao_item + " " +
    item.remetente + " " +
    item.cpf_cnpj + " " +
    item.status + " " +
    item.tipo + " " +
    item.descricao;

  linha.setAttribute("data-busca", busca.toLowerCase());
  linha.setAttribute("data-status", item.status || "");
  linha.setAttribute("data-tipo", item.tipo || "");

  let status = item.status || "Sem status";
  let statusClass = classeStatus(status);

  linha.innerHTML = `
    <td class="col-id">#${item.id || "-"}</td>

    <td class="col-item">
      ${item.doacao_item || "Item sem nome"}
      <span class="item-subtext">CPF/CNPJ: ${item.cpf_cnpj || "-"}</span>
    </td>

    <td>${item.tipo || "Outros"}</td>
    <td>${item.remetente || "-"}</td>
    <td>${item.quantidade || 0}</td>
    <td>${item.quantidade_repassada || 0}</td>
    <td><strong>${item.saldo || 0}</strong></td>
    <td><span class="badge status-pill ${statusClass}">${status}</span></td>
    <td>${formatarData(item.data)}</td>
    <td class="col-desc">${item.descricao || "-"}</td>

    <td class="col-actions">
      <button class="btn btn-outline-primary btn-table btn-editar-estoque" type="button">Editar</button>
      <button class="btn btn-outline-success btn-table btn-repassar-estoque" type="button">Repassar</button>
      <button class="btn btn-outline-danger btn-table btn-apagar-estoque" type="button">Excluir</button>
    </td>
  `;

  linha.querySelector(".btn-editar-estoque").onclick = function () {
    abrirModalEdicaoDoacao(item);
  };

  linha.querySelector(".btn-repassar-estoque").onclick = function () {
    abrirModalRepassar(item);
  };

  linha.querySelector(".btn-apagar-estoque").onclick = function () {
    abrirModalConfirmacao(
      "Excluir item",
      "Tem certeza que deseja excluir este item? Use apenas quando o cadastro estiver errado.",
      async function () {
        await apiFetch("/doacoes/" + item.id + "/", "DELETE");
        mostrarMensagem("Item excluído com sucesso.");
        carregarEstoque();
        carregarDoacoes();
        carregarPainelInicial();
      }
    );
  };

  return linha;
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
    let totalProcessando = 0;
    let saldoGeral = 0;

    for (let i = 0; i < itens.length; i++) {
      let saldo = Number(itens[i].saldo || 0);
      saldoGeral += saldo;

      if (itens[i].status === "Recebido") {
        totalRecebido += saldo;
      }

      if (itens[i].status === "Processando") {
        totalProcessando += saldo;
      }
    }

    atualizarTexto("totalItens", saldoGeral);
    atualizarTexto("totalRecebido", totalRecebido);
    atualizarTexto("totalProcessando", totalProcessando);

    if (itens.length === 0) {
      lista.appendChild(criarEstadoVazio("Estoque vazio."));
      return;
    }

    let tabela = criarTabelaEstoque();
    lista.appendChild(tabela);

    let corpo = document.getElementById("corpoTabelaEstoque");

    for (let i = 0; i < itens.length; i++) {
      corpo.appendChild(criarLinhaEstoque(itens[i]));
    }

    ativarBusca();

  } catch (erro) {
    lista.appendChild(criarEstadoVazio("Não foi possível carregar o estoque."));
  }
}

// BUSCA E FILTROS -------------------------------------------------------------------------

function ativarBusca() {
  let campoBusca = document.getElementById("buscaItens");
  let filtroStatus = document.getElementById("filtroStatus");
  let filtroTipo = document.getElementById("filtroTipo");
  let lista = document.getElementById("acaoSocialEstoqueScrollbar");

  if (!lista) {
    return;
  }

  function filtrarTabela() {
    let termo = "";
    let status = "";
    let tipo = "";

    if (campoBusca) {
      termo = campoBusca.value.trim().toLowerCase();
    }

    if (filtroStatus) {
      status = filtroStatus.value;
    }

    if (filtroTipo) {
      tipo = filtroTipo.value;
    }

    let linhas = lista.querySelectorAll(".record-card");

    for (let i = 0; i < linhas.length; i++) {
      let linha = linhas[i];

      let buscaLinha = linha.getAttribute("data-busca");
      let statusLinha = linha.getAttribute("data-status");
      let tipoLinha = linha.getAttribute("data-tipo");

      let passouBusca = buscaLinha.includes(termo);
      let passouStatus = status === "" || statusLinha === status;
      let passouTipo = tipo === "" || tipoLinha === tipo;

      if (passouBusca && passouStatus && passouTipo) {
        linha.style.display = "";
      } else {
        linha.style.display = "none";
      }
    }
  }

  if (campoBusca) {
    campoBusca.oninput = filtrarTabela;
  }

  if (filtroStatus) {
    filtroStatus.onchange = filtrarTabela;
  }

  if (filtroTipo) {
    filtroTipo.onchange = filtrarTabela;
  }
}

// PAINEL INICIAL ------------------------------------------------------------------------------

function criarLinhaPainel(doacao) {
  let linha = document.createElement("div");
  linha.className = "compact-row";

  let status = doacao.status || "Sem status";
  let statusClass = classeStatus(status);

  linha.innerHTML = `
    <div class="compact-main">
      <strong>${doacao.doacao_item || "Doação sem nome"}</strong>
      <span>${doacao.remetente || "-"} · ${doacao.tipo || "Outros"}</span>
    </div>

    <div class="compact-meta">${formatarData(doacao.data)}</div>
    <span class="badge status-pill ${statusClass}">${status}</span>
  `;

  return linha;
}

async function carregarPainelInicial() {
  let lista = document.getElementById("painelUltimasDoacoes");

  if (!lista) {
    return;
  }

  lista.innerHTML = "";

  try {
    let doacoes = await apiFetch("/doacoes/");
    let estoque = await apiFetch("/estoque/");

    let totalRepasses = 0;

    for (let i = 0; i < doacoes.length; i++) {
      totalRepasses += Number(doacoes[i].quantidade_repassada || 0);
    }

    let itensEstoque = 0;
    let totalRecebidos = 0;
    let totalProcessando = 0;

    for (let i = 0; i < estoque.length; i++) {
      let saldo = Number(estoque[i].saldo || 0);
      itensEstoque += saldo;

      if (estoque[i].status === "Recebido") {
        totalRecebidos += saldo;
      }

      if (estoque[i].status === "Processando") {
        totalProcessando += saldo;
      }
    }

    atualizarTexto("painelTotalDoacoes", doacoes.length);
    atualizarTexto("painelItensEstoque", itensEstoque);
    atualizarTexto("painelTotalRepasses", totalRepasses);
    atualizarTexto("painelRecebidos", totalRecebidos);
    atualizarTexto("painelProcessando", totalProcessando);

    if (doacoes.length === 0) {
      atualizarTexto("painelUltimaDoacao", "-");
      lista.appendChild(criarEstadoVazio("Nenhuma doação registrada ainda."));
      return;
    }

    atualizarTexto("painelUltimaDoacao", doacoes[0].doacao_item || "-");

    let limite = 6;

    if (doacoes.length < 6) {
      limite = doacoes.length;
    }

    for (let i = 0; i < limite; i++) {
      lista.appendChild(criarLinhaPainel(doacoes[i]));
    }

  } catch (erro) {
    lista.appendChild(criarEstadoVazio("Não foi possível carregar o painel inicial."));
  }
}

// ACESSIBILIDADE ------------------------------------------------------------------------------

function aplicarPreferenciasAcessibilidade() {
  let tema = localStorage.getItem("temaAcolher") || "claro";
  let fonte = localStorage.getItem("fonteAcolher") || "normal";

  document.body.classList.remove("tema-escuro");
  document.body.classList.remove("fonte-maior");
  document.body.classList.remove("fonte-extra");

  if (tema === "escuro") {
    document.body.classList.add("tema-escuro");
  }

  if (fonte === "maior") {
    document.body.classList.add("fonte-maior");
  }

  if (fonte === "extra") {
    document.body.classList.add("fonte-extra");
  }
}

function atualizarBotoesAcessibilidade() {
  let tema = localStorage.getItem("temaAcolher") || "claro";
  let fonte = localStorage.getItem("fonteAcolher") || "normal";

  let botaoTema = document.getElementById("acessibilidadeTema");

  if (botaoTema) {
    if (tema === "escuro") {
      botaoTema.textContent = "Tema claro";
    } else {
      botaoTema.textContent = "Tema escuro";
    }
  }

  let botoesFonte = document.querySelectorAll("[data-fonte]");

  for (let i = 0; i < botoesFonte.length; i++) {
    let botao = botoesFonte[i];

    if (botao.getAttribute("data-fonte") === fonte) {
      botao.classList.add("ativo");
    } else {
      botao.classList.remove("ativo");
    }
  }
}

function criarAcessibilidade() {
  if (document.getElementById("acessibilidadeBox")) {
    return;
  }

  let caixa = document.createElement("div");
  caixa.id = "acessibilidadeBox";
  caixa.className = "acessibilidade-box";

  caixa.innerHTML = `
    <div class="acessibilidade-titulo">Acessibilidade</div>

    <button type="button" id="acessibilidadeTema">Tema escuro</button>

    <div class="acessibilidade-botoes">
      <button type="button" data-fonte="normal">A</button>
      <button type="button" data-fonte="maior">A+</button>
      <button type="button" data-fonte="extra">A++</button>
    </div>
  `;

  let menuLateral = document.querySelector(".app-sidebar");

  if (menuLateral) {
    menuLateral.appendChild(caixa);
  } else {
    document.body.appendChild(caixa);
  }

  document.getElementById("acessibilidadeTema").onclick = function () {
    let temaAtual = localStorage.getItem("temaAcolher") || "claro";

    if (temaAtual === "escuro") {
      localStorage.setItem("temaAcolher", "claro");
    } else {
      localStorage.setItem("temaAcolher", "escuro");
    }

    aplicarPreferenciasAcessibilidade();
    atualizarBotoesAcessibilidade();
  };

  let botoesFonte = document.querySelectorAll("[data-fonte]");

  for (let i = 0; i < botoesFonte.length; i++) {
    botoesFonte[i].onclick = function () {
      localStorage.setItem("fonteAcolher", this.getAttribute("data-fonte"));
      aplicarPreferenciasAcessibilidade();
      atualizarBotoesAcessibilidade();
    };
  }

  aplicarPreferenciasAcessibilidade();
  atualizarBotoesAcessibilidade();
}

// LOGIN ------------------------------------------------------------------------------------

function prepararLoginSimples() {
  let formulario = document.querySelector("#loginBody form");

  if (!formulario) {
    return;
  }

  formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    let usuario = document.getElementById("loginUsuario").value.trim();
    let senha = document.getElementById("loginUsuarioSenha").value.trim();
    let mensagem = document.getElementById("loginMensagem");

    if (!usuario || !senha) {
      mensagem.textContent = "Preencha usuário e senha.";
      mensagem.className = "text-danger text-center fw-semibold mt-3 mb-0";
      return;
    }

    try {
      await apiFetch("/login/", "POST", { usuario: usuario, senha: senha });

      mensagem.textContent = "Login feito com sucesso.";
      mensagem.className = "text-success text-center fw-semibold mt-3 mb-0";

      setTimeout(function () {
        window.location.href = "/";
      }, 700);

    } catch (erro) {
      mensagem.textContent = "Usuário ou senha incorretos.";
      mensagem.className = "text-danger text-center fw-semibold mt-3 mb-0";
    }
  });
}

// INICIALIZAÇÃO ---------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
  aplicarPreferenciasAcessibilidade();
  criarAcessibilidade();
  mostrarDataAtualNoFormulario();

  carregarPainelInicial();
  carregarDoacoes();
  carregarEstoque();

  prepararFormularioDoacao();
  prepararLoginSimples();
});