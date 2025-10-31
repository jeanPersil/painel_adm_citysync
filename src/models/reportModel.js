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
    this.nome_status = nome_status;
    this.fk_usuario = fk_usuario;
    this.url_imagem = url_imagem;
    this.data_criacao = data_criacao;
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

module.exports = ReportModel;
