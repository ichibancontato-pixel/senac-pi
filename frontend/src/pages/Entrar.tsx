// Entrada no sistema: escolha do perfil de acesso (enviado ao backend em x-user-profile).

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pagina } from '../components/Pagina'
import { api, modoDemonstracao } from '../services/api'
import { definirPerfil, PERFIS } from '../services/sessao'
import type { Perfil } from '../types'

type EstadoServidor = 'verificando' | 'online' | 'offline'

export default function Entrar() {
  const navigate = useNavigate()
  const [servidor, setServidor] = useState<EstadoServidor>('verificando')

  useEffect(() => {
    let ativo = true
    void api.servidorOnline().then((online) => {
      if (ativo) setServidor(online ? 'online' : 'offline')
    })
    return () => {
      ativo = false
    }
  }, [])

  function entrar(perfil: Perfil) {
    definirPerfil(perfil)
    navigate('/')
  }

  // Atalho de teclado: 1 a 4 escolhe o perfil
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.ctrlKey || evento.altKey || evento.metaKey) return
      const indice = Number(evento.key) - 1
      const escolhido = PERFIS[indice]
      if (escolhido) {
        definirPerfil(escolhido.perfil)
        navigate('/')
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [navigate])

  return (
    <Pagina titulo="Acesso ao sistema">
      <h1 className="titulo-sistema">SISTEMA DE GESTÃO ACADÊMICA</h1>
      <hr className="linha" />

      <section aria-labelledby="rotulo-acesso">
        <h2 id="rotulo-acesso" className="menu-rotulo">
          [ ACESSO AO SISTEMA ]
        </h2>
        <p className="texto-suave">Selecione o seu perfil de acesso:</p>
        <ul className="menu-lista">
          {PERFIS.map(({ perfil, descricao }, indice) => (
            <li key={perfil}>
              <button type="button" className="menu-item menu-item-botao" onClick={() => entrar(perfil)}>
                <span>
                  [{indice + 1}] {perfil}
                </span>
                <span className="menu-item-descricao">{descricao}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <footer className="menu-rodape">
        {modoDemonstracao ? (
          <span>Modo demonstração: os dados ficam salvos neste navegador.</span>
        ) : servidor === 'verificando' ? (
          <span>Verificando conexão com o servidor...</span>
        ) : servidor === 'online' ? (
          <span>
            Servidor: <strong className="texto-verde">[ ONLINE ]</strong>
          </span>
        ) : (
          <span>
            Servidor: <strong className="texto-vermelho">[ OFFLINE ]</strong> Inicie o backend com{' '}
            <code>npm start</code> na pasta <code>backend</code>.
          </span>
        )}
      </footer>
    </Pagina>
  )
}
