/**
 * SERVICE - Camada de regras de negócio para Reports
 */

import reportRepositories from "../repositories/reportsRepositories.js";
import ReportModel from "../models/reportModel.js";
import { mapearCategoria, mapearStatus } from "../utils/utils.js";
import emailService from "./emailService.js";

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
    const { endereco, descricao, categoria, status, prioridade } = dados;

    // Busca o report atual para comparar o status
    const reportAtual = await reportRepositories.buscarReportCompleto(id);

    if (!reportAtual) {
      throw new Error("Report não encontrado");
    }

    const dadosAtualizados = {
      endereco: endereco.trim(),
      descricao: descricao.trim(),
      fk_categoria: mapearCategoria(categoria),
      fk_status: mapearStatus(status),
    };

    // Adiciona prioridade apenas se foi fornecida
    if (prioridade) {
      dadosAtualizados.prioridade = prioridade;
    }

    const reportAtualizado = await reportRepositories.editar(
      parseInt(id),
      dadosAtualizados
    );

    // Verifica se o status mudou e se deve enviar email
    const statusMudou = reportAtual.nome_status !== status;
    const statusQueEnviamEmail = ["Em andamento", "Resolvido", "Inválido"];

    if (statusMudou && statusQueEnviamEmail.includes(status)) {
      // Busca o email do usuário que criou o report
      const emailUsuario = await reportRepositories.buscarEmailUsuario(
        reportAtual.fk_usuario
      );

      if (emailUsuario) {
        console.log(
          `Status mudou de "${reportAtual.nome_status}" para "${status}". Enviando email para ${emailUsuario}...`
        );

        // Envia o email de forma assíncrona (não bloqueia a resposta)
        emailService
          .enviarNotificacaoStatus(
            emailUsuario,
            status,
            id,
            endereco
          )
          .then((result) => {
            if (result.success) {
              console.log(
                `✅ Email enviado com sucesso para ${emailUsuario}`
              );
            } else {
              console.error(
                `❌ Falha ao enviar email: ${result.message}`
              );
            }
          })
          .catch((error) => {
            console.error("Erro ao enviar email:", error);
          });
      } else {
        console.warn(
          `Usuário não possui email cadastrado. Report ID: ${id}`
        );
      }
    }

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