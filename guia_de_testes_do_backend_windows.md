# Guia de testes do backend no Windows

Backend do Sistema de Gestão de Dados de uma Grande Universidade (Etapa 4).

Este guia mostra como instalar e iniciar o backend no Windows e como testar cada rota da API pelo Prompt de Comando (CMD). O banco SQLite (`database.sqlite`) é criado na primeira execução.

## 1. Pré-requisitos

- Node.js 18 ou superior (o npm vem junto).
- Prompt de Comando (`cmd.exe`), PowerShell ou o terminal do VS Code.
- Opcional: Postman, Insomnia ou a extensão Thunder Client do VS Code, para testar sem linha de comando.

## 2. Instalação e inicialização do servidor

1. Abra o Prompt de Comando na pasta do repositório (`senac-pi`) e entre na pasta `backend`:

   ```
   cd backend
   ```

2. Instale as dependências (`express` e `sqlite3`):

   ```
   npm.cmd install
   ```

3. Inicie o servidor:

   ```
   npm.cmd start
   ```

4. O terminal deve mostrar `Servidor backend rodando em http://localhost:3000`. O arquivo `database.sqlite` aparece dentro de `backend\`, já com as tabelas `pessoas`, `alunos`, `docentes` e `fornecedores` e suas restrições.

## 3. Autenticação e controle de acesso (RBAC)

Todas as rotas, exceto `/api/health`, exigem o cabeçalho HTTP `x-user-profile` com o perfil do usuário:

| Perfil (`x-user-profile`) | Permissões na API |
| ----- | ----- |
| `Administrador` | Todas as rotas, inclusive o CRUD geral de pessoas físicas e jurídicas |
| `Secretaria Acadêmica` | CRUD de alunos, comprovante de vínculo e relatórios gerenciais |
| `RH` | CRUD de docentes |
| `Setor de Compras` | CRUD de fornecedores |

Nos comandos, escreva `Secretaria Academica`, sem acento. O servidor ignora acentos ao comparar o perfil, mas o "ê" digitado no terminal chega corrompido e a chamada volta com 403.

## 4. Roteiro de testes no Prompt de Comando

Deixe o servidor rodando numa janela e execute os comandos abaixo em outra janela do Prompt de Comando (`cmd.exe`).

> Os comandos ficam em uma linha só e usam `\"` dentro do JSON, porque o `cmd.exe` não aceita aspas simples (`'`) nem quebra de linha com `\`.

### Passo 1: verificar se a API está online

```
curl -i -X GET http://localhost:3000/api/health
```

Resultado esperado: HTTP `200 OK` com `{"status":"ok","etapa":"4 - Desenvolvimento Backend"}`.

### Passo 2: cadastrar aluno com matrícula automática (Secretaria Acadêmica)

```
curl -i -X POST http://localhost:3000/api/alunos -H "Content-Type: application/json" -H "x-user-profile: Secretaria Academica" -d "{\"nome\": \"João Silva Nascimento\", \"documento\": \"12345678901\", \"email\": \"joao.nascimento@universidade.edu.br\", \"telefone\": \"11999990000\", \"curso\": \"Análise e Desenvolvimento de Sistemas\", \"periodo\": \"2026.1\"}"
```

Resultado esperado: HTTP `201 Created` com os dados do aluno e o campo `matricula` preenchido pelo servidor (ex.: `"2026123456"`).

### Passo 3: tentar cadastrar o mesmo CPF (HTTP 409)

Repita o cadastro com o CPF `12345678901`:

```
curl -i -X POST http://localhost:3000/api/alunos -H "Content-Type: application/json" -H "x-user-profile: Secretaria Academica" -d "{\"nome\": \"Outro Aluno\", \"documento\": \"12345678901\", \"curso\": \"Engenharia de Software\", \"periodo\": \"2026.1\"}"
```

Resultado esperado: HTTP `409 Conflict` com a mensagem `"CPF já cadastrado no sistema."`.

### Passo 4: consultar, atualizar e emitir o comprovante de vínculo do aluno

1. Listar os alunos:

   ```
   curl -i -X GET http://localhost:3000/api/alunos -H "x-user-profile: Secretaria Academica"
   ```

2. Atualizar o telefone do aluno de ID `1`:

   ```
   curl -i -X PUT http://localhost:3000/api/alunos/1 -H "Content-Type: application/json" -H "x-user-profile: Secretaria Academica" -d "{\"telefone\": \"11977776666\"}"
   ```

3. Emitir o comprovante de vínculo acadêmico:

   ```
   curl -i -X GET http://localhost:3000/api/alunos/1/comprovante -H "x-user-profile: Secretaria Academica"
   ```

### Passo 5: cadastrar e consultar docentes (RH)

1. Cadastrar um docente:

   ```
   chcp 65001 && curl -i -X POST http://localhost:3000/api/docentes -H "Content-Type: application/json" -H "x-user-profile: RH" -d "{\"nome\": \"Dra. Helena Souza\", \"documento\": \"98765432100\", \"email\": \"helena.souza@universidade.edu.br\", \"telefone\": \"11988887777\", \"titulacao\": \"Doutorado\", \"cargaHoraria\": 40, \"departamento\": \"Computação\", \"dadosBancarios\": \"Banco 001 / Ag 1234-5 / CC 67890-1\"}"
   ```

2. Consultar os docentes:

   ```
   curl -i -X GET http://localhost:3000/api/docentes -H "x-user-profile: RH"
   ```

### Passo 6: fornecedores e bloqueio de exclusão (Setor de Compras)

1. Cadastre um fornecedor com contrato vigente (ele fica com o ID `1`):

   ```
   curl -i -X POST http://localhost:3000/api/fornecedores -H "Content-Type: application/json" -H "x-user-profile: Setor de Compras" -d "{\"razaoSocial\": \"Tech Suprimentos LTDA\", \"cnpj\": \"11222333000181\", \"email\": \"contato@techsuprimentos.com.br\", \"telefone\": \"1133334444\", \"contratoVigente\": true, \"pendenciaFinanceira\": false}"
   ```

   Tente excluí-lo:

   ```
   curl -i -X DELETE http://localhost:3000/api/fornecedores/1 -H "x-user-profile: Setor de Compras"
   ```

   Resultado esperado: HTTP `409 Conflict` com `"Exclusão bloqueada: fornecedor possui contrato vigente."`.

2. Cadastre um fornecedor sem contrato e sem pendência (ele fica com o ID `2`):

   ```
   curl -i -X POST http://localhost:3000/api/fornecedores -H "Content-Type: application/json" -H "x-user-profile: Setor de Compras" -d "{\"razaoSocial\": \"Papelaria Central ME\", \"cnpj\": \"44555666000199\", \"contratoVigente\": false, \"pendenciaFinanceira\": false}"
   ```

3. Exclua esse segundo fornecedor:

   ```
   curl -i -X DELETE http://localhost:3000/api/fornecedores/2 -H "x-user-profile: Setor de Compras"
   ```

   Resultado esperado: HTTP `200 OK` com `"Fornecedor excluído com segurança."`.

### Passo 7: listar pessoas físicas e jurídicas (Administrador)

```
curl -i -X GET http://localhost:3000/api/pessoas -H "x-user-profile: Administrador"
```

Resultado esperado: HTTP `200 OK` com todas as pessoas físicas e jurídicas da tabela `pessoas`.

### Passo 8: relatório de matrículas (Sistema Acadêmico)

```
curl -i -X GET "http://localhost:3000/api/relatorios/matriculas?periodo=2026.1" -H "x-user-profile: Secretaria Academica"
```

Resultado esperado: HTTP `200 OK` com o total de matrículas por período e curso.

### Passo 9: bloqueio de acesso por perfil (HTTP 401 e 403)

1. Sem o cabeçalho de perfil, a resposta é HTTP `401`:

   ```
   curl -i -X GET http://localhost:3000/api/alunos
   ```

2. Com um perfil que não tem permissão na rota, a resposta é HTTP `403`:

   ```
   curl -i -X GET http://localhost:3000/api/docentes -H "x-user-profile: Setor de Compras"
   ```

## 5. Como zerar o banco de dados

1. No terminal do servidor, pressione `Ctrl + C` e confirme com `S` se o Windows perguntar.

2. Ainda na pasta `backend`, apague o arquivo do banco:

   ```
   del database.sqlite
   ```

3. Rode `npm start` de novo para criar um banco vazio.
