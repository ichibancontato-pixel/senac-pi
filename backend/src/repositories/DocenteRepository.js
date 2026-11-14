const { db } = require('../config/database');
const PessoaRepository = require('./PessoaRepository');

class DocenteRepository {
  constructor() {
    this.pessoaRepo = new PessoaRepository();
  }

  listar({ busca, departamento } = {}) {
    return new Promise((resolve, reject) => {
      const filtros = [];
      const params = [];
      if (busca) {
        filtros.push('(p.nome LIKE ? OR p.documento LIKE ?)');
        params.push(`%${busca}%`, `%${busca}%`);
      }
      if (departamento) {
        filtros.push('d.departamento = ?');
        params.push(departamento);
      }
      const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
      const sql = `
        SELECT d.id, d.pessoa_id, d.titulacao, d.carga_horaria, d.departamento, d.dados_bancarios,
               p.nome, p.documento, p.email, p.telefone
        FROM docentes d
        INNER JOIN pessoas p ON p.id = d.pessoa_id
        ${where}
        ORDER BY d.id DESC
      `;
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  buscarPorId(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT d.id, d.pessoa_id, d.titulacao, d.carga_horaria, d.departamento, d.dados_bancarios,
               p.nome, p.documento, p.email, p.telefone
        FROM docentes d
        INNER JOIN pessoas p ON p.id = d.pessoa_id
        WHERE d.id = ?
      `;
      db.get(sql, [id], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }

  criar(docente) {
    return new Promise(async (resolve, reject) => {
      try {
        const pessoa = await this.pessoaRepo.criar({
          tipoPessoa: 'FISICA',
          nome: docente.nome,
          documento: docente.documento,
          email: docente.email,
          telefone: docente.telefone,
        });

        db.run(
          `INSERT INTO docentes (pessoa_id, titulacao, carga_horaria, departamento, dados_bancarios)
           VALUES (?, ?, ?, ?, ?)`,
          [pessoa.id, docente.titulacao, docente.cargaHoraria, docente.departamento, docente.dadosBancarios],
          function (err) {
            if (err) return reject(err);
            resolve({
              id: this.lastID,
              pessoa_id: pessoa.id,
              titulacao: docente.titulacao,
              carga_horaria: docente.cargaHoraria,
              departamento: docente.departamento,
              dados_bancarios: docente.dadosBancarios,
              nome: pessoa.nome,
              documento: pessoa.documento,
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

        await this.pessoaRepo.atualizar(atual.pessoa_id, {
          nome: dados.nome ?? atual.nome,
          documento: dados.documento ?? atual.documento,
          email: dados.email ?? atual.email,
          telefone: dados.telefone ?? atual.telefone,
        });

        db.run(
          `UPDATE docentes SET titulacao = ?, carga_horaria = ?, departamento = ?, dados_bancarios = ? WHERE id = ?`,
          [
            dados.titulacao ?? atual.titulacao,
            dados.cargaHoraria ?? atual.carga_horaria,
            dados.departamento ?? atual.departamento,
            dados.dadosBancarios ?? atual.dados_bancarios,
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

module.exports = DocenteRepository;