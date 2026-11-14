const Pessoa = require('./Pessoa');

class Fornecedor extends Pessoa {
  constructor({
    id = null,
    pessoaId = null,
    razaoSocial,
    cnpj,
    contratoVigente = false,
    pendenciaFinanceira = false,
    ...pessoaProps
  }) {
    const docLimpo = Pessoa.normalizarDocumento(cnpj || pessoaProps.documento);
    super({ ...pessoaProps, nome: razaoSocial || pessoaProps.nome, documento: docLimpo, tipoPessoa: 'JURIDICA' });
    this.id = id;
    this.pessoaId = pessoaId;
    this.razaoSocial = razaoSocial;
    this.cnpj = docLimpo;
    this.contratoVigente = Boolean(contratoVigente);
    this.pendenciaFinanceira = Boolean(pendenciaFinanceira);
  }

  validar() {
    if (!this.razaoSocial || !this.cnpj || this.cnpj.length !== 14) {
      const err = new Error('Campos obrigatórios de fornecedor: razaoSocial e cnpj válido (14 dígitos).');
      err.statusCode = 400;
      throw err;
    }
  }

  podeSerExcluido() {
    if (this.contratoVigente || this.pendenciaFinanceira) {
      const motivos = [];
      if (this.contratoVigente) motivos.push('contrato vigente');
      if (this.pendenciaFinanceira) motivos.push('pendência financeira ativa');
      const err = new Error(`Exclusão bloqueada: fornecedor possui ${motivos.join(' e ')}.`);
      err.statusCode = 409;
      throw err;
    }
  }
}

module.exports = Fornecedor;