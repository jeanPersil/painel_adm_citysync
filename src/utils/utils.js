function mapearCategoria(categoria) {
  const mapeamento = {
    buraco: 1,
    iluminação: 2,
    lixo: 3,
    semáforo: 4,
    "vazamento/esgoto": 5,
    transporte: 6,
    outros: 7,
  };

  return mapeamento[categoria.toLowerCase()] || categoria;
}

function mapearStatus(status) {
  const mapeamento = {
    pendente: 1,
    "em andamento": 2,
    resolvido: 3,
    "inválido": 4,
  };

  return mapeamento[status.toLowerCase()] || status;
}

function validarEmailBasico(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export {
  mapearCategoria,
  mapearStatus,
  validarEmailBasico,
};