# Sistema de Gestão Acadêmica

Projeto Integrador: Desenvolvimento de Sistemas Orientado a Dispositivos Móveis e Baseados na Web (Senac EAD, ADS 2026, Grupo 24).

Aplicação web para gestão dos dados cadastrais de uma universidade: alunos, docentes, fornecedores e pessoas. O repositório tem duas partes:

- `backend/`: API em Node.js (Express) com banco SQLite
- `frontend/`: interface web em React + TypeScript, ligada à API

## O que faz

- Entrada por perfil de acesso (Administrador, Secretaria Acadêmica, RH, Setor de Compras), com menu que mostra só as funções de cada perfil.
- Cadastra aluno com bloqueio de CPF duplicado, matrícula gerada automaticamente pelo servidor e emissão do comprovante de vínculo acadêmico.
- Cadastra docente com titulação, departamento, carga horária e dados bancários.
- Cadastra, consulta e exclui fornecedores; a exclusão é bloqueada quando há contrato vigente ou pendência financeira.
- Consulta pessoas físicas e jurídicas por CPF/CNPJ, matrícula, nome ou tipo, mostrando o vínculo de cada uma e o perfil completo.
- Gera o relatório gerencial de matrículas por período e curso.
- Layout responsivo, seguindo os protótipos de interface do projeto.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Front-end | React 19 + TypeScript, Vite 8, React Router 7, CSS próprio |
| Back-end | Node.js + Express 4 |
| Banco de dados | SQLite (`backend/database.sqlite`, criado automaticamente) |
| Qualidade | oxlint e checagem de tipos do TypeScript (front-end) |

## Requisitos

- Node.js 20.19+ ou 22.12+ (recomendado: versão LTS)
- Windows para usar o `Start.ps1` do front-end (em Linux ou macOS, use os comandos npm abaixo)

Observação: se o Node.js não estiver instalado, o `Start.ps1` pergunta se deseja instalar via winget.

## Como executar (recomendado)

São duas janelas de terminal: uma para o backend e outra para o front-end.

**1. Backend** (primeira janela):

```powershell
cd backend
npm.cmd install
npm.cmd start
```

O terminal deve mostrar `Servidor backend rodando em http://localhost:3000`.

**2. Front-end** (segunda janela):

```powershell
cd frontend
.\Start.ps1
```

Abra http://127.0.0.1:5173 e escolha um perfil.

Para apenas preparar o front-end (sem subir o servidor):

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
3. Instala as dependências do front-end (`npm install`).
4. Garante o arquivo `.env`: se não existir, copia do `.env.example`.
5. Valida o projeto com `npm run build`.
6. Avisa se o backend não estiver respondendo.
7. Sobe o servidor de desenvolvimento.

## Como executar manualmente

```bash
# backend
cd backend
npm install
npm start

# front-end (em outro terminal)
cd frontend
npm install
cp .env.example .env      # no Windows: copy .env.example .env
npm run dev
```

Outros comandos do front-end (dentro de `frontend/`):

- `npm run build`: gera a versão de produção em `frontend/dist`
- `npm run preview`: serve a versão gerada pelo build (também repassa `/api` para o backend)
- `npm run lint`: verifica o código

Para zerar o banco, pare o backend, apague `backend/database.sqlite` e rode `npm start` de novo.

## Endereços

- Front-end: http://127.0.0.1:5173
- Backend: http://localhost:3000
- Status da API: http://localhost:3000/api/health

## Perfis de acesso

O perfil escolhido na entrada é enviado ao backend em todas as chamadas, no cabeçalho `x-user-profile`. As permissões são as mesmas do `backend/server.js`:

| Perfil | Telas disponíveis |
| --- | --- |
| Administrador | Todas |
| Secretaria Acadêmica | Cadastrar Aluno, Relatório de Matrículas |
| RH | Cadastrar Docente |
| Setor de Compras | Consultar Fornecedor, Cadastrar Fornecedor |

Abrir pelo endereço uma tela de outro perfil mostra "Acesso negado". Para trocar de perfil, use "[ trocar perfil ]" no menu.

## Telas

| Rota | Tela | Referência |
| --- | --- | --- |
| `/entrar` | Escolha do perfil de acesso | Jornadas: login e painel por perfil |
| `/` | Menu principal | Protótipo "Tela inicial" |
| `/alunos/cadastrar` | Cadastrar Aluno e emitir comprovante | Caso de Uso 1, jornada da Mariana |
| `/docentes/cadastrar` | Cadastrar Docente | Caso de Uso 2, jornada do Ricardo |
| `/fornecedores/consultar` | Consultar e excluir fornecedor | Caso de Uso 3, jornada do Camilo |
| `/fornecedores/cadastrar` | Cadastrar Fornecedor | Guia de testes, passo 6 |
| `/pessoas/consultar` | Consultar Pessoa | Caso de Uso 4 |
| `/pessoas/:id` | Perfil completo da pessoa | Caso de Uso 4 |
| `/relatorios/matriculas` | Relatório de Matrículas | Guia de testes, passo 8 |

## Integração com o backend

O front-end chama `/api/...` no próprio endereço (porta 5173), e o Vite repassa essas chamadas para o backend (proxy configurado em `frontend/vite.config.ts`). Assim o navegador não esbarra em CORS, que o backend não libera.

O perfil vai no cabeçalho sem acento (`Secretaria Academica`): o navegador envia cabeçalhos em Latin-1 e o "ê" chegaria corrompido. O backend compara os perfis sem acento, então o resultado é o mesmo.

Rotas do backend usadas pelo front-end:

| Rota | Usada em |
| --- | --- |
| `GET /api/health` | Indicador de servidor online na tela de entrada |
| `POST /api/alunos` | Cadastrar Aluno |
| `GET /api/alunos/:id/comprovante` | Emitir comprovante de vínculo |
| `GET /api/alunos` | Consultar Pessoa e Perfil (vínculo e matrícula) |
| `POST /api/docentes` | Cadastrar Docente |
| `GET /api/docentes` | Consultar Pessoa e Perfil |
| `GET /api/fornecedores?busca=` | Consultar Fornecedor, Consultar Pessoa e Perfil |
| `POST /api/fornecedores` | Cadastrar Fornecedor |
| `DELETE /api/fornecedores/:id` | Excluir fornecedor |
| `GET /api/pessoas?busca=&tipoPessoa=` | Consultar Pessoa |
| `GET /api/pessoas/:id` | Perfil da pessoa |
| `GET /api/relatorios/matriculas?periodo=&curso=` | Relatório de Matrículas |

Os tipos dos dados trocados estão em `frontend/src/types.ts`. Os testes do backend por linha de comando estão em [guia_de_testes_do_backend_windows.md](guia_de_testes_do_backend_windows.md).

## Variáveis de ambiente do front-end

Arquivo `frontend/.env` (modelo em `frontend/.env.example`):

- `BACKEND_URL=http://localhost:3000`: endereço do backend para onde o Vite repassa as chamadas `/api`.
- `VITE_MODO_DEMO=false`: com `true`, o front roda sem backend, com dados de exemplo salvos no navegador (usado para apresentar a interface sem servidor).

Depois de alterar o `.env`, reinicie o `npm run dev`.

## Estrutura essencial

- `backend/server.js`: rotas da API e permissões por perfil
- `backend/src/`: modelos, controladores, repositórios e banco SQLite
- `frontend/Start.ps1`: preparação e execução do front-end no Windows
- `frontend/vite.config.ts`: servidor do front-end e proxy para o backend
- `frontend/src/App.tsx`: rotas das telas e bloqueio por perfil
- `frontend/src/pages/`: uma tela por arquivo
- `frontend/src/components/`: componentes visuais reutilizáveis (cabeçalho, seção, campo, botão, mensagem, diálogo)
- `frontend/src/services/http.ts`: chamadas ao backend
- `frontend/src/services/sessao.ts`: perfis e permissões
- `frontend/src/services/mock.ts`: modo demonstração
- `frontend/src/types.ts`: formatos dos dados da API
- `frontend/src/utils/`: máscaras, validações e regras de negócio
- `frontend/src/styles.css`: tema visual (cores medidas nos protótipos)

## Integrantes

- Arthur Santos de Oliveira
- Douglas Fernandes Cordeiro
- Felipe Ferreira da Silva
- Felipe Moura Nunes
- Vitor Daniel De Brito
