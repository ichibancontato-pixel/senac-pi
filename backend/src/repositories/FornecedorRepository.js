const { db } = require('../config/database');
const PessoaRepository = require('./PessoaRepository');

class FornecedorRepository {
  constructor() {
    this.pessoaRepo = new PessoaRepository();
  }

  listar({ busca } = {}) {
    return new Promise((resolve, reject) => {
      const params = [];
      const where = busca ? 'WHERE f.razao_social LIKE ? OR f.cnpj LIKE ?' : '';
      if (busca) {
        params.push(`%${busca}%`, `%${busca}%`);
      }

      const sql = `
        SELECT f.id, f.pessoa_id, f.razao_social, f.cnpj,
               f.contrato_vigente, f.pendencia_financeira, p.email, p.telefone
        FROM fornecedores f
        INNER JOIN pessoas p ON p.id = f.pessoa_id
        ${where}
        ORDER BY f.id DESC
      `;
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(
          rows.map((r) => ({
            ...r,
            contrato_vigente: Boolean(r.contrato_vigente),
            pendencia_financeira: Boolean(r.pendencia_financeira),
          }))
        );
      });
    });
  }

  buscarPorId(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT f.id, f.pessoa_id, f.razao_social, f.cnpj,
               f.contrato_vigente, f.pendencia_financeira, p.email, p.telefone
        FROM fornecedores f
        INNER JOIN pessoas p ON p.id = f.pessoa_id
        WHERE f.id = ?
      `;
      db.get(sql, [id], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve({
          ...row,
          contrato_vigente: Boolean(row.contrato_vigente),
          pendencia_financeira: Boolean(row.pendencia_financeira),
        });
      });
    });
  }

  criar(fornecedor) {
    return new Promise(async (resolve, reject) => {
      try {
        const pessoa = await this.pessoaRepo.criar({
          tipoPessoa: 'JURIDICA',
          nome: fornecedor.razaoSocial,
          documento: fornecedor.cnpj,
          email: fornecedor.email,
          telefone: fornecedor.telefone,
        });

        db.run(
          `INSERT INTO fornecedores (pessoa_id, razao_social, cnpj, contrato_vigente, pendencia_financeira)
           VALUES (?, ?, ?, ?, ?)`,
          [
            pessoa.id,
            fornecedor.razaoSocial,
            fornecedor.cnpj,
            fornecedor.contratoVigente ? 1 : 0,
            fornecedor.pendenciaFinanceira ? 1 : 0,
          ],
          function (err) {
            if (err) return reject(err);
            resolve({
              id: this.lastID,
              pessoa_id: pessoa.id,
              razao_social: fornecedor.razaoSocial,
              cnpj: fornecedor.cnpj,
              contrato_vigente: fornecedor.contratoVigente,
              pendencia_financeira: fornecedor.pendenciaFinanceira,
              email: pessoa.email,
              telefone: pessoa.telefone,
            });
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  atualizar(id, dados) {
    return new Promise(async (resolve, reject) => {
      try {
        const atual = await this.buscarPorId(id);
        if (!atual) return resolve(null);

        const novoCnpj = dados.cnpj ? String(dados.cnpj).replace(/\D/g, '') : atual.cnpj;
        const novaRazao = dados.razaoSocial ?? atual.razao_social;

        await this.pessoaRepo.atualizar(atual.pessoa_id, {
          nome: novaRazao,
          documento: novoCnpj,
          email: dados.email ?? atual.email,
          telefone: dados.telefone ?? atual.telefone,
        });

        db.run(
          `UPDATE fornecedores SET razao_social = ?, cnpj = ?, contrato_vigente = ?, pendencia_financeira = ? WHERE id = ?`,
          [
            novaRazao,
            novoCnpj,
            dados.contratoVigente !== undefined ? (dados.contratoVigente ? 1 : 0) : (atual.contrato_vigente ? 1 : 0),
            dados.pendenciaFinanceira !== undefined ? (dados.pendenciaFinanceira ? 1 : 0) : (atual.pendencia_financeira ? 1 : 0),
            id,
          ],
          function (err) {
            if (err) return reject(err);
            resolve(this.buscarPorId(id));
          }.bind(this)
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  excluir(id) {
    return new Promise(async (resolve, reject) => {
      try {
        const atual = await this.buscarPorId(id);
        if (!atual) return resolve(false);
        await this.pessoaRepo.excluir(atual.pessoa_id);
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = FornecedorRepository;