import type { Fornecedor } from '../types'

/**
 * Motivos que impedem a exclusão de um fornecedor (Caso de Uso 3, cenário alternativo 1).
 * Lista vazia = pode excluir.
 */
export function motivosBloqueioExclusao(fornecedor: Fornecedor): string[] {
  const motivos: string[] = []
  if (fornecedor.ativo) motivos.push(`Contrato ${fornecedor.contrato} vigente.`)
  if (fornecedor.possui_pendencia) motivos.push('Pendência financeira em aberto.')
  return motivos
}
