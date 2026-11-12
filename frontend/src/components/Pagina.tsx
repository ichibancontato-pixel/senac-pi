import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface PaginaProps {
  titulo: string
  children: ReactNode
}

/** Contêiner das telas; também atualiza o título da aba do navegador. */
export function Pagina({ titulo, children }: PaginaProps) {
  useEffect(() => {
    document.title = `${titulo} | Sistema de Gestão Acadêmica`
  }, [titulo])

  return <main className="pagina">{children}</main>
}

interface CabecalhoProps {
  /** Trilha depois de "[ Menu Principal ]", ex.: ["Gestão de Alunos", "Cadastrar Aluno"]. */
  caminho: string[]
}

/** Caixa de navegação "[ Menu Principal ] > Módulo > Tela" com a linha azul abaixo. */
export function Cabecalho({ caminho }: CabecalhoProps) {
  return (
    <header className="cabecalho nao-imprimir">
      <nav className="breadcrumb" aria-label="Você está em">
        <Link to="/">[ Menu Principal ]</Link>
        {caminho.map((item, indice) => (
          <span key={item} aria-current={indice === caminho.length - 1 ? 'page' : undefined}>
            {' > '}
            {item}
          </span>
        ))}
      </nav>
    </header>
  )
}
