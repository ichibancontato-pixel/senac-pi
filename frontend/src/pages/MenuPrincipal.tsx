import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Pagina } from '../components/Pagina'
import { modoDemonstracao } from '../services/api'
import { restaurarDadosDemo } from '../services/mock'
import { definirPerfil, podeAcessar, type Funcionalidade } from '../services/sessao'
import { usePerfil } from '../services/usePerfil'

const OPCOES: { rotulo: string; rota: string; funcionalidade: Funcionalidade }[] = [
  { rotulo: 'Cadastrar Aluno', rota: '/alunos/cadastrar', funcionalidade: 'alunos' },
  { rotulo: 'Cadastrar Docente', rota: '/docentes/cadastrar', funcionalidade: 'docentes' },
  { rotulo: 'Consultar Fornecedor', rota: '/fornecedores/consultar', funcionalidade: 'fornecedores' },
  { rotulo: 'Consultar Pessoa', rota: '/pessoas/consultar', funcionalidade: 'pessoas' },
  { rotulo: 'Relatório de Matrículas', rota: '/relatorios/matriculas', funcionalidade: 'relatorios' },
]

export default function MenuPrincipal() {
  const navigate = useNavigate()
  const perfil = usePerfil()

  // Painel por perfil: só aparecem as funções que o perfil pode usar
  const opcoes = useMemo(
    () => (perfil ? OPCOES.filter((o) => podeAcessar(perfil, o.funcionalidade)) : []),
    [perfil],
  )

  // Atalho de teclado: o número da opção abre a tela
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.ctrlKey || evento.altKey || evento.metaKey) return
      const opcao = opcoes[Number(evento.key) - 1]
      if (opcao) navigate(opcao.rota)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [navigate, opcoes])

  function trocarPerfil() {
    definirPerfil(null)
    navigate('/entrar')
  }

  function restaurar() {
    restaurarDadosDemo()
    window.location.reload()
  }

  return (
    <Pagina titulo="Menu Principal">
      <h1 className="titulo-sistema">SISTEMA DE GESTÃO ACADÊMICA</h1>
      <hr className="linha" />

      <div className="perfil-atual">
        <span>Perfil: {perfil}</span>
        <button type="button" className="link-acao" onClick={trocarPerfil}>
          [ trocar perfil ]
        </button>
      </div>

      <nav aria-labelledby="menu-rotulo">
        <h2 id="menu-rotulo" className="menu-rotulo">
          [ MENU PRINCIPAL ]
        </h2>
        <ul className="menu-lista">
          {opcoes.map((opcao, indice) => (
            <li key={opcao.rota}>
              <Link className="menu-item" to={opcao.rota}>
                [{indice + 1}] {opcao.rotulo}
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
