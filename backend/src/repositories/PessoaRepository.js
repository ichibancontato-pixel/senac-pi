const { db } = require('../config/database');

class PessoaRepository {
  buscarPorDocumento(documento) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM pessoas WHERE documento = ?', [documento], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }

  buscarPorId(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM pessoas WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }

  listar({ tipoPessoa, busca } = {}) {
    return new Promise((resolve, reject) => {
      const filtros = [];
      const params = [];

      if (tipoPessoa) {
        filtros.push('tipo_pessoa = ?');
        params.push(tipoPessoa);
      }
      if (busca) {
        filtros.push('(nome LIKE ? OR documento LIKE ?)');
        params.push(`%${busca}%`, `%${busca}%`);
      }

      const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
      db.all(`SELECT * FROM pessoas ${where} ORDER BY id DESC`, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  criar({ tipoPessoa, nome, documento, email, telefone }) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO pessoas (tipo_pessoa, nome, documento, email, telefone) VALUES (?, ?, ?, ?, ?)`,
        [tipoPessoa, nome, documento, email, telefone],
        function (err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, tipoPessoa, nome, documento, email, telefone });
        }
      );
    });
  }

  atualizar(id, { nome, documento, email, telefone }) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE pessoas SET nome = ?, documento = ?, email = ?, telefone = ? WHERE id = ?`,
        [nome, documento, email, telefone, id],
        function (err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  excluir(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM pessoas WHERE id = ?', [id], function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }
}

module.exports = PessoaRepository;