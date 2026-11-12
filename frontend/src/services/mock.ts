// Back-end de demonstração: roda inteiro no navegador, sem servidor.
// Usado quando VITE_API_URL não está definida. Os dados iniciais espelham o
// script DML do projeto (DML_gestao_universitaria.sql) e as alterações ficam
// salvas no localStorage do navegador.

import { ApiError, MENSAGENS } from './erros'
import type {
  AlunoCadastrado,
  Api,
  Curso,
  Departamento,
  DocenteCadastrado,
  Fornecedor,
  PessoaDetalhe,
  PessoaResumo,
  SituacaoAluno,
  Titulacao,
  Turno,
  Vinculo,
} from '../types'
import { hojeIso, normalizar, soDigitos } from '../utils/formatos'
import { motivosBloqueioExclusao } from '../utils/regras'

interface PessoaLinha {
  id_pessoa: number
  nome: string
  cpf: string
  data_nascimento: string
  email: string | null
  telefone: string | null
  ativo: boolean
}

interface AlunoLinha {
  id_aluno: number
  matricula: string
  id_curso: number
  turno: Turno
  data_matricula: string
  situacao: SituacaoAluno
}

interface DocenteLinha {
  id_docente: number
  titulacao: Titulacao
  id_departamento: number
  carga_horaria: number
  banco: string | null
  agencia: string | null
  conta_corrente: string | null
}

interface AdministradorLinha {
  id_administrador: number
  login: string
}

interface BancoDemo {
  cursos: Curso[]
  departamentos: Departamento[]
  pessoas: PessoaLinha[]
  alunos: AlunoLinha[]
  docentes: DocenteLinha[]
  administradores: AdministradorLinha[]
  fornecedores: Fornecedor[]
}

const CHAVE_ARMAZENAMENTO = 'sga-demo-v1'

function dadosIniciais(): BancoDemo {
  return {
    cursos: [
      { id_curso: 1, nome_curso: 'Análise e Desenvolvimento de Sistemas' },
      { id_curso: 2, nome_curso: 'Administração' },
      { id_curso: 3, nome_curso: 'Ciências Contábeis' },
      { id_curso: 4, nome_curso: 'Engenharia Civil' },
    ],
    departamentos: [
      { id_departamento: 1, nome_depto: 'Tecnologia da Informação' },
      { id_departamento: 2, nome_depto: 'Ciências Humanas' },
      { id_departamento: 3, nome_depto: 'Exatas e Engenharias' },
      { id_departamento: 4, nome_depto: 'Gestão e Negócios' },
    ],
    pessoas: [
      { id_pessoa: 1, nome: 'Carlos Alberto Souza', cpf: '00000000001', data_nascimento: '1985-03-10', email: 'carlos.admin@univ.edu.br', telefone: '(11)99999-0001', ativo: true },
      { id_pessoa: 2, nome: 'João Silva Nascimento', cpf: '11122233344', data_nascimento: '2000-06-15', email: 'joao.aluno@univ.edu.br', telefone: '(11)98888-0002', ativo: true },
      { id_pessoa: 3, nome: 'Maria de Fátima Souza', cpf: '55566677788', data_nascimento: '1999-11-22', email: 'maria.aluno@univ.edu.br', telefone: '(11)97777-0003', ativo: true },
      { id_pessoa: 4, nome: 'Ana Paula Ferreira', cpf: '22233344455', data_nascimento: '1978-04-30', email: 'ana.docente@univ.edu.br', telefone: '(11)96666-0004', ativo: true },
      { id_pessoa: 5, nome: 'Roberto Carlos Lima', cpf: '33344455566', data_nascimento: '1975-09-18', email: 'roberto.doc@univ.edu.br', telefone: '(11)95555-0005', ativo: true },
    ],
    alunos: [
      { id_aluno: 2, matricula: '2026001001', id_curso: 1, turno: 'Noturno', data_matricula: '2026-02-02', situacao: 'Ativo' },
      { id_aluno: 3, matricula: '2026001002', id_curso: 2, turno: 'Vespertino', data_matricula: '2026-02-02', situacao: 'Ativo' },
    ],
    docentes: [
      { id_docente: 4, titulacao: 'Mestre', id_departamento: 1, carga_horaria: 40, banco: 'Banco do Brasil', agencia: '0001-9', conta_corrente: '12345-6' },
      { id_docente: 5, titulacao: 'Doutor', id_departamento: 3, carga_horaria: 20, banco: 'Itaú', agencia: '3456-7', conta_corrente: '98765-4' },
    ],
    administradores: [{ id_administrador: 1, login: 'carlos.admin' }],
    fornecedores: [
      // Contrato vigente + pendência: exclusão bloqueada
      { id_fornecedor: 1, razao_social: 'Kalunga Suprimentos', cnpj: '43283811000158', categoria: 'Material de Escritório', contrato: 'CT-2023/12', ativo: true, possui_pendencia: true },
      // Contrato vigente: exclusão bloqueada
      { id_fornecedor: 2, razao_social: 'Dell Computadores do Brasil', cnpj: '72381189000110', categoria: 'Equipamentos de TI', contrato: 'CT-2022/04', ativo: true, possui_pendencia: false },
      // Inativo e sem pendências: pode ser excluído
      { id_fornecedor: 3, razao_social: 'Limpeza & Cia', cnpj: '12345678000199', categoria: 'Serviços de Limpeza', contrato: 'CT-2021/01', ativo: false, possui_pendencia: false },
    ],
  }
}

function carregar(): BancoDemo {
  try {
    const salvo = localStorage.getItem(CHAVE_ARMAZENAMENTO)
    if (salvo) return JSON.parse(salvo) as BancoDemo
  } catch {
    // localStorage indisponível ou corrompido: volta aos dados iniciais
  }
  return dadosIniciais()
}

let banco = carregar()

function salvar() {
  try {
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(banco))
  } catch {
    // sem armazenamento: os dados ficam só na memória desta aba
  }
}

/** Simula o tempo de resposta de um servidor. */
const aguardar = (ms = 250) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const clonar = <T>(valor: T): T => JSON.parse(JSON.stringify(valor)) as T

function proximoIdPessoa(): number {
  return Math.max(0, ...banco.pessoas.map((p) => p.id_pessoa)) + 1
}

/** Matrícula = ano atual + sequencial de 6 dígitos (ex.: 2026001003). */
function proximaMatricula(): string {
  const ano = String(new Date().getFullYear())
  const sequenciais = banco.alunos
    .filter((a) => a.matricula.startsWith(ano))
    .map((a) => Number(a.matricula.slice(ano.length)))
  const proximo = Math.max(0, ...sequenciais) + 1
  return `${ano}${String(proximo).padStart(6, '0')}`
}

function vinculoDe(idPessoa: number): Vinculo | null {
  if (banco.alunos.some((a) => a.id_aluno === idPessoa)) return 'Aluno'
  if (banco.docentes.some((d) => d.id_docente === idPessoa)) return 'Docente'
  if (banco.administradores.some((a) => a.id_administrador === idPessoa)) return 'Administrador'
  return null
}

function resumoDe(pessoa: PessoaLinha): PessoaResumo {
  const aluno = banco.alunos.find((a) => a.id_aluno === pessoa.id_pessoa)
  return {
    id_pessoa: pessoa.id_pessoa,
    nome: pessoa.nome,
    cpf: pessoa.cpf,
    vinculo: vinculoDe(pessoa.id_pessoa),
    matricula: aluno?.matricula ?? null,
  }
}

function exigirCampos(dados: object, campos: string[]) {
  const registro = dados as Record<string, unknown>
  const faltando = campos.filter((c) => registro[c] === undefined || registro[c] === null || registro[c] === '')
  if (faltando.length > 0) {
    throw new ApiError('VALIDACAO', MENSAGENS.camposObrigatorios, { campos: faltando })
  }
}

function exigirCpfLivre(cpf: string) {
  if (banco.pessoas.some((p) => p.cpf === cpf)) {
    throw new ApiError('CONFLITO', MENSAGENS.cpfDuplicado, { campos: ['cpf'] })
  }
}

export const apiDemo: Api = {
  async listarCursos() {
    await aguardar(120)
    return clonar(banco.cursos)
  },

  async listarDepartamentos() {
    await aguardar(120)
    return clonar(banco.departamentos)
  },

  async cadastrarAluno(dados) {
    await aguardar()
    exigirCampos(dados, ['nome', 'cpf', 'data_nascimento', 'id_curso', 'turno'])
    const cpf = soDigitos(dados.cpf)
    exigirCpfLivre(cpf)
    const curso = banco.cursos.find((c) => c.id_curso === dados.id_curso)
    if (!curso) throw new ApiError('VALIDACAO', 'Curso inválido.', { campos: ['id_curso'] })

    const id = proximoIdPessoa()
    const matricula = proximaMatricula()
    const hoje = hojeIso()
    banco.pessoas.push({ id_pessoa: id, nome: dados.nome.trim(), cpf, data_nascimento: dados.data_nascimento, email: null, telefone: null, ativo: true })
    banco.alunos.push({ id_aluno: id, matricula, id_curso: curso.id_curso, turno: dados.turno, data_matricula: hoje, situacao: 'Ativo' })
    salvar()

    const cadastrado: AlunoCadastrado = {
      id_pessoa: id,
      nome: dados.nome.trim(),
      cpf,
      matricula,
      id_curso: curso.id_curso,
      nome_curso: curso.nome_curso,
      turno: dados.turno,
      data_matricula: hoje,
    }
    return cadastrado
  },

  async cadastrarDocente(dados) {
    await aguardar()
    exigirCampos(dados, ['nome', 'cpf', 'titulacao', 'id_departamento', 'carga_horaria'])
    if (!(dados.carga_horaria > 0)) {
      throw new ApiError('VALIDACAO', 'A carga horária deve ser maior que zero.', { campos: ['carga_horaria'] })
    }
    const cpf = soDigitos(dados.cpf)
    exigirCpfLivre(cpf)
    const departamento = banco.departamentos.find((d) => d.id_departamento === dados.id_departamento)
    if (!departamento) throw new ApiError('VALIDACAO', 'Departamento inválido.', { campos: ['id_departamento'] })

    const id = proximoIdPessoa()
    // A tela de docente não pede data de nascimento; a coluna é obrigatória no banco,
    // então o demo grava a data do cadastro. O back-end real deve decidir essa regra.
    banco.pessoas.push({ id_pessoa: id, nome: dados.nome.trim(), cpf, data_nascimento: hojeIso(), email: null, telefone: null, ativo: true })
    banco.docentes.push({
      id_docente: id,
      titulacao: dados.titulacao,
      id_departamento: departamento.id_departamento,
      carga_horaria: dados.carga_horaria,
      banco: dados.banco,
      agencia: dados.agencia,
      conta_corrente: dados.conta_corrente,
    })
    salvar()

    const cadastrado: DocenteCadastrado = {
      id_pessoa: id,
      nome: dados.nome.trim(),
      cpf,
      titulacao: dados.titulacao,
      id_departamento: departamento.id_departamento,
      nome_depto: departamento.nome_depto,
      carga_horaria: dados.carga_horaria,
    }
    return cadastrado
  },

  async buscarFornecedores(termo) {
    await aguardar()
    const texto = normalizar(termo)
    const digitos = soDigitos(termo)
    const encontrados = banco.fornecedores.filter((f) => {
      if (!texto) return true
      const porRazao = normalizar(f.razao_social).includes(texto)
      const porCnpj = digitos.length > 0 && f.cnpj.includes(digitos)
      return porRazao || porCnpj
    })
    return clonar(encontrados)
  },

  async excluirFornecedor(id) {
    await aguardar()
    const fornecedor = banco.fornecedores.find((f) => f.id_fornecedor === id)
    if (!fornecedor) throw new ApiError('NAO_ENCONTRADO', 'Fornecedor não encontrado.')
    const motivos = motivosBloqueioExclusao(fornecedor)
    if (motivos.length > 0) {
      throw new ApiError('CONFLITO', MENSAGENS.exclusaoBloqueada, { detalhe: motivos.join(' ') })
    }
    banco.fornecedores = banco.fornecedores.filter((f) => f.id_fornecedor !== id)
    salvar()
  },

  async consultarPessoas(filtro) {
    await aguardar()
    const cpf = soDigitos(filtro.cpf ?? '')
    const matricula = soDigitos(filtro.matricula ?? '')
    const nome = normalizar(filtro.nome ?? '')
    const nascimento = filtro.data_nascimento ?? ''
    return banco.pessoas
      .map((p) => ({ pessoa: p, resumo: resumoDe(p) }))
      .filter(({ pessoa, resumo }) => {
        if (cpf && !pessoa.cpf.includes(cpf)) return false
        if (matricula && !(resumo.matricula ?? '').includes(matricula)) return false
        if (nome && !normalizar(pessoa.nome).includes(nome)) return false
        if (nascimento && pessoa.data_nascimento !== nascimento) return false
        return true
      })
      .map(({ resumo }) => resumo)
  },

  async obterPessoa(id) {
    await aguardar(150)
    const pessoa = banco.pessoas.find((p) => p.id_pessoa === id)
    if (!pessoa) throw new ApiError('NAO_ENCONTRADO', 'Pessoa não encontrada.')
    const aluno = banco.alunos.find((a) => a.id_aluno === id)
    const docente = banco.docentes.find((d) => d.id_docente === id)
    const administrador = banco.administradores.find((a) => a.id_administrador === id)

    const detalhe: PessoaDetalhe = {
      ...resumoDe(pessoa),
      data_nascimento: pessoa.data_nascimento,
      email: pessoa.email,
      telefone: pessoa.telefone,
      ativo: pessoa.ativo,
      aluno: aluno
        ? {
            matricula: aluno.matricula,
            nome_curso: banco.cursos.find((c) => c.id_curso === aluno.id_curso)?.nome_curso ?? '—',
            turno: aluno.turno,
            situacao: aluno.situacao,
            data_matricula: aluno.data_matricula,
          }
        : null,
      docente: docente
        ? {
            titulacao: docente.titulacao,
            nome_depto:
              banco.departamentos.find((d) => d.id_departamento === docente.id_departamento)?.nome_depto ?? '—',
            carga_horaria: docente.carga_horaria,
            banco: docente.banco,
            agencia: docente.agencia,
            conta_corrente: docente.conta_corrente,
          }
        : null,
      administrador: administrador ? { login: administrador.login } : null,
    }
    return clonar(detalhe)
  },
}

/** Apaga as alterações feitas no modo demonstração e volta aos dados iniciais. */
export function restaurarDadosDemo() {
  banco = dadosIniciais()
  try {
    localStorage.removeItem(CHAVE_ARMAZENAMENTO)
  } catch {
    // nada a fazer
  }
}
