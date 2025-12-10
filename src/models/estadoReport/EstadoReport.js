export class EstadoReport {
  constructor(report) {
    this.report = report;
  }

  pendente() {
    throw new Error("Essa ação não é permitida no estado atual.");
  }

  analise() {
    throw new Error("Essa ação não é permitida no estado atual.");
  }

  andamento() {
    throw new Error("Essa ação não é permitida no estado atual.");
  }

  resolver() {
    throw new Error("Essa ação não é permitida no estado atual.");
  }

  recusar() {
    throw new Error("Essa ação não é permitida no estado atual.");
  }
}
