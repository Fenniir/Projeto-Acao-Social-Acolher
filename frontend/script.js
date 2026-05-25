const API_BASE_URL = "http://127.0.0.1:8000/api";

function formatarData(data) {
  if (!data) return "-";
  const partes = String(data).split("-");
  if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
  return data;
}

function mostrarMensagem(texto, tipo = "info") {
  let msg = document.getElementById("mensagemSistema");
  if (!msg) {
    msg = document.createElement("p");
    msg.id = "mensagemSistema";
    msg.style.textAlign = "center";
    msg.style.fontSize = "20px";
    msg.style.color = tipo === "erro" ? "#b00020" : "#0b5";
    document.body.appendChild(msg);
  }
  msg.textContent = texto;
}

async function apiFetch(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
    headers: { "Content-Type": "application/json", ...(opcoes.headers || {}) },
    ...opcoes,
  });

  let dados = null;
  try { dados = await resposta.json(); } catch (_) {}

  if (!resposta.ok) {
    throw new Error(dados?.erro || dados?.detail || "Erro ao conectar com o backend.");
  }
  return dados;
}

function criarLinha(texto, id = null) {
  const div = document.createElement("div");
  div.className = "itemInformacaoDivTemplate";
  div.style.top = "0";

  const p = document.createElement("p");
  p.className = "itemInformacaoDivTemplateP";
  p.textContent = texto;
  div.appendChild(p);

  if (id) {
    const btn = document.createElement("button");
    btn.className = "itemInformacaoDivTemplateEditar";
    btn.title = "Apagar registro";
    btn.textContent = "X";
    btn.style.color = "white";
    btn.style.fontWeight = "bold";
    btn.addEventListener("click", async () => {
      if (!confirm("Apagar esta doação?")) return;
      try {
        await apiFetch(`/doacoes/${id}/`, { method: "DELETE" });
        div.remove();
        mostrarMensagem("Registro apagado com sucesso.");
      } catch (erro) {
        mostrarMensagem(erro.message, "erro");
      }
    });
    div.appendChild(btn);
  }
  return div;
}

async function carregarDoacoes() {
  const lista = document.getElementById("acaoSocialEstoqueScrollbar");
  if (!lista || !document.title.includes("Doação")) return;
  lista.innerHTML = "";

  try {
    const doacoes = await apiFetch("/doacoes/");
    if (!doacoes.length) {
      lista.appendChild(criarLinha("Nenhuma doação registrada ainda."));
      return;
    }

    doacoes.forEach((d) => {
      lista.appendChild(criarLinha(
        `| ${d.doacao_item} | Remetente: ${d.remetente} | QTD: ${d.quantidade} | CPF/CNPJ: ${d.cpf_cnpj || "-"} | Status: ${d.status} | Data: ${formatarData(d.data)} |`,
        d.id
      ));
    });
  } catch (erro) {
    lista.appendChild(criarLinha("Não foi possível carregar as doações. Verifique se o Django está rodando."));
  }
}

async function carregarEstoque() {
  const lista = document.getElementById("acaoSocialEstoqueScrollbar");
  if (!lista || !document.title.includes("Estoque")) return;
  lista.innerHTML = "";

  try {
    const itens = await apiFetch("/estoque/");
    if (!itens.length) {
      lista.appendChild(criarLinha("Estoque vazio."));
      return;
    }

    itens.forEach((item) => {
      lista.appendChild(criarLinha(
        `| Item: ${item.doacao_item} | Recebido: ${item.recebido} | Repassado: ${item.repassado} | Processado: ${item.processado} | Saldo: ${item.saldo} |`
      ));
    });
  } catch (erro) {
    lista.appendChild(criarLinha("Não foi possível carregar o estoque. Verifique se o Django está rodando."));
  }
}

function prepararFormularioDoacao() {
  const botao = document.getElementById("registrarDoacaoBotao");
  if (!botao) return;

  const dataInput = document.getElementById("data");
  if (dataInput) dataInput.type = "date";

  botao.addEventListener("click", async (evento) => {
    evento.preventDefault();

    const dados = {
      doacao_item: document.getElementById("doacaoItem").value.trim(),
      remetente: document.getElementById("remetente").value.trim(),
      quantidade: Number(document.getElementById("quantidade").value),
      cpf_cnpj: document.getElementById("cpfCnpj").value.trim(),
      status: document.getElementById("status").value,
      data: document.getElementById("data").value,
    };

    if (!dados.doacao_item || !dados.remetente || !dados.quantidade || dados.status === "null" || !dados.data) {
      mostrarMensagem("Preencha doação, remetente, quantidade, status e data.", "erro");
      return;
    }

    try {
      await apiFetch("/doacoes/", { method: "POST", body: JSON.stringify(dados) });
      mostrarMensagem("Doação registrada com sucesso.");
      document.querySelectorAll("input").forEach((input) => input.value = "");
      document.getElementById("status").value = "null";
    } catch (erro) {
      mostrarMensagem(erro.message, "erro");
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
      return;
    }
    localStorage.setItem("usuarioLogado", email);
    msg.textContent = "Login feito com sucesso.";
    setTimeout(() => window.location.href = "index.html", 700);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  carregarDoacoes();
  carregarEstoque();
  prepararFormularioDoacao();
  prepararLoginSimples();
});
