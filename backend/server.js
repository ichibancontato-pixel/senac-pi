const express = require('express');
const { initDatabase } = require('./src/config/database');
const { autenticarEAutorizar } = require('./src/middlewares/authMiddleware');
const errorHandler = require('./src/middlewares/errorHandler');

const AlunoController = require('./src/controllers/AlunoController');
const DocenteController = require('./src/controllers/DocenteController');
const FornecedorController = require('./src/controllers/FornecedorController');
const PessoaController = require('./src/controllers/PessoaController');
const RelatorioController = require('./src/controllers/RelatorioController');

const app = express();
app.use(express.json());

const alunoCtrl = new AlunoController();
const docenteCtrl = new DocenteController();
const fornecedorCtrl = new FornecedorController();
const pessoaCtrl = new PessoaController();
const relatorioCtrl = new RelatorioController();

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', etapa: '4 - Desenvolvimento Backend' });
});

// Alunos (Secretaria Acadêmica / Administrador)
app.get('/api/alunos', autenticarEAutorizar(['Secretaria Acadêmica']), alunoCtrl.listar);
app.get('/api/alunos/:id', autenticarEAutorizar(['Secretaria Acadêmica']), alunoCtrl.buscarPorId);
app.get('/api/alunos/:id/comprovante', autenticarEAutorizar(['Secretaria Acadêmica']), alunoCtrl.comprovanteVinculo);
app.post('/api/alunos', autenticarEAutorizar(['Secretaria Acadêmica']), alunoCtrl.criar);
app.put('/api/alunos/:id', autenticarEAutorizar(['Secretaria Acadêmica']), alunoCtrl.atualizar);
app.delete('/api/alunos/:id', autenticarEAutorizar(['Secretaria Acadêmica']), alunoCtrl.excluir);

// Docentes (RH / Administrador)
app.get('/api/docentes', autenticarEAutorizar(['RH']), docenteCtrl.listar);
app.get('/api/docentes/:id', autenticarEAutorizar(['RH']), docenteCtrl.buscarPorId);
app.post('/api/docentes', autenticarEAutorizar(['RH']), docenteCtrl.criar);
app.put('/api/docentes/:id', autenticarEAutorizar(['RH']), docenteCtrl.atualizar);
app.delete('/api/docentes/:id', autenticarEAutorizar(['RH']), docenteCtrl.excluir);

// Fornecedores (Setor de Compras / Administrador)
app.get('/api/fornecedores', autenticarEAutorizar(['Setor de Compras']), fornecedorCtrl.listar);
app.get('/api/fornecedores/:id', autenticarEAutorizar(['Setor de Compras']), fornecedorCtrl.buscarPorId);
app.post('/api/fornecedores', autenticarEAutorizar(['Setor de Compras']), fornecedorCtrl.criar);
app.put('/api/fornecedores/:id', autenticarEAutorizar(['Setor de Compras']), fornecedorCtrl.atualizar);
app.delete('/api/fornecedores/:id', autenticarEAutorizar(['Setor de Compras']), fornecedorCtrl.excluir);

// Pessoas Físicas e Jurídicas (Administrador)
app.get('/api/pessoas', autenticarEAutorizar([]), pessoaCtrl.listar);
app.get('/api/pessoas/:id', autenticarEAutorizar([]), pessoaCtrl.buscarPorId);
app.post('/api/pessoas', autenticarEAutorizar([]), pessoaCtrl.criar);
app.put('/api/pessoas/:id', autenticarEAutorizar([]), pessoaCtrl.atualizar);
app.delete('/api/pessoas/:id', autenticarEAutorizar([]), pessoaCtrl.excluir);

// Relatórios Gerenciais - Módulo Sistema Acadêmico
app.get(
  '/api/relatorios/matriculas',
  autenticarEAutorizar(['Secretaria Acadêmica']),
  relatorioCtrl.matriculasPorPeriodoECurso
);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor backend rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Falha ao inicializar o banco de dados:', err);
    process.exit(1);
  });