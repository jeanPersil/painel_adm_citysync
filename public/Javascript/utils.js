import { api } from "./api.js";
// ============================================================================
// 1. Funções de UI (Interface do Usuário)
// ============================================================================

/**
 * Alterna a visibilidade do menu lateral em telas pequenas.
 * @param {HTMLElement} barraLateral - O elemento DOM da barra lateral.
 * @param {HTMLElement} menuToggle - O botão de alternância do menu.
 * @param {HTMLElement} overlay - O elemento overlay para fechar o menu.
 * @param {boolean} estadoMenuAberto - O estado atual do menu (aberto/fechado).
 * @returns {boolean} O novo estado do menu (aberto/fechado).
 */
export function toggleMenuLateral(
  barraLateral,
  menuToggle,
  overlay,
  estadoMenuAberto
) {
  // Não permitir abrir/fechar o menu em telas grandes onde ele já está sempre visível
  if (window.innerWidth >= 992) {
    return true; // Retorna true para indicar que o menu está "aberto" em telas grandes
  }

  const novoEstado = !estadoMenuAberto;

  if (novoEstado) {
    barraLateral.style.transform = "translateX(0)";
    overlay.classList.add("active");
    menuToggle.innerHTML = '<i class="fas fa-times"></i>';
    menuToggle.setAttribute("aria-label", "Fechar menu");
  } else {
    barraLateral.style.transform = "translateX(-100%)";
    overlay.classList.remove("active");
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    menuToggle.setAttribute("aria-label", "Abrir menu");
  }

  // Salvar preferência apenas para telas pequenas
  if (window.innerWidth < 992) {
    localStorage.setItem("menuAberto", novoEstado);
  }

  document.dispatchEvent(new CustomEvent("menuToggle", { detail: novoEstado }));
  return novoEstado;
}

/**
 * Alterna o modo escuro/claro da aplicação.
 * @param {boolean} estadoModoEscuroAtivo - O estado atual do modo escuro.
 * @returns {boolean} O novo estado do modo escuro.
 */
export function toggleModoEscuro(estadoModoEscuroAtivo) {
  const novoEstado = !estadoModoEscuroAtivo;

  if (novoEstado) {
    document.body.classList.add("dark-mode");
    document.dispatchEvent(
      new CustomEvent("modoEscuroAlterado", { detail: true })
    );
  } else {
    document.body.classList.remove("dark-mode");
    document.dispatchEvent(
      new CustomEvent("modoEscuroAlterado", { detail: false })
    );
  }

  localStorage.setItem("darkMode", novoEstado);
  return novoEstado;
}

/**
 * Exibe uma notificação toast na tela.
 * @param {string} mensagem - A mensagem a ser exibida.
 * @param {string} [tipo='info'] - O tipo da notificação ('sucesso', 'erro', 'aviso', 'info').
 * @param {number} [timeout=3000] - Tempo em milissegundos para a notificação desaparecer.
 */
export function mostrarNotificacao(mensagem, tipo = "info", timeout = 3000) {
  const toast = document.createElement("div");
  toast.className = `toast-message ${tipo}`;
  toast.innerHTML = `
        <i class="fas fa-${obterIconeNotificacao(tipo)}"></i>
        <span>${mensagem}</span>
    `;

  // Estilos para o toast (centralizados aqui para consistência)
  toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        background: ${obterCorNotificacao(tipo)};
        color: white;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000; /* Z-index alto para garantir visibilidade */
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    `;

  document.body.appendChild(toast);

  // Força o reflow para que a transição funcione
  toast.offsetHeight;

  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 300);
  }, timeout);
}

/**
 * Retorna o ícone Font Awesome correspondente ao tipo de notificação.
 * @param {string} tipo - O tipo da notificação.
 * @returns {string} Classe do ícone.
 */
function obterIconeNotificacao(tipo) {
  const icones = {
    sucesso: "check-circle",
    erro: "exclamation-circle",
    aviso: "exclamation-triangle",
    info: "info-circle",
  };
  return icones[tipo] || "info-circle";
}

/**
 * Retorna a cor de fundo correspondente ao tipo de notificação.
 * @param {string} tipo - O tipo da notificação.
 * @returns {string} Código de cor CSS.
 */
function obterCorNotificacao(tipo) {
  const cores = {
    sucesso: "#2ecc71",
    erro: "#e74c3c",
    aviso: "#f39c12",
    info: "#3498db",
  };
  return cores[tipo] || "#3498db";
}

// ============================================================================
// 2. Funções Utilitárias Gerais
// ============================================================================

/**
 * Retorna uma função "debounced" que atrasa a execução da função original.
 * Útil para eventos que disparam rapidamente (ex: redimensionamento, digitação).
 * @param {Function} func - A função a ser debounced.
 * @param {number} wait - O tempo de espera em milissegundos.
 * @returns {Function} A função debounced.
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Adiciona estilos CSS para modais dinamicamente.
 * Isso garante que os estilos dos modais criados via JS estejam sempre disponíveis.
 */
export function adicionarEstilosModais() {
  if (document.getElementById("modal-global-styles")) {
    return; // Estilos já adicionados
  }

  const estilos = `
        <style id="modal-global-styles">
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .modal-overlay.active {
                opacity: 1;
            }
            .modal-overlay.hidden { /* Para esconder rapidamente sem transição */
                display: none;
            }
            
            .modal {
                background-color: var(--bg-card);
                border-radius: 12px;
                padding: 25px;
                width: 90%;
                max-width: 500px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                transform: translateY(-20px);
                opacity: 0;
                transition: transform 0.3s ease, opacity 0.3s ease;
            }
            .modal-overlay.active .modal {
                transform: translateY(0);
                opacity: 1;
            }
            
            .modal h3 {
                margin-top: 0;
                margin-bottom: 15px;
                color: var(--text-primary);
            }
            
            .modal-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
            }
            
            .botao-acao.secundario {
                background-color: var(--bg-main);
                color: var(--text-primary);
                border: 1px solid var(--border-color);
            }
            .botao-acao.secundario:hover {
                background-color: var(--border-color);
            }
            
            .botao-acao.perigo {
                background-color: var(--accent-red);
                color: white;
                border: none;
            }
            .botao-acao.perigo:hover {
                background-color: #c0392b;
            }
            
            .form-group {
                margin-bottom: 15px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
                color: var(--text-primary);
            }
            
            .form-group input,
            .form-group select {
                width: 100%;
                padding: 10px;
                border-radius: 6px;
                border: 1px solid var(--border-color);
                background-color: var(--bg-main);
                color: var(--text-primary);
                transition: all 0.3s;
            }
            .form-group input:focus,
            .form-group select:focus {
                outline: none;
                border-color: var(--accent-blue);
                box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
            }

            /* Estilos específicos para o switch dentro do modal */
            .modal .switch {
                margin-left: auto; /* Alinha o switch à direita */
            }
            .modal .opcao-configuracao {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
        </style>
    `;

  document.head.insertAdjacentHTML("beforeend", estilos);
}

// Utils para gerenciar auth
export const authUtils = {
  getUser() {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem("userToken");
  },

  isAuthenticated() {
    return !!this.getUser() && !!this.getToken();
  },

  async logout() {
    try {
      const data = await api.logout();

      if (!data.success) {
        mostrarNotificacao(data.message, "erro");
        return;
      }

      window.location.href = data.redirect || "/";
    } catch (error) {
      mostrarNotificacao(error, "erro");
      return;
    }
  },
};

export function carregarPerfilUsuario() {
  const user = authUtils.getUser();

  const span = document.querySelector("span.profile-name");
  if (user && user.nome && span) {
    span.textContent = user.nome;
  } else {
    span.textContent = "Usuário";
  }
}

export function reconnectModalListeners(reports) {
  const modal = document.getElementById("reportModal");
  const viewButtons = document.querySelectorAll(".view-btn");
  const closeButton = document.getElementById("modalClose");
  const modalCloseBtn = document.querySelector(".modal-footer .btn-secondary");

  // Abrir modal com dados dinâmicos
  viewButtons.forEach((button) => {
    // Remove event listeners existentes para evitar duplicação
    button.replaceWith(button.cloneNode(true));
  });

  // Re-seleciona os botões após o clone
  const newViewButtons = document.querySelectorAll(".view-btn");

  newViewButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const reportId = this.getAttribute("data-id");

      // Encontrar o report correspondente nos dados
      const reportData = reports.find((report) => report.id == reportId);

      if (reportData) {
        // Preencher dados do modal com informações reais da API
        document.getElementById("modalReportId").textContent = reportId;
        document.getElementById("modalBairro").textContent =
          reportData.endereco || "-";
        document.getElementById("modalData").textContent = new Date(
          reportData.data_criacao
        ).toLocaleDateString("pt-BR");
        document.getElementById("modalCategoria").textContent =
          reportData.nome_categoria || "-";
        document.getElementById("modalDescricao").textContent =
          reportData.descricao || "Sem descrição disponível";
        document.getElementById("modalStatus").textContent =
          reportData.nome_status || "-";
        document.getElementById("modalPrioridade").textContent =
          reportData.nome_categoria || "-";
        document.getElementById("modalResponsavel").textContent =
          reportData.responsavel || "Não atribuído";
        document.getElementById("modalDataPrevista").textContent =
          reportData.data_prevista_resolucao
            ? new Date(reportData.data_prevista_resolucao).toLocaleDateString(
                "pt-BR"
              )
            : "Não definida";

        // Ajustar classes de status para corresponder aos dados reais
        const statusElement = document.getElementById("modalStatus");
        statusElement.className = "info-value";
        if (reportData.nome_status) {
          statusElement.classList.add(
            `status-${reportData.nome_status.toLowerCase()}`
          );
        }

        // Mostrar modal
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
      }
    });
  });

  // Manter a funcionalidade de fechar modal (já existe, mas garantindo)
  function closeModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (closeButton) {
    closeButton.addEventListener("click", closeModal);
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeModal);
  }

  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && modal.classList.contains("active")) {
      closeModal();
    }
  });
}

// Adicionar estilos para modais quando o script utils.js for carregado
adicionarEstilosModais();
