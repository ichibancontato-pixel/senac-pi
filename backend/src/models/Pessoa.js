class Pessoa {
  constructor({ id = null, tipoPessoa = 'FISICA', nome, documento, email = null, telefone = null }) {
    if (new.target === Pessoa) {
      throw new Error('Pessoa é uma classe base abstrata e não deve ser instanciada diretamente.');
    }
    this.id = id;
    this.tipoPessoa = tipoPessoa;
    this.nome = nome;
    this.documento = Pessoa.normalizarDocumento(documento);
    this.email = email;
    this.telefone = telefone;
  }

  static normalizarDocumento(doc) {
    return String(doc || '').replace(/\D/g, '');
  }

  validarBase() {
    if (!this.nome || !this.documento) {
      const err = new Error('Campos obrigatórios ausentes: nome e documento (CPF/CNPJ).');
      err.statusCode = 400;
      throw err;
    }
    if (this.documento.length !== 11 && this.documento.length !== 14) {
      const err = new Error('Documento inválido: informe CPF (11 dígitos) ou CNPJ (14 dígitos).');
      err.statusCode = 400;
      throw err;
    }
  }
}

module.exports = Pessoa;