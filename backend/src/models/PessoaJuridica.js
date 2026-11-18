const Pessoa = require('./Pessoa');

class PessoaJuridica extends Pessoa {
  constructor({ id = null, nome, documento, email = null, telefone = null }) {
    super({ id, tipoPessoa: 'JURIDICA', nome, documento, email, telefone });
  }

  validar() {
    this.validarBase();
    if (this.documento.length !== 14) {
      const err = new Error('Pessoa Jurídica exige CNPJ com 14 dígitos.');
      err.statusCode = 400;
      throw err;
    }
  }
}

module.exports = PessoaJuridica;