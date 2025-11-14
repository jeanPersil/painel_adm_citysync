/**
 * SERVICE - Camada de regras de negócio para Reports
 *
 * Responsabilidades:
 * - Orquestrar operações com reports (CRUD, filtros, estatísticas)
 * - Aplicar transformações e mapeamentos de dados
 * - Implementar lógica de agregação e categorização
 * - Validar e processar dados antes do repositório
 * - Converter entre formatos (frontend ←→ banco)
 *
 * NÃO lida com HTTP (controller)
 * NÃO acessa banco diretamente (repository)
 */

import reportRepositories from "../repositories/reportsRepositories.js";
import ReportModel from "../models/reportModel.js";
import { mapearCategoria, mapearStatus } from "../utils/utils.js";

class ReportService {
  async obterReportesPeriodo(periodoDeReports) {
    let dataInicio = new Date();
    let dataFim = new Date();
    dataInicio.setDate(dataFim.getDate() - parseInt(periodoDeReports));

    const data = await reportRepositories.reportesPeriodo(dataInicio, dataFim);

    const reports = data.map((row) => ({
      ...ReportModel.fromDb(row),
    }));

    const problemasResolvidos = reports.filter(
      (r) => r.nome_status === "Resolvido"
    );
    const problemasEmAndamento = reports.filter(
      (r) => r.nome_status === "Em andamento"
    );
    const problemasPendentes = reports.filter(
      (r) => r.nome_status === "Pendente"
    );

    return {
      problemasResolvidos,
      problemasEmAndamento,
      problemasPendentes,
      total: reports.length,
    };
  }

  async filtrarReportes(filtros, page, limit) {
    const safePage = Number(page) > 0 ? Number(page) : 1;
    const safeLimit = Number(limit) > 0 ? Number(limit) : 10;

    const { reportsData, total } = await reportRepositories.filtrar(
      filtros,
      safePage,
      safeLimit
    );

    const totalPages = Math.ceil(total / safeLimit);

    return {
      reports: reportsData,
      totalItems: total,
      totalPages: totalPages,
      currentPage: safePage,
    };
  }

  async editarReport(id, dados) {
    const { endereco, descricao, categoria, status, url_imagem } = dados;

    const dadosAtualizados = {
      endereco: endereco.trim(),
      descricao: descricao.trim(),
      fk_categoria: mapearCategoria(categoria),
      fk_status: mapearStatus(status),
    };

    const reportAtualizado = await reportRepositories.editar(
      parseInt(id),
      dadosAtualizados
    );

    return reportAtualizado;
  }

  async excluirReport(id) {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      throw new Error("O ID fornecido é inválido.");
    }
    await reportRepositories.excluir(numericId);
    return true;
  }
}

export default new ReportService();