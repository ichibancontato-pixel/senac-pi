import type { ReactNode } from 'react'

export type TipoMensagem = 'sucesso' | 'erro' | 'aviso' | 'info'

/** Estado de mensagem usado pelas telas. */
export interface MensagemTela {
  tipo: TipoMensagem
  texto: string
  detalhe?: string
}

const ROTULOS: Record<TipoMensagem, string> = {
  sucesso: 'OK',
  erro: 'ERRO',
  aviso: 'AVISO',
  info: 'INFO',
}

interface MensagemProps {
  tipo: TipoMensagem
  detalhe?: string
  children: ReactNode
  acoes?: ReactNode
}

/** Caixa de retorno ao usuário: "[ OK ] Aluno cadastrado com sucesso." */
export function Mensagem({ tipo, detalhe, children, acoes }: MensagemProps) {
  return (
    <div className={`mensagem mensagem-${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'}>
      <strong>[ {ROTULOS[tipo]} ]</strong>
      <span>{children}</span>
      {detalhe ? <span className="mensagem-detalhe">{detalhe}</span> : null}
      {acoes ? <div className="mensagem-acoes">{acoes}</div> : null}
    </div>
  )
}
