import type { Fornecedor } from '../types'

/**
 * Motivos que impedem a exclusão de um fornecedor (Caso de Uso 3, cenário alternativo 1).
 * Mesma regra de Fornecedor.podeSerExcluido() no backend. Lista vazia = pode excluir.
 */
export function motivosBloqueioExclusao(fornecedor: Fornecedor): string[] {
  const motivos: string[] = []
  if (fornecedor.contrato_vigente) motivos.push('contrato vigente')
  if (fornecedor.pendencia_financeira) motivos.push('pendência financeira ativa')
  return motivos
}
