const Aluno = require('../models/Aluno');
const AlunoRepository = require('../repositories/AlunoRepository');
const PessoaRepository = require('../repositories/PessoaRepository');

class AlunoController {
  constructor() {
    this.repo = new AlunoRepository();
    this.pessoaRepo = new PessoaRepository();
    this.listar = this.listar.bind(this);
    this.buscarPorId = this.buscarPorId.bind(this);
    this.criar = this.criar.bind(this);
    this.atualizar = this.atualizar.bind(this);
    this.excluir = this.excluir.bind(this);
    this.comprovanteVinculo = this.comprovanteVinculo.bind(this);
  }

  async listar(req, res, next) {
    try {
      const { busca, curso, periodo } = req.query;
      const dados = await this.repo.listar({ busca, curso, periodo });
      res.status(200).json(dados);
    } catch (err) {
      next(err);
    }
  }

  async buscarPorId(req, res, next) {
    try {
      const aluno = await this.repo.buscarPorId(req.params.id);
      if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });
      res.status(200).json(aluno);
    } catch (err) {
      next(err);
    }
  }

  async criar(req, res, next) {
    try {
      const aluno = new Aluno(req.body);
      aluno.validar();

      const existente = await this.pessoaRepo.buscarPorDocumento(aluno.documento);
      if (existente) {
        return res.status(409).json({ erro: 'CPF já cadastrado no sistema.' });
      }

      aluno.matricula = Aluno.gerarMatriculaAutomatica();
      const criado = await this.repo.criar(aluno);
      res.status(201).json({
        mensagem: 'Aluno cadastrado e matrícula gerada automaticamente.',
        aluno: criado,
      });
    } catch (err) {
      next(err);
    }
  }

  async atualizar(req, res, next) {
    try {
      const atualizado = await this.repo.atualizar(req.params.id, req.body);
      if (!atualizado) return res.status(404).json({ erro: 'Aluno não encontrado.' });
      res.status(200).json(atualizado);
    } catch (err) {
      next(err);
    }
  }

  async excluir(req, res, next) {
    try {
      const removido = await this.repo.excluir(req.params.id);
      if (!removido) return res.status(404).json({ erro: 'Aluno não encontrado.' });
      res.status(200).json({ mensagem: 'Aluno removido com sucesso.' });
    } catch (err) {
      next(err);
    }
  }

  async comprovanteVinculo(req, res, next) {
    try {
      const aluno = await this.repo.buscarPorId(req.params.id);
      if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });
      res.status(200).json({
        comprovante: 'DECLARAÇÃO DE VÍNCULO ACADÊMICO',
        emitido_em: new Date().toISOString(),
        matricula: aluno.matricula,
        nome: aluno.nome,
        cpf: aluno.documento,
        curso: aluno.curso,
        periodo: aluno.periodo,
        status_vinculo: aluno.status_vinculo,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AlunoController;