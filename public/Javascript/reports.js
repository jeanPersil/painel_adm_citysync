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

// const btnSair = document.getElementById("btnSair"); // REMOVIDO DAQUI

// --- ADICIONADO: Variáveis de estado para paginação ---
let paginaAtual = 1;
const limitePorPagina = 10; // Defina quantos itens por página você quer

// --- Objeto de elementos do DOM ---
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

  // --- MODIFICADO: Seletores para os elementos do HTML ---
  // (Não precisamos de IDs, vamos usar as classes existentes)
  resultadosInfoSpan: document.querySelector(".tabela-footer .resultados-info"),
  paginacaoContainer: document.querySelector(".tabela-footer .paginacao"),
  btnSair: document.getElementById("btnSair"), // Adicionado aqui
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
  initEditModal();
  initTableInteractions();
  initFilters(); // Esta função agora também carrega os dados iniciais
  carregarPerfilUsuario();

  // --- ADICIONADO: Listener do btnSair movido para cá ---
  if (elementos.btnSair) {
    elementos.btnSair.addEventListener("click", async (e) => {
      e.preventDefault();
      authUtils.logout();
    });
  }

  // --- REMOVIDO: A paginação falsa não é mais inicializada ---
  // initPagination();
});

// ==================================
// 2. MODO ESCURO
// ==================================
function initDarkMode() {
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const body = document.body;
  if (!darkModeToggle) return; // Segurança
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
  if (!menuToggle || !sidebar || !overlay) return; // Segurança
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
// 4. MODAL DE VISUALIZAÇÃO E EDIÇÃO
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
  if (!elementos.editModal || !elementos.editReportForm) return; // Segurança
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
      // --- MODIFICADO: Chamar a função principal de recarga ---
      applyFilters(); // Recarrega os dados da página atual
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
  // NOTA: A ordenação (sortTable) só ordena os 10 itens da página atual.
  const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
  const headerCheckbox = document.querySelector('thead input[type="checkbox"]');
  
  if (headerCheckbox) {
    headerCheckbox.addEventListener("change", function () {
      const isChecked = this.checked;
      const pageCheckboxes = document.querySelectorAll('tbody input[type="checkbox"]'); // Seleciona apenas os da página atual
      pageCheckboxes.forEach((checkbox) => {
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
    if(row) { // Verificação de segurança
      if (checkbox.checked) {
        row.classList.add("selected");
      } else {
        row.classList.remove("selected");
      }
    }
  }

  function updateHeaderCheckbox() {
    if (!headerCheckbox) return;
    const checkedCount = document.querySelectorAll(
      'tbody input[type="checkbox"]:checked'
    ).length;
    const totalCount = document.querySelectorAll('tbody input[type="checkbox"]').length;
    headerCheckbox.checked = (totalCount > 0) && (checkedCount === totalCount);
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
  if (!table || !tbody) return; // Segurança
  
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
// 6. FILTROS, PESQUISA E RENDERIZAÇÃO
// ==================================

function initFilters() {
  // Aplicar filtros
  if (elementos.applyFiltersBtn) {
    elementos.applyFiltersBtn.addEventListener("click", () => {
      paginaAtual = 1; // Reseta a página ao aplicar filtros
      applyFilters();
    });
  }

  // Limpar filtros
  if (elementos.clearFiltersBtn) {
    elementos.clearFiltersBtn.addEventListener("click", () => {
      paginaAtual = 1; // Reseta a página
      clearFilters();
    });
  }

  // Pesquisa em tempo real
  if (elementos.searchInput) {
    elementos.searchInput.addEventListener(
      "input",
      debounce(() => {
        paginaAtual = 1; // Reseta a página
        applyFilters();
      }, 500) // Aumentado para 500ms para chamadas de API
    );
  }

  // Carga inicial
  applyFilters();
}

/**
 * Função principal que busca dados da API
 */
async function applyFilters() {
  // Captura dos campos
  const pesquisarInput = document.querySelector(
    ".search-field .filter-input"
  );
  // NOTA: Esta forma de pegar os inputs é frágil.
  // É melhor dar IDs para eles no HTML.
  const bairroInput = document.querySelectorAll(".filter-input")[1];
  const dataInput = document.querySelectorAll(".filter-input")[2];
  const statusSelect = document.querySelectorAll(".select-field select")[0];
  const categoriaSelect = document.querySelectorAll(".select-field select")[1];

  const pesquisar = pesquisarInput?.value?.trim() || "";
  const endereco = bairroInput?.value?.trim() || "";
  const data = dataInput?.value || "";
  const status = statusSelect?.value !== "todos" ? statusSelect?.value : "";
  const categoria =
    categoriaSelect?.value !== "" ? categoriaSelect?.value : "";

  // --- MODIFICADO: Adiciona paginação aos parâmetros ---
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
    // --- ADICIONADO: Estado de carregamento ---
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

    // --- MODIFICADO: Chama as novas funções de renderização ---
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
    // ATENÇÃO: Estes counts são baseados APENAS nos itens da página atual.
    const pendentes = reports.filter(
      (r) => r.nome_status === "Pendente"
    ).length;
    const emAndamento = reports.filter(
      (r) => r.nome_status === "Em andamento"
    ).length;
    const resolvidos = reports.filter(
      (r) => r.nome_status === "Resolvido"
    ).length;

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
      report.nome_categoria?.toLowerCase().replace("/", "-").replace(" ", "-") || "" // Corrige classes CSS
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

  // Re-anexa os eventos
  adicionarEventosRemover();
  adicionarEventosEditar(reports);
  adicionarEventosVisualizar(reports);
  // Re-inicializa os eventos de checkbox/sort para a nova tabela
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
        document.getElementById("modalBairro").textContent = reportData.endereco || "-";
        document.getElementById("modalData").textContent = new Date(
          reportData.data_criacao
        ).toLocaleDateString("pt-BR");
        document.getElementById("modalCategoria").textContent = reportData.nome_categoria || "-";
        document.getElementById("modalDescricao").textContent = reportData.descricao || "Sem descrição disponível";
        

        const statusElement = document.getElementById("modalStatus");
        statusElement.textContent = reportData.nome_status || "-";
        statusElement.className = "status";
        if (reportData.nome_status) {
          statusElement.classList.add(
            `status-${reportData.nome_status.toLowerCase().replace(" ", "-")}`
          );
        }
        
   
        const prioridadeElement = document.getElementById("modalPrioridade");
        prioridadeElement.textContent = reportData.nome_categoria || "-";
        prioridadeElement.className = "prioridade";
        if (reportData.nome_categoria) {
          prioridadeElement.classList.add(
            reportData.nome_categoria.toLowerCase().replace("/", "-").replace(" ", "-")
          );
        }

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
        
        if (result != null) {
          throw new Error(result.message || "Erro ao excluir");
        }
        
        mostrarNotificacao("Reporte excluido com sucesso", "sucesso");
        // --- ADICIONADO: Verifica se a página atual ficou vazia ---
        if (elementos.tbody.rows.length === 1) { // Se só tinha 1 item
          paginaAtual = Math.max(1, paginaAtual - 1); // Volta uma página
        }
        applyFilters(); // Recarrega a página
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
  applyFilters(); // Chama a função principal
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
// 7. PAGINAÇÃO
// ==================================

// --- ADICIONADO: Nova função para renderizar a paginação dinamicamente ---
function renderizarPaginacao(totalPages, currentPage) {
  const container = elementos.paginacaoContainer;
  if (!container) {
    console.error("Contêiner de paginação não encontrado.");
    return;
  }
  
  // Limpa os botões estáticos ("1", "2", "3") do HTML
  container.innerHTML = ""; 

  if (totalPages <= 1) return; // Não mostra nada se só tiver 1 página

  // Botão "Anterior"
  const btnAnterior = document.createElement("button");
  btnAnterior.className = "btn-pagina";
  btnAnterior.innerHTML = `<i class="fas fa-chevron-left"></i>`;
  btnAnterior.disabled = currentPage === 1;
  btnAnterior.addEventListener("click", () => {
    if (currentPage > 1) {
      paginaAtual--;
      applyFilters(); // Recarrega os dados da nova página
    }
  });
  container.appendChild(btnAnterior);

  // --- Lógica de Paginação Melhorada (Evita 1000 botões) ---
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
      applyFilters(); // Recarrega os dados da página clicada
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
  // --- Fim da Lógica de Paginação Melhorada ---

  // Botão "Próximo"
  const btnProximo = document.createElement("button");
  btnProximo.className = "btn-pagina";
  btnProximo.innerHTML = `<i class="fas fa-chevron-right"></i>`;
  btnProximo.disabled = currentPage === totalPages;
  btnProximo.addEventListener("click", () => {
    if (currentPage < totalPages) {
      paginaAtual++;
      applyFilters(); // Recarrega os dados da nova página
    }
  });
  container.appendChild(btnProximo);
}

// --- ADICIONADO: Nova função para atualizar o texto "Mostrando X de Y" ---
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

