# Sistema de Gestão Acadêmica

Projeto Integrador: Desenvolvimento de Sistemas Orientado a Dispositivos Móveis e Baseados na Web (Senac EAD, ADS 2026, Grupo 24).

Aplicação web para gestão dos dados cadastrais de uma universidade: alunos, docentes, fornecedores e pessoas. O front-end está na pasta `frontend/`. O back-end em Python e os scripts do banco entram em pastas próprias.

## O que faz

- Menu principal com as quatro funções do sistema (atalhos de teclado 1 a 4).
- Cadastra aluno com campos obrigatórios, máscara de CPF e data, bloqueio de CPF duplicado e matrícula gerada automaticamente, com comprovante para impressão.
- Cadastra docente com titulação, departamento, carga horária e dados bancários opcionais. Pede confirmação antes de descartar o que foi digitado.
- Consulta fornecedores por CNPJ ou razão social e só exclui quem não tem contrato vigente nem pendência financeira.
- Consulta pessoas por CPF, matrícula, nome ou data de nascimento e abre o perfil completo.
- Funciona sem back-end, em modo demonstração, ou ligado à API real.
- Layout responsivo, seguindo os protótipos de interface do projeto.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Front-end | React 19 + TypeScript, Vite 8, React Router 7, CSS próprio |
| Back-end | Python (em desenvolvimento) |
| Banco de dados | PostgreSQL |
| Qualidade | oxlint e checagem de tipos do TypeScript |

## Requisitos

- Node.js 20.19+ ou 22.12+ (recomendado: versão LTS)
- Windows para usar o `Start.ps1` (em Linux ou macOS, use os comandos npm abaixo)

Observação: se o Node.js não estiver instalado, o script pergunta se deseja instalar via winget.

## Como executar (recomendado)

No PowerShell, a partir da raiz do repositório:

```powershell
cd frontend
.\Start.ps1
```

Para apenas preparar o ambiente (sem subir o servidor):

```powershell
.\Start.ps1 -SetupOnly
```

Se o Windows bloquear a execução de scripts:

```powershell
powershell -ExecutionPolicy Bypass -File .\Start.ps1
```

## O que o Start.ps1 faz

1. Verifica se o Node.js existe e se a versão é compatível.
2. Oferece instalação via winget quando necessário.
3. Instala as dependências (`npm install`).
4. Garante o arquivo `.env`: se não existir, copia do `.env.example`.
5. Valida o projeto com `npm run build`.
6. Sobe o servidor de desenvolvimento.

## Como executar manualmente

```bash
cd frontend
npm install
cp .env.example .env      # no Windows: copy .env.example .env
npm run dev
```

Outros comandos (dentro de `frontend/`):

- `npm run build`: gera a versão de produção em `frontend/dist`
- `npm run preview`: serve a versão gerada pelo build
- `npm run lint`: verifica o código

## Endereços

- App (desenvolvimento): http://127.0.0.1:5173
- App (preview do build): http://127.0.0.1:4173

## Telas

| Rota | Tela | Referência |
| --- | --- | --- |
| `/` | Menu principal | Protótipo "Tela inicial" |
| `/alunos/cadastrar` | Cadastrar Aluno | Caso de Uso 1, jornada da Mariana |
| `/docentes/cadastrar` | Cadastrar Docente | Caso de Uso 2, jornada do Ricardo |
| `/fornecedores/consultar` | Consultar e excluir fornecedor | Caso de Uso 3, jornada do Camilo |
| `/pessoas/consultar` | Consultar Pessoa | Caso de Uso 4 |
| `/pessoas/:id` | Perfil completo da pessoa | Caso de Uso 4 |

## Modo demonstração

Com `VITE_API_URL` vazia, o front usa um back-end simulado dentro do próprio navegador, com os mesmos dados do script DML do projeto. Cadastros e exclusões ficam salvos no navegador. Para voltar aos dados iniciais, use o link "restaurar dados iniciais" no rodapé do menu.

Dados para testar os cenários:

- CPF já cadastrado (testa o bloqueio de duplicidade): `111.222.333-44`
- Fornecedor bloqueado por pendência financeira: Kalunga Suprimentos
- Fornecedor bloqueado por contrato vigente: Dell Computadores do Brasil
- Fornecedor que pode ser excluído: Limpeza & Cia

## Variáveis de ambiente

Arquivo `frontend/.env` (modelo em `frontend/.env.example`).

- `VITE_API_URL=`: endereço do back-end, sem barra no final (ex.: `http://127.0.0.1:5000`). Vazio = modo demonstração.

Depois de alterar o `.env`, reinicie o `npm run dev`.

## Rotas da API consumidas pelo front

Contrato que o back-end deve implementar. O JSON usa os mesmos nomes de colunas do banco. CPF vai com 11 dígitos, CNPJ com 14 dígitos e datas no formato `AAAA-MM-DD`.

| Rota | Envia | Respostas esperadas |
| --- | --- | --- |
| `GET /api/cursos` | | 200: lista de `{ id_curso, nome_curso }` |
| `GET /api/departamentos` | | 200: lista de `{ id_departamento, nome_depto }` |
| `POST /api/alunos` | `{ nome, cpf, data_nascimento, id_curso, turno }` | 201: `{ id_pessoa, nome, cpf, matricula, id_curso, nome_curso, turno, data_matricula }`; 409: CPF já cadastrado; 422: campos inválidos |
| `POST /api/docentes` | `{ nome, cpf, titulacao, id_departamento, carga_horaria, banco, agencia, conta_corrente }` | 201: `{ id_pessoa, nome, cpf, titulacao, id_departamento, nome_depto, carga_horaria }`; 409: CPF já cadastrado; 422: campos inválidos |
| `GET /api/fornecedores?busca=<termo>` | | 200: lista de `{ id_fornecedor, razao_social, cnpj, categoria, contrato, ativo, possui_pendencia }` |
| `DELETE /api/fornecedores/<id>` | | 204: excluído; 409: contrato vigente ou pendência; 404: não encontrado |
| `GET /api/pessoas?cpf=&matricula=&nome=&data_nascimento=` | | 200: lista de `{ id_pessoa, nome, cpf, vinculo, matricula }` |
| `GET /api/pessoas/<id>` | | 200: dados da pessoa com os objetos `aluno`, `docente` e `administrador` (ou `null`); 404: não encontrado |

Valores aceitos:

- `turno`: Matutino, Vespertino, Noturno, Integral
- `titulacao`: Especialista, Mestre, Doutor
- `vinculo`: Aluno, Docente, Administrador

Formato de erro: `{ "mensagem": "texto para o usuário", "campos": ["cpf"], "detalhe": "opcional" }`. Status 5xx ou servidor fora do ar mostram a mensagem de falha de comunicação prevista nos casos de uso. Os tipos completos estão em `frontend/src/types.ts`.

CORS: o back-end precisa liberar a origem `http://127.0.0.1:5173` (Flask: `flask-cors`; FastAPI: `CORSMiddleware`).

## Estrutura essencial

- `frontend/Start.ps1`: setup e execução no Windows
- `frontend/src/main.tsx`: inicialização do React
- `frontend/src/App.tsx`: rotas das telas
- `frontend/src/pages/`: uma tela por arquivo
- `frontend/src/components/`: componentes visuais reutilizáveis (cabeçalho, seção, campo, botão, mensagem, diálogo)
- `frontend/src/services/api.ts`: escolhe entre a API real e o modo demonstração
- `frontend/src/services/http.ts`: chamadas ao back-end
- `frontend/src/services/mock.ts`: back-end simulado com os dados do DML
- `frontend/src/types.ts`: tipos e contrato da API
- `frontend/src/utils/`: máscaras, validações e regras de negócio
- `frontend/src/styles.css`: tema visual (cores medidas nos protótipos)

## Integrantes

- Arthur Santos de Oliveira
- Douglas Fernandes Cordeiro
- Felipe Ferreira da Silva
- Felipe Moura Nunes
- Vitor Daniel De Brito
