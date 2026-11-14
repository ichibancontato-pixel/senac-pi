const Pessoa = require('../models/Pessoa');
const PessoaJuridica = require('../models/PessoaJuridica');
const PessoaRepository = require('../repositories/PessoaRepository');

class PessoaController {
  constructor() {
    this.repo = new PessoaRepository();
    this.listar = this.listar.bind(this);
    this.buscarPorId = this.buscarPorId.bind(this);
    this.criar = this.criar.bind(this);
    this.atualizar = this.atualizar.bind(this);
    this.excluir = this.excluir.bind(this);
  }

  async listar(req, res, next) {
    try {
      const { tipoPessoa, busca } = req.query;
      const dados = await this.repo.listar({ tipoPessoa, busca });
      res.status(200).json(dados);
    } catch (err) {
      next(err);
    }
  }

  async buscarPorId(req, res, next) {
    try {
      const pessoa = await this.repo.buscarPorId(req.params.id);
      if (!pessoa) return res.status(404).json({ erro: 'Pessoa não encontrada.' });
      res.status(200).json(pessoa);
    } catch (err) {
      next(err);
    }
  }

  async criar(req, res, next) {
    try {
      const { tipoPessoa = 'FISICA', nome, documento, email, telefone } = req.body;
      const docLimpo = Pessoa.normalizarDocumento(documento);

      if (!nome || !docLimpo) {
        return res.status(400).json({ erro: 'Campos obrigatórios: nome e documento.' });
      }
      if (tipoPessoa === 'JURIDICA') {
        const pj = new PessoaJuridica({ nome, documento: docLimpo, email, telefone });
        pj.validar();
      } else if (docLimpo.length !== 11 && docLimpo.length !== 14) {
        return res.status(400).json({ erro: 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos.' });
      }

      const existente = await this.repo.buscarPorDocumento(docLimpo);
      if (existente) {
        return res.status(409).json({ erro: 'Documento (CPF/CNPJ) já cadastrado.' });
      }

      const criada = await this.repo.criar({
        tipoPessoa,
        nome,
        documento: docLimpo,
        email,
        telefone,
      });
      res.status(201).json(criada);
    } catch (err) {
      next(err);
    }
  }

  async atualizar(req, res, next) {
    try {
      const atual = await this.repo.buscarPorId(req.params.id);
      if (!atual) return res.status(404).json({ erro: 'Pessoa não encontrada.' });

      const novoDoc = req.body.documento ? Pessoa.normalizarDocumento(req.body.documento) : atual.documento;
      await this.repo.atualizar(req.params.id, {
        nome: req.body.nome ?? atual.nome,
        documento: novoDoc,
        email: req.body.email ?? atual.email,
        telefone: req.body.telefone ?? atual.telefone,
      });
      const atualizada = await this.repo.buscarPorId(req.params.id);
      res.status(200).json(atualizada);
    } catch (err) {
      next(err);
    }
  }

  async excluir(req, res, next) {
    try {
      const removida = await this.repo.excluir(req.params.id);
      if (!removida) return res.status(404).json({ erro: 'Pessoa não encontrada.' });
      res.status(200).json({ mensagem: 'Registro excluído com sucesso.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PessoaController;