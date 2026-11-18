// Perfil de acesso escolhido na entrada do sistema.
// O backend identifica o usuário pelo cabeçalho HTTP "x-user-profile".

import type { Perfil } from '../types'

export const PERFIS: { perfil: Perfil; descricao: string }[] = [
  { perfil: 'Administrador', descricao: 'Acesso total, incluindo a consulta geral de pessoas' },
  { perfil: 'Secretaria Acadêmica', descricao: 'Cadastro de alunos, comprovante de vínculo e relatórios' },
  { perfil: 'RH', descricao: 'Cadastro de docentes' },
  { perfil: 'Setor de Compras', descricao: 'Cadastro, consulta e exclusão de fornecedores' },
]

export type Funcionalidade = 'alunos' | 'docentes' | 'fornecedores' | 'pessoas' | 'relatorios'

/** Quem acessa o quê, igual ao server.js. O Administrador acessa tudo. */
const ACESSO: Record<Funcionalidade, Perfil[]> = {
  alunos: ['Secretaria Acadêmica'],
  docentes: ['RH'],
  fornecedores: ['Setor de Compras'],
  pessoas: [],
  relatorios: ['Secretaria Acadêmica'],
}

export function podeAcessar(perfil: Perfil, funcionalidade: Funcionalidade): boolean {
  return perfil === 'Administrador' || ACESSO[funcionalidade].includes(perfil)
}

/**
 * Valor enviado no cabeçalho, sem acentos: navegadores mandam cabeçalhos em Latin-1
 * e o "ê" chegaria corrompido ao servidor. O backend compara os perfis sem acento.
 */
export function cabecalhoDoPerfil(perfil: Perfil): string {
  return perfil.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

const CHAVE = 'sga-perfil'
let perfilAtual: Perfil | null = lerPerfilSalvo()
const ouvintes = new Set<() => void>()

/** Usado pelo hook usePerfil para redesenhar a tela quando o perfil muda. */
export function assinarPerfil(ouvinte: () => void) {
  ouvintes.add(ouvinte)
  return () => {
    ouvintes.delete(ouvinte)
  }
}

function lerPerfilSalvo(): Perfil | null {
  try {
    const salvo = sessionStorage.getItem(CHAVE)
    return PERFIS.some((p) => p.perfil === salvo) ? (salvo as Perfil) : null
  } catch {
    return null
  }
}

export function obterPerfil(): Perfil | null {
  return perfilAtual
}

export function definirPerfil(perfil: Perfil | null) {
  perfilAtual = perfil
  try {
    if (perfil) sessionStorage.setItem(CHAVE, perfil)
    else sessionStorage.removeItem(CHAVE)
  } catch {
    // sem armazenamento: o perfil vale só enquanto a aba estiver aberta
  }
  ouvintes.forEach((avisar) => avisar())
}
