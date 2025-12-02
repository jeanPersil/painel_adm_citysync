import {
  toggleMenuLateral,
  toggleModoEscuro,
  mostrarNotificacao,
  debounce,
  carregarPerfilUsuario,
  authUtils,
} from "./utils.js";

import { api } from "./api.js";

// ===== CONSTANTES E CONFIGURAÇÕES =====
const CONFIG = {
  ATUALIZACAO_TEMPO_REAL: 30000, 
  ANIMACAO_ENTRADA: 300,
  NOTIFICACAO_TIMEOUT: 5000,
  LOCAL_STORAGE_KEYS: {
    MODO_ESCURO: "darkMode",
    MENU_ABERTO: "menuAberto",
  },
};

// ===== ELEMENTOS DO DOM =====
const btnSair = document.getElementById("btnSair");

let elementos = {
  menuToggle: null,
  barraLateral: null,
  darkModeToggle: null,
  searchInput: null,
  chartFilter: null,
  viewAllBtn: null,
  actionButtons: null,
  statusBadges: null,
  overlay: null,
  cardsStatus: null,
  cardTotalReports: null,
  cardPendentes: null,
  cardEmAndamento: null,
  cardResolvidos: null,
};

// ===== ESTADO DA APLICAÇÃO =====
let estado = {
  menuAberto: true,
  modoEscuroAtivo: false,
  dadosFiltrados: false,
  tempoRealAtivo: true,
  ultimaAtualizacao: null,
  estatisticas: {
    total: 0,
    pendentes: 0,
    emAndamento: 0,
    resolvidos: 0,
  },
};

// ===== INICIALIZAÇÃO =====
document.addEventListener("DOMContentLoaded", function () {
  inicializarElementos();
  criarOverlay();
  carregarPreferencias();
  inicializarAplicacao();
  carregarPerfilUsuario();
  carregarDadosDashboard(); 
});

function inicializarElementos() {
  elementos = {
    menuToggle: document.getElementById("menuToggle"),
    barraLateral: document.querySelector(".barra-lateral"),
    darkModeToggle: document.getElementById("dark-mode-toggle"),
    searchInput: document.querySelector(".search-box input"),
    chartFilter: document.querySelector(".chart-filter"),
    viewAllBtn: document.querySelector(".view-all"),
    actionButtons: document.querySelectorAll(".action-buttons .action-btn"),
    statusBadges: document.querySelectorAll(".status-badge"),
    cardsStatus: document.querySelectorAll(".status-card"),
    cardTotalReports: document.querySelector(".status-card:nth-child(1) .card-value"),
    cardPendentes: document.querySelector(".status-card:nth-child(2) .card-value"),
    cardEmAndamento: document.querySelector(".status-card:nth-child(3) .card-value"),
    cardResolvidos: document.querySelector(".status-card:nth-child(4) .card-value"),
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

function inicializarAplicacao() {
  inicializarTooltips();
  configurarEventListeners();
  animarElementos();
  iniciarAtualizacaoTempoReal();
  configurarObservadorIntersecao();
}


async function carregarDadosDashboard() {
  try {
    
    const resultado = await api.obterReportsPorPeriodo(7);
    
    if (resultado.success === false) {
      throw new Error(resultado.message);
    }

    // Atualizar estatísticas
    estado.estatisticas = {
      total: resultado.problemasResolvidos.length + 
             resultado.problemasEmAndamento.length + 
             resultado.problemasPendentes.length,
      pendentes: resultado.problemasPendentes.length,
      emAndamento: resultado.problemasEmAndamento.length,
      resolvidos: resultado.problemasResolvidos.length,
    };

    
    atualizarCardsEstatisticas();
    
    // Atualizar tabela
    await mostrarProblemasRecentes();
    
    estado.ultimaAtualizacao = new Date();
    
  } catch (error) {
    console.error("Erro ao carregar dados do dashboard:", error);
    mostrarNotificacao("Erro ao carregar dados do dashboard", "erro");
  }
}


function atualizarCardsEstatisticas() {
  if (elementos.cardTotalReports) {
    animarContagem(elementos.cardTotalReports, 0, estado.estatisticas.total);
  }
  if (elementos.cardPendentes) {
    animarContagem(elementos.cardPendentes, 0, estado.estatisticas.pendentes);
  }
  if (elementos.cardEmAndamento) {
    animarContagem(elementos.cardEmAndamento, 0, estado.estatisticas.emAndamento);
  }
  if (elementos.cardResolvidos) {
    animarContagem(elementos.cardResolvidos, 0, estado.estatisticas.resolvidos);
  }
}


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

// ===== INICIALIZAR TOOLTIPS =====
function inicializarTooltips() {
  const tooltipElements = document.querySelectorAll("[data-tooltip]");

  tooltipElements.forEach((element) => {
    element.addEventListener("mouseenter", mostrarTooltip);
    element.addEventListener("mouseleave", esconderTooltip);
    element.addEventListener("focus", mostrarTooltip);
    element.addEventListener("blur", esconderTooltip);
  });
}

function mostrarTooltip(e) {
  const tooltipTexto = this.getAttribute("data-tooltip");
  if (!tooltipTexto) return;

  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.textContent = tooltipTexto;
  tooltip.setAttribute("role", "tooltip");
  document.body.appendChild(tooltip);

  const rect = this.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  tooltip.style.top = `${rect.top + scrollTop - tooltip.offsetHeight - 10}px`;
  tooltip.style.left = `${
    rect.left + rect.width / 2 - tooltip.offsetWidth / 2
  }px`;

  this._tooltipElement = tooltip;
}

function esconderTooltip() {
  if (this._tooltipElement) {
    this._tooltipElement.remove();
    this._tooltipElement = null;
  }
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

  
  if (elementos.searchInput) {
    elementos.searchInput.addEventListener(
      "input",
      debounce(async (e) => {
        const termo = e.target.value.trim();
        if (termo.length >= 3) {
          await pesquisarConteudoAPI(termo);
        } else if (termo.length === 0) {
          await mostrarProblemasRecentes();
        }
      }, 500)
    );
    
    elementos.searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        elementos.searchInput.value = "";
        mostrarProblemasRecentes();
      }
    });
  }

  elementos.actionButtons.forEach((botao) => {
    botao.addEventListener("click", handleActionClick);
  });

  document.addEventListener("keydown", handleKeyboardShortcuts);
  window.addEventListener("resize", debounce(verificarTamanhoTela, 250));
}


async function pesquisarConteudoAPI(termo) {
  try {
    const resultado = await api.obterReportsFiltrados({ pesquisar: termo });
    
    if (!resultado.success) {
      throw new Error(resultado.message);
    }

    const tabela = document.querySelector("#reportsRecentes");
    tabela.innerHTML = "";

    if (resultado.reports.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="5" style="text-align:center;">Nenhum resultado encontrado para "${termo}"</td>`;
      tabela.appendChild(tr);
      return;
    }

    resultado.reports.slice(0, 10).forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>#${item.id}</td>
        <td>${item.nome_categoria}</td>
        <td>${item.endereco}</td>
        <td><span class="status-badge ${item.nome_status?.toLowerCase().replace(" ", "-")}">${item.nome_status}</span></td>
        <td>${new Date(item.data_criacao).toLocaleDateString("pt-BR")}</td>
      `;
      tabela.appendChild(tr);
    });

    mostrarNotificacao(`${resultado.reports.length} resultado(s) encontrado(s)`, "info");
    
  } catch (error) {
    console.error("Erro na pesquisa:", error);
    mostrarNotificacao("Erro ao pesquisar", "erro");
  }
}


function handleActionClick(e) {
  const acaoSpan = this.querySelector("span");
  if (!acaoSpan) return;
  const acao = acaoSpan.textContent;

  switch (acao) {
    case "Exportar Dados":
      exportarDados();
      break;
    case "Filtrar":
      toggleFiltros();
      break;
    case "Relatório":
      gerarRelatorio();
      break;
    default:
      console.log("Ação não reconhecida:", acao);
  }
}


async function exportarDados() {
  try {
    mostrarNotificacao("Preparando exportação...", "info");
    
    const resultado = await api.obterReportsPorPeriodo(30);
    
    if (resultado.success === false) {
      throw new Error(resultado.message);
    }

   
    const todosReports = [
      ...resultado.problemasResolvidos,
      ...resultado.problemasEmAndamento,
      ...resultado.problemasPendentes,
    ];

    
    const csv = [
      ["ID", "Categoria", "Endereço", "Status", "Data", "Descrição"],
      ...todosReports.map(r => [
        r.id,
        r.nome_categoria,
        r.endereco,
        r.nome_status,
        new Date(r.data_criacao).toLocaleDateString("pt-BR"),
        r.descricao
      ])
    ].map(row => row.join(";")).join("\n");

    // Download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reports_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    mostrarNotificacao("Dados exportados com sucesso!", "sucesso");
    
  } catch (error) {
    console.error("Erro ao exportar:", error);
    mostrarNotificacao("Erro ao exportar dados", "erro");
  }
}

function toggleFiltros() {
  const quickActionsDiv = document.querySelector(".quick-actions");
  let filtrosAvancados = quickActionsDiv.querySelector(".filtros-avancados");

  if (!filtrosAvancados) {
    filtrosAvancados = document.createElement("div");
    filtrosAvancados.className = "filtros-avancados";
    filtrosAvancados.innerHTML = `
      <h4>Filtros Avançados</h4>
      <div class="filtro-grupo">
        <label for="filtroDataInicial">Data Inicial</label>
        <input type="date" id="filtroDataInicial">
      </div>
      <div class="filtro-grupo">
        <label for="filtroDataFinal">Data Final</label>
        <input type="date" id="filtroDataFinal">
      </div>
      <div class="filtro-grupo">
        <label for="filtroCategoria">Categoria</label>
        <select id="filtroCategoria">
          <option value="">Todas</option>
          <option value="Buraco">Buraco</option>
          <option value="Iluminação">Iluminação</option>
          <option value="Lixo">Lixo</option>
          <option value="Semáforo">Semáforo</option>
          <option value="Vazamento/esgoto">Vazamento/esgoto</option>
          <option value="Transporte">Transporte</option>
          <option value="Outros">Outros</option>
        </select>
      </div>
      <button class="action-btn aplicar-filtros"><i class="fas fa-filter"></i> Aplicar Filtros</button>
      <button class="botao-acao limpar-filtros"><i class="fas fa-times"></i> Limpar Filtros</button>
    `;
    quickActionsDiv.appendChild(filtrosAvancados);

    filtrosAvancados
      .querySelector(".aplicar-filtros")
      .addEventListener("click", aplicarFiltrosAvancados);
    
    filtrosAvancados
      .querySelector(".limpar-filtros")
      .addEventListener("click", () => {
        filtrosAvancados.querySelectorAll("input, select").forEach((input) => {
          if (input.type === "date") input.value = "";
          else if (input.tagName === "SELECT") input.value = "";
        });
        mostrarProblemasRecentes();
        mostrarNotificacao("Filtros limpos!", "info");
      });

    setTimeout(() => filtrosAvancados.classList.add("ativo"), 10);
  } else {
    filtrosAvancados.classList.toggle("ativo");
  }
}


async function aplicarFiltrosAvancados() {
  try {
    const dataInicial = document.getElementById("filtroDataInicial").value;
    const dataFinal = document.getElementById("filtroDataFinal").value;
    const categoria = document.getElementById("filtroCategoria").value;

    const params = {};
    if (dataInicial) params.dataInicial = dataInicial;
    if (dataFinal) params.dataFinal = dataFinal;
    if (categoria) params.categoria = categoria;

    const resultado = await api.obterReportsFiltrados(params);
    
    if (!resultado.success) {
      throw new Error(resultado.message);
    }

    const tabela = document.querySelector("#reportsRecentes");
    tabela.innerHTML = "";

    resultado.reports.slice(0, 10).forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>#${item.id}</td>
        <td>${item.nome_categoria}</td>
        <td>${item.endereco}</td>
        <td><span class="status-badge ${item.nome_status?.toLowerCase().replace(" ", "-")}">${item.nome_status}</span></td>
        <td>${new Date(item.data_criacao).toLocaleDateString("pt-BR")}</td>
      `;
      tabela.appendChild(tr);
    });

    mostrarNotificacao("Filtros aplicados!", "sucesso");
    
  } catch (error) {
    console.error("Erro ao aplicar filtros:", error);
    mostrarNotificacao("Erro ao aplicar filtros", "erro");
  }
}

function gerarRelatorio() {
  mostrarNotificacao("Relatório sendo gerado...", "info");
  setTimeout(() => {
    mostrarNotificacao("Relatório gerado com sucesso!", "sucesso");
    
  }, 2000);
}

// ===== ANIMAÇÕES =====
function animarElementos() {
  animarCardsStatus();
  animarTabela();
  animarAtividades();
}

function animarCardsStatus() {
  elementos.cardsStatus.forEach((card, index) => {
    setTimeout(() => {
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, index * 150);
  });
}

function animarTabela() {
  const linhasTabela = document.querySelectorAll(".tabela-recentes tbody tr");
  linhasTabela.forEach((linha, index) => {
    setTimeout(() => {
      linha.style.opacity = "1";
      linha.style.transform = "translateX(0)";
    }, 600 + index * 100);
  });
}

function animarAtividades() {
  const atividades = document.querySelectorAll(".activity-item");
  atividades.forEach((atividade, index) => {
    setTimeout(() => {
      atividade.style.opacity = "1";
      atividade.style.transform = "translateX(0)";
    }, 1000 + index * 150);
  });
}


function iniciarAtualizacaoTempoReal() {
  if (!estado.tempoRealAtivo) return;

  setInterval(async () => {
    if (document.visibilityState === "visible") {
      await carregarDadosDashboard();
      console.log("Dashboard atualizado em tempo real");
    }
  }, CONFIG.ATUALIZACAO_TEMPO_REAL);
}

function animarContagem(elemento, valorInicial, valorFinal) {
  const duracao = 1000;
  const intervalo = 30;
  const passos = duracao / intervalo;
  const incremento = (valorFinal - valorInicial) / passos;
  let valorAtual = valorInicial;

  const timer = setInterval(() => {
    valorAtual += incremento;

    if (
      (incremento > 0 && valorAtual >= valorFinal) ||
      (incremento < 0 && valorAtual <= valorFinal)
    ) {
      elemento.textContent = Math.round(valorFinal);
      clearInterval(timer);
    } else {
      elemento.textContent = Math.round(valorAtual);
    }
  }, intervalo);
}


function configurarObservadorIntersecao() {
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visivel");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document
      .querySelectorAll(".card, .chart-container, .activity-item")
      .forEach((el) => {
        observer.observe(el);
      });
  }
}

function handleKeyboardShortcuts(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    elementos.searchInput.focus();
  }

  if (e.key === "Escape" && document.activeElement === elementos.searchInput) {
    elementos.searchInput.value = "";
    mostrarProblemasRecentes();
    elementos.searchInput.blur();
  }
}


async function mostrarProblemasRecentes() {
  const tabela = document.getElementById("reportsRecentes");
  tabela.innerHTML = "";

  try {
    const resultado = await api.obterReportsPorPeriodo(7);

    let todasCategorias = [
      ...resultado.problemasResolvidos,
      ...resultado.problemasEmAndamento,
      ...resultado.problemasPendentes,
    ];

    todasCategorias = todasCategorias.slice(0, 10);

    todasCategorias.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>#${item.id}</td>
        <td>${item.nome_categoria}</td>
        <td>${item.endereco}</td>
        <td><span class="status-badge ${item.nome_status?.toLowerCase().replace(" ", "-")}">${item.nome_status}</span></td>
        <td>${new Date(item.data_criacao).toLocaleDateString("pt-BR")}</td>
      `;
      tabela.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao carregar problemas recentes:", error);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" style="text-align:center;">Erro ao carregar dados</td>`;
    tabela.appendChild(tr);
  }
}

// ===== EXPORTAÇÃO =====
window.Dashboard = {
  toggleMenu: () => {
    elementos.menuToggle.click();
  },
  toggleDarkMode: () => {
    elementos.darkModeToggle.click();
  },
  exportarDados: exportarDados,
  atualizarDados: carregarDadosDashboard,
  mostrarNotificacao: mostrarNotificacao,
};

btnSair.addEventListener("click", async (e) => {
  e.preventDefault();
  authUtils.logout();
});