/**
 * REPOSITORY - Camada de acesso a dados para Reports
 *
 * Responsabilidades:
 * - Executar operações CRUD no banco de dados
 * - Construir queries complexas com filtros
 * - Mapear entre formato da aplicação e formato do banco
 * - Tratar erros específicos de banco de dados
 * - Otimizar consultas e queries
 *
 * NÃO contém regras de negócio (service)
 * NÃO valida dados (service/controller)
 */

const supabase = require("../config");

class ReportRepositories {
  async reportesPeriodo(dataInicio, dataFim) {
    const { data, error } = await supabase
      .from("listar_reportes")
      .select("*")
      .gte("data_criacao", dataInicio.toISOString())
      .lte("data_criacao", dataFim.toISOString());

    if (error) {
      console.error("Erro ao buscar usuario por ID: " + error);
      throw new Error("Não foi possível obter os reports por periodo");
    }

    return data;
  }

  async filtrar(filtros) {
    const { endereco, data, status, pesquisar, categoria } = filtros;

    console.log(
      `Endereco: ${endereco} | data: ${data} | status: ${status} | pesquisar: ${pesquisar} | categoria: ${categoria}`
    );
    let query = supabase.from("listar_reportes").select("*");

    if (endereco) {
      query = query.ilike("endereco", `%${endereco}%`);
    }

    if (status) {
      query = query.eq("nome_status", status);
    }

    if (categoria) {
      query = query.eq("nome_categoria", categoria);
    }

    if (data) {
      const inicio = new Date(data);
      const fim = new Date(data);
      fim.setDate(fim.getDate() + 1);

      query = query
        .gte("data_criacao", inicio.toISOString())
        .lt("data_criacao", fim.toISOString());
    }

    if (pesquisar) {
      const termo = `%${pesquisar}%`;
      query = query.or(
        `descricao.ilike.${termo},endereco.ilike.${termo},nome_categoria.ilike.${termo}`
      );
    }

    const { data: reportsData, error } = await query;

    if (error)
      throw new Error("Falha ao filtrar os reportes: " + error.message);

    return reportsData;
  }

  async editar(id, dadosParaAtualizar) {
    const { data, error } = await supabase
      .from("reportes")
      .update(dadosParaAtualizar)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar o reporte no Supabase:", error.message);
      throw new Error("Não foi possível atualizar o reporte.");
    }

    return data;
  }

  async buscarReport(id) {
    const { data, error } = await supabase
      .from("reportes")
      .select("id, descricao")
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new Error("Report não encontrado ou erro na busca.");
    }

    return data;
  }

  async excluir(id) {
    const { error } = await supabase.from("reportes").delete().eq("id", id);

    if (error) {
      throw new Error("Erro ao excluir report: " + error.message);
    }

    return true;
  }
}

module.exports = new ReportRepositories();
