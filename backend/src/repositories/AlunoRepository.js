const { db } = require('../config/database');
const PessoaRepository = require('./PessoaRepository');

class AlunoRepository {
  constructor() {
    this.pessoaRepo = new PessoaRepository();
  }

  listar({ busca, curso, periodo } = {}) {
    return new Promise((resolve, reject) => {
      const filtros = [];
      const params = [];

      if (busca) {
        filtros.push('(p.nome LIKE ? OR p.documento LIKE ? OR a.matricula LIKE ?)');
        params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
      }
      if (curso) {
        filtros.push('a.curso = ?');
        params.push(curso);
      }
      if (periodo) {
        filtros.push('a.periodo = ?');
        params.push(periodo);
      }

      const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
      const sql = `
        SELECT a.id, a.pessoa_id, a.matricula, a.curso, a.periodo, a.status_vinculo,
               p.nome, p.documento, p.email, p.telefone
        FROM alunos a
        INNER JOIN pessoas p ON p.id = a.pessoa_id
        ${where}
        ORDER BY a.id DESC
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
        SELECT a.id, a.pessoa_id, a.matricula, a.curso, a.periodo, a.status_vinculo,
               p.nome, p.documento, p.email, p.telefone
        FROM alunos a
        INNER JOIN pessoas p ON p.id = a.pessoa_id
        WHERE a.id = ?
      `;
      db.get(sql, [id], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }

  criar(aluno) {
    return new Promise(async (resolve, reject) => {
      try {
        const pessoa = await this.pessoaRepo.criar({
          tipoPessoa: 'FISICA',
          nome: aluno.nome,
          documento: aluno.documento,
          email: aluno.email,
          telefone: aluno.telefone,
        });

        db.run(
          `INSERT INTO alunos (pessoa_id, matricula, curso, periodo, status_vinculo) VALUES (?, ?, ?, ?, ?)`,
          [pessoa.id, aluno.matricula, aluno.curso, aluno.periodo, aluno.statusVinculo],
          function (err) {
            if (err) return reject(err);
            resolve({
              id: this.lastID,
              pessoa_id: pessoa.id,
              matricula: aluno.matricula,
              curso: aluno.curso,
              periodo: aluno.periodo,
              status_vinculo: aluno.statusVinculo,
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
          `UPDATE alunos SET curso = ?, periodo = ?, status_vinculo = ? WHERE id = ?`,
          [
            dados.curso ?? atual.curso,
            dados.periodo ?? atual.periodo,
            dados.statusVinculo ?? atual.status_vinculo,
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

  relatorioMatriculas({ periodo, curso } = {}) {
    return new Promise((resolve, reject) => {
      const filtros = [];
      const params = [];
      if (periodo) {
        filtros.push('periodo = ?');
        params.push(periodo);
      }
      if (curso) {
        filtros.push('curso = ?');
        params.push(curso);
      }
      const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
      const sql = `
        SELECT periodo, curso, status_vinculo, COUNT(*) AS total_matriculas
        FROM alunos
        ${where}
        GROUP BY periodo, curso, status_vinculo
        ORDER BY periodo DESC, curso ASC
      `;
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }
}

module.exports = AlunoRepository;