import type { ReactNode } from 'react'

interface CampoProps {
  id: string
  rotulo: string
  obrigatorio?: boolean
  erro?: string
  className?: string
  children: ReactNode
}

/** Rótulo + controle + mensagem de erro. O controle deve usar o mesmo `id`. */
export function Campo({ id, rotulo, obrigatorio, erro, className, children }: CampoProps) {
  return (
    <div className={['campo', erro ? 'campo-invalido' : '', className ?? ''].join(' ').trim()}>
      <label htmlFor={id}>
        {obrigatorio ? '*' : ''}
        {rotulo}:
      </label>
      {children}
      {erro ? (
        <span className="campo-mensagem" id={`${id}-erro`}>
          {erro}
        </span>
      ) : null}
    </div>
  )
}

