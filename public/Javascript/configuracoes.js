import {
  toggleMenuLateral,
  toggleModoEscuro,
  mostrarNotificacao,
  debounce,
  carregarPerfilUsuario,
  authUtils,
} from "./utils.js";

// ===== CONSTANTES =====
const btnSair = document.getElementById("btnSair");

const CONFIG = {
  LOCAL_STORAGE_KEYS: {
    MODO_ESCURO: "darkMode",
    MENU_ABERTO: "menuAberto",
    CONFIG_PREFERENCES: "configPreferences",
  },
};

// ===== ELEMENTOS DO DOM =====
let elementos = {
  menuToggle: null,
  barraLateral: null,
  overlay: null,
  darkModeToggle: null,
  langSelect: null,
  notifyToggle: null,
  savePrefsBtn: null,
  editButtons: null,
  deleteButtons: null,
};

// ===== ESTADO DA APLICAÇÃO =====
let estado = {
  menuAberto: true,
  modoEscuroAtivo: false,
  preferencias: {
    idioma: "pt",
    notificacoes: true,
  },
};

// ===== INICIALIZAÇÃO =====
document.addEventListener("DOMContentLoaded", function () {
  inicializarElementos();
  criarOverlay();
  carregarPreferencias();
  carregarConfiguracoes();
  inicializarAplicacao();
  carregarPerfilUsuario();
});

function inicializarElementos() {
  elementos = {
    menuToggle: document.getElementById("menuToggle"),
    barraLateral: document.querySelector(".barra-lateral"),
    darkModeToggle: document.getElementById("dark-mode-toggle"),
    langSelect: document.getElementById("lang"),
    notifyToggle: document.getElementById("notify"),
    savePrefsBtn: document.querySelector(".action-btn"),
    editButtons: document.querySelectorAll(
      ".tabela-configuracoes .botao-acao:nth-of-type(1)"
    ),
    deleteButtons: document.querySelectorAll(
      ".tabela-configuracoes .botao-acao:nth-of-type(2)"
    ),
  };
}

function criarOverlay() {
  elementos.overlay = document.createElement("div");
  elementos.overlay.className = "overlay";
  document.body.appendChild(elementos.overlay);

  elementos.overlay.addEventListener("click", function () {
    if (estado.menuAberto && window.innerWidth < 992) {
      estado.menuAberto = toggleMenuLateral(
        elementos.barraLateral,
        elementos.menuToggle,
        elementos.overlay,
        estado.menuAberto
      );
    }
  });
}

function carregarPreferencias() {
  const darkModeSalvo = localStorage.getItem(
    CONFIG.LOCAL_STORAGE_KEYS.MODO_ESCURO
  );
  estado.modoEscuroAtivo = darkModeSalvo === "true";

  if (estado.modoEscuroAtivo) {
    document.body.classList.add("dark-mode");
    if (elementos.darkModeToggle) elementos.darkModeToggle.checked = true;
  }

  const menuAbertoSalvo = localStorage.getItem(
    CONFIG.LOCAL_STORAGE_KEYS.MENU_ABERTO
  );
  if (menuAbertoSalvo !== null && window.innerWidth < 992) {
    estado.menuAberto = menuAbertoSalvo === "true";
    if (!estado.menuAberto) {
      elementos.barraLateral.style.transform = "translateX(-100%)";
      elementos.menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    } else {
      elementos.barraLateral.style.transform = "translateX(0)";
      elementos.menuToggle.innerHTML = '<i class="fas fa-times"></i>';
    }
  } else if (window.innerWidth >= 992) {
    estado.menuAberto = true;
  }
  verificarTamanhoTela();
}

function carregarConfiguracoes() {
  const prefsSalvas = localStorage.getItem(
    CONFIG.LOCAL_STORAGE_KEYS.CONFIG_PREFERENCES
  );
  if (prefsSalvas) {
    estado.preferencias = JSON.parse(prefsSalvas);
    atualizarInterfacePreferencias();
  }
}

function inicializarAplicacao() {
  configurarEventListeners();
  animarCards();
}

// ===== CONFIGURAR EVENT LISTENERS =====
function configurarEventListeners() {
  if (elementos.menuToggle) {
    elementos.menuToggle.addEventListener("click", () => {
      estado.menuAberto = toggleMenuLateral(
        elementos.barraLateral,
        elementos.menuToggle,
        elementos.overlay,
        estado.menuAberto
      );
    });
  }

  if (elementos.darkModeToggle) {
    elementos.darkModeToggle.addEventListener("change", () => {
      estado.modoEscuroAtivo = toggleModoEscuro(estado.modoEscuroAtivo);
    });
  }

  if (elementos.langSelect) {
    elementos.langSelect.addEventListener("change", () => {
      estado.preferencias.idioma = elementos.langSelect.value;
      mostrarNotificacao("Idioma atualizado! Salve as alterações.", "info");
    });
  }

  if (elementos.notifyToggle) {
    elementos.notifyToggle.addEventListener("change", () => {
      estado.preferencias.notificacoes = elementos.notifyToggle.checked;
      mostrarNotificacao(
        `Notificações ${estado.preferencias.notificacoes ? "ativadas" : "desativadas"}!`,
        "info"
      );
    });
  }

  if (elementos.savePrefsBtn) {
    elementos.savePrefsBtn.addEventListener("click", salvarPreferencias);
  }

  elementos.editButtons.forEach((btn, index) => {
    btn.addEventListener("click", () => editarUsuario(index));
  });

  elementos.deleteButtons.forEach((btn, index) => {
    btn.addEventListener("click", () => excluirUsuario(index));
  });

  window.addEventListener("resize", debounce(handleResize, 250));
}

// ===== VERIFICAR TAMANHO DA TELA =====
function verificarTamanhoTela() {
  if (window.innerWidth >= 992) {
    elementos.barraLateral.style.transform = "translateX(0)";
    elementos.overlay.classList.remove("active");
    estado.menuAberto = true;
    elementos.menuToggle.style.display = "none";
  } else {
    elementos.menuToggle.style.display = "block";
    if (!estado.menuAberto) {
      elementos.barraLateral.style.transform = "translateX(-100%)";
      elementos.overlay.classList.remove("active");
      elementos.menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    } else {
      elementos.barraLateral.style.transform = "translateX(0)";
      elementos.overlay.classList.add("active");
      elementos.menuToggle.innerHTML = '<i class="fas fa-times"></i>';
    }
  }
}

// ===== ATUALIZAR INTERFACE =====
function atualizarInterfacePreferencias() {
  if (elementos.langSelect) {
    elementos.langSelect.value = estado.preferencias.idioma;
  }

  if (elementos.notifyToggle) {
    elementos.notifyToggle.checked = estado.preferencias.notificacoes;
  }
}

// ===== SALVAR PREFERÊNCIAS =====
function salvarPreferencias(e) {
  if (e) e.preventDefault();

  localStorage.setItem(
    CONFIG.LOCAL_STORAGE_KEYS.CONFIG_PREFERENCES,
    JSON.stringify(estado.preferencias)
  );

  mostrarNotificacao("Configurações salvas com sucesso!", "sucesso");
}

// ===== GERENCIAMENTO DE USUÁRIOS =====
function editarUsuario(index) {
  const linhas = document.querySelectorAll(".tabela-configuracoes tbody tr");
  if (linhas[index]) {
    const nome = linhas[index].querySelector("td:first-child").textContent;
    mostrarNotificacao(`Editando usuário: ${nome}`, "info");

    setTimeout(() => {
      mostrarModalEdicaoUsuario(linhas[index]);
    }, 300);
  }
}

function excluirUsuario(index) {
  const linhas = document.querySelectorAll(".tabela-configuracoes tbody tr");
  if (linhas[index]) {
    const nome = linhas[index].querySelector("td:first-child").textContent;

    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay active";
    modalOverlay.id = "modalExcluir";

    modalOverlay.innerHTML = `
      <div class="modal">
        <h3>Confirmar Exclusão</h3>
        <p>Tem certeza que deseja excluir o usuário <strong>${nome}</strong>?</p>
        <div class="modal-actions">
          <button class="botao-acao perigo" id="confirmarExclusao">Excluir</button>
          <button class="botao-acao secundario" id="cancelarExclusao">Cancelar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        fecharModalExclusao(false);
      }
    });
    
    document
      .getElementById("confirmarExclusao")
      .addEventListener("click", () => fecharModalExclusao(true, linhas[index]));
    
    document
      .getElementById("cancelarExclusao")
      .addEventListener("click", () => fecharModalExclusao(false));
    
    document.addEventListener("keydown", handleEscapeKeyModalExclusao);
  }
}

function fecharModalExclusao(confirmado, linhaParaExcluir = null) {
  const modalOverlay = document.getElementById("modalExcluir");
  if (modalOverlay) {
    modalOverlay.classList.remove("active");
    modalOverlay.addEventListener(
      "transitionend",
      () => modalOverlay.remove(),
      { once: true }
    );
    document.removeEventListener("keydown", handleEscapeKeyModalExclusao);

    if (confirmado && linhaParaExcluir) {
      linhaParaExcluir.remove();
      mostrarNotificacao("Usuário excluído com sucesso!", "sucesso");
    } else if (!confirmado) {
      mostrarNotificacao("Exclusão cancelada.", "info");
    }
  }
}

function handleEscapeKeyModalExclusao(e) {
  if (e.key === "Escape") {
    fecharModalExclusao(false);
  }
}

function mostrarModalEdicaoUsuario(linha) {
  const nomeAtual = linha.querySelector("td:first-child").textContent;
  const funcaoAtual = linha.querySelector("td:nth-child(2)").textContent;
  const statusAtual = linha
    .querySelector(".status")
    .classList.contains("status-ativo");

  const modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay active";
  modalOverlay.id = "modalEdicao";

  modalOverlay.innerHTML = `
    <div class="modal">
      <h3>Editar Usuário</h3>
      <div class="form-group">
        <label for="editNome">Nome:</label>
        <input type="text" id="editNome" value="${nomeAtual}" required>
      </div>
      <div class="form-group">
        <label for="editFuncao">Função:</label>
        <select id="editFuncao">
          <option value="Administrador" ${funcaoAtual === "Administrador" ? "selected" : ""}>Administrador</option>
          <option value="Moderador" ${funcaoAtual === "Moderador" ? "selected" : ""}>Moderador</option>
          <option value="Usuário" ${funcaoAtual === "Usuário" ? "selected" : ""}>Usuário</option>
        </select>
      </div>
      <div class="form-group opcao-configuracao">
        <label for="editStatus">Status:</label>
        <label class="switch">
          <input type="checkbox" id="editStatus" ${statusAtual ? "checked" : ""}>
          <span class="slider round"></span>
        </label>
      </div>
      <div class="modal-actions">
        <button class="action-btn" id="salvarEdicao">Salvar</button>
        <button class="botao-acao secundario" id="cancelarEdicao">Cancelar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      fecharModalEdicaoUsuario();
    }
  });
  
  document
    .getElementById("salvarEdicao")
    .addEventListener("click", () => salvarEdicaoUsuario(linha));
  
  document
    .getElementById("cancelarEdicao")
    .addEventListener("click", fecharModalEdicaoUsuario);
  
  document.addEventListener("keydown", handleEscapeKeyModalEdicao);

  const editStatusToggle = document.getElementById("editStatus");
  const statusLabel = editStatusToggle
    .closest(".opcao-configuracao")
    .querySelector("label:first-child");
  statusLabel.textContent = `Status: ${editStatusToggle.checked ? "Ativo" : "Inativo"}`;
  editStatusToggle.addEventListener("change", function () {
    statusLabel.textContent = `Status: ${this.checked ? "Ativo" : "Inativo"}`;
  });
}

function salvarEdicaoUsuario(linha) {
  const novoNome = document.getElementById("editNome").value;
  const novaFuncao = document.getElementById("editFuncao").value;
  const novoStatus = document.getElementById("editStatus").checked;

  linha.querySelector("td:first-child").textContent = novoNome;
  linha.querySelector("td:nth-child(2)").textContent = novaFuncao;

  const statusElement = linha.querySelector(".status");
  statusElement.textContent = novoStatus ? "Ativo" : "Inativo";
  statusElement.className = novoStatus
    ? "status status-ativo"
    : "status status-inativo";

  mostrarNotificacao("Usuário atualizado com sucesso!", "sucesso");
  fecharModalEdicaoUsuario();
}

function fecharModalEdicaoUsuario() {
  const modalOverlay = document.getElementById("modalEdicao");
  if (modalOverlay) {
    modalOverlay.classList.remove("active");
    modalOverlay.addEventListener(
      "transitionend",
      () => modalOverlay.remove(),
      { once: true }
    );
    document.removeEventListener("keydown", handleEscapeKeyModalEdicao);
  }
}

function handleEscapeKeyModalEdicao(e) {
  if (e.key === "Escape") {
    fecharModalEdicaoUsuario();
  }
}

// ===== ANIMAÇÕES =====
function animarCards() {
  const cards = document.querySelectorAll(".cartao-configuracao");
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, index * 150);
  });
}

// ===== HANDLE RESIZE =====
function handleResize() {
  verificarTamanhoTela();
}

// ===== LOGOUT =====
if (btnSair) {
  btnSair.addEventListener("click", async (e) => {
    e.preventDefault();
    authUtils.logout();
  });
}

// ===== EXPORTAÇÃO =====
window.Configuracoes = {
  salvarPreferencias: salvarPreferencias,
  mostrarNotificacao: mostrarNotificacao,
};