import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { usePerfil } from '../services/usePerfil'

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

/** Caixa de navegação "[ Menu Principal ] > Módulo > Tela", com o perfil atual à direita. */
export function Cabecalho({ caminho }: CabecalhoProps) {
  const perfil = usePerfil()
  return (
    <header className="cabecalho nao-imprimir">
      <div className="breadcrumb">
        <nav aria-label="Você está em">
          <Link to="/">[ Menu Principal ]</Link>
          {caminho.map((item, indice) => (
            <span key={item} aria-current={indice === caminho.length - 1 ? 'page' : undefined}>
              {' > '}
              {item}
            </span>
          ))}
        </nav>
        {perfil ? <span className="breadcrumb-perfil">Perfil: {perfil}</span> : null}
      </div>
    </header>
  )
}
