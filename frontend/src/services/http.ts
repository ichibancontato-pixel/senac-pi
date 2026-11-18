// Cliente do backend (pasta backend/, Node + Express).
// As chamadas vão para /api no mesmo endereço do front; o Vite repassa para o backend
// (proxy configurado em vite.config.ts), o que evita bloqueio de CORS no navegador.

import { ApiError, MENSAGENS, type CodigoErro } from './erros'
import { cabecalhoDoPerfil, obterPerfil } from './sessao'
import type {
  Aluno,
  Api,
  ComprovanteVinculo,
  Docente,
  Fornecedor,
  Pessoa,
  PessoaDetalhe,
  RelatorioMatriculas,
} from '../types'
import { soDigitos } from '../utils/formatos'
import { combinarPessoas } from '../utils/pessoas'

/** O backend responde erros como { "erro": "mensagem", "detalhe": "..." }. */
interface CorpoErro {
  erro?: string
  mensagem?: string
}

function codigoPorStatus(status: number): CodigoErro {
  if (status === 400 || status === 422) return 'VALIDACAO'
  if (status === 401 || status === 403) return 'NAO_AUTORIZADO'
  if (status === 404) return 'NAO_ENCONTRADO'
  if (status === 409) return 'CONFLITO'
  if (status >= 500) return 'CONEXAO'
  return 'DESCONHECIDO'
}

function consulta(parametros: Record<string, string | undefined>): string {
  const busca = new URLSearchParams()
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor) busca.set(chave, valor)
  }
  const texto = busca.toString()
  return texto ? `?${texto}` : ''
}

async function requisitar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const perfil = obterPerfil()
  const cabecalhos: Record<string, string> = { Accept: 'application/json' }
  if (opcoes.body) cabecalhos['Content-Type'] = 'application/json'
  if (perfil) cabecalhos['x-user-profile'] = cabecalhoDoPerfil(perfil)

  let resposta: Response
  try {
    resposta = await fetch(caminho, { ...opcoes, headers: cabecalhos })
  } catch {
    throw new ApiError('CONEXAO', MENSAGENS.conexaoCadastro)
  }

  const texto = await resposta.text()
  let corpo: unknown = null
  if (texto) {
    try {
      corpo = JSON.parse(texto)
    } catch {
      corpo = null
    }
  }

  if (resposta.ok) return corpo as T

  const erro = (corpo ?? {}) as CorpoErro
  const codigo = codigoPorStatus(resposta.status)
  const mensagem =
    erro.erro ??
    erro.mensagem ??
    (codigo === 'CONEXAO' ? MENSAGENS.conexaoCadastro : `Erro ${resposta.status} ao acessar o servidor.`)
  throw new ApiError(codigo, mensagem, resposta.status)
}

const enviar = (metodo: string, dados: unknown): RequestInit => ({
  method: metodo,
  body: JSON.stringify(dados),
})

export const apiHttp: Api = {
  async servidorOnline() {
    try {
      await requisitar('/api/health')
      return true
    } catch {
      return false
    }
  },

  async cadastrarAluno(dados) {
    const resposta = await requisitar<{ mensagem: string; aluno: Aluno }>('/api/alunos', enviar('POST', dados))
    return resposta.aluno
  },

  emitirComprovante: (idAluno) => requisitar<ComprovanteVinculo>(`/api/alunos/${idAluno}/comprovante`),

  cadastrarDocente: (dados) => requisitar<Docente>('/api/docentes', enviar('POST', dados)),

  buscarFornecedores: (termo) => requisitar<Fornecedor[]>(`/api/fornecedores${consulta({ busca: termo })}`),

  cadastrarFornecedor: (dados) => requisitar<Fornecedor>('/api/fornecedores', enviar('POST', dados)),

  async excluirFornecedor(id) {
    const resposta = await requisitar<{ mensagem: string }>(`/api/fornecedores/${id}`, { method: 'DELETE' })
    return resposta.mensagem
  },

  async consultarPessoas(filtro) {
    // CPF/CNPJ vai para o servidor; nome, matrícula e vínculo são resolvidos aqui,
    // porque a busca do SQLite diferencia acentos ("joao" não encontra "João").
    const documento = soDigitos(filtro.documento ?? '')
    const [pessoas, alunos, docentes, fornecedores] = await Promise.all([
      requisitar<Pessoa[]>(`/api/pessoas${consulta({ busca: documento, tipoPessoa: filtro.tipoPessoa })}`),
      requisitar<Aluno[]>('/api/alunos'),
      requisitar<Docente[]>('/api/docentes'),
      requisitar<Fornecedor[]>('/api/fornecedores'),
    ])
    return combinarPessoas(pessoas, alunos, docentes, fornecedores, filtro)
  },

  async obterPessoa(id) {
    const pessoa = await requisitar<Pessoa>(`/api/pessoas/${id}`)
    const filtro = consulta({ busca: pessoa.documento })
    const detalhe: PessoaDetalhe = { pessoa, aluno: null, docente: null, fornecedor: null }

    if (pessoa.tipo_pessoa === 'JURIDICA') {
      const fornecedores = await requisitar<Fornecedor[]>(`/api/fornecedores${filtro}`)
      detalhe.fornecedor = fornecedores.find((f) => f.pessoa_id === pessoa.id) ?? null
    } else {
      const [alunos, docentes] = await Promise.all([
        requisitar<Aluno[]>(`/api/alunos${filtro}`),
        requisitar<Docente[]>(`/api/docentes${filtro}`),
      ])
      detalhe.aluno = alunos.find((a) => a.pessoa_id === pessoa.id) ?? null
      detalhe.docente = docentes.find((d) => d.pessoa_id === pessoa.id) ?? null
    }
    return detalhe
  },

  relatorioMatriculas: (filtro) =>
    requisitar<RelatorioMatriculas>(`/api/relatorios/matriculas${consulta(filtro)}`),
}
