// Tipos compartilhados entre as telas e a camada de dados.
// Os formatos seguem o backend (pasta backend/): o que a API recebe usa camelCase
// e o que ela devolve usa os nomes das colunas do SQLite (snake_case).

// ---------------------------------------------------------------- Perfis de acesso

export type Perfil = 'Administrador' | 'Secretaria Acadêmica' | 'RH' | 'Setor de Compras'

// ---------------------------------------------------------------- Listas fixas da interface

export const CURSOS = [
  'Análise e Desenvolvimento de Sistemas',
  'Administração',
  'Ciências Contábeis',
  'Engenharia Civil',
  'Engenharia de Software',
]

export const DEPARTAMENTOS = [
  'Computação',
  'Tecnologia da Informação',
  'Ciências Humanas',
  'Exatas e Engenharias',
  'Gestão e Negócios',
]

export const TITULACOES = ['Especialista', 'Mestre', 'Doutor']

/** Períodos letivos oferecidos no cadastro: semestres do ano atual e o 1º do próximo. */
export function periodosLetivos(hoje = new Date()): string[] {
  const ano = hoje.getFullYear()
  return [`${ano}.1`, `${ano}.2`, `${ano + 1}.1`]
}

// ---------------------------------------------------------------- Pessoas

export type TipoPessoa = 'FISICA' | 'JURIDICA'

/** Linha da tabela `pessoas` (GET /api/pessoas e /api/pessoas/:id). */
export interface Pessoa {
  id: number
  tipo_pessoa: TipoPessoa
  nome: string
  documento: string
  email: string | null
  telefone: string | null
  criado_em: string
}

// ---------------------------------------------------------------- Alunos

/** Corpo do POST /api/alunos. */
export interface NovoAluno {
  nome: string
  documento: string
  email: string | null
  telefone: string | null
  curso: string
  periodo: string
}

/** Aluno devolvido pela API (pessoa + dados acadêmicos). */
export interface Aluno {
  id: number
  pessoa_id: number
  matricula: string
  curso: string
  periodo: string
  status_vinculo: string
  nome: string
  documento: string
  email: string | null
  telefone: string | null
}

/** GET /api/alunos/:id/comprovante */
export interface ComprovanteVinculo {
  comprovante: string
  emitido_em: string
  matricula: string
  nome: string
  cpf: string
  curso: string
  periodo: string
  status_vinculo: string
}

// ---------------------------------------------------------------- Docentes

/** Corpo do POST /api/docentes. */
export interface NovoDocente {
  nome: string
  documento: string
  email: string | null
  telefone: string | null
  titulacao: string
  cargaHoraria: number
  departamento: string
  /** Texto único, ex.: "Banco 001 / Ag 1234-5 / CC 67890-1". */
  dadosBancarios: string
}

export interface Docente {
  id: number
  pessoa_id: number
  titulacao: string
  carga_horaria: number
  departamento: string
  dados_bancarios: string
  nome: string
  documento: string
  email: string | null
  telefone: string | null
}

// ---------------------------------------------------------------- Fornecedores

/** Corpo do POST /api/fornecedores. */
export interface NovoFornecedor {
  razaoSocial: string
  cnpj: string
  email: string | null
  telefone: string | null
  contratoVigente: boolean
  pendenciaFinanceira: boolean
}

export interface Fornecedor {
  id: number
  pessoa_id: number
  razao_social: string
  cnpj: string
  contrato_vigente: boolean
  pendencia_financeira: boolean
  email: string | null
  telefone: string | null
}

// ---------------------------------------------------------------- Consulta de pessoas

export type Vinculo = 'Aluno' | 'Docente' | 'Fornecedor' | 'Pessoa física' | 'Pessoa jurídica'

export interface FiltroPessoa {
  documento?: string
  matricula?: string
  nome?: string
  tipoPessoa?: TipoPessoa
}

export interface PessoaResumo extends Pessoa {
  vinculo: Vinculo
  matricula: string | null
}

export interface PessoaDetalhe {
  pessoa: Pessoa
  aluno: Aluno | null
  docente: Docente | null
  fornecedor: Fornecedor | null
}

// ---------------------------------------------------------------- Relatórios

export interface LinhaRelatorio {
  periodo: string
  curso: string
  status_vinculo: string
  total_matriculas: number
}

/** GET /api/relatorios/matriculas */
export interface RelatorioMatriculas {
  modulo: string
  filtros: { periodo: string; curso: string }
  total_geral: number
  detalhamento: LinhaRelatorio[]
}

// ---------------------------------------------------------------- Contrato da camada de dados

/** O que as telas usam. Implementado pelo cliente HTTP (backend real) e pelo modo demonstração. */
export interface Api {
  servidorOnline(): Promise<boolean>
  cadastrarAluno(dados: NovoAluno): Promise<Aluno>
  emitirComprovante(idAluno: number): Promise<ComprovanteVinculo>
  cadastrarDocente(dados: NovoDocente): Promise<Docente>
  buscarFornecedores(termo: string): Promise<Fornecedor[]>
  cadastrarFornecedor(dados: NovoFornecedor): Promise<Fornecedor>
  /** Devolve a mensagem de sucesso do servidor. */
  excluirFornecedor(id: number): Promise<string>
  consultarPessoas(filtro: FiltroPessoa): Promise<PessoaResumo[]>
  obterPessoa(id: number): Promise<PessoaDetalhe>
  relatorioMatriculas(filtro: { periodo?: string; curso?: string }): Promise<RelatorioMatriculas>
}
