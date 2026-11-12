import type { ButtonHTMLAttributes } from 'react'

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'padrao' | 'perigo'
}

/** Botão no estilo dos protótipos: "[ TEXTO ]" com borda azul. */
export function Botao({ variante = 'padrao', type = 'button', className, children, ...resto }: BotaoProps) {
  const classes = ['botao', variante === 'perigo' ? 'botao-perigo' : '', className ?? ''].join(' ').trim()
  return (
    <button type={type} className={classes} {...resto}>
      [ {children} ]
    </button>
  )
}
