import { EstadoReport } from "./EstadoReport.js";
import { EstadoResolvido } from "./resolver.js";

export class EstadoEmAndamento extends EstadoReport {
  get nome() {
    return "Em Andamento";
  }

  pendente() {
    throw new Error(
      "[STATUS] Não é possível voltar para pendente um report que está em andamento."
    );
  }

  analise() {
    throw new Error(
      "[STATUS] Não é possível voltar para análise um report que está em andamento."
    );
  }

  andamento() {
    throw new Error("[STATUS] O report já está em andamento.");
  }

  resolver() {
    this.report.mudarEstado(new EstadoResolvido(this.report));
  }

  recusar() {
    throw new Error(
      "[STATUS] Não é possível recusar um report que já está em andamento (o serviço já começou)."
    );
  }
}
