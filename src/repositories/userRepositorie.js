/**
 * REPOSITORY - Camada de acesso a dados para Users
 *
 * Responsabilidades:
 * - Executar operações de leitura/escrita na tabela de usuários
 * - Buscar dados complementares de usuários autenticados
 * - Garantir integridade das consultas ao banco
 * - Tratar erros de infraestrutura de dados
 */

const supabase = require("../config");

class UserRepositories {
  async pegarDadosPeloId(id) {
    const { data, error } = await supabase
      .from("users")
      .select("role, nome, email")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erro ao buscar usuario por ID: " + error);
      throw new Error("Não foi possível acessar os dados do usuário.");
    }

    return data;
  }
}

module.exports = new UserRepositories();
