// Cliente da API real (back-end Python). Usado quando VITE_API_URL está definida.

import { ApiError, MENSAGENS, type CodigoErro } from './erros'
import type {
  AlunoCadastrado,
  Api,
  Curso,
  Departamento,
  DocenteCadastrado,
  Fornecedor,
  PessoaDetalhe,
  PessoaResumo,
} from '../types'

/** Formato de erro esperado: { "mensagem": "...", "campos": ["cpf"], "detalhe": "..." } */
interface CorpoErro {
  mensagem?: string
  message?: string
  detail?: unknown
  campos?: string[]
  detalhe?: string
}

function codigoPorStatus(status: number): CodigoErro {
  if (status === 400 || status === 422) return 'VALIDACAO'
  if (status === 404) return 'NAO_ENCONTRADO'
  if (status === 409) return 'CONFLITO'
  if (status >= 500) return 'CONEXAO'
  return 'DESCONHECIDO'
}

export function criarApiHttp(urlBase: string): Api {
  async function requisitar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
    let resposta: Response
    try {
      resposta = await fetch(`${urlBase}${caminho}`, {
        ...opcoes,
        headers: {
          Accept: 'application/json',
          ...(opcoes.body ? { 'Content-Type': 'application/json' } : {}),
        },
      })
    } catch {
      // Servidor fora do ar, CORS bloqueado ou sem rede
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
      erro.mensagem ??
      erro.message ??
      (typeof erro.detail === 'string' ? erro.detail : undefined) ??
      (codigo === 'CONEXAO' ? MENSAGENS.conexaoCadastro : `Erro ${resposta.status} ao acessar o servidor.`)
    throw new ApiError(codigo, mensagem, { campos: erro.campos, detalhe: erro.detalhe })
  }

  const enviar = (metodo: string, dados: unknown): RequestInit => ({
    method: metodo,
    body: JSON.stringify(dados),
  })

  return {
    listarCursos: () => requisitar<Curso[]>('/api/cursos'),
    listarDepartamentos: () => requisitar<Departamento[]>('/api/departamentos'),
    cadastrarAluno: (dados) => requisitar<AlunoCadastrado>('/api/alunos', enviar('POST', dados)),
    cadastrarDocente: (dados) => requisitar<DocenteCadastrado>('/api/docentes', enviar('POST', dados)),
    buscarFornecedores: (termo) =>
      requisitar<Fornecedor[]>(`/api/fornecedores?busca=${encodeURIComponent(termo)}`),
    excluirFornecedor: (id) => requisitar<void>(`/api/fornecedores/${id}`, { method: 'DELETE' }),
    consultarPessoas: (filtro) => {
      const parametros = new URLSearchParams()
      for (const [chave, valor] of Object.entries(filtro)) {
        if (valor) parametros.set(chave, valor)
      }
      const consulta = parametros.toString()
      return requisitar<PessoaResumo[]>(`/api/pessoas${consulta ? `?${consulta}` : ''}`)
    },
    obterPessoa: (id) => requisitar<PessoaDetalhe>(`/api/pessoas/${id}`),
  }
}
