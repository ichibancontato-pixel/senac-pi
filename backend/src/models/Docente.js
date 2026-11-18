const Pessoa = require('./Pessoa');

class Docente extends Pessoa {
  constructor({ id = null, pessoaId = null, titulacao, cargaHoraria, departamento, dadosBancarios, ...pessoaProps }) {
    super({ ...pessoaProps, tipoPessoa: 'FISICA' });
    this.id = id;
    this.pessoaId = pessoaId;
    this.titulacao = titulacao;
    this.cargaHoraria = Number(cargaHoraria);
    this.departamento = departamento;
    this.dadosBancarios = dadosBancarios;
  }

  validar() {
    this.validarBase();
    if (!this.titulacao || !this.cargaHoraria || !this.departamento || !this.dadosBancarios) {
      const err = new Error('Campos obrigatórios de docente: titulacao, cargaHoraria, departamento e dadosBancarios.');
      err.statusCode = 400;
      throw err;
    }
  }
}

module.exports = Docente;