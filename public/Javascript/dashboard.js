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
  ATUALIZACAO_TEMPO_REAL: 15000, // 15 segundos
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
  cardsStatus: null, // Adicionado
};

// ===== ESTADO DA APLICAÇÃO =====
let estado = {
  menuAberto: true,
  modoEscuroAtivo: false,
  dadosFiltrados: false,
  tempoRealAtivo: true,
};

// ===== INICIALIZAÇÃO =====
document.addEventListener("DOMContentLoaded", function () {
  inicializarElementos();
  criarOverlay();
  carregarPreferencias();
  inicializarAplicacao();
  carregarPerfilUsuario();
  mostrarProblemasRecentes();
});

function inicializarElementos() {
  elementos = {
    menuToggle: document.getElementById("menuToggle"),
    barraLateral: document.querySelector(".barra-lateral"),
    darkModeToggle: document.getElementById("dark-mode-toggle"),
    searchInput: document.querySelector(".search-box input"),
    chartFilter: document.querySelector(".chart-filter"),
    viewAllBtn: document.querySelector(".view-all"),
    actionButtons: document.querySelectorAll(".action-buttons .action-btn"), // Seleção mais específica
    statusBadges: document.querySelectorAll(".status-badge"),
    cardsStatus: document.querySelectorAll(".status-card"),
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

  verificarTamanhoTela();
}

function inicializarAplicacao() {
  // A inicialização dos gráficos agora é feita em charts.js
  // inicializarGraficos(); // Removido
  inicializarTooltips();
  configurarEventListeners();
  animarElementos();
  iniciarAtualizacaoTempoReal();
  configurarObservadorIntersecao();
  configurarServiceWorker();
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
    elementos.menuToggle.addEventListener("keypress", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        estado.menuAberto = toggleMenuLateral(
          elementos.barraLateral,
          elementos.menuToggle,
          elementos.overlay,
          estado.menuAberto
        );
      }
    });
  }

  // Dark mode toggle
  if (elementos.darkModeToggle) {
    elementos.darkModeToggle.addEventListener("change", () => {
      estado.modoEscuroAtivo = toggleModoEscuro(estado.modoEscuroAtivo);
    });
  }

  // Search input
  if (elementos.searchInput) {
    elementos.searchInput.addEventListener(
      "input",
      debounce(pesquisarConteudo, 300)
    );
    elementos.searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        elementos.searchInput.value = "";
        pesquisarConteudo({ target: elementos.searchInput });
      }
    });
  }

  // Chart filter
  if (elementos.chartFilter) {
    elementos.chartFilter.addEventListener("change", filtrarGrafico);
  }

  // Action buttons
  elementos.actionButtons.forEach((botao) => {
    botao.addEventListener("click", handleActionClick);
    botao.addEventListener("keypress", (e) => {
      if (e.key === "Enter" || e.key === " ") handleActionClick.call(botao, e);
    });
  });

  // Status badges (se houver necessidade de filtrar por eles)
  // elementos.statusBadges.forEach(badge => {
  //     badge.addEventListener('click', () => filtrarPorStatus(badge.textContent));
  //     badge.addEventListener('keypress', (e) => {
  //         if (e.key === 'Enter' || e.key === ' ') filtrarPorStatus(badge.textContent);
  //     });
  // });

  // Eventos de teclado
  document.addEventListener("keydown", handleKeyboardShortcuts);

  // Redimensionamento da janela
  window.addEventListener("resize", debounce(verificarTamanhoTela, 250));
}

// ===== PESQUISAR CONTEÚDO =====
function pesquisarConteudo(e) {
  const termo = e.target.value.toLowerCase().trim();

  const linhasTabela = document.querySelectorAll(".tabela-recentes tbody tr");
  let resultados = 0;

  linhasTabela.forEach((linha) => {
    const textoLinha = linha.textContent.toLowerCase();
    if (textoLinha.includes(termo)) {
      linha.style.display = "";
      linha.classList.add("highlight");
      resultados++;
    } else {
      linha.style.display = "none";
      linha.classList.remove("highlight");
    }
  });

  mostrarResultadoPesquisa(resultados);
  estado.dadosFiltrados = termo.length > 0;
}

function mostrarResultadoPesquisa(resultados) {
  let mensagem = document.getElementById("resultado-pesquisa");

  if (!mensagem) {
    mensagem = document.createElement("div");
    mensagem.id = "resultado-pesquisa";
    mensagem.style.cssText = `
            padding: 10px;
            margin: 10px 0;
            background: var(--info-light);
            border-left: 4px solid var(--accent-blue);
            border-radius: 4px;
            color: var(--text-primary);
        `;
    document.querySelector(".tabela-recentes").appendChild(mensagem);
  }

  mensagem.textContent = `${resultados} resultado(s) encontrado(s)`;
  if (resultados === 0) {
    mensagem.style.backgroundColor = "var(--danger-light)";
    mensagem.style.borderColor = "var(--accent-red)";
  } else {
    mensagem.style.backgroundColor = "var(--info-light)";
    mensagem.style.borderColor = "var(--accent-blue)";
  }
}

function esconderResultadoPesquisa() {
  const mensagem = document.getElementById("resultado-pesquisa");
  if (mensagem) mensagem.remove();
}

// ===== FILTRAR GRÁFICO =====
function filtrarGrafico(e) {
  const periodo = e.target.value;

  const chartContainer = document.querySelector(".main-chart");
  chartContainer.classList.add("loading");

  // Chamar a função de atualização do charts.js
  if (
    window.GraficosDashboard &&
    window.GraficosDashboard.atualizarCategorias
  ) {
    window.GraficosDashboard.atualizarCategorias(periodo);
  }

  // O remover da classe 'loading' é feito dentro de charts.js agora
}

// ===== VER TODOS REPORTS =====

// ===== HANDLE ACTION CLICK =====
function handleActionClick(e) {
  const acaoSpan = this.querySelector("span");
  if (!acaoSpan) return; // Garante que o span existe
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

function exportarDados() {
  mostrarNotificacao("Dados exportados com sucesso!", "sucesso");
  document.dispatchEvent(new CustomEvent("exportacaoIniciada"));
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
                    <option value="todas">Todas</option>
                    <option value="Buraco">Buraco</option>
                    <option value="Iluminação">Iluminação</option>
                    <option value="Limpeza">Limpeza</option>
                    <option value="Sinalização">Sinalização</option>
                </select>
            </div>
            <button class="action-btn aplicar-filtros"><i class="fas fa-filter"></i> Aplicar Filtros</button>
            <button class="botao-acao limpar-filtros"><i class="fas fa-times"></i> Limpar Filtros</button>
        `;
    quickActionsDiv.appendChild(filtrosAvancados);

    // Adicionar listeners para os novos botões
    filtrosAvancados
      .querySelector(".aplicar-filtros")
      .addEventListener("click", () => {
        mostrarNotificacao("Filtros avançados aplicados!", "info");
        // Implementar lógica de filtragem real aqui
      });
    filtrosAvancados
      .querySelector(".limpar-filtros")
      .addEventListener("click", () => {
        filtrosAvancados.querySelectorAll("input, select").forEach((input) => {
          if (input.type === "date") input.value = "";
          else if (input.tagName === "SELECT") input.value = "todas";
        });
        mostrarNotificacao("Filtros avançados limpos!", "info");
        // Implementar lógica para remover filtros
      });

    setTimeout(() => filtrosAvancados.classList.add("ativo"), 10);
  } else {
    filtrosAvancados.classList.toggle("ativo");
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

// ===== ATUALIZAÇÃO EM TEMPO REAL =====
function iniciarAtualizacaoTempoReal() {
  if (!estado.tempoRealAtivo) return;

  setInterval(() => {
    if (document.visibilityState === "visible") {
      atualizarDadosTempoReal();
    }
  }, CONFIG.ATUALIZACAO_TEMPO_REAL);
}

function atualizarDadosTempoReal() {
  elementos.cardsStatus.forEach((card) => {
    const valorElemento = card.querySelector(".card-value");
    let valorAtual = parseInt(valorElemento.textContent);
    const variacao = Math.floor(Math.random() * 5) - 2;
    const novoValor = Math.max(0, valorAtual + variacao);

    animarContagem(valorElemento, valorAtual, novoValor);

    const tendencia = card.querySelector(".card-trend");
    if (tendencia) {
      // Verifica se o elemento tendência existe
      if (variacao > 0) {
        tendencia.className = "card-trend up";
        tendencia.innerHTML = `<i class="fas fa-arrow-up"></i> ${Math.abs(
          variacao
        )}%`;
      } else if (variacao < 0) {
        tendencia.className = "card-trend down";
        tendencia.innerHTML = `<i class="fas fa-arrow-down"></i> ${Math.abs(
          variacao
        )}%`;
      } else {
        tendencia.className = "card-trend"; // Sem mudança
        tendencia.innerHTML = "";
      }
    }
  });

  document.dispatchEvent(new CustomEvent("dadosAtualizados"));
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

// ===== OBSERVADOR DE INTERSEÇÃO (LAZY LOADING) =====
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

// ===== SERVICE WORKER (CACHE E OFFLINE) =====
function configurarServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  }
}

// ===== UTILITÁRIOS =====
function formatarNumero(numero) {
  if (numero >= 1000000) {
    return (numero / 1000000).toFixed(1) + "M";
  } else if (numero >= 1000) {
    return (numero / 1000).toFixed(1) + "K";
  }
  return numero;
}

function handleKeyboardShortcuts(e) {
  // Ctrl/Cmd + K para focar na pesquisa
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    elementos.searchInput.focus();
  }

  // Esc para limpar pesquisa
  if (e.key === "Escape" && document.activeElement === elementos.searchInput) {
    elementos.searchInput.value = "";
    pesquisarConteudo({ target: elementos.searchInput });
    elementos.searchInput.blur();
  }
}

// ===== EXPORTAÇÃO PARA USO EXTERNO =====
window.Dashboard = {
  toggleMenu: () => {
    // Wrapper para a função centralizada
    elementos.menuToggle.click(); // Simula o clique no botão
  },
  toggleDarkMode: () => {
    // Wrapper para a função centralizada
    elementos.darkModeToggle.click(); // Simula o clique no switch
  },
  exportarDados: exportarDados,
  atualizarGrafico: filtrarGrafico, // Renomeado para refletir a ação
  mostrarNotificacao: mostrarNotificacao,
};

async function mostrarProblemasRecentes() {
  const tabela = document.getElementById("reportsRecentes");

  const reports = await api.obterReportsPorPeriodo(7);

  const todasCategorias = [
    ...reports.problemasResolvidos,
    ...reports.problemasEmAndamento,
    ...reports.problemasPendentes,
  ];

  todasCategorias.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>#${item.id}</td>
      <td>${item.nome_categoria}</td>
      <td>${item.endereco}</td>
      <td><span class="status-badge">${item.nome_status}</span></td>
      <td>${new Date(item.data_criacao).toLocaleDateString("pt-BR")}</td>
    `;
    tabela.appendChild(tr);
  });
}

btnSair.addEventListener("click", async (e) => {
  e.preventDefault();
  authUtils.logout();
});
