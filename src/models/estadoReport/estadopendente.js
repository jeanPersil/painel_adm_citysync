import { EstadoReport } from "./EstadoReport.js";
import { EstadoEmAnalise } from "./emAnalise.js";

export class EstadoPendente extends EstadoReport {
  get nome() {
    return "Pendente";
  }

  pendente() {
    throw new Error("[STATUS] O report já esta pendente.");
  }

  analise() {
    this.report.mudarEstado(new EstadoEmAnalise(this.report));
  }

  andamento() {
    throw new Error(
      " [STATUS] Não é possível pular direto para andamento um report que está pendente (precisa passar pela análise)."
    );
  }

  resolver() {
    throw new Error(
      "[STATUS] Não é possível resolver imediatamente um report que está pendente (precisa passar pela análise e depois pelo andamento)."
    );
  }

  recusar() {
    throw new Error(
      "[STATUS] Não é possível recusar imediatamente um report que está pendente (precisa passar pela análise)."
    );
  }
}
