function errorHandler(err, req, res, next) {
  if (err && err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({
      erro: 'Conflito de integridade ou duplicidade de registro (ex.: CPF/CNPJ já cadastrado).',
      detalhe: err.message,
    });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    erro: err.message || 'Erro interno do servidor.',
  });
}

module.exports = errorHandler;