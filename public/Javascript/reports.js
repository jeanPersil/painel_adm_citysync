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

// Variáveis de estado para paginação
let paginaAtual = 1;
const limitePorPagina = 10;

// Objeto de elementos do DOM
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

  // Paginação
  resultadosInfoSpan: document.querySelector(".tabela-footer .resultados-info"),
  paginacaoContainer: document.querySelector(".tabela-footer .paginacao"),
  btnSair: document.getElementById("btnSair"),
};

document.addEventListener("DOMContentLoaded", function () {
  if (!document.querySelector(".container-painel")) {
    return;
  }

  initDarkMode();
  initMenuToggle();
  initModal();
  initEditModal();
  initTableInteractions();
  initFilters();
  carregarPerfilUsuario();

  if (elementos.btnSair) {
    elementos.btnSair.addEventListener("click", async (e) => {
      e.preventDefault();
      authUtils.logout();
    });
  }
});

// ==================================
// 2. MODO ESCURO
// ==================================
function initDarkMode() {
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const body = document.body;
  if (!darkModeToggle) return;
  
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
  
  if (!menuToggle || !sidebar || !overlay) return;
  
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
function initModal() {
  const modal = elementos.viewModal;
  if (!modal) return;

  function closeModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
  
  if (elementos.viewModalClose) {
    elementos.viewModalClose.addEventListener("click", closeModal);
  }
  
  if (elementos.viewModalBtnClose) {
    elementos.viewModalBtnClose.addEventListener("click", closeModal);
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

// ==================================
// 5. MODAL DE EDIÇÃO
// ==================================
function formatarDataParaInput(dataString) {
  if (!dataString) return "";
  try {
    const date = new Date(dataString);
    if (isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset();
    const dateCorrigida = new Date(date.getTime() - offset * 60 * 1000);
    return dateCorrigida.toISOString().split("T")[0];
  } catch (e) {
    return "";
  }
}

function openEditReportModal(reportData) {
  if (!elementos.editModal) return;
  
  elementos.editModalReportId.textContent = reportData.id;
  elementos.editReportInternalId.value = reportData.id;
  elementos.editBairro.value = reportData.endereco || "";
  elementos.editData.value = formatarDataParaInput(reportData.data_criacao);
  elementos.editCategoria.value = reportData.nome_categoria || "";
  elementos.editStatus.value = reportData.nome_status || "";
  elementos.editDescricao.value = reportData.descricao || "";
  
  elementos.editBairro.disabled = true;
  elementos.editData.disabled = true;
  
  elementos.editModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeEditReportModal() {
  if (!elementos.editModal) return;
  elementos.editModal.classList.remove("active");
  elementos.editReportForm.reset();
  document.body.style.overflow = "";
}

function initEditModal() {
  if (!elementos.editModal || !elementos.editReportForm) return;
  
  elementos.editModalClose.addEventListener("click", closeEditReportModal);
  elementos.cancelEditReportBtn.addEventListener("click", closeEditReportModal);

  elementos.editReportForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const reportId = elementos.editReportInternalId.value;
    
    const updatedData = {
      endereco: elementos.editBairro.value,
      data_criacao: elementos.editData.value,
      nome_categoria: elementos.editCategoria.value,
      nome_status: elementos.editStatus.value,
      descricao: elementos.editDescricao.value,
    };
    
    elementos.saveEditedReportBtn.textContent = "Salvando...";
    elementos.saveEditedReportBtn.disabled = true;

    try {
      const result = await api.atualizarReport(reportId, updatedData);
      if (!result.success) {
        throw new Error(result.message || "Erro ao salvar");
      }
      mostrarNotificacao("Report atualizado com sucesso!", "sucesso");
      closeEditReportModal();
      applyFilters();
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
// 6. INTERAÇÕES DA TABELA
// ==================================
function initTableInteractions() {
  const headerCheckbox = document.querySelector('thead input[type="checkbox"]');
  
  if (headerCheckbox) {
    headerCheckbox.addEventListener("change", function () {
      const isChecked = this.checked;
      const pageCheckboxes = document.querySelectorAll('tbody input[type="checkbox"]');
      pageCheckboxes.forEach((checkbox) => {
        checkbox.checked = isChecked;
        toggleRowSelection(checkbox);
      });
    });
  }

  function toggleRowSelection(checkbox) {
    const row = checkbox.closest("tr");
    if(row) {
      if (checkbox.checked) {
        row.classList.add("selected");
      } else {
        row.classList.remove("selected");
      }
    }
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
  if (!table || !tbody) return;
  
  const rows = Array.from(tbody.querySelectorAll("tr"));
  const isAscending = !table.querySelectorAll("th")[columnIndex].classList.contains("asc");
  
  rows.sort((a, b) => {
    const aValue = a.children[columnIndex]?.textContent.trim() || "";
    const bValue = b.children[columnIndex]?.textContent.trim() || "";
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
  table.querySelectorAll("th")[columnIndex].classList.add(isAscending ? "asc" : "desc");
}

// ==================================
// 7. FILTROS E RENDERIZAÇÃO
// ==================================
function initFilters() {
  if (elementos.applyFiltersBtn) {
    elementos.applyFiltersBtn.addEventListener("click", () => {
      paginaAtual = 1;
      applyFilters();
    });
  }

  if (elementos.clearFiltersBtn) {
    elementos.clearFiltersBtn.addEventListener("click", () => {
      paginaAtual = 1;
      clearFilters();
    });
  }

  if (elementos.searchInput) {
    elementos.searchInput.addEventListener(
      "input",
      debounce(() => {
        paginaAtual = 1;
        applyFilters();
      }, 500)
    );
  }

  applyFilters();
}

async function applyFilters() {
  const pesquisarInput = document.querySelector(".search-field .filter-input");
  const bairroInput = document.querySelectorAll(".filter-input")[1];
  const dataInput = document.querySelectorAll(".filter-input")[2];
  const statusSelect = document.querySelectorAll(".select-field select")[0];
  const categoriaSelect = document.querySelectorAll(".select-field select")[1];

  const pesquisar = pesquisarInput?.value?.trim() || "";
  const endereco = bairroInput?.value?.trim() || "";
  const data = dataInput?.value || "";
  const status = statusSelect?.value !== "todos" ? statusSelect?.value : "";
  const categoria = categoriaSelect?.value !== "" ? categoriaSelect?.value : "";

  const params = new URLSearchParams({
    pesquisar,
    endereco,
    data,
    status,
    categoria,
    page: paginaAtual,
    limit: limitePorPagina,
  });

  try {
    elementos.tbody.innerHTML =
      '<tr><td colspan="7" style="text-align:center; padding:20px;">Carregando...</td></tr>';
    if (elementos.paginacaoContainer) elementos.paginacaoContainer.innerHTML = "";
    if (elementos.resultadosInfoSpan) elementos.resultadosInfoSpan.textContent = "Carregando...";

    const result = await api.obterReportsFiltrados(params);

    if (!result.success) {
      mostrarNotificacao(`Erro ao buscar reports: ${result.message}`, "erro");
      elementos.tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">Erro ao carregar dados.</td></tr>`;
      return;
    }

    renderTable(result.reports);
    renderizarPaginacao(result.totalPages, result.currentPage);
    atualizarResultadosInfo(
      result.reports.length,
      result.totalItems,
      result.currentPage
    );
    atualizar_cards(result.totalItems, result.reports);
  } catch (error) {
    console.error("Erro na requisição:", error);
    elementos.tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">Erro fatal na requisição.</td></tr>`;
  }
}

function atualizar_cards(total, reports) {
  const cardTotal = document.getElementById("reports_total");
  const cardPendente = document.getElementById("reports_pendentes");
  const cardAndamento = document.getElementById("reports_andamento");
  const cardResolvido = document.getElementById("reports_resolvidos");

  if (cardTotal) cardTotal.textContent = total;

  if (reports && Array.isArray(reports)) {
    const pendentes = reports.filter((r) => r.nome_status === "Pendente").length;
    const emAndamento = reports.filter((r) => r.nome_status === "Em andamento").length;
    const resolvidos = reports.filter((r) => r.nome_status === "Resolvido").length;

    if (cardPendente) cardPendente.textContent = pendentes;
    if (cardAndamento) cardAndamento.textContent = emAndamento;
    if (cardResolvido) cardResolvido.textContent = resolvidos;
  }
}

function renderTable(reports) {
  const tbody = elementos.tbody;
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
    tr.innerHTML = `
    <td><input type="checkbox" /></td>
    <td>#${report.id}</td>
    <td>${report.endereco || "-"}</td>
    <td>${new Date(report.data_criacao).toLocaleDateString("pt-BR")}</td>
    <td><span class="status status-${
      report.nome_status?.toLowerCase().replace(" ", "-") || "indefinido"
    }">
      ${report.nome_status || "-"}
    </span></td>
    <td><span class="prioridade ${
      report.nome_categoria?.toLowerCase().replace("/", "-").replace(" ", "-") || ""
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
  adicionarEventosEditar(reports);
  adicionarEventosVisualizar(reports);
  initTableInteractions();
}

function adicionarEventosVisualizar(reports) {
  const viewButtons = document.querySelectorAll(".view-btn");
  viewButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      const reportData = reports.find((r) => r.id == id);
      if (reportData) {
        document.getElementById("modalReportId").textContent = reportData.id;
        document.getElementById("modalBairro").textContent = reportData.endereco;
        document.getElementById("modalData").textContent = new Date(
          reportData.data_criacao
        ).toLocaleDateString("pt-BR");
        document.getElementById("modalCategoria").textContent = reportData.nome_categoria;
        document.getElementById("modalDescricao").textContent = reportData.descricao;
        document.getElementById("modalStatus").textContent = reportData.nome_status;
        document.getElementById("modalPrioridade").textContent = "Alta";
        document.getElementById("modalResponsavel").textContent = "Não atribuído";
        document.getElementById("modalDataPrevista").textContent = "Não definida";

        elementos.viewModal.classList.add("active");
        document.body.style.overflow = "hidden";
      }
    });
  });
}

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
        console.error("Não foi possível encontrar os dados do report para o ID:", id);
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
        
        if (result != null) {
          throw new Error(result.message || "Erro ao excluir");
        }
        
        mostrarNotificacao("Reporte excluído com sucesso", "sucesso");
        
        if (elementos.tbody.rows.length === 1) {
          paginaAtual = Math.max(1, paginaAtual - 1);
        }
        applyFilters();
      } catch (error) {
        console.error("Erro ao excluir:", error);
        mostrarNotificacao(`Erro inesperado: ${error.message}`, "erro");
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

// ==================================
// 8. PAGINAÇÃO
// ==================================
function renderizarPaginacao(totalPages, currentPage) {
  const container = elementos.paginacaoContainer;
  if (!container) {
    console.error("Contêiner de paginação não encontrado.");
    return;
  }
  
  container.innerHTML = "";

  if (totalPages <= 1) return;

  const btnAnterior = document.createElement("button");
  btnAnterior.className = "btn-pagina";
  btnAnterior.innerHTML = `<i class="fas fa-chevron-left"></i>`;
  btnAnterior.disabled = currentPage === 1;
  btnAnterior.addEventListener("click", () => {
    if (currentPage > 1) {
      paginaAtual--;
      applyFilters();
    }
  });
  container.appendChild(btnAnterior);

  const maxBotoes = 5;
  let inicio = Math.max(1, currentPage - Math.floor(maxBotoes / 2));
  let fim = Math.min(totalPages, inicio + maxBotoes - 1);

  if (fim - inicio < maxBotoes - 1) {
    inicio = Math.max(1, fim - maxBotoes + 1);
  }

  if (inicio > 1) {
    const btnPrimeira = document.createElement("button");
    btnPrimeira.textContent = "1";
    btnPrimeira.className = "btn-pagina";
    btnPrimeira.addEventListener("click", () => {
      paginaAtual = 1;
      applyFilters();
    });
    container.appendChild(btnPrimeira);
    
    if (inicio > 2) {
      const elipse = document.createElement("span");
      elipse.textContent = "...";
      elipse.className = "paginacao-elipse";
      container.appendChild(elipse);
    }
  }

  for (let i = inicio; i <= fim; i++) {
    const btnPagina = document.createElement("button");
    btnPagina.textContent = i;
    btnPagina.className = "btn-pagina";
    if (i === currentPage) {
      btnPagina.classList.add("active");
      btnPagina.disabled = true;
    }
    btnPagina.addEventListener("click", () => {
      paginaAtual = i;
      applyFilters();
    });
    container.appendChild(btnPagina);
  }

  if (fim < totalPages) {
    if (fim < totalPages - 1) {
      const elipse = document.createElement("span");
      elipse.textContent = "...";
      elipse.className = "paginacao-elipse";
      container.appendChild(elipse);
    }
    const btnUltima = document.createElement("button");
    btnUltima.textContent = totalPages;
    btnUltima.className = "btn-pagina";
    btnUltima.addEventListener("click", () => {
      paginaAtual = totalPages;
      applyFilters();
    });
    container.appendChild(btnUltima);
  }

  const btnProximo = document.createElement("button");
  btnProximo.className = "btn-pagina";
  btnProximo.innerHTML = `<i class="fas fa-chevron-right"></i>`;
  btnProximo.disabled = currentPage === totalPages;
  btnProximo.addEventListener("click", () => {
    if (currentPage < totalPages) {
      paginaAtual++;
      applyFilters();
    }
  });
  container.appendChild(btnProximo);
}

function atualizarResultadosInfo(reportsLength, totalItems, currentPage) {
  const spanInfo = elementos.resultadosInfoSpan;
  if (!spanInfo) return;

  const from = (currentPage - 1) * limitePorPagina + 1;
  const to = from + reportsLength - 1;

  if (totalItems === 0) {
    spanInfo.textContent = "Nenhum resultado encontrado";
  } else {
    spanInfo.textContent = `Mostrando ${from}-${to} de ${totalItems} resultados`;
  }
}