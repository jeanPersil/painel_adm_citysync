import { EstadoReport } from "./EstadoReport.js";

export class EstadoResolvido extends EstadoReport {
  get nome() {
    return "Resolvido";
  }

  pendente() {
    throw new Error(
      " [STATUS] Não é possível reabrir (pendente) um report que já está resolvido."
    );
  }

  analise() {
    throw new Error(
      " [STATUS] Não é possível analisar um report que já está resolvido."
    );
  }

  andamento() {
    throw new Error(
      "[STATUS] Não é possível colocar em andamento um report que já está resolvido."
    );
  }

  resolver() {
    throw new Error("[STATUS] O report já está resolvido.");
  }

  recusar() {
    throw new Error(
      "[STATUS] Não é possível recusar um report que já foi resolvido com sucesso."
    );
  }
}
