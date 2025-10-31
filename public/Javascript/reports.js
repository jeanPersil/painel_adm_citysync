// ==================================
// 1. CONFIGURAÇÃO INICIAL
// ==================================

import {
  carregarPerfilUsuario,
  mostrarNotificacao,
  reconnectModalListeners,
  authUtils,
} from "./utils.js";
import { api } from "./api.js";

const btnSair = document.getElementById("btnSair");

// --- NOVO: Objeto de elementos do DOM ---
// Agrupa todas as referências do DOM em um só lugar
const elementos = {
  // Modais
  viewModal: document.getElementById("reportModal"),
  viewModalClose: document.getElementById("modalClose"),
  viewModalBtnClose: document.querySelector(
    "#reportModal .modal-footer .btn-secondary"
  ),
  editModal: document.getElementById("editReportModal"),
  editModalClose: document.getElementById("editModalClose"),

  // Formulário de Edição
  editReportForm: document.getElementById("editReportForm"),
  editModalReportId: document.getElementById("editModalReportId"),
  editReportInternalId: document.getElementById("editReportInternalId"),
  editBairro: document.getElementById("editBairro"),
  editData: document.getElementById("editData"),
  editCategoria: document.getElementById("editCategoria"),
  editStatus: document.getElementById("editStatus"),
  editDescricao: document.getElementById("editDescricao"),
  cancelEditReportBtn: document.getElementById("cancelEditReport"),
  saveEditedReportBtn: document.getElementById("saveEditedReport"),

  // Tabela e Filtros
  tbody: document.querySelector("tbody"),
  applyFiltersBtn: document.querySelector(".botao-primario"),
  clearFiltersBtn: document.querySelector(".botao-secundario"),
  filterInputs: document.querySelectorAll(
    ".filter-input, .select-field select"
  ),
  searchInput: document.querySelector(".search-field input"),
};

document.addEventListener("DOMContentLoaded", function () {
  // Verificar se estamos na página correta
  if (!document.querySelector(".container-painel")) {
    return;
  }

  // Inicializar todas as funcionalidades
  initDarkMode();
  initMenuToggle();
  initModal();
  initEditModal(); // --- NOVO: Chama a inicialização do modal de edição
  initTableInteractions();
  initFilters();
  carregarPerfilUsuario();
});

// ==================================
// 2. MODO ESCURO
// ==================================
function initDarkMode() {
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const body = document.body;
  const isDarkMode = localStorage.getItem("darkMode") === "true";
  if (isDarkMode) {
    body.classList.add("dark-mode");
    darkModeToggle.checked = true;
  }
  darkModeToggle.addEventListener("change", function () {
    body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", body.classList.contains("dark-mode"));
  });
}

// ==================================
// 3. MENU MOBILE
// ==================================
function initMenuToggle() {
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.querySelector(".barra-lateral");
  const overlay = document.getElementById("overlay");
  if (!menuToggle || !sidebar) return;
  menuToggle.addEventListener("click", function () {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("active");
    document.body.style.overflow = sidebar.classList.contains("open")
      ? "hidden"
      : "";
  });
  overlay.addEventListener("click", function () {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 992) {
      sidebar.classList.remove("open");
      overlay.classList.remove("active");
      document.body.style.overflow = "";
    }
  });
}

// ==================================
// 4. MODAL DE VISUALIZAÇÃO
// ==================================
// --- MODIFICADO: usa 'reconnectModalListeners' ---
function initModal() {
  const modal = elementos.viewModal;
  if (!modal) return;

  // Fechar modal
  function closeModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  // Event listeners para fechar modal
  if (elementos.viewModalClose) {
    elementos.viewModalClose.addEventListener("click", closeModal);
  }
  if (elementos.viewModalBtnClose) {
    elementos.viewModalBtnClose.addEventListener("click", closeModal);
  }

  // Fechar modal clicando fora
  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  // Fechar modal com ESC
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && modal.classList.contains("active")) {
      closeModal();
    }
  });
}

function formatarDataParaInput(dataString) {
  if (!dataString) return "";
  try {
    const date = new Date(dataString);
    if (isNaN(date.getTime())) return ""; // Data inválida

    // Pega o fuso horário local para evitar erro de "um dia a menos"
    const offset = date.getTimezoneOffset();
    const dateCorrigida = new Date(date.getTime() - offset * 60 * 1000);

    return dateCorrigida.toISOString().split("T")[0];
  } catch (e) {
    return "";
  }
}

/**
 * Preenche e abre o modal de edição com os dados do report
 */
function openEditReportModal(reportData) {
  if (!elementos.editModal) return;

  // Mapeia os dados da API para os campos do formulário
  elementos.editModalReportId.textContent = reportData.id;
  elementos.editReportInternalId.value = reportData.id; // O ID real
  elementos.editBairro.value = reportData.endereco || "";
  elementos.editData.value = formatarDataParaInput(reportData.data_criacao);
  elementos.editCategoria.value = reportData.nome_categoria || "";
  elementos.editStatus.value = reportData.nome_status || "";
  elementos.editDescricao.value = reportData.descricao || "";

  elementos.editModal.classList.add("active"); // Mostra o modal
  document.body.style.overflow = "hidden";
}

/**
 * Fecha e limpa o modal de edição
 */
function closeEditReportModal() {
  if (!elementos.editModal) return;
  elementos.editModal.classList.remove("active"); // Esconde o modal
  elementos.editReportForm.reset(); // Limpa o formulário
  document.body.style.overflow = "";
}

/**
 * Inicializa os eventos do modal de edição (fechar e salvar)
 */
function initEditModal() {
  if (!elementos.editModal) return;

  // Eventos para fechar
  elementos.editModalClose.addEventListener("click", closeEditReportModal);
  elementos.cancelEditReportBtn.addEventListener("click", closeEditReportModal);

  // Evento para salvar (submit do form)
  elementos.editReportForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Impede o recarregamento da página

    // Pega o ID e os dados do formulário
    const reportId = elementos.editReportInternalId.value;
    const updatedData = {
      endereco: elementos.editBairro.value,
      data_criacao: elementos.editData.value,
      nome_categoria: elementos.editCategoria.value,
      nome_status: elementos.editStatus.value,
      descricao: elementos.editDescricao.value,
    };

    // UI de "Carregando"
    elementos.saveEditedReportBtn.textContent = "Salvando...";
    elementos.saveEditedReportBtn.disabled = true;

    try {
      const result = await api.atualizarReport(reportId, updatedData);

      if (!result.success) {
        throw new Error(result.message || "Erro ao salvar");
      }

      mostrarNotificacao("Report atualizado com sucesso!", "sucesso");
      closeEditReportModal();

      // Atualiza a tabela chamando a função de filtro
      elementos.applyFiltersBtn.click();

      elementos.applyFiltersBtn.click();
    } catch (error) {
      console.error("Erro ao salvar edições:", error);
      mostrarNotificacao(`Erro ao atualizar: ${error.message}`, "erro");
    } finally {
      elementos.saveEditedReportBtn.textContent = "Salvar Alterações";
      elementos.saveEditedReportBtn.disabled = false;
    }
  });
}

// ==================================
// 5. INTERAÇÕES DA TABELA
// ==================================
function initTableInteractions() {
  const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
  const headerCheckbox = document.querySelector('thead input[type="checkbox"]');
  if (headerCheckbox) {
    headerCheckbox.addEventListener("change", function () {
      const isChecked = this.checked;
      checkboxes.forEach((checkbox) => {
        checkbox.checked = isChecked;
        toggleRowSelection(checkbox);
      });
    });
  }
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      toggleRowSelection(this);
      updateHeaderCheckbox();
    });
  });
  function toggleRowSelection(checkbox) {
    const row = checkbox.closest("tr");
    if (checkbox.checked) {
      row.classList.add("selected");
    } else {
      row.classList.remove("selected");
    }
  }
  function updateHeaderCheckbox() {
    if (!headerCheckbox) return;
    const checkedCount = document.querySelectorAll(
      'tbody input[type="checkbox"]:checked'
    ).length;
    const totalCount = checkboxes.length;
    headerCheckbox.checked = checkedCount === totalCount;
    headerCheckbox.indeterminate =
      checkedCount > 0 && checkedCount < totalCount;
  }
  const sortButtons = document.querySelectorAll("th i.fa-sort");
  sortButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const th = this.closest("th");
      const columnIndex = Array.from(th.parentNode.children).indexOf(th);
      sortTable(columnIndex);
    });
  });
}

function sortTable(columnIndex) {
  const table = document.querySelector("table");
  const tbody = table.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));
  const isAscending = !table.querySelector("th").classList.contains("asc");
  rows.sort((a, b) => {
    const aValue = a.children[columnIndex].textContent.trim();
    const bValue = b.children[columnIndex].textContent.trim();
    if (!isNaN(aValue) && !isNaN(bValue)) {
      return isAscending ? aValue - bValue : bValue - aValue;
    }
    return isAscending
      ? aValue.localeCompare(bValue, "pt-BR")
      : bValue.localeCompare(aValue, "pt-BR");
  });
  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }
  rows.forEach((row) => tbody.appendChild(row));
  table.querySelectorAll("th").forEach((th) => {
    th.classList.remove("asc", "desc");
  });
  const currentTh = table.querySelectorAll("th")[columnIndex];
  currentTh.classList.add(isAscending ? "asc" : "desc");
}

// ==================================
// 6. FILTROS E PESQUISA
// ==================================

function initFilters() {
  // Aplicar filtros
  if (elementos.applyFiltersBtn) {
    elementos.applyFiltersBtn.addEventListener("click", applyFilters);
  }

  // Limpar filtros
  if (elementos.clearFiltersBtn) {
    elementos.clearFiltersBtn.addEventListener("click", clearFilters);
  }

  // Pesquisa em tempo real
  if (elementos.searchInput) {
    elementos.searchInput.addEventListener(
      "input",
      debounce(applyFilters, 300)
    );
  }

  async function applyFilters() {
    // Captura dos campos
    const pesquisarInput = document.querySelector(
      ".search-field .filter-input"
    );
    const bairroInput = document.querySelectorAll(".filter-input")[1];
    const dataInput = document.querySelectorAll(".filter-input")[2];
    const statusSelect = document.querySelectorAll(".select-field select")[0];
    const prioridadeSelect = document.querySelectorAll(
      // --- MODIFICADO: corrigido para 'categoriaSelect' ---
      ".select-field select"
    )[1]; // Este é o select de Categoria, não prioridade

    const pesquisar = pesquisarInput?.value?.trim() || "";
    const endereco = bairroInput?.value?.trim() || "";
    const data = dataInput?.value || "";
    const status = statusSelect?.value !== "todos" ? statusSelect?.value : "";
    const categoria =
      prioridadeSelect?.value !== "" ? prioridadeSelect?.value : "";

    try {
      const params = new URLSearchParams({
        pesquisar,
        endereco,
        data,
        status,
        categoria,
      });

      const result = await api.obterReportsFiltrados(params);

      if (!result.success) {
        mostrarNotificacao(`Erro ao buscar reports: ${result.message}`, "erro");
        return;
      }

      renderTable(result.reports);
      atualizar_cards(result.total, result.reports);
    } catch (error) {
      console.error("Erro na requisição:", error);
    }
  }

  function atualizar_cards(total, reports) {
    const cardTotal = document.getElementById("reports_total");
    const cardPendente = document.getElementById("reports_pendentes");
    const cardAndamento = document.getElementById("reports_andamento");
    const cardResolvido = document.getElementById("reports_resolvidos");

    cardTotal.textContent = total;

    if (reports && Array.isArray(reports)) {
      const pendentes = reports.filter(
        (r) => r.nome_status === "Pendente"
      ).length;
      const emAndamento = reports.filter(
        (r) => r.nome_status === "Em andamento"
      ).length;
      const resolvidos = reports.filter(
        (r) => r.nome_status === "Resolvido"
      ).length;

      cardPendente.textContent = pendentes;
      cardAndamento.textContent = emAndamento;
      cardResolvido.textContent = resolvidos;
    }
  }

  function renderTable(reports) {
    const tbody = elementos.tbody; // --- MODIFICADO: usa o objeto 'elementos'
    tbody.innerHTML = "";

    if (!reports || reports.length === 0) {
      tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:20px;">
          Nenhum resultado encontrado.
        </td>
      </tr>`;
      return;
    }

    reports.forEach((report) => {
      const tr = document.createElement("tr");
      // --- MODIFICADO: Adicionado 'edit-btn' e 'data-id' ao botão de editar ---
      tr.innerHTML = `
      <td><input type="checkbox" /></td>
      <td>#${report.id}</td>
      <td>${report.endereco || "-"}</td>
      <td>${new Date(report.data_criacao).toLocaleDateString("pt-BR")}</td>
      <td><span class="status status-${
        report.nome_status?.toLowerCase().replace(" ", "-") || "indefinido" // --- MODIFICADO: replace " "
      }">
        ${report.nome_status || "-"}
      </span></td>
      <td><span class="prioridade ${
        report.nome_categoria?.toLowerCase() || ""
      }">
        ${report.nome_categoria || "-"}
      </span></td>
      <td>
        <div class="acoes">
          <button class="botao-acao view-btn" data-id="${report.id}">
            <i class="fas fa-eye"></i>
          </button>
          <button class="botao-acao edit-btn" data-id="${report.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="botao-acao delete" data-id="${report.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;
      tbody.appendChild(tr);
    });

    adicionarEventosRemover();
    adicionarEventosEditar(reports); // <-- CHAMA A NOVA FUNÇÃO
    adicionarEventosVisualizar(reports);
  }

  function adicionarEventosVisualizar(reports) {
    const viewButtons = document.querySelectorAll(".view-btn");
    viewButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        const reportData = reports.find((r) => r.id == id);

        if (reportData) {
          // Preenche o modal de VISUALIZAÇÃO
          document.getElementById("modalReportId").textContent = reportData.id;
          document.getElementById("modalBairro").textContent =
            reportData.endereco;
          document.getElementById("modalData").textContent = new Date(
            reportData.data_criacao
          ).toLocaleDateString("pt-BR");
          document.getElementById("modalCategoria").textContent =
            reportData.nome_categoria;
          document.getElementById("modalDescricao").textContent =
            reportData.descricao;
          document.getElementById("modalStatus").textContent =
            reportData.nome_status;

          // (Dados fictícios que não estão na sua view)
          document.getElementById("modalPrioridade").textContent = "Alta"; // (Fictício)
          document.getElementById("modalResponsavel").textContent =
            "Não atribuído"; // (Fictício)
          document.getElementById("modalDataPrevista").textContent =
            "Não definida"; // (Fictício)

          // Mostrar modal
          elementos.viewModal.classList.add("active");
          document.body.style.overflow = "hidden";
        }
      });
    });
  }

  // --- NOVO: Função para adicionar eventos de edição ---
  function adicionarEventosEditar(reports) {
    const botoesEditar = document.querySelectorAll(".edit-btn");
    botoesEditar.forEach((botao) => {
      botao.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = e.currentTarget.getAttribute("data-id");

        const reportData = reports.find((r) => r.id == id);

        if (reportData) {
          openEditReportModal(reportData);
        } else {
          console.error(
            "Não foi possível encontrar os dados do report para o ID:",
            id
          );
        }
      });
    });
  }

  function adicionarEventosRemover() {
    const botoesRemover = document.querySelectorAll(".delete");
    botoesRemover.forEach((botao) => {
      botao.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = e.currentTarget.getAttribute("data-id");
        if (!confirm("Tem certeza que deseja excluir este report?")) return;
        try {
          const result = await api.excluirReport(id);
          if (result !== null)
            return mostrarNotificacao("erro ao excluir report.", "erro");
          mostrarNotificacao("Reporte excluido com sucesso", "sucesso");
          applyFilters();
        } catch (error) {
          console.error("Erro ao excluir:", error);
          mostrarNotificacao("Erro inesperado ao excluir report.", "erro");
        }
      });
    });
  }

  function clearFilters() {
    elementos.filterInputs.forEach((input) => {
      if (input.tagName === "SELECT") {
        input.selectedIndex = 0;
      } else {
        input.value = "";
      }
    });
    applyFilters();
  }

  function debounce(func, wait) {
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

  // Carga inicial
  applyFilters();
}

// ==================================
// 7. PAGINAÇÃO
// ==================================
function initPagination() {
  const paginationButtons = document.querySelectorAll(".btn-pagina");
  paginationButtons.forEach((button) => {
    button.addEventListener("click", function () {
      if (this.classList.contains("active")) return;
      paginationButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");
      simulatePageChange();
    });
  });
  function simulatePageChange() {
    const tableBody = document.querySelector("tbody");
    tableBody.style.opacity = "0.5";
    setTimeout(() => {
      tableBody.style.opacity = "1";
    }, 300);
  }
}

// ==================================
// 8. INICIALIZAÇÃO DA PAGINAÇÃO
// ==================================
initPagination();

btnSair.addEventListener("click", async (e) => {
  e.preventDefault();
  authUtils.logout();
});
