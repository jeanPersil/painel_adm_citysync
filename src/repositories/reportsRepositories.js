/**
 * REPOSITORY - Camada de acesso a dados para Reports
 */

import supabase from "../config.js";

class ReportRepositories {
  async reportesPeriodo(dataInicio, dataFim) {
    const { data, error } = await supabase
      .from("listar_reportes")
      .select("*")
      .gte("data_criacao", dataInicio.toISOString())
      .lte("data_criacao", dataFim.toISOString())
      .order("data_criacao", { ascending: false });

    if (error) {
      console.error("Erro ao buscar reports por período:", error);
      throw new Error("Não foi possível obter os reports por período");
    }

    return data;
  }

  async filtrar(filtros, page, limit) {
    const { endereco, data, status, pesquisar, categoria } = filtros;

    let query = supabase
      .from("listar_reportes")
      .select("*", { count: "exact" });

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
        `descricao.ilike."${termo}",endereco.ilike."${termo}",nome_categoria.ilike."${termo}"`
      );
    }

    query = query.order("data_criacao", { ascending: false });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: reportsData, error, count } = await query;

    if (error)
      throw new Error("Falha ao filtrar os reportes: " + error.message);

    return { reportsData, total: count };
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

  /**
   * Busca o report completo com todas as informações
   * incluindo o status atual
   */
  async buscarReportCompleto(id) {
    const { data, error } = await supabase
      .from("listar_reportes")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("Erro ao buscar report completo:", error);
      return null;
    }

    return data;
  }

  /**
   * Busca o email do usuário que criou o report
   */
  async buscarEmailUsuario(usuarioId) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("email")
        .eq("id", usuarioId)
        .single();

      if (error || !data) {
        console.error("Erro ao buscar email do usuário:", error);
        return null;
      }

      return data.email;
    } catch (error) {
      console.error("Erro na busca de email:", error);
      return null;
    }
  }

  async excluir(id) {
    const { error } = await supabase.from("reportes").delete().eq("id", id);

    if (error) {
      throw new Error("Erro ao excluir report: " + error.message);
    }

    return true;
  }
}

export default new ReportRepositories();