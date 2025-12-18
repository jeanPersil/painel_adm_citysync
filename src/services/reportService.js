/**
 * SERVICE - Camada de regras de negócio para Reports
 */

import reportRepositories from "../repositories/reportsRepositories.js";
import ReportModel from "../models/reportModel.js"; // Importante: Agora traz a Factory junto
import { mapearCategoria, mapearStatus } from "../utils/utils.js";
import emailService from "./emailService.js";

class ReportService {
  async obterReportesPeriodo(periodoDeReports) {
    let dataInicio = new Date();
    let dataFim = new Date();
    dataInicio.setDate(dataFim.getDate() - parseInt(periodoDeReports));

    const data = await reportRepositories.reportesPeriodo(dataInicio, dataFim);

    const reports = data.map((row) => {
      const model = ReportModel.fromDb(row);

      return {
        id: model.id,
        endereco: model.endereco,
        descricao: model.descricao,
        prioridade: model.prioridade,
        fk_usuario: model.fk_usuario,
        nome_categoria: model.nome_categoria,
        data_criacao: model.data_criacao,
        nome_status: model.nome_status,
      };
    });

    const problemasResolvidos = reports.filter(
      (r) => r.nome_status === "Resolvido"
    );
    const problemasEmAndamento = reports.filter(
      (r) => r.nome_status === "Em andamento"
    );
    const problemasPendentes = reports.filter(
      (r) => r.nome_status === "Pendente"
    );

    const problemasEmAnalise = reports.filter(
      (r) => r.nome_status == "Em analise"
    );

    const problemasInvalidos = reports.filter(
      (r) => r.nome_status === "Invalido"
    );

    return {
      problemasResolvidos,
      problemasEmAndamento,
      problemasPendentes,
      problemasEmAnalise,
      problemasInvalidos,
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
    const {
      endereco,
      descricao,
      categoria,
      status: novoStatusString,
      prioridade,
    } = dados;

    const dadosBanco = await reportRepositories.buscarReportCompleto(id);

    if (!dadosBanco) {
      throw new Error("Report não encontrado");
    }

    const reportModel = ReportModel.fromDb(dadosBanco);
    const statusAnterior = reportModel.nome_status;

    if (novoStatusString && novoStatusString !== statusAnterior) {
      try {
        switch (novoStatusString) {
          case "Em analise":
            reportModel.analise();
            break;
          case "Em andamento":
            reportModel.andamento();
            break;
          case "Resolvido":
            reportModel.resolver();
            break;
          case "Invalido":
            reportModel.recusar();
            break;
          case "Pendente":
            reportModel.pendente();
            break;
          default:
            console.warn(
              `Tentativa de status desconhecido: ${novoStatusString}`
            );
        }
      } catch (error) {
        throw new Error(error.message);
      }
    }

    const dadosAtualizados = {
      endereco: endereco ? endereco.trim() : dadosBanco.endereco,
      descricao: descricao ? descricao.trim() : dadosBanco.descricao,
      fk_categoria: categoria
        ? mapearCategoria(categoria)
        : dadosBanco.fk_categoria,

      fk_status: mapearStatus(reportModel.nome_status),

      prioridade: prioridade || dadosBanco.prioridade,
    };

    // 5. Persiste no Banco de Dados
    const reportAtualizado = await reportRepositories.editar(
      parseInt(id),
      dadosAtualizados
    );

    // 6. Envio de E-mail (Lógica mantida, mas verificando a mudança real)
    const statusMudou = reportModel.nome_status !== statusAnterior;
    const statusQueEnviamEmail = ["Em andamento", "Resolvido", "Inválido"];

    if (statusMudou && statusQueEnviamEmail.includes(reportModel.nome_status)) {
      const emailUsuario = await reportRepositories.buscarEmailUsuario(
        reportModel.fk_usuario
      );

      if (emailUsuario) {
        console.log(
          `Status mudou de "${statusAnterior}" para "${reportModel.nome_status}". Enviando email...`
        );

        emailService
          .enviarNotificacaoStatus(
            emailUsuario,
            reportModel.nome_status, // Status novo
            id,
            endereco || dadosBanco.endereco
          )
          .then((result) => {
            if (result.success)
              console.log(`✅ Email enviado para ${emailUsuario}`);
            else console.error(`❌ Falha ao enviar email: ${result.message}`);
          })
          .catch((error) => console.error("Erro ao enviar email:", error));
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
