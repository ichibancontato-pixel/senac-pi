// Erros padronizados da camada de dados e mensagens dos casos de uso.

export type CodigoErro =
  | 'VALIDACAO'
  | 'CONFLITO'
  | 'NAO_ENCONTRADO'
  | 'NAO_AUTORIZADO'
  | 'CONEXAO'
  | 'DESCONHECIDO'

export class ApiError extends Error {
  codigo: CodigoErro
  status?: number

  constructor(codigo: CodigoErro, mensagem: string, status?: number) {
    super(mensagem)
    this.name = 'ApiError'
    this.codigo = codigo
    this.status = status
  }
}

export const MENSAGENS = {
  camposObrigatorios: 'Por favor, preencha todos os campos obrigatórios.',
  corrijaCampos: 'Corrija os campos destacados antes de salvar.',
  cpfDuplicado: 'O CPF informado já está cadastrado no sistema.',
  cnpjDuplicado: 'O CNPJ informado já está cadastrado no sistema.',
  conexaoCadastro:
    'Erro de comunicação com o servidor. Não foi possível concluir o cadastro. Tente novamente mais tarde.',
  conexaoConsulta:
    'Erro ao processar consulta. O servidor do banco de dados não respondeu. Tente novamente em instantes.',
  exclusaoBloqueada:
    'Ação não permitida. Este fornecedor possui contratos ativos ou pendências financeiras no sistema.',
  nenhumaPessoa: 'Nenhum registro encontrado para os filtros informados.',
  nenhumFornecedor: 'Nenhum fornecedor encontrado para o termo informado.',
  nenhumaMatricula: 'Nenhuma matrícula encontrada para os filtros informados.',
} as const

export function ehApiError(erro: unknown): erro is ApiError {
  return erro instanceof ApiError
}

/** Mensagem para mostrar na tela, trocando falha de rede pela mensagem do caso de uso. */
export function mensagemDeErro(erro: unknown, contexto: 'cadastro' | 'consulta'): string {
  if (ehApiError(erro) && erro.codigo !== 'CONEXAO') return erro.message
  return contexto === 'cadastro' ? MENSAGENS.conexaoCadastro : MENSAGENS.conexaoConsulta
}
