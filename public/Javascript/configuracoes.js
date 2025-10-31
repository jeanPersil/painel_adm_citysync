import {
  toggleMenuLateral,
  toggleModoEscuro,
  mostrarNotificacao,
  debounce,
  adicionarEstilosModais,
  carregarPerfilUsuario,
  authUtils,
} from "./utils.js";

// ===== CONSTANTES =====

const btnSair = document.getElementById("btnSair");

const CONFIG = {
  LOCAL_STORAGE_KEYS: {
    MODO_ESCURO: "darkMode",
    MENU_ABERTO: "menuAberto", // Adicionado para consistência
    CONFIG_PREFERENCES: "configPreferences",
    CONFIG_SEGURANCA: "configSeguranca",
  },
};

// ===== ELEMENTOS DO DOM =====
let elementos = {
  menuToggle: null,
  barraLateral: null, // Adicionado
  overlay: null, // Adicionado
  darkModeToggle: null,
  langSelect: null,
  notifyToggle: null,
  twoFAToggle: null,
  savePrefsBtn: null,
  changePasswordBtn: null,
  manageDevicesBtn: null,
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
  seguranca: {
    doisFatores: false,
  },
};

// ===== INICIALIZAÇÃO =====
document.addEventListener("DOMContentLoaded", function () {
  inicializarElementos();
  criarOverlay(); // Criar overlay antes de carregar preferências
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
    twoFAToggle: document.getElementById("2fa"),
    savePrefsBtn: document.querySelector(".action-btn"),
    // Seleciona os botões de ação de forma mais robusta
    changePasswordBtn: document.querySelector(
      ".cartao-configuracao:nth-of-type(2) .botao-acao:nth-of-type(1)"
    ),
    manageDevicesBtn: document.querySelector(
      ".cartao-configuracao:nth-of-type(2) .botao-acao:nth-of-type(2)"
    ),
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

  // Fechar menu ao clicar no overlay
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
  // Carregar preferência do modo escuro
  const darkModeSalvo = localStorage.getItem(
    CONFIG.LOCAL_STORAGE_KEYS.MODO_ESCURO
  );
  estado.modoEscuroAtivo = darkModeSalvo === "true";

  if (estado.modoEscuroAtivo) {
    document.body.classList.add("dark-mode");
    if (elementos.darkModeToggle) elementos.darkModeToggle.checked = true;
  }

  // Carregar preferência do menu lateral
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
    estado.menuAberto = true; // Menu sempre aberto em telas grandes
  }
  verificarTamanhoTela(); // Ajusta o menu na inicialização
}

function carregarConfiguracoes() {
  // Carregar preferências do sistema
  const prefsSalvas = localStorage.getItem(
    CONFIG.LOCAL_STORAGE_KEYS.CONFIG_PREFERENCES
  );
  if (prefsSalvas) {
    estado.preferencias = JSON.parse(prefsSalvas);
    atualizarInterfacePreferencias();
  }

  // Carregar configurações de segurança
  const segurancaSalva = localStorage.getItem(
    CONFIG.LOCAL_STORAGE_KEYS.CONFIG_SEGURANCA
  );
  if (segurancaSalva) {
    estado.seguranca = JSON.parse(segurancaSalva);
    atualizarInterfaceSeguranca();
  }
}

function inicializarAplicacao() {
  configurarEventListeners();
}

// ===== CONFIGURAR EVENT LISTENERS =====
function configurarEventListeners() {
  // Menu toggle
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

  // Dark mode toggle
  if (elementos.darkModeToggle) {
    elementos.darkModeToggle.addEventListener("change", () => {
      estado.modoEscuroAtivo = toggleModoEscuro(estado.modoEscuroAtivo);
    });
  }

  // Preferências do sistema
  if (elementos.langSelect) {
    elementos.langSelect.addEventListener("change", () => {
      estado.preferencias.idioma = elementos.langSelect.value;
    });
  }

  if (elementos.notifyToggle) {
    elementos.notifyToggle.addEventListener("change", () => {
      estado.preferencias.notificacoes = elementos.notifyToggle.checked;
    });
  }

  // Botão salvar preferências
  if (elementos.savePrefsBtn) {
    elementos.savePrefsBtn.addEventListener("click", salvarPreferencias);
  }

  // Segurança
  if (elementos.twoFAToggle) {
    elementos.twoFAToggle.addEventListener("change", () => {
      estado.seguranca.doisFatores = elementos.twoFAToggle.checked;
      if (elementos.twoFAToggle.checked) {
        mostrarModal2FA();
      } else {
        // Se desativar, salva o estado imediatamente
        salvarPreferencias();
      }
    });
  }

  // Botões de ação
  if (elementos.changePasswordBtn) {
    elementos.changePasswordBtn.addEventListener("click", alterarSenha);
  }

  if (elementos.manageDevicesBtn) {
    elementos.manageDevicesBtn.addEventListener("click", gerenciarDispositivos);
  }

  // Botões de edição e exclusão na tabela
  elementos.editButtons.forEach((btn, index) => {
    btn.addEventListener("click", () => editarUsuario(index));
  });

  elementos.deleteButtons.forEach((btn, index) => {
    btn.addEventListener("click", () => excluirUsuario(index));
  });

  // Evento de redimensionamento
  window.addEventListener("resize", debounce(handleResize, 250));
}

// ===== VERIFICAR TAMANHO DA TELA E AJUSTAR MENU =====
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

// ===== ATUALIZAR INTERFACES =====
function atualizarInterfacePreferencias() {
  if (elementos.langSelect) {
    elementos.langSelect.value = estado.preferencias.idioma;
  }

  if (elementos.notifyToggle) {
    elementos.notifyToggle.checked = estado.preferencias.notificacoes;
  }
}

function atualizarInterfaceSeguranca() {
  if (elementos.twoFAToggle) {
    elementos.twoFAToggle.checked = estado.seguranca.doisFatores;
  }
}

// ===== SALVAR PREFERÊNCIAS =====
function salvarPreferencias(e) {
  if (e) e.preventDefault();

  localStorage.setItem(
    CONFIG.LOCAL_STORAGE_KEYS.CONFIG_PREFERENCES,
    JSON.stringify(estado.preferencias)
  );

  localStorage.setItem(
    CONFIG.LOCAL_STORAGE_KEYS.CONFIG_SEGURANCA,
    JSON.stringify(estado.seguranca)
  );

  mostrarNotificacao("Configurações salvas com sucesso!", "sucesso");
}

// ===== SEGURANÇA =====
function alterarSenha() {
  mostrarModalAlteracaoSenha();
}

function gerenciarDispositivos() {
  mostrarNotificacao(
    "Funcionalidade de gerenciamento de dispositivos em desenvolvimento.",
    "info"
  );
}

function mostrarModal2FA() {
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay active";
  modalOverlay.id = "modal2FA";

  modalOverlay.innerHTML = `
        <div class="modal">
            <h3>Configurar Autenticação de Dois Fatores</h3>
            <p>Escaneie o código QR com seu aplicativo autenticador:</p>
            <div class="qr-code-placeholder" style="width: 200px; height: 200px; background: var(--bg-main); margin: 15px auto; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
                <i class="fas fa-qrcode" style="font-size: 48px; color: var(--text-secondary);"></i>
            </div>
            <p>Ou insira manualmente: <code style="background: var(--bg-main); padding: 5px 10px; border-radius: 4px; color: var(--text-primary);">ABCD-EFGH-IJKL-MNOP</code></p>
            <div class="modal-actions">
                <button class="action-btn" id="confirmar2FA">Confirmar</button>
                <button class="botao-acao secundario" id="cancelar2FA">Cancelar</button>
            </div>
        </div>
    `;

  document.body.appendChild(modalOverlay);

  // Adiciona listeners para fechar o modal
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      fecharModal2FA(false);
    }
  });
  document
    .getElementById("confirmar2FA")
    .addEventListener("click", () => fecharModal2FA(true));
  document
    .getElementById("cancelar2FA")
    .addEventListener("click", () => fecharModal2FA(false));
  document.addEventListener("keydown", handleEscapeKeyModal2FA);
}

function fecharModal2FA(confirmado) {
  const modalOverlay = document.getElementById("modal2FA");
  if (modalOverlay) {
    modalOverlay.classList.remove("active");
    modalOverlay.addEventListener(
      "transitionend",
      () => modalOverlay.remove(),
      { once: true }
    );
    document.removeEventListener("keydown", handleEscapeKeyModal2FA);

    if (confirmado) {
      estado.seguranca.doisFatores = true;
      elementos.twoFAToggle.checked = true;
      mostrarNotificacao(
        "Autenticação de dois fatores ativada com sucesso!",
        "sucesso"
      );
    } else {
      estado.seguranca.doisFatores = false;
      elementos.twoFAToggle.checked = false;
      mostrarNotificacao("Configuração de 2FA cancelada.", "aviso");
    }
    salvarPreferencias(); // Salva o estado após a interação com o modal
  }
}

function handleEscapeKeyModal2FA(e) {
  if (e.key === "Escape") {
    fecharModal2FA(false);
  }
}

function mostrarModalAlteracaoSenha() {
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay active";
  modalOverlay.id = "modalSenha";

  modalOverlay.innerHTML = `
        <div class="modal">
            <h3>Alterar Senha</h3>
            <div class="form-group">
                <label for="senhaAtual">Senha Atual:</label>
                <input type="password" id="senhaAtual" required>
            </div>
            <div class="form-group">
                <label for="novaSenha">Nova Senha:</label>
                <input type="password" id="novaSenha" required>
            </div>
            <div class="form-group">
                <label for="confirmarNovaSenha">Confirmar Nova Senha:</label>
                <input type="password" id="confirmarNovaSenha" required>
            </div>
            <div class="modal-actions">
                <button class="action-btn" id="confirmarAlteracaoSenha">Alterar Senha</button>
                <button class="botao-acao secundario" id="cancelarAlteracaoSenha">Cancelar</button>
            </div>
        </div>
    `;

  document.body.appendChild(modalOverlay);

  // Adiciona listeners para fechar o modal
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      fecharModalAlteracaoSenha();
    }
  });
  document
    .getElementById("confirmarAlteracaoSenha")
    .addEventListener("click", validarEAlterarSenha);
  document
    .getElementById("cancelarAlteracaoSenha")
    .addEventListener("click", fecharModalAlteracaoSenha);
  document.addEventListener("keydown", handleEscapeKeyModalSenha);
}

function validarEAlterarSenha() {
  const senhaAtual = document.getElementById("senhaAtual").value;
  const novaSenha = document.getElementById("novaSenha").value;
  const confirmarNovaSenha =
    document.getElementById("confirmarNovaSenha").value;

  if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
    mostrarNotificacao("Por favor, preencha todos os campos.", "erro");
    return;
  }

  // Simulação de validação da senha atual
  if (senhaAtual !== "suaSenhaAtual") {
    // Substitua por uma validação real
    mostrarNotificacao("Senha atual incorreta.", "erro");
    return;
  }

  if (novaSenha !== confirmarNovaSenha) {
    mostrarNotificacao("As novas senhas não coincidem.", "erro");
    return;
  }

  if (novaSenha.length < 6) {
    mostrarNotificacao(
      "A nova senha deve ter pelo menos 6 caracteres.",
      "erro"
    );
    return;
  }

  // Lógica para realmente alterar a senha (API call, etc.)
  mostrarNotificacao("Senha alterada com sucesso!", "sucesso");
  fecharModalAlteracaoSenha();
}

function fecharModalAlteracaoSenha() {
  const modalOverlay = document.getElementById("modalSenha");
  if (modalOverlay) {
    modalOverlay.classList.remove("active");
    modalOverlay.addEventListener(
      "transitionend",
      () => modalOverlay.remove(),
      { once: true }
    );
    document.removeEventListener("keydown", handleEscapeKeyModalSenha);
  }
}

function handleEscapeKeyModalSenha(e) {
  if (e.key === "Escape") {
    fecharModalAlteracaoSenha();
  }
}

// ===== GERENCIAMENTO DE USUÁRIOS =====
function editarUsuario(index) {
  const linhas = document.querySelectorAll(".tabela-configuracoes tbody tr");
  if (linhas[index]) {
    const nome = linhas[index].querySelector("td:first-child").textContent;
    mostrarNotificacao(`Editando usuário: ${nome}`, "info");

    // Simulação de modal de edição
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

    // Adiciona listeners para fechar o modal
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        fecharModalExclusao(false);
      }
    });
    document
      .getElementById("confirmarExclusao")
      .addEventListener("click", () =>
        fecharModalExclusao(true, linhas[index])
      );
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
                    <option value="Administrador" ${
                      funcaoAtual === "Administrador" ? "selected" : ""
                    }>Administrador</option>
                    <option value="Moderador" ${
                      funcaoAtual === "Moderador" ? "selected" : ""
                    }>Moderador</option>
                    <option value="Usuário" ${
                      funcaoAtual === "Usuário" ? "selected" : ""
                    }>Usuário</option>
                </select>
            </div>
            <div class="form-group opcao-configuracao">
                <label for="editStatus">Status:</label>
                <label class="switch">
                    <input type="checkbox" id="editStatus" ${
                      statusAtual ? "checked" : ""
                    }>
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

  // Adiciona listeners para fechar o modal
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

  // Atualiza o texto do status ao alternar o switch dentro do modal
  const editStatusToggle = document.getElementById("editStatus");
  const statusLabel = editStatusToggle
    .closest(".opcao-configuracao")
    .querySelector("label:first-child");
  statusLabel.textContent = `Status: ${
    editStatusToggle.checked ? "Ativo" : "Inativo"
  }`;
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

// ===== HANDLE RESIZE =====
function handleResize() {
  verificarTamanhoTela();
}

// ===== EXPORTAÇÃO PARA USO EXTERNO =====
window.Configuracoes = {
  salvarPreferencias: salvarPreferencias,
  mostrarNotificacao: mostrarNotificacao, // Mantido para compatibilidade, mas agora vem de utils
};

btnSair.addEventListener("click", async (e) => {
  e.preventDefault();
  authUtils.logout();
});
