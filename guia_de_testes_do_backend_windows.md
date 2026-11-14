# Sistema de Gestão de Dados de uma Grande Universidade — Backend (Etapa 4)

> **Ambiente de Execução:** Prompt de Comando do Windows (`cmd.exe`)

Guia passo a passo para instalar, inicializar e testar todas as APIs, regras de negócio e o banco de dados integrado (`database.sqlite`) no **Windows**.

---

## 1. Pré-requisitos

* **Node.js** (versão 18 ou superior) instalado no Windows.
* **npm** (instalado junto com o Node.js).
* **Prompt de Comando (`cmd.exe`)** ou terminal integrado do VS Code configurado para CMD.
* *Opcional:* **Postman**, **Insomnia** ou extensão **Thunder Client** no VS Code.

---

## 2. Instalação e Inicialização do Servidor

1. Abra o Prompt de Comando (`cmd`) e navegue até a pasta `backend` do projeto:
   ```cmd
   cd sistema-gestao-universidade\backend
   ```

2. Instale as dependências (`express` e `sqlite3`):
   ```cmd
   npm.cmd install
   ```

3. Inicie o servidor:
   ```cmd
   npm.cmd start
   ```

4. **Verificação esperada:**
   * O terminal exibirá a mensagem: `Servidor backend rodando em http://localhost:3000`
   * O arquivo `database.sqlite` será gerado automaticamente na raiz da pasta `backend\` com todas as tabelas (`pessoas`, `alunos`, `docentes`, `fornecedores`) e restrições criadas.

---

## 3. Autenticação e Controle de Acesso (RBAC)

Todas as rotas da API (exceto `/api/health`) exigem o cabeçalho HTTP `x-user-profile` para identificar o perfil do usuário:

| Perfil (`x-user-profile`) | Permissões na API |
| :--- | :--- |
| `Administrador` | Acesso total a todas as rotas (incluindo CRUD geral de Pessoas Físicas e Jurídicas) |
| `Secretaria Acadêmica` | CRUD de Alunos, emissão de comprovante de vínculo e Relatórios Gerenciais |
| `RH` | CRUD de Docentes |
| `Setor de Compras` | CRUD de Fornecedores |

---

## 4. Roteiro Passo a Passo de Testes (CMD)

Mantenha o servidor rodando em uma janela do terminal e execute os comandos abaixo em **outra janela do Prompt de Comando (`cmd.exe`)**.

> **⚠️ Nota sobre o CMD do Windows:** Os comandos abaixo estão em **linha única** e utilizam `\"` dentro do JSON, pois o `cmd.exe` não aceita aspas simples (`'`) nem quebra de linha com `\`.

### Passo 1 — Verificar se a API está online

```cmd
curl -i -X GET http://localhost:3000/api/health
```

* **Resultado esperado:** HTTP `200 OK`
  ```json
  {"status":"ok","etapa":"4 - Desenvolvimento Backend"}
  ```

---

### Passo 2 — Cadastrar e Matricular Aluno (`Secretaria Acadêmica`)

```cmd
curl -i -X POST http://localhost:3000/api/alunos -H "Content-Type: application/json" -H "x-user-profile: Secretaria Academica" -d "{\"nome\": \"João Silva Nascimento\", \"documento\": \"12345678901\", \"email\": \"joao.nascimento@universidade.edu.br\", \"telefone\": \"11999990000\", \"curso\": \"Análise e Desenvolvimento de Sistemas\", \"periodo\": \"2026.1\"}"
```

* **Resultado esperado:** HTTP `201 Created`, retornando os dados do aluno e o campo `matricula` gerado automaticamente (ex.: `"2026123456"`).

---

### Passo 3 — Validar Duplicidade de CPF (HTTP 409)

Execute novamente o cadastro utilizando o mesmo CPF (`12345678901`):

```cmd
curl -i -X POST http://localhost:3000/api/alunos -H "Content-Type: application/json" -H "x-user-profile: Secretaria Academica" -d "{\"nome\": \"Outro Aluno\", \"documento\": \"12345678901\", \"curso\": \"Engenharia de Software\", \"periodo\": \"2026.1\"}"
```

* **Resultado esperado:** HTTP `409 Conflict` com a mensagem `"CPF já cadastrado no sistema."`.

---

### Passo 4 — Consultar, Atualizar e Emitir Comprovante de Aluno

1. **Listar alunos:**
   ```cmd
   curl -i -X GET http://localhost:3000/api/alunos -H "x-user-profile: Secretaria Academica"
   ```

2. **Atualizar telefone do aluno (ID `1`):**
   ```cmd
   curl -i -X PUT http://localhost:3000/api/alunos/1 -H "Content-Type: application/json" -H "x-user-profile: Secretaria Academica" -d "{\"telefone\": \"11977776666\"}"
   ```

3. **Emitir comprovante de vínculo acadêmico:**
   ```cmd
   curl -i -X GET http://localhost:3000/api/alunos/1/comprovante -H "x-user-profile: Secretaria Academica"
   ```

---

### Passo 5 — Testar CRUD de Docentes (`RH`)

1. **Cadastrar docente:**
   ```cmd
   chcp 65001 && curl -i -X POST http://localhost:3000/api/docentes -H "Content-Type: application/json" -H "x-user-profile: RH" -d "{\"nome\": \"Dra. Helena Souza\", \"documento\": \"98765432100\", \"email\": \"helena.souza@universidade.edu.br\", \"telefone\": \"11988887777\", \"titulacao\": \"Doutorado\", \"cargaHoraria\": 40, \"departamento\": \"Computação\", \"dadosBancarios\": \"Banco 001 / Ag 1234-5 / CC 67890-1\"}"
   ```

2. **Consultar docentes:**
   ```cmd
   curl -i -X GET http://localhost:3000/api/docentes -H "x-user-profile: RH"
   ```

---

### Passo 6 — Testar Fornecedores e Bloqueio de Exclusão (`Setor de Compras`)

1. **Cadastrar fornecedor COM contrato vigente (ID `1`):**
   ```cmd
   curl -i -X POST http://localhost:3000/api/fornecedores -H "Content-Type: application/json" -H "x-user-profile: Setor de Compras" -d "{\"razaoSocial\": \"Tech Suprimentos LTDA\", \"cnpj\": \"11222333000181\", \"email\": \"contato@techsuprimentos.com.br\", \"telefone\": \"1133334444\", \"contratoVigente\": true, \"pendenciaFinanceira\": false}"
   ```

2. **Tentar excluir fornecedor com contrato vigente (deve bloquear):**
   ```cmd
   curl -i -X DELETE http://localhost:3000/api/fornecedores/1 -H "x-user-profile: Setor de Compras"
   ```
   * **Resultado esperado:** HTTP `409 Conflict` com `"Exclusão bloqueada: fornecedor possui contrato vigente."`.

3. **Cadastrar fornecedor SEM vínculos/pendências (ID `2`):**
   ```cmd
   curl -i -X POST http://localhost:3000/api/fornecedores -H "Content-Type: application/json" -H "x-user-profile: Setor de Compras" -d "{\"razaoSocial\": \"Papelaria Central ME\", \"cnpj\": \"44555666000199\", \"contratoVigente\": false, \"pendenciaFinanceira\": false}"
   ```

4. **Excluir fornecedor sem vínculos (ID `2`):**
   ```cmd
   curl -i -X DELETE http://localhost:3000/api/fornecedores/2 -H "x-user-profile: Setor de Compras"
   ```
   * **Resultado esperado:** HTTP `200 OK` com `"Fornecedor excluído com segurança."`.

---

### Passo 7 — Testar Gestão Geral de Pessoas (`Administrador`)

```cmd
curl -i -X GET http://localhost:3000/api/pessoas -H "x-user-profile: Administrador"
```

* **Resultado esperado:** HTTP `200 OK`, listando todas as pessoas físicas e jurídicas integradas na tabela `pessoas`.

---

### Passo 8 — Testar Relatórios Gerenciais (`Secretaria Acadêmica`)

```cmd
curl -i -X GET "http://localhost:3000/api/relatorios/matriculas?periodo=2026.1" -H "x-user-profile: Secretaria Acadêmica"
```

* **Resultado esperado:** HTTP `200 OK` com a consolidação do total de matrículas por período e curso.

---

### Passo 9 — Testar Bloqueio de Acesso por Perfil (RBAC)

1. **Sem cabeçalho de perfil (HTTP 401 Unauthorized):**
   ```cmd
   curl -i -X GET http://localhost:3000/api/alunos
   ```

2. **Perfil sem permissão na rota (HTTP 403 Forbidden):**
   ```cmd
   curl -i -X GET http://localhost:3000/api/docentes -H "x-user-profile: Setor de Compras"
   ```

---

## 5. Como Resetar o Banco de Dados

Caso queira zerar os dados e recomeçar os testes do zero no Windows:

1. No terminal onde o servidor está rodando, pressione `Ctrl + C` e confirme com `S` (se solicitado).
2. Exclua o arquivo do banco pelo CMD:
   ```cmd
   del database.sqlite
   ```
3. Rode `npm.cmd start` novamente para recriar um banco limpo.