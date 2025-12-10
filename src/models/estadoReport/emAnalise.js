import { EstadoReport } from "./EstadoReport.js";
import { EstadoEmAndamento } from "./emAndamento.js";
import { EstadoRecusado } from "./invalido.js";

export class EstadoEmAnalise extends EstadoReport {
  get nome() {
    return "Em Analise";
  }

  pendente() {
    throw new Error(
      "[STATUS] Não é possível voltar para pendente um report que está em análise."
    );
  }

  analise() {
    throw new Error("[STATUS] O report já está em análise.");
  }

  andamento() {
    this.report.mudarEstado(new EstadoEmAndamento(this.report));
  }

  resolver() {
    throw new Error(
      "[STATUS] Não é possível resolver um report que está em análise (precisa entrar em andamento)."
    );
  }

  recusar() {
    this.report.mudarEstado(new EstadoRecusado(this.report));
  }
}
