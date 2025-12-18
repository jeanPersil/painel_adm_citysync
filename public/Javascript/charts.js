import { toggleModoEscuro, debounce } from "./utils.js";
import { api } from "./api.js";

let reports = [];

// Constantes para cores dos gráficos
const CHART_COLORS = {
  blue: "rgba(52, 152, 219, 1)",
  green: "rgba(46, 204, 113, 1)",
  red: "rgba(231, 76, 60, 1)",
  orange: "rgba(243, 156, 18, 1)",
  purple: "rgba(155, 89, 182, 1)",
  yellow: "rgba(241, 196, 15, 1)",

  blueLight: "rgba(52, 152, 219, 0.7)",
  greenLight: "rgba(46, 204, 113, 0.7)",
  orangeLight: "rgba(243, 156, 18, 0.7)",
  redLight: "rgba(231, 76, 60, 0.7)",
  purpleLight: "rgba(155, 89, 182, 0.7)",
  yellowLight: "rgba(241, 196, 15, 0.7)",
};

// Variáveis globais para os gráficos
let categoriaChart, statusChart;

function getTextColor() {
  return document.body.classList.contains("dark-mode") ? "#e0e0e0" : "#34495e";
}

function getGridColor() {
  return document.body.classList.contains("dark-mode")
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.1)";
}

// Inicialização dos gráficos
document.addEventListener("DOMContentLoaded", async function () {
  reports = await api.obterReportsPorPeriodo(7);
  setTimeout(initCharts, 100);
});

function initCharts() {
  criarGraficoCategorias();
  criarGraficoStatus();
  configurarEventListenersGraficos();
}

function configurarEventListenersGraficos() {
  const periodoSelect = document.getElementById("periodo-select");
  if (periodoSelect) {
    periodoSelect.addEventListener("change", async function () {
      reports = await api.obterReportsPorPeriodo(this.value);
      atualizarGraficoCategorias(this.value);
      if (statusChart) statusChart.destroy();
      criarGraficoStatus();
    });
  }

  document.addEventListener("modoEscuroAlterado", function (e) {
    setTimeout(function () {
      if (categoriaChart) {
        categoriaChart.destroy();
      }
      if (statusChart) {
        statusChart.destroy();
      }
      initCharts();
    }, 100);
  });
}

function criarGraficoCategorias() {
  const ctx = document.getElementById("categoriaChart");
  if (!ctx) return;

  const context = ctx.getContext("2d");
  const dados = obterDadosCategorias(7);

  categoriaChart = new Chart(context, {
    type: "bar",
    data: {
      labels: dados.labels,
      datasets: [
        {
          label: "Número de Reports",
          data: dados.valores,
          backgroundColor: [
            CHART_COLORS.blueLight,
            CHART_COLORS.greenLight,
            CHART_COLORS.orangeLight,
            CHART_COLORS.redLight,
            CHART_COLORS.purpleLight,
            CHART_COLORS.yellowLight,
          ],
          borderColor: [
            CHART_COLORS.blue,
            CHART_COLORS.green,
            CHART_COLORS.orange,
            CHART_COLORS.red,
            CHART_COLORS.purple,
            CHART_COLORS.yellow,
          ],
          borderWidth: 1,
          borderRadius: 5,
          hoverBackgroundColor: [
            CHART_COLORS.blue,
            CHART_COLORS.green,
            CHART_COLORS.orange,
            CHART_COLORS.red,
            CHART_COLORS.purple,
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: document.body.classList.contains("dark-mode")
            ? "rgba(30, 30, 30, 0.9)"
            : "rgba(0, 0, 0, 0.8)",
          titleColor: "#fff",
          bodyColor: "#fff",
          titleFont: {
            size: 14,
            weight: "bold",
          },
          bodyFont: {
            size: 13,
          },
          padding: 10,
          cornerRadius: 5,
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.raw}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: getGridColor(),
          },
          ticks: {
            font: {
              size: 12,
            },
            color: getTextColor(),
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 12,
            },
            color: getTextColor(),
          },
        },
      },
      animation: {
        duration: 1000,
        easing: "easeOutQuart",
      },
    },
  });
}

function criarGraficoStatus() {
  const ctx = document.getElementById("statusChart");
  if (!ctx) return;

  const context = ctx.getContext("2d");

  statusChart = new Chart(context, {
    type: "doughnut",
    data: {
      labels: [
        "Resolvidos",
        "Em Andamento",
        "Abertos",
        "Inválidos",
        "Em análise",
      ],
      datasets: [
        {
          data: [
            reports.problemasResolvidos?.length || 0,
            reports.problemasEmAndamento?.length || 0,
            reports.problemasPendentes?.length || 0,
            reports.problemasInvalidos?.length || 0,
            reports.problemasEmAnalise?.length || 0,
          ],
          backgroundColor: [
            CHART_COLORS.greenLight,
            CHART_COLORS.orangeLight,
            CHART_COLORS.blueLight,
            CHART_COLORS.redLight,
            CHART_COLORS.purpleLight,
          ],
          borderColor: [
            CHART_COLORS.green,
            CHART_COLORS.orange,
            CHART_COLORS.blue,
            CHART_COLORS.red,
            CHART_COLORS.purple,
          ],
          borderWidth: 1,
          hoverOffset: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "60%",
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: document.body.classList.contains("dark-mode")
            ? "rgba(30, 30, 30, 0.9)"
            : "rgba(0, 0, 0, 0.8)",
          titleColor: "#fff",
          bodyColor: "#fff",
          titleFont: {
            size: 14,
            weight: "bold",
          },
          bodyFont: {
            size: 13,
          },
          padding: 10,
          cornerRadius: 5,
          callbacks: {
            label: function (context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage =
                total > 0 ? Math.round((context.raw / total) * 100) : 0;
              return `${context.label}: ${context.raw} (${percentage}%)`;
            },
          },
        },
      },
      animation: {
        animateScale: true,
        animateRotate: true,
        duration: 1000,
        easing: "easeOutQuart",
      },
    },
  });

  criarLegendaPersonalizada();
}

function criarLegendaPersonalizada() {
  const legendContainer = document.getElementById("pieLegend");
  if (!legendContainer) return;

  const labels = [
    "Resolvidos",
    "Em Andamento",
    "Abertos",
    "Inválidos",
    "Em análise",
  ];
  const colors = [
    CHART_COLORS.green,
    CHART_COLORS.orange,
    CHART_COLORS.blue,
    CHART_COLORS.red,
    CHART_COLORS.purple,
  ];
  const values = [
    reports.problemasResolvidos?.length || 0,
    reports.problemasEmAndamento?.length || 0,
    reports.problemasPendentes?.length || 0,
    reports.problemasInvalidos?.length || 0,
    reports.problemasEmAnalise?.length || 0,
  ];

  const total = values.reduce((a, b) => a + b, 0);

  let legendHTML = '<div class="custom-legend">';

  labels.forEach((label, index) => {
    const percentage =
      total > 0 ? Math.round((values[index] / total) * 100) : 0;
    legendHTML += `
      <div class="legend-item">
        <span class="legend-color" style="background-color: ${colors[index]}"></span>
        <span>${label}: ${values[index]} (${percentage}%)</span>
      </div>
    `;
  });

  legendHTML += "</div>";
  legendContainer.innerHTML = legendHTML;
}

// Obter dados para o gráfico de categorias baseado no período
function obterDadosCategorias(dias) {
  const todasCategorias = [
    ...(reports.problemasResolvidos || []),
    ...(reports.problemasEmAndamento || []),
    ...(reports.problemasPendentes || []),
    ...(reports.problemasEmAnalise || []),
    ...(reports.problemasInvalidos || []),
  ];

  const contagem = {};
  todasCategorias.forEach((item) => {
    const categoria = item.nome_categoria || "Outros";
    contagem[categoria] = (contagem[categoria] || 0) + 1;
  });

  const labels = Object.keys(contagem);
  const valores = Object.values(contagem);

  return { labels, valores };
}

function atualizarGraficoCategorias(dias) {
  const chartContainer = document.querySelector(".main-chart");
  if (chartContainer) {
    chartContainer.classList.add("loading");
  }

  setTimeout(() => {
    const novosDados = obterDadosCategorias(dias);

    if (categoriaChart) {
      categoriaChart.data.labels = novosDados.labels;
      categoriaChart.data.datasets[0].data = novosDados.valores;

      categoriaChart.options.scales.x.ticks.color = getTextColor();
      categoriaChart.options.scales.y.ticks.color = getTextColor();
      categoriaChart.options.scales.y.grid.color = getGridColor();

      categoriaChart.update();
    }

    if (chartContainer) {
      chartContainer.classList.remove("loading");
    }

    document.dispatchEvent(
      new CustomEvent("graficoAtualizado", {
        detail: { tipo: "categorias", periodo: dias },
      })
    );
  }, 800);
}

// Exportar funções para uso global
window.GraficosDashboard = {
  atualizarCategorias: atualizarGraficoCategorias,
  recriarGraficos: initCharts,
};
