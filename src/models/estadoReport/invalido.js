import { EstadoReport } from "./EstadoReport.js";

export class EstadoRecusado extends EstadoReport {
  get nome() {
    return "Invalido";
  }

  pendente() {
    throw new Error(
      "[STATUS] Não é possível reabrir um report que foi recusado/inválido."
    );
  }

  analise() {
    throw new Error("[STATUS] Não é possível analisar um report recusado.");
  }

  andamento() {
    throw new Error(
      "[STATUS] Não é possível dar andamento em um report recusado."
    );
  }

  resolver() {
    throw new Error("[STATUS] Não é possível resolver um report recusado.");
  }

  recusar() {
    throw new Error("[STATUS] O report já está recusado/inválido.");
  }
}
