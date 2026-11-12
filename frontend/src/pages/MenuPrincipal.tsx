import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Pagina } from '../components/Pagina'
import { modoDemonstracao } from '../services/api'
import { restaurarDadosDemo } from '../services/mock'

const OPCOES = [
  { tecla: '1', rotulo: 'Cadastrar Aluno', rota: '/alunos/cadastrar' },
  { tecla: '2', rotulo: 'Cadastrar Docente', rota: '/docentes/cadastrar' },
  { tecla: '3', rotulo: 'Consultar Fornecedor', rota: '/fornecedores/consultar' },
  { tecla: '4', rotulo: 'Consultar Pessoa', rota: '/pessoas/consultar' },
]

export default function MenuPrincipal() {
  const navigate = useNavigate()

  // Atalho de teclado: digitar 1 a 4 abre a opção correspondente
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.ctrlKey || evento.altKey || evento.metaKey) return
      const opcao = OPCOES.find((o) => o.tecla === evento.key)
      if (opcao) navigate(opcao.rota)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [navigate])

  function restaurar() {
    restaurarDadosDemo()
    window.location.reload()
  }

  return (
    <Pagina titulo="Menu Principal">
      <h1 className="titulo-sistema">SISTEMA DE GESTÃO ACADÊMICA</h1>
      <hr className="linha" />

      <nav aria-labelledby="menu-rotulo">
        <h2 id="menu-rotulo" className="menu-rotulo">
          [ MENU PRINCIPAL ]
        </h2>
        <ul className="menu-lista">
          {OPCOES.map((opcao) => (
            <li key={opcao.rota}>
              <Link className="menu-item" to={opcao.rota}>
                [{opcao.tecla}] {opcao.rotulo}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <footer className="menu-rodape">
        Selecione uma opção acima para começar
        {modoDemonstracao ? (
          <p className="nota-demo">
            Modo demonstração: dados salvos neste navegador.{' '}
            <button type="button" className="link-acao" onClick={restaurar}>
              [ restaurar dados iniciais ]
            </button>
          </p>
        ) : null}
      </footer>
    </Pagina>
  )
}
