import { EstadoPendente } from "./estadopendente.js";
import { EstadoEmAnalise } from "./emAnalise.js";
import { EstadoEmAndamento } from "./emAndamento.js"; // Faltava importar este aqui!
import { EstadoResolvido } from "./resolver.js"; // O arquivo é 'resolver.js', e não 'EstadoResolvido.js'
import { EstadoRecusado } from "./invalido.js"; // O arquivo é 'invalido.js', e não 'EstadoRecusado.js'

export class ReportStateFactory {
  /**
   * Recebe uma string (ex: 'pendente') e devolve a CLASSE instanciada (ex: new EstadoPendente)
   * @param {string} nomeStatus - O status que veio do banco de dados
   * @param {ReportModel} report - A instância do report para passar para o estado
   */
  static criar(nomeStatus, report) {
    const statusNormalizado = nomeStatus
      ? nomeStatus.toLowerCase().trim()
      : "pendente";

    switch (statusNormalizado) {
      case "pendente":
        return new EstadoPendente(report);

      case "em andamento":
      case "em_andamento": // Adicionado caso venha com underline
        return new EstadoEmAndamento(report);

      case "analise":
      case "em analise": 
        return new EstadoEmAnalise(report);

      case "finalizado":
      case "resolvido": // Adicionado para garantir compatibilidade
        return new EstadoResolvido(report);

      case "invalido":
      case "recusado": // Adicionado variação comum
        return new EstadoRecusado(report);

      default:
        console.warn(
          `[Factory] Status desconhecido: "${nomeStatus}". Iniciando como Pendente.`
        );
        return new EstadoPendente(report);
    }
  }
}