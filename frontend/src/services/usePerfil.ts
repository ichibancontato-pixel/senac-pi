import { useSyncExternalStore } from 'react'
import { assinarPerfil, obterPerfil } from './sessao'

/** Perfil de acesso atual; a tela é redesenhada quando ele muda. */
export function usePerfil() {
  return useSyncExternalStore(assinarPerfil, obterPerfil)
}
