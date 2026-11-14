const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, '../../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao database.sqlite:', err.message);
    process.exit(1);
  }
});

function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('PRAGMA foreign_keys = ON;');

      db.run(`
        CREATE TABLE IF NOT EXISTS pessoas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tipo_pessoa TEXT NOT NULL CHECK (tipo_pessoa IN ('FISICA', 'JURIDICA')),
          nome TEXT NOT NULL,
          documento TEXT NOT NULL UNIQUE,
          email TEXT,
          telefone TEXT,
          criado_em TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS alunos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pessoa_id INTEGER NOT NULL UNIQUE,
          matricula TEXT NOT NULL UNIQUE,
          curso TEXT NOT NULL,
          periodo TEXT NOT NULL,
          status_vinculo TEXT NOT NULL DEFAULT 'ATIVO',
          FOREIGN KEY (pessoa_id) REFERENCES pessoas(id) ON DELETE CASCADE
        );
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS docentes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pessoa_id INTEGER NOT NULL UNIQUE,
          titulacao TEXT NOT NULL,
          carga_horaria INTEGER NOT NULL,
          departamento TEXT NOT NULL,
          dados_bancarios TEXT NOT NULL,
          FOREIGN KEY (pessoa_id) REFERENCES pessoas(id) ON DELETE CASCADE
        );
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS fornecedores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pessoa_id INTEGER NOT NULL UNIQUE,
          razao_social TEXT NOT NULL,
          cnpj TEXT NOT NULL UNIQUE,
          contrato_vigente INTEGER NOT NULL DEFAULT 0,
          pendencia_financeira INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (pessoa_id) REFERENCES pessoas(id) ON DELETE CASCADE
        );
      `, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}

module.exports = { db, initDatabase };