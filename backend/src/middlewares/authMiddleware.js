const PERFIS_VALIDOS = [
  'Administrador',
  'Secretaria Acadêmica',
  'RH',
  'Setor de Compras',
];

function normalizarTexto(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function autenticarEAutorizar(perfisPermitidos = []) {
  return (req, res, next) => {
    const perfilHeader = req.header('x-user-profile');
    if (!perfilHeader) {
      return res.status(401).json({
        erro: 'Cabeçalho x-user-profile obrigatório para autenticação.',
      });
    }

    const perfilNormalizado = normalizarTexto(perfilHeader);
    const perfilEncontrado = PERFIS_VALIDOS.find(
      (p) => normalizarTexto(p) === perfilNormalizado
    );

    if (!perfilEncontrado) {
      return res.status(403).json({
        erro: `Perfil desconhecido: ${perfilHeader}. Perfis válidos: ${PERFIS_VALIDOS.join(', ')}.`,
      });
    }

    req.perfil = perfilEncontrado;

    if (
      perfisPermitidos.length > 0 &&
      perfilEncontrado !== 'Administrador' &&
      !perfisPermitidos.includes(perfilEncontrado)
    ) {
      return res.status(403).json({
        erro: `Acesso negado para o perfil "${perfilEncontrado}".`,
      });
    }

    next();
  };
}

module.exports = { autenticarEAutorizar, PERFIS_VALIDOS };