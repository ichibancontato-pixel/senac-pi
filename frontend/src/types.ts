// Tipos compartilhados entre as telas e a camada de dados.
// Os nomes dos campos seguem as colunas do banco (DDL do Grupo 23),
// para que o JSON trocado com o back-end use exatamente os mesmos nomes.

export type Turno = 'Matutino' | 'Vespertino' | 'Noturno' | 'Integral'
export const TURNOS: Turno[] = ['Matutino', 'Vespertino', 'Noturno', 'Integral']

export type Titulacao = 'Especialista' | 'Mestre' | 'Doutor'
export const TITULACOES: Titulacao[] = ['Especialista', 'Mestre', 'Doutor']

export type SituacaoAluno = 'Ativo' | 'Trancado' | 'Formado' | 'Cancelado'
export type Vinculo = 'Aluno' | 'Docente' | 'Administrador'

export interface Curso {
  id_curso: number
  nome_curso: string
}

export interface Departamento {
  id_departamento: number
  nome_depto: string
}

/** Corpo do POST /api/alunos. CPF com 11 dígitos, data em AAAA-MM-DD. */
export interface NovoAluno {
  nome: string
  cpf: string
  data_nascimento: string
  id_curso: number
  turno: Turno
}

export interface AlunoCadastrado {
  id_pessoa: number
  nome: string
  cpf: string
  matricula: string
  id_curso: number
  nome_curso: string
  turno: Turno
  data_matricula: string
}

/** Corpo do POST /api/docentes. Dados bancários são opcionais. */
export interface NovoDocente {
  nome: string
  cpf: string
  titulacao: Titulacao
  id_departamento: number
  carga_horaria: number
  banco: string | null
  agencia: string | null
  conta_corrente: string | null
}

export interface DocenteCadastrado {
  id_pessoa: number
  nome: string
  cpf: string
  titulacao: Titulacao
  id_departamento: number
  nome_depto: string
  carga_horaria: number
}

export interface Fornecedor {
  id_fornecedor: number
  razao_social: string
  cnpj: string
  categoria: string
  contrato: string
  /** true = contrato vigente (status "Ativo"). */
  ativo: boolean
  possui_pendencia: boolean
}

/** Filtros do GET /api/pessoas. Todos opcionais; os informados são combinados (E). */
export interface FiltroPessoa {
  cpf?: string
  matricula?: string
  nome?: string
  data_nascimento?: string
}

export interface PessoaResumo {
  id_pessoa: number
  nome: string
  cpf: string
  vinculo: Vinculo | null
  matricula: string | null
}

export interface PessoaDetalhe extends PessoaResumo {
  data_nascimento: string
  email: string | null
  telefone: string | null
  ativo: boolean
  aluno: {
    matricula: string
    nome_curso: string
    turno: Turno
    situacao: SituacaoAluno
    data_matricula: string
  } | null
  docente: {
    titulacao: Titulacao
    nome_depto: string
    carga_horaria: number
    banco: string | null
    agencia: string | null
    conta_corrente: string | null
  } | null
  administrador: {
    login: string
  } | null
}

/** Contrato que o front espera do back-end (real ou de demonstração). */
export interface Api {
  listarCursos(): Promise<Curso[]>
  listarDepartamentos(): Promise<Departamento[]>
  cadastrarAluno(dados: NovoAluno): Promise<AlunoCadastrado>
  cadastrarDocente(dados: NovoDocente): Promise<DocenteCadastrado>
  buscarFornecedores(termo: string): Promise<Fornecedor[]>
  excluirFornecedor(id: number): Promise<void>
  consultarPessoas(filtro: FiltroPessoa): Promise<PessoaResumo[]>
  obterPessoa(id: number): Promise<PessoaDetalhe>
}
