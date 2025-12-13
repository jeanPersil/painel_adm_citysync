// ===== SUBSTITUIR TODO O ARQUIVO public/Javascript/reports.js =====

import {
  carregarPerfilUsuario,
  mostrarNotificacao,
  authUtils,
} from "./utils.js";
import { api } from "./api.js";

// Variáveis de estado para paginação
let paginaAtual = 1;
const limitePorPagina = 10;

// Variável global para armazenar o report atual sendo visualizado
let reportAtualVisualizado = null;

// Objeto de elementos do DOM
const elementos = {
  // Modais
  viewModal: document.getElementById("reportModal"),
  viewModalClose: document.getElementById("modalClose"),
  closeViewModalBtn: document.getElementById("closeViewModalBtn"),
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
  editPrioridade: document.getElementById("editPrioridade"),
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
  initExportButton();

  if (elementos.btnSair) {
    elementos.btnSair.addEventListener("click", async (e) => {
      e.preventDefault();
      authUtils.logout();
    });
  }
});

// ===== MODO ESCURO =====
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

// ===== MENU MOBILE =====
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

// ===== MODAL DE VISUALIZAÇÃO =====
function initModal() {
  const modal = elementos.viewModal;
  if (!modal) return;

  function closeViewModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
    reportAtualVisualizado = null;
  }
  
  if (elementos.viewModalClose) {
    elementos.viewModalClose.addEventListener("click", closeViewModal);
  }
  
  if (elementos.closeViewModalBtn) {
    elementos.closeViewModalBtn.addEventListener("click", closeViewModal);
  }
  
  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeViewModal();
    }
  });
  
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && modal.classList.contains("active")) {
      closeViewModal();
    }
  });
}

// ===== MODAL DE EDIÇÃO =====
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
  elementos.editPrioridade.value = reportData.prioridade || "Média";
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
      prioridade: elementos.editPrioridade.value,
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

// ===== INTERAÇÕES DA TABELA =====
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

// ===== FILTROS E RENDERIZAÇÃO =====
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

// ===== EXPORTAÇÃO =====
function initExportButton() {
  const exportBtn = document.querySelector('.btn-secondary');
  
  if (!exportBtn) return;
  
  exportBtn.addEventListener('click', async () => {
    exportBtn.disabled = true;
    exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exportando...';
    
    try {
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

      const params = {
        pesquisar,
        endereco,
        data,
        status,
        categoria,
        page: 1,
        limit: 99999
      };
      
      const result = await api.obterReportsFiltrados(params);
      
      if (!result.success || !result.reports) {
        throw new Error('Erro ao buscar reports para exportação');
      }
      
      exportarParaCSV(result.reports);
      
      mostrarNotificacao('Arquivo exportado com sucesso!', 'sucesso');
      
    } catch (error) {
      console.error('Erro ao exportar:', error);
      mostrarNotificacao('Erro ao exportar arquivo: ' + error.message, 'erro');
    } finally {
      exportBtn.disabled = false;
      exportBtn.innerHTML = '<i class="fas fa-download"></i> Exportar';
    }
  });
}

function exportarParaCSV(reports) {
  if (!reports || reports.length === 0) {
    mostrarNotificacao('Nenhum report para exportar', 'aviso');
    return;
  }
  
  const headers = [
    'ID',
    'Endereço',
    'Data de Criação',
    'Status',
    'Categoria',
    'Prioridade',
    'Descrição',
    'URL Imagem'
  ];
  
  const rows = reports.map(report => [
    report.id || '',
    `"${(report.endereco || '').replace(/"/g, '""')}"`,
    report.data_criacao ? new Date(report.data_criacao).toLocaleDateString('pt-BR') : '',
    report.nome_status || '',
    report.nome_categoria || '',
    report.prioridade || '',
    `"${(report.descricao || '').replace(/"/g, '""')}"`,
    report.url_imagem || ''
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  const BOM = '\uFEFF';
  const csvContentWithBOM = BOM + csvContent;
  
  const blob = new Blob([csvContentWithBOM], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  const now = new Date();
  const fileName = `reports_citysync_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.csv`;
  
  if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, fileName);
  } else {
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  }
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

  const params = {
    pesquisar,
    endereco,
    data,
    status,
    categoria,
    page: paginaAtual,
    limit: limitePorPagina,
  };

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
    console.error("Erro interno:", error);
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
        reportAtualVisualizado = reportData;
        
        document.getElementById("modalReportId").textContent = reportData.id;
        document.getElementById("modalBairro").textContent = reportData.endereco || "-";
        document.getElementById("modalData").textContent = new Date(
          reportData.data_criacao
        ).toLocaleDateString("pt-BR");
        document.getElementById("modalCategoria").textContent = reportData.nome_categoria || "-";
        document.getElementById("modalDescricao").textContent = reportData.descricao || "Sem descrição disponível";
        
        const statusElement = document.getElementById("modalStatus");
        const statusClass = reportData.nome_status?.toLowerCase().replace(" ", "-") || "indefinido";
        statusElement.innerHTML = `<span class="status status-${statusClass}">${reportData.nome_status || "-"}</span>`;
        
        document.getElementById("modalPrioridade").textContent = reportData.prioridade || "Média";
        document.getElementById("modalResponsavel").textContent = "Não atribuído";
        document.getElementById("modalDataPrevista").textContent = "Não definida";

        exibirImagensDoReport(reportData);

        elementos.viewModal.classList.add("active");
        document.body.style.overflow = "hidden";
      }
    });
  });
}

/**
 * Exibe as imagens do report no modal
 * @param {Object} reportData - Dados do report
 */
function exibirImagensDoReport(reportData) {
  const imagesContainer = document.querySelector(".modal-images-grid");
  
  if (!imagesContainer) {
    console.error("Container de imagens não encontrado");
    return;
  }

  imagesContainer.innerHTML = "";

  if (reportData.url_imagem && reportData.url_imagem.trim() !== "") {
    const imageUrl = reportData.url_imagem.trim();
    
    const imageWrapper = document.createElement("div");
    imageWrapper.className = "modal-image-wrapper";
    
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = `Imagem do Report #${reportData.id}`;
    img.className = "modal-image-real";
    
    img.addEventListener("load", () => {
      imageWrapper.classList.add("loaded");
    });
    
    img.addEventListener("error", () => {
      imageWrapper.innerHTML = `
        <div class="modal-image-placeholder error">
          <i class="fas fa-image-slash"></i>
          <span>Erro ao carregar imagem</span>
        </div>
      `;
    });
    
    // ✅ CORRIGIDO: Click no wrapper inteiro, não apenas na imagem
    imageWrapper.addEventListener("click", () => {
      expandirImagem(imageUrl, reportData.id);
    });
    
    imageWrapper.appendChild(img);
    imagesContainer.appendChild(imageWrapper);
    
  } else {
    imagesContainer.innerHTML = `
      <div class="modal-image-placeholder">
        <i class="fas fa-image"></i>
        <span>Nenhuma imagem anexada</span>
      </div>
    `;
  }
}

/**
 * Expande a imagem em tela cheia
 * @param {string} imageUrl - URL da imagem
 * @param {number} reportId - ID do report
 */
function expandirImagem(imageUrl, reportId) {
  const overlay = document.createElement("div");
  overlay.className = "image-fullscreen-overlay";
  overlay.innerHTML = `
    <div class="image-fullscreen-content">
      <button class="image-fullscreen-close" aria-label="Fechar">
        <i class="fas fa-times"></i>
      </button>
      <img src="${imageUrl}" alt="Imagem do Report #${reportId}" />
      <div class="image-fullscreen-info">
        <span>Report #${reportId}</span>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.closest(".image-fullscreen-close")) {
      overlay.classList.add("closing");
      setTimeout(() => overlay.remove(), 300);
    }
  });
  
  const handleEsc = (e) => {
    if (e.key === "Escape") {
      overlay.classList.add("closing");
      setTimeout(() => overlay.remove(), 300);
      document.removeEventListener("keydown", handleEsc);
    }
  };
  document.addEventListener("keydown", handleEsc);
  
  setTimeout(() => overlay.classList.add("active"), 10);
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

// ===== PAGINAÇÃO =====
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