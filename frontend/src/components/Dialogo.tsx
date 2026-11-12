import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Botao } from './Botao'

interface DialogoProps {
  aberto: boolean
  titulo: string
  children: ReactNode
  textoConfirmar: string
  onConfirmar: () => void
  /** Sem texto de cancelar o diálogo vira um alerta com um único botão. */
  textoCancelar?: string
  onCancelar?: () => void
  perigo?: boolean
  alerta?: boolean
  ocupado?: boolean
}

/** Janela modal (confirmação de exclusão, cancelamento de cadastro, alertas de bloqueio). */
export function Dialogo({
  aberto,
  titulo,
  children,
  textoConfirmar,
  onConfirmar,
  textoCancelar,
  onCancelar,
  perigo,
  alerta,
  ocupado,
}: DialogoProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (aberto && !dialogo.open) dialogo.showModal()
    if (!aberto && dialogo.open) dialogo.close()
  }, [aberto])

  const fechar = onCancelar ?? onConfirmar

  return (
    <dialog
      ref={ref}
      className={`dialogo ${alerta ? 'dialogo-alerta' : ''}`}
      aria-labelledby={idTitulo}
      onCancel={(evento) => {
        // Tecla Esc: fecha pelo mesmo caminho do botão de cancelar
        evento.preventDefault()
        if (!ocupado) fechar()
      }}
    >
      <h2 id={idTitulo} className="dialogo-titulo">
        {titulo}
      </h2>
      <div className="dialogo-corpo">{children}</div>
      <div className="dialogo-acoes">
        {textoCancelar && onCancelar ? (
          <Botao onClick={onCancelar} disabled={ocupado} autoFocus={perigo}>
            {textoCancelar}
          </Botao>
        ) : null}
        <Botao
          variante={perigo ? 'perigo' : 'padrao'}
          onClick={onConfirmar}
          disabled={ocupado}
          autoFocus={!perigo}
        >
          {textoConfirmar}
        </Botao>
      </div>
    </dialog>
  )
}
