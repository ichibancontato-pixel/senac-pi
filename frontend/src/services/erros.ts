// Erros padronizados da camada de dados e mensagens dos casos de uso.

export type CodigoErro = 'VALIDACAO' | 'CONFLITO' | 'NAO_ENCONTRADO' | 'CONEXAO' | 'DESCONHECIDO'

export class ApiError extends Error {
  codigo: CodigoErro
  /** Campos rejeitados pelo servidor, com os nomes das colunas (ex.: "cpf"). */
  campos: string[]
  detalhe?: string

  constructor(
    codigo: CodigoErro,
    mensagem: string,
    opcoes: { campos?: string[]; detalhe?: string } = {},
  ) {
    super(mensagem)
    this.name = 'ApiError'
    this.codigo = codigo
    this.campos = opcoes.campos ?? []
    this.detalhe = opcoes.detalhe
  }
}

export const MENSAGENS = {
  camposObrigatorios: 'Por favor, preencha todos os campos obrigatórios.',
  corrijaCampos: 'Corrija os campos destacados antes de salvar.',
  cpfDuplicado: 'O CPF informado já está cadastrado no sistema.',
  conexaoCadastro:
    'Erro de comunicação com o servidor. Não foi possível concluir o cadastro. Tente novamente mais tarde.',
  conexaoConsulta:
    'Erro ao processar consulta. O servidor do banco de dados não respondeu. Tente novamente em instantes.',
  exclusaoBloqueada:
    'Ação não permitida. Este fornecedor possui contratos ativos ou pendências financeiras no sistema.',
  nenhumaPessoa: 'Nenhum registro encontrado para os filtros informados.',
  nenhumFornecedor: 'Nenhum fornecedor encontrado para o termo informado.',
} as const

export function ehApiError(erro: unknown): erro is ApiError {
  return erro instanceof ApiError
}
