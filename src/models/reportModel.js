import { ReportStateFactory } from "./estadoReport/reportStateFactory.js";

class ReportModel {
  constructor(
    id,
    endereco,
    descricao,
    nome_categoria,
    nome_status,
    fk_usuario,
    url_imagem,
    data_criacao
  ) {
    this.id = id;
    this.endereco = endereco;
    this.descricao = descricao;
    this.nome_categoria = nome_categoria;
    this.fk_usuario = fk_usuario;
    this.url_imagem = url_imagem;
    this.data_criacao = data_criacao;
    this.nome_status = nome_status;

    this.estadoAtual = ReportStateFactory.criar(nome_status, this);
  }

  pendente() {
    this.estadoAtual.pendente();
  }

  analise() {
    this.estadoAtual.analise();
  }

  andamento() {
    this.estadoAtual.andamento();
  }

  resolver() {
    this.estadoAtual.resolver();
  }

  recusar() {
    this.estadoAtual.recusar();
  }

  mudarEstado(novoEstadoObjeto) {
    this.estadoAtual = novoEstadoObjeto;
    this.nome_status = novoEstadoObjeto.nome;
  }

  static fromDb(row) {
    return new ReportModel(
      row.id,
      row.endereco,
      row.descricao,
      row.nome_categoria,
      row.nome_status,
      row.fk_usuario,
      row.url_imagem,
      row.data_criacao
    );
  }
}

export default ReportModel;
