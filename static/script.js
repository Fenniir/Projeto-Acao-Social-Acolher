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

  let dados = null;

  try {
    dados = await resposta.json();
  } catch (erro) {
    dados = null;
  }

  if (!resposta.ok) {
    if (dados && dados.erro) {
      throw new Error(dados.erro);
    }

    throw new Error("Erro ao conectar com o backend.");
  }

  return dados;
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

// MODAL DE CONFIRMAÇÃO DO SISTEMA ---------------------------------------------------------

function abrirModalConfirmacao(titulo, texto, funcaoConfirmar) {
  let modal = document.getElementById("modalConfirmacaoSistema");

  if (!modal) {
    modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = "modalConfirmacaoSistema";
    modal.tabIndex = -1;

    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 rounded-4 shadow">
          <div class="modal-header">
            <h5 class="modal-title" id="confirmacaoTitulo">Confirmação</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
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

  let botao = document.getElementById("confirmacaoBotao");

  botao.onclick = async function () {
    await funcaoConfirmar();
    bootstrap.Modal.getInstance(modal).hide();
  };

  bootstrap.Modal.getOrCreateInstance(modal).show();
}

function abrirModalRepassar(item) {
  let modal = document.getElementById("modalRepassarItem");

  if (!modal) {
    modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = "modalRepassarItem";
    modal.tabIndex = -1;

    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <form class="modal-content border-0 rounded-4 shadow" id="formRepassarItem">
          <div class="modal-header">
            <h5 class="modal-title">
              Repassar item
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>

          <div class="modal-body">
            <input type="hidden" id="repassarId">

            <p class="mb-2">
              Item: <strong id="repassarNome"></strong>
            </p>

            <p class="text-secondary small mb-3">
              Saldo disponível: <strong id="repassarSaldo"></strong>
            </p>

            <label for="repassarQuantidade" class="form-label fw-semibold">
              Quantidade que será repassada
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

      if (!quantidade || quantidade <= 0) {
        mostrarMensagem("Informe uma quantidade válida.", "erro");
        return;
      }

      try {
        await apiFetch("/doacoes/" + id + "/repassar/", {
          method: "POST",
          body: JSON.stringify({
            quantidade: quantidade
          })
        });

        bootstrap.Modal.getInstance(modal).hide();
        mostrarMensagem("Repasse registrado com sucesso.");
        carregarEstoque();
        carregarDoacoes();

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

// DOAÇÕES ----------------------------------------------------------------------

function pegarDadosFormularioDoacao() {
  return {
    doacao_item: document.getElementById("doacaoItem").value.trim(),
    remetente: document.getElementById("remetente").value.trim(),
    quantidade: Number(document.getElementById("quantidade").value),
    cpf_cnpj: document.getElementById("cpfCnpj").value.trim(),
    tipo: document.getElementById("tipo").value,
    descricao: document.getElementById("descricao").value.trim(),
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

  if (!doacao.tipo) {
    return false;
  }

  if (!doacao.data) {
    return false;
  }

  return true;
}

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

function criarCardDoacao(doacao) {
  let linha = document.createElement("tr");
  linha.className = "record-card";

  linha.dataset.busca = (
    doacao.id + " " +
    doacao.doacao_item + " " +
    doacao.remetente + " " +
    doacao.cpf_cnpj + " " +
    doacao.status + " " +
    doacao.tipo + " " +
    doacao.descricao
  ).toLowerCase();

  linha.dataset.status = doacao.status || "";
  linha.dataset.tipo = doacao.tipo || "";

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

    atualizarTexto("totalDoacoes", doacoes.length);

    let quantidadeTotal = 0;
    let totalRepasses = 0;

    for (let i = 0; i < doacoes.length; i++) {
      quantidadeTotal += Number(doacoes[i].quantidade || 0);
      totalRepasses += Number(doacoes[i].quantidade_repassada || 0);
    }

    atualizarTexto("quantidadeDoada", quantidadeTotal);
    atualizarTexto("totalRepasses", totalRepasses);

    if (doacoes.length === 0) {
      atualizarTexto("ultimaDoacao", "-");
      atualizarTexto("totalRepasses", 0);
      lista.appendChild(criarEstadoVazio("Nenhuma doação registrada ainda."));
      return;
    }

    let ultimaDoacao = doacoes[0];

    atualizarTexto("ultimaDoacao", ultimaDoacao.doacao_item || "-");

    let tabela = criarTabelaDoacoes();
    lista.appendChild(tabela);

    let corpo = document.getElementById("corpoTabelaDoacoes");

    for (let i = 0; i < doacoes.length; i++) {
      corpo.appendChild(criarCardDoacao(doacoes[i]));
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
      mostrarMensagem("Preencha doação, remetente, quantidade, tipo e data.", "erro");
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
      document.getElementById("tipo").value = "Outros";

    } catch (erro) {
      mostrarMensagem(erro.message, "erro");

    } finally {
      botao.disabled = false;
      botao.textContent = "Registrar Doação";
    }
  });
}

// MODAL DE EDIÇÃO DO ESTOQUE -------------------------------------------------------------

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
            Editar item do estoque
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
              <label class="form-label fw-semibold" for="editarTipo">
                Tipo de doação
              </label>

              <select class="form-select" id="editarTipo" required>
                <option value="Alimento">Alimento</option>
                <option value="Roupa">Roupa</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label fw-semibold" for="editarData">
                Data
              </label>

              <input class="form-control" id="editarData" type="date" required>
            </div>

            <div class="col-12">
              <label class="form-label fw-semibold" for="editarDescricao">
                Descrição
              </label>

              <textarea class="form-control" id="editarDescricao" rows="3"></textarea>
            </div>

          </div>

          <p class="text-secondary small mt-3 mb-0">
            O status não é editado manualmente. Ele muda sozinho quando houver repasse.
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

function preencherModalEdicao(doacao) {
  document.getElementById("editarDoacaoId").value = doacao.id;
  document.getElementById("editarDoacaoItem").value = doacao.doacao_item || "";
  document.getElementById("editarRemetente").value = doacao.remetente || "";
  document.getElementById("editarQuantidade").value = doacao.quantidade || 1;
  document.getElementById("editarCpfCnpj").value = doacao.cpf_cnpj || "";
  document.getElementById("editarTipo").value = doacao.tipo || "Outros";
  document.getElementById("editarDescricao").value = doacao.descricao || "";
  document.getElementById("editarData").value = normalizarDataInput(doacao.data);
}

function pegarDadosModalEdicao() {
  return {
    doacao_item: document.getElementById("editarDoacaoItem").value.trim(),
    remetente: document.getElementById("editarRemetente").value.trim(),
    quantidade: Number(document.getElementById("editarQuantidade").value),
    cpf_cnpj: document.getElementById("editarCpfCnpj").value.trim(),
    tipo: document.getElementById("editarTipo").value,
    descricao: document.getElementById("editarDescricao").value.trim(),
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

      mostrarMensagem("Item do estoque editado com sucesso.");

      carregarDoacoes();
      carregarEstoque();

    } catch (erro) {
      mostrarMensagem(erro.message, "erro");
    }
  });
}

// ESTOQUE ----------------------------------------------------------------------

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

function criarCardEstoque(item) {
  let linha = document.createElement("tr");
  linha.className = "record-card";

  linha.dataset.busca = (
    item.id + " " +
    item.doacao_item + " " +
    item.remetente + " " +
    item.cpf_cnpj + " " +
    item.status + " " +
    item.tipo + " " +
    item.descricao
  ).toLowerCase();

  linha.dataset.status = item.status || "";
  linha.dataset.tipo = item.tipo || "";

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

  let botaoEditar = linha.querySelector(".btn-editar-estoque");
  let botaoRepassar = linha.querySelector(".btn-repassar-estoque");
  let botaoApagar = linha.querySelector(".btn-apagar-estoque");

  botaoEditar.addEventListener("click", function () {
    abrirModalEdicaoDoacao(item);
  });

  botaoRepassar.addEventListener("click", function () {
    abrirModalRepassar(item);
  });

  botaoApagar.addEventListener("click", function () {
    abrirModalConfirmacao(
      "Excluir item",
      "Tem certeza que deseja excluir este item? Use apenas quando o cadastro estiver errado.",
      async function () {
        try {
          await apiFetch("/doacoes/" + item.id + "/", {
            method: "DELETE"
          });

          mostrarMensagem("Item excluído com sucesso.");
          carregarEstoque();
          carregarDoacoes();

        } catch (erro) {
          mostrarMensagem(erro.message, "erro");
        }
      }
    );
  });

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
      if (itens[i].status === "Recebido") {
        totalRecebido += Number(itens[i].saldo || 0);
      }

      if (itens[i].status === "Processando") {
        totalProcessando += Number(itens[i].saldo || 0);
      }

      saldoGeral += Number(itens[i].saldo || 0);
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
      corpo.appendChild(criarCardEstoque(itens[i]));
    }

    ativarBusca();

  } catch (erro) {
    lista.appendChild(
      criarEstadoVazio("Não foi possível carregar o estoque. Verifique se o Django está rodando.")
    );
  }
}

// BUSCA// BUSCA ----------------------------------------------------------------------

function ativarBusca() {
  let campoBusca = document.getElementById("buscaItens");
  let filtroStatus = document.getElementById("filtroStatus");
  let filtroTipo = document.getElementById("filtroTipo");
  let lista = document.getElementById("acaoSocialEstoqueScrollbar");

  if (!lista) {
    return;
  }

  function filtrarTabela() {
    let termo = campoBusca ? campoBusca.value.trim().toLowerCase() : "";
    let status = filtroStatus ? filtroStatus.value : "";
    let tipo = filtroTipo ? filtroTipo.value : "";

    let linhas = lista.querySelectorAll(".record-card");

    for (let i = 0; i < linhas.length; i++) {
      let linha = linhas[i];
      let bateBusca = linha.dataset.busca.includes(termo);
      let bateStatus = !status || linha.dataset.status === status;
      let bateTipo = !tipo || linha.dataset.tipo === tipo;

      if (bateBusca && bateStatus && bateTipo) {
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


// PAINEL INICIAL ----------------------------------------------------------------------

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

    let limite = doacoes.length;

    if (limite > 6) {
      limite = 6;
    }

    for (let i = 0; i < limite; i++) {
      lista.appendChild(criarLinhaPainel(doacoes[i]));
    }

  } catch (erro) {
    lista.appendChild(criarEstadoVazio("Não foi possível carregar o painel inicial."));
  }
}



// ACESSIBILIDADE -------------------------------------------------------------

function aplicarPreferenciasAcessibilidade() {
  let tema = localStorage.getItem("temaAcolher") || "claro";
  let fonte = localStorage.getItem("fonteAcolher") || "normal";

  document.body.classList.remove("tema-escuro", "fonte-maior", "fonte-extra");

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
    botaoTema.classList.toggle("ativo", tema === "escuro");
    botaoTema.textContent = tema === "escuro" ? "Tema claro" : "Tema escuro";
  }

  document.querySelectorAll("[data-fonte]").forEach(function (botao) {
    botao.classList.toggle("ativo", botao.dataset.fonte === fonte);
  });
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

    <div class="acessibilidade-botoes" aria-label="Tamanho da fonte">
      <button type="button" data-fonte="normal">A</button>
      <button type="button" data-fonte="maior">A+</button>
      <button type="button" data-fonte="extra">A++</button>
    </div>
  `;

  let menuLateral = document.querySelector(".app-sidebar");
  let botaoLogin = document.querySelector(".sidebar-login");

  if (menuLateral && botaoLogin) {
    menuLateral.insertBefore(caixa, botaoLogin);
  } else {
    caixa.classList.add("login-acessibilidade");
    document.body.appendChild(caixa);
  }

  document.getElementById("acessibilidadeTema").addEventListener("click", function () {
    let temaAtual = localStorage.getItem("temaAcolher") || "claro";

    if (temaAtual === "escuro") {
      localStorage.setItem("temaAcolher", "claro");
    } else {
      localStorage.setItem("temaAcolher", "escuro");
    }

    aplicarPreferenciasAcessibilidade();
    atualizarBotoesAcessibilidade();
  });

  document.querySelectorAll("[data-fonte]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      localStorage.setItem("fonteAcolher", botao.dataset.fonte);
      aplicarPreferenciasAcessibilidade();
      atualizarBotoesAcessibilidade();
    });
  });

  aplicarPreferenciasAcessibilidade();
  atualizarBotoesAcessibilidade();
}

// LOGIN SIMPLES// LOGIN SIMPLES ----------------------------------------------------------------------

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
      window.location.href = "/";
    }, 700);
  });
}

// INICIALIZAÇÃO ----------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
  aplicarPreferenciasAcessibilidade();
  criarAcessibilidade();
  carregarPainelInicial();
  carregarDoacoes();
  carregarEstoque();
  prepararFormularioDoacao();
  prepararLoginSimples();
});
