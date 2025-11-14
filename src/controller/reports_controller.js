/**
 * CONTROLLER - Camada de controle de requisições
 *
 * Responsabilidades:
 * - Receber requisições HTTP
 * - Validar dados de entrada (params, query, body)
 * - Chamar os serviços apropriados
 * - Formatar e retornar respostas HTTP
 * - Tratar erros e códigos de status
 *
 * NÃO contém regras de negócio (ficam no service)
 */

import reportService from "../services/reportService.js";

class ReportsController {
  async obterReportesPorPeriodo(req, res) {
    try {
      let periodoDeReports = req.query.periodo || 365;

      if (!periodoDeReports) {
        return res.status(401).json({
          success: false,
          message: "Insira um periodo valido.",
        });
      }

      const resp = await reportService.obterReportesPeriodo(periodoDeReports);

      return res.status(200).json({ success: true, ...resp });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  }

  async listarEfiltrar(req, res) {
    try {
      const { page = 1, limit = 10, ...filtros } = req.query;

      const pageInt = parseInt(page);
      const limitInt = parseInt(limit);

      const reportes = await reportService.filtrarReportes(filtros, pageInt, limitInt);

      return res.status(200).json({
        success: true,
        ...reportes,
      }); 

    } catch (error) {
      console.error("Erro interno:", error);
      return res.status(500).json({
        success: false,
        message: "Ocorreu um erro ao buscar os reportes.",
      });
    }
  }

  async editarReport(req, res) {
    try {
      const { id } = req.params;
      const { endereco, descricao, categoria, status } = req.body;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: "ID do report é obrigatório e deve ser um número válido",
        });
      }
      const camposObrigatorios = {
        endereco,
        descricao,
        categoria,
        status,
      };
      const camposFaltantes = Object.keys(camposObrigatorios).filter(
        (campo) =>
          !camposObrigatorios[campo] ||
          camposObrigatorios[campo].toString().trim() === ""
      );

      if (camposFaltantes.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Campos obrigatórios faltando: ${camposFaltantes.join(
            ", "
          )}`,
        });
      }

      const dadosParaEditar = {
        endereco,
        descricao,
        categoria,
        status,
      };

      const reportAtualizado = await reportService.editarReport(
        id,
        dadosParaEditar
      );

      return res.status(200).json({
        success: true,
        report_atualizado: reportAtualizado,
      });
    } catch (error) {
      console.error("💥 Erro interno no servidor:", error);
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor ao editar report",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  async deletarReport(req, res) {
    try {
      const { id } = req.params;
      await reportService.excluirReport(id);

      return res.status(200).json({
        success: true,
        message: "report excluido com sucesso!",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Erro ao excluir report ${error}`,
      });
    }
  }
}

export default new ReportsController();