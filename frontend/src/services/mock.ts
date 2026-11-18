// Modo demonstração: imita o backend dentro do navegador, sem servidor.
// Usado quando VITE_MODO_DEMO=true (por exemplo, na página publicada para apresentação).
// Respostas e mensagens seguem as do backend; as alterações ficam no localStorage.

import { ApiError } from './erros'
import type {
  Aluno,
  Api,
  ComprovanteVinculo,
  Docente,
  Fornecedor,
  LinhaRelatorio,
  Pessoa,
  PessoaDetalhe,
  TipoPessoa,
} from '../types'
import { soDigitos } from '../utils/formatos'
import { combinarPessoas } from '../utils/pessoas'

interface BancoDemo {
  pessoas: Pessoa[]
  alunos: Aluno[]
  docentes: Docente[]
  fornecedores: Fornecedor[]
}

const CHAVE_ARMAZENAMENTO = 'sga-demo-v2'
const CRIADO = '2026-02-02 09:00:00'

function pessoa(id: number, tipo: TipoPessoa, nome: string, documento: string, email: string | null, telefone: string | null): Pessoa {
  return { id, tipo_pessoa: tipo, nome, documento, email, telefone, criado_em: CRIADO }
}

function dadosIniciais(): BancoDemo {
  const pessoas = [
    pessoa(1, 'FISICA', 'Carlos Alberto Souza', '00000000001', 'carlos.admin@univ.edu.br', '11999990001'),
    pessoa(2, 'FISICA', 'João Silva Nascimento', '11122233344', 'joao.aluno@univ.edu.br', '11988880002'),
    pessoa(3, 'FISICA', 'Maria de Fátima Souza', '55566677788', 'maria.aluno@univ.edu.br', '11977770003'),
    pessoa(4, 'FISICA', 'Ana Paula Ferreira', '22233344455', 'ana.docente@univ.edu.br', '11966660004'),
    pessoa(5, 'FISICA', 'Roberto Carlos Lima', '33344455566', 'roberto.doc@univ.edu.br', '11955550005'),
    pessoa(6, 'JURIDICA', 'Kalunga Suprimentos', '43283811000158', 'vendas@kalunga.com.br', '1133330006'),
    pessoa(7, 'JURIDICA', 'Dell Computadores do Brasil', '72381189000110', 'contato@dell.com.br', '1133330007'),
    pessoa(8, 'JURIDICA', 'Limpeza & Cia', '12345678000199', null, null),
  ]
  const dadosDe = (id: number) => {
    const p = pessoas.find((x) => x.id === id) as Pessoa
    return { nome: p.nome, documento: p.documento, email: p.email, telefone: p.telefone }
  }
  return {
    pessoas,
    alunos: [
      { id: 1, pessoa_id: 2, matricula: '2026001001', curso: 'Análise e Desenvolvimento de Sistemas', periodo: '2026.1', status_vinculo: 'ATIVO', ...dadosDe(2) },
      { id: 2, pessoa_id: 3, matricula: '2026001002', curso: 'Administração', periodo: '2026.1', status_vinculo: 'ATIVO', ...dadosDe(3) },
    ],
    docentes: [
      { id: 1, pessoa_id: 4, titulacao: 'Mestre', carga_horaria: 40, departamento: 'Tecnologia da Informação', dados_bancarios: 'Banco do Brasil / Ag 0001-9 / CC 12345-6', ...dadosDe(4) },
      { id: 2, pessoa_id: 5, titulacao: 'Doutor', carga_horaria: 20, departamento: 'Exatas e Engenharias', dados_bancarios: 'Itaú / Ag 3456-7 / CC 98765-4', ...dadosDe(5) },
    ],
    fornecedores: [
      // Contrato vigente + pendência: exclusão bloqueada
      { id: 1, pessoa_id: 6, razao_social: 'Kalunga Suprimentos', cnpj: '43283811000158', contrato_vigente: true, pendencia_financeira: true, email: 'vendas@kalunga.com.br', telefone: '1133330006' },
      // Contrato vigente: exclusão bloqueada
      { id: 2, pessoa_id: 7, razao_social: 'Dell Computadores do Brasil', cnpj: '72381189000110', contrato_vigente: true, pendencia_financeira: false, email: 'contato@dell.com.br', telefone: '1133330007' },
      // Sem contrato nem pendência: pode ser excluído
      { id: 3, pessoa_id: 8, razao_social: 'Limpeza & Cia', cnpj: '12345678000199', contrato_vigente: false, pendencia_financeira: false, email: null, telefone: null },
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

const aguardar = (ms = 250) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const clonar = <T>(valor: T): T => JSON.parse(JSON.stringify(valor)) as T
const proximoId = (lista: { id: number }[]) => Math.max(0, ...lista.map((x) => x.id)) + 1
const agora = () => new Date().toISOString().slice(0, 19).replace('T', ' ')

function exigir(condicao: unknown, mensagem: string): void {
  if (!condicao) throw new ApiError('VALIDACAO', mensagem, 400)
}

function criarPessoa(tipo: TipoPessoa, nome: string, documento: string, email: string | null, telefone: string | null, rotuloDoc: string): Pessoa {
  if (banco.pessoas.some((p) => p.documento === documento)) {
    throw new ApiError('CONFLITO', `${rotuloDoc} já cadastrado no sistema.`, 409)
  }
  const nova = { id: proximoId(banco.pessoas), tipo_pessoa: tipo, nome, documento, email, telefone, criado_em: agora() }
  banco.pessoas.push(nova)
  return nova
}

function buscaTexto(texto: string | undefined, ...campos: string[]): boolean {
  if (!texto) return true
  const alvo = texto.toLowerCase()
  return campos.some((c) => c.toLowerCase().includes(alvo))
}

export const apiDemo: Api = {
  async servidorOnline() {
    return true
  },

  async cadastrarAluno(dados) {
    await aguardar()
    const documento = soDigitos(dados.documento)
    exigir(dados.nome && documento, 'Campos obrigatórios ausentes: nome e documento (CPF/CNPJ).')
    exigir(dados.curso && dados.periodo, 'Campos obrigatórios de aluno: curso e periodo.')
    const p = criarPessoa('FISICA', dados.nome, documento, dados.email, dados.telefone, 'CPF')
    const aluno: Aluno = {
      id: proximoId(banco.alunos),
      pessoa_id: p.id,
      matricula: `${new Date().getFullYear()}${String(Date.now()).slice(-6)}`,
      curso: dados.curso,
      periodo: dados.periodo,
      status_vinculo: 'ATIVO',
      nome: p.nome,
      documento: p.documento,
      email: p.email,
      telefone: p.telefone,
    }
    banco.alunos.push(aluno)
    salvar()
    return clonar(aluno)
  },

  async emitirComprovante(idAluno) {
    await aguardar(150)
    const aluno = banco.alunos.find((a) => a.id === idAluno)
    if (!aluno) throw new ApiError('NAO_ENCONTRADO', 'Aluno não encontrado.', 404)
    const comprovante: ComprovanteVinculo = {
      comprovante: 'DECLARAÇÃO DE VÍNCULO ACADÊMICO',
      emitido_em: new Date().toISOString(),
      matricula: aluno.matricula,
      nome: aluno.nome,
      cpf: aluno.documento,
      curso: aluno.curso,
      periodo: aluno.periodo,
      status_vinculo: aluno.status_vinculo,
    }
    return comprovante
  },

  async cadastrarDocente(dados) {
    await aguardar()
    const documento = soDigitos(dados.documento)
    exigir(dados.nome && documento, 'Campos obrigatórios ausentes: nome e documento (CPF/CNPJ).')
    exigir(
      dados.titulacao && dados.cargaHoraria && dados.departamento && dados.dadosBancarios,
      'Campos obrigatórios de docente: titulacao, cargaHoraria, departamento e dadosBancarios.',
    )
    const p = criarPessoa('FISICA', dados.nome, documento, dados.email, dados.telefone, 'CPF')
    const docente: Docente = {
      id: proximoId(banco.docentes),
      pessoa_id: p.id,
      titulacao: dados.titulacao,
      carga_horaria: dados.cargaHoraria,
      departamento: dados.departamento,
      dados_bancarios: dados.dadosBancarios,
      nome: p.nome,
      documento: p.documento,
      email: p.email,
      telefone: p.telefone,
    }
    banco.docentes.push(docente)
    salvar()
    return clonar(docente)
  },

  async buscarFornecedores(termo) {
    await aguardar()
    return clonar(
      banco.fornecedores
        .filter((f) => buscaTexto(termo, f.razao_social, f.cnpj))
        .sort((a, b) => b.id - a.id),
    )
  },

  async cadastrarFornecedor(dados) {
    await aguardar()
    const cnpj = soDigitos(dados.cnpj)
    exigir(dados.razaoSocial && cnpj.length === 14, 'Campos obrigatórios de fornecedor: razaoSocial e cnpj válido (14 dígitos).')
    const p = criarPessoa('JURIDICA', dados.razaoSocial, cnpj, dados.email, dados.telefone, 'CNPJ')
    const fornecedor: Fornecedor = {
      id: proximoId(banco.fornecedores),
      pessoa_id: p.id,
      razao_social: dados.razaoSocial,
      cnpj,
      contrato_vigente: dados.contratoVigente,
      pendencia_financeira: dados.pendenciaFinanceira,
      email: p.email,
      telefone: p.telefone,
    }
    banco.fornecedores.push(fornecedor)
    salvar()
    return clonar(fornecedor)
  },

  async excluirFornecedor(id) {
    await aguardar()
    const fornecedor = banco.fornecedores.find((f) => f.id === id)
    if (!fornecedor) throw new ApiError('NAO_ENCONTRADO', 'Fornecedor não encontrado.', 404)
    const motivos: string[] = []
    if (fornecedor.contrato_vigente) motivos.push('contrato vigente')
    if (fornecedor.pendencia_financeira) motivos.push('pendência financeira ativa')
    if (motivos.length > 0) {
      throw new ApiError('CONFLITO', `Exclusão bloqueada: fornecedor possui ${motivos.join(' e ')}.`, 409)
    }
    banco.fornecedores = banco.fornecedores.filter((f) => f.id !== id)
    banco.pessoas = banco.pessoas.filter((p) => p.id !== fornecedor.pessoa_id)
    salvar()
    return 'Fornecedor excluído com segurança.'
  },

  async consultarPessoas(filtro) {
    await aguardar()
    const pessoas = [...banco.pessoas].sort((a, b) => b.id - a.id)
    return combinarPessoas(pessoas, banco.alunos, banco.docentes, banco.fornecedores, filtro)
  },

  async obterPessoa(id) {
    await aguardar(150)
    const encontrada = banco.pessoas.find((p) => p.id === id)
    if (!encontrada) throw new ApiError('NAO_ENCONTRADO', 'Pessoa não encontrada.', 404)
    const detalhe: PessoaDetalhe = {
      pessoa: encontrada,
      aluno: banco.alunos.find((a) => a.pessoa_id === id) ?? null,
      docente: banco.docentes.find((d) => d.pessoa_id === id) ?? null,
      fornecedor: banco.fornecedores.find((f) => f.pessoa_id === id) ?? null,
    }
    return clonar(detalhe)
  },

  async relatorioMatriculas({ periodo, curso }) {
    await aguardar()
    const grupos = new Map<string, LinhaRelatorio>()
    for (const a of banco.alunos) {
      if (periodo && a.periodo !== periodo) continue
      if (curso && a.curso !== curso) continue
      const chave = `${a.periodo}|${a.curso}|${a.status_vinculo}`
      const linha = grupos.get(chave) ?? { periodo: a.periodo, curso: a.curso, status_vinculo: a.status_vinculo, total_matriculas: 0 }
      linha.total_matriculas += 1
      grupos.set(chave, linha)
    }
    const detalhamento = [...grupos.values()].sort(
      (x, y) => y.periodo.localeCompare(x.periodo) || x.curso.localeCompare(y.curso),
    )
    return {
      modulo: 'Sistema Acadêmico',
      filtros: { periodo: periodo || 'TODOS', curso: curso || 'TODOS' },
      total_geral: detalhamento.reduce((soma, l) => soma + l.total_matriculas, 0),
      detalhamento,
    }
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
