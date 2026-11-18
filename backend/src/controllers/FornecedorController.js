const Fornecedor = require('../models/Fornecedor');
const FornecedorRepository = require('../repositories/FornecedorRepository');
const PessoaRepository = require('../repositories/PessoaRepository');

class FornecedorController {
  constructor() {
    this.repo = new FornecedorRepository();
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
      const fornecedor = await this.repo.buscarPorId(req.params.id);
      if (!fornecedor) return res.status(404).json({ erro: 'Fornecedor não encontrado.' });
      res.status(200).json(fornecedor);
    } catch (err) {
      next(err);
    }
  }

  async criar(req, res, next) {
    try {
      const fornecedor = new Fornecedor(req.body);
      fornecedor.validar();

      const existente = await this.pessoaRepo.buscarPorDocumento(fornecedor.cnpj);
      if (existente) {
        return res.status(409).json({ erro: 'CNPJ já cadastrado no sistema.' });
      }

      const criado = await this.repo.criar(fornecedor);
      res.status(201).json(criado);
    } catch (err) {
      next(err);
    }
  }

  async atualizar(req, res, next) {
    try {
      const atualizado = await this.repo.atualizar(req.params.id, req.body);
      if (!atualizado) return res.status(404).json({ erro: 'Fornecedor não encontrado.' });
      res.status(200).json(atualizado);
    } catch (err) {
      next(err);
    }
  }

  async excluir(req, res, next) {
    try {
      const atual = await this.repo.buscarPorId(req.params.id);
      if (!atual) return res.status(404).json({ erro: 'Fornecedor não encontrado.' });

      const modelo = new Fornecedor({
        razaoSocial: atual.razao_social,
        cnpj: atual.cnpj,
        contratoVigente: atual.contrato_vigente,
        pendenciaFinanceira: atual.pendencia_financeira,
      });
      modelo.podeSerExcluido(); // Lança 409 se contrato vigente ou pendência financeira

      await this.repo.excluir(req.params.id);
      res.status(200).json({ mensagem: 'Fornecedor excluído com segurança.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = FornecedorController;