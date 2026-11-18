const Docente = require('../models/Docente');
const DocenteRepository = require('../repositories/DocenteRepository');
const PessoaRepository = require('../repositories/PessoaRepository');

class DocenteController {
  constructor() {
    this.repo = new DocenteRepository();
    this.pessoaRepo = new PessoaRepository();
    this.listar = this.listar.bind(this);
    this.buscarPorId = this.buscarPorId.bind(this);
    this.criar = this.criar.bind(this);
    this.atualizar = this.atualizar.bind(this);
    this.excluir = this.excluir.bind(this);
  }

  async listar(req, res, next) {
    try {
      const dados = await this.repo.listar(req.query);
      res.status(200).json(dados);
    } catch (err) {
      next(err);
    }
  }

  async buscarPorId(req, res, next) {
    try {
      const docente = await this.repo.buscarPorId(req.params.id);
      if (!docente) return res.status(404).json({ erro: 'Docente não encontrado.' });
      res.status(200).json(docente);
    } catch (err) {
      next(err);
    }
  }

  async criar(req, res, next) {
    try {
      const docente = new Docente(req.body);
      docente.validar();

      const existente = await this.pessoaRepo.buscarPorDocumento(docente.documento);
      if (existente) {
        return res.status(409).json({ erro: 'CPF já cadastrado no sistema.' });
      }

      const criado = await this.repo.criar(docente);
      res.status(201).json(criado);
    } catch (err) {
      next(err);
    }
  }

  async atualizar(req, res, next) {
    try {
      const atualizado = await this.repo.atualizar(req.params.id, req.body);
      if (!atualizado) return res.status(404).json({ erro: 'Docente não encontrado.' });
      res.status(200).json(atualizado);
    } catch (err) {
      next(err);
    }
  }

  async excluir(req, res, next) {
    try {
      const removido = await this.repo.excluir(req.params.id);
      if (!removido) return res.status(404).json({ erro: 'Docente não encontrado.' });
      res.status(200).json({ mensagem: 'Docente removido com sucesso.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DocenteController;