const Pessoa = require('./Pessoa');

class Aluno extends Pessoa {
  constructor({ id = null, pessoaId = null, matricula = null, curso, periodo, statusVinculo = 'ATIVO', ...pessoaProps }) {
    super({ ...pessoaProps, tipoPessoa: 'FISICA' });
    this.id = id;
    this.pessoaId = pessoaId;
    this.matricula = matricula;
    this.curso = curso;
    this.periodo = periodo;
    this.statusVinculo = statusVinculo;
  }

  static gerarMatriculaAutomatica(sequencial = Date.now()) {
    const ano = new Date().getFullYear();
    const sufixo = String(sequencial).slice(-6).padStart(6, '0');
    return `${ano}${sufixo}`;
  }

  validar() {
    this.validarBase();
    if (!this.curso || !this.periodo) {
      const err = new Error('Campos obrigatórios de aluno: curso e periodo.');
      err.statusCode = 400;
      throw err;
    }
  }
}

module.exports = Aluno;