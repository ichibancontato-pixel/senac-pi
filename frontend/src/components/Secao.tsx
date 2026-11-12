import type { ReactNode } from 'react'

interface SecaoProps {
  titulo: string
  children: ReactNode
}

/** Bloco com título em caixa alta entre linhas azuis (ex.: "DADOS PESSOAIS"). */
export function Secao({ titulo, children }: SecaoProps) {
  return (
    <section className="secao">
      <h2 className="secao-titulo">{titulo}</h2>
      <div className="secao-corpo">{children}</div>
    </section>
  )
}
