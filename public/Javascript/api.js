class Api {
  // AUTENTICAÇÃO ( LOGIN, LOGOUT )
  constructor() {
    this.url_api = "http://localhost:3000/api";
  }
  async login(email, senha) {
    try {
      const response = await fetch(`${this.url_api}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async logout() {
    try {
      const response = await fetch(`${this.url_api}/users/logout`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Erro na API de logout:", error);
      throw error;
    }
  }

  // ==== REPORTES ====
  async obterReportsPorPeriodo(periodoDias) {
    try {
      const response = await fetch(
        `${this.url_api}/reports/periodo?periodo=${periodoDias}`
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async obterReportsFiltrados(parametros) {
    try {
      const response = await fetch(
        `${this.url_api}/reports/filtrados?${parametros.toString()}`
      );

      const result = await response.json();

      return result;
    } catch (error) {
      console.error("Erro em obterReportsFiltrados:", error);
      return {
        success: false,
        message: error.message || error,
      };
    }
  }

  async atualizarReport(reportId, dadosDoFormulario) {
    try {
      const bodyParaBackend = {
        endereco: dadosDoFormulario.endereco,
        descricao: dadosDoFormulario.descricao,
        categoria: dadosDoFormulario.nome_categoria,
        status: dadosDoFormulario.nome_status,
      };

      const response = await fetch(`/api/reports/editar/${reportId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyParaBackend),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Falha ao atualizar report");
      }

      return result;
      
    } catch (error) {
      console.error("Erro em api.atualizarReport:", error);
      if (error instanceof SyntaxError) {
        throw new Error();
      }
      throw error;
    }
  }

  async excluirReport(id) {
    const response = await fetch(`${this.url_api}/reports/deletar/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const result = await response.json();

    if (!result.success) throw new Error(result.message);

    return null;
  }

  async editar_dados(novoNome, novoEmail) {
    try {
      const response = await fetch(`${this.url_api}/users/atualizar_dados`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({ novoNome, novoEmail }),

        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ocorreu um erro no servidor");
      }

      return data;
    } catch (error) {
      console.error("Erro ao editar dados:", error);
      throw new Error(error.message);
    }
  }
}

export const api = new Api();
