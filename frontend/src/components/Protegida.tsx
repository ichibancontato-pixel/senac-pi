import type { ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { podeAcessar, type Funcionalidade } from '../services/sessao'
import { usePerfil } from '../services/usePerfil'
import { Botao } from './Botao'
import { Mensagem } from './Mensagem'
import { Cabecalho, Pagina } from './Pagina'

interface ProtegidaProps {
  /** Sem funcionalidade: basta ter escolhido um perfil. */
  funcionalidade?: Funcionalidade
  children: ReactNode
}

/** Só mostra a tela se houver perfil escolhido e ele tiver permissão (mesmas regras do backend). */
export function Protegida({ funcionalidade, children }: ProtegidaProps) {
  const perfil = usePerfil()
  const navigate = useNavigate()

  if (!perfil) return <Navigate to="/entrar" replace />

  if (funcionalidade && !podeAcessar(perfil, funcionalidade)) {
    return (
      <Pagina titulo="Acesso negado">
        <Cabecalho caminho={['Acesso negado']} />
        <Mensagem tipo="erro">
          Acesso negado para o perfil "{perfil}". Esta função não faz parte das permissões deste perfil.
        </Mensagem>
        <div className="acoes">
          <Botao onClick={() => navigate('/')}>← VOLTAR AO MENU</Botao>
        </div>
      </Pagina>
    )
  }

  return children
}
