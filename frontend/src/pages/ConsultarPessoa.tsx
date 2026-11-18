// Caso de Uso 4: consultar pessoas físicas e jurídicas por documento, matrícula, nome ou tipo.
// API: GET /api/pessoas, cruzando com /api/alunos, /api/docentes e /api/fornecedores
// para mostrar o vínculo de cada registro (perfil Administrador).

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Botao } from '../components/Botao'
import { Campo } from '../components/Campo'
import { Mensagem, type MensagemTela } from '../components/Mensagem'
import { Cabecalho, Pagina } from '../components/Pagina'
import { api } from '../services/api'
import { MENSAGENS, mensagemDeErro } from '../services/erros'
import type { FiltroPessoa, PessoaResumo, TipoPessoa } from '../types'
import { formatarDocumento, mascaraDocumento, soDigitos } from '../utils/formatos'

interface Filtros {
  documento: string
  matricula: string
  nome: string
  tipoPessoa: TipoPessoa | ''
}

const SEM_FILTROS: Filtros = { documento: '', matricula: '', nome: '', tipoPessoa: '' }

interface Consulta {
  lista: PessoaResumo[]
  mensagem: MensagemTela | null
}

async function obterPessoas(filtro: FiltroPessoa): Promise<Consulta> {
  try {
    const lista = await api.consultarPessoas(filtro)
    return { lista, mensagem: lista.length === 0 ? { tipo: 'info', texto: MENSAGENS.nenhumaPessoa } : null }
  } catch (erro) {
    // Os filtros continuam na tela para o usuário tentar de novo
    return { lista: [], mensagem: { tipo: 'erro', texto: mensagemDeErro(erro, 'consulta') } }
  }
}

export default function ConsultarPessoa() {
  const navigate = useNavigate()
  const primeiroCampo = useRef<HTMLInputElement>(null)
  const [filtros, setFiltros] = useState<Filtros>(SEM_FILTROS)
  const [resultados, setResultados] = useState<PessoaResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState<MensagemTela | null>(null)

  function aplicar({ lista, mensagem: retorno }: Consulta) {
    setResultados(lista)
    setMensagem(retorno)
    setCarregando(false)
  }

  async function pesquisar(filtro: FiltroPessoa) {
    setCarregando(true)
    setMensagem(null)
    aplicar(await obterPessoas(filtro))
  }

  // Ao abrir a tela, lista todas as pessoas
  useEffect(() => {
    let ativo = true
    void obterPessoas({}).then((consulta) => {
      if (ativo) aplicar(consulta)
    })
    return () => {
      ativo = false
    }
  }, [])

  function alterar<C extends keyof Filtros>(campo: C, valor: Filtros[C]) {
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }))
  }

  function aoPesquisar(evento: FormEvent) {
    evento.preventDefault()
    void pesquisar({
      documento: soDigitos(filtros.documento) || undefined,
      matricula: soDigitos(filtros.matricula) || undefined,
      nome: filtros.nome.trim() || undefined,
      tipoPessoa: filtros.tipoPessoa || undefined,
    })
  }

  function limparFiltros() {
    setFiltros(SEM_FILTROS)
    void pesquisar({})
    primeiroCampo.current?.focus()
  }

  function novaBusca() {
    setMensagem(null)
    primeiroCampo.current?.focus()
  }

  return (
    <Pagina titulo="Consultar Pessoa">
      <Cabecalho caminho={['Gestão de Pessoas', 'Consultar Pessoa']} />

      <div className="barra-voltar">
        <Botao onClick={() => navigate('/')}>← VOLTAR AO MENU</Botao>
      </div>

      <form onSubmit={aoPesquisar} noValidate role="search" aria-labelledby="titulo-filtros">
        <h2 id="titulo-filtros" className="subtitulo">
          FILTROS DE BUSCA:
        </h2>
        <div className="grade grade-2">
          <Campo id="filtro-documento" rotulo="CPF / CNPJ">
            <input
              ref={primeiroCampo}
              id="filtro-documento"
              className="entrada"
              inputMode="numeric"
              autoComplete="off"
              value={filtros.documento}
              onChange={(e) => alterar('documento', mascaraDocumento(e.target.value))}
            />
          </Campo>
          <Campo id="filtro-matricula" rotulo="Matrícula">
            <input
              id="filtro-matricula"
              className="entrada"
              inputMode="numeric"
              autoComplete="off"
              maxLength={20}
              value={filtros.matricula}
              onChange={(e) => alterar('matricula', soDigitos(e.target.value))}
            />
          </Campo>
          <Campo id="filtro-nome" rotulo="Nome / Razão Social">
            <input
              id="filtro-nome"
              className="entrada"
              autoComplete="off"
              value={filtros.nome}
              onChange={(e) => alterar('nome', e.target.value)}
            />
          </Campo>
          <Campo id="filtro-tipo" rotulo="Tipo de Pessoa">
            <select
              id="filtro-tipo"
              className="entrada"
              value={filtros.tipoPessoa}
              onChange={(e) => alterar('tipoPessoa', e.target.value as TipoPessoa | '')}
            >
              <option value="">Todas</option>
              <option value="FISICA">Pessoa física</option>
              <option value="JURIDICA">Pessoa jurídica</option>
            </select>
          </Campo>
        </div>
        <div className="filtros-acoes">
          <Botao onClick={limparFiltros}>LIMPAR FILTROS</Botao>
          <Botao type="submit" disabled={carregando}>
            PESQUISAR
          </Botao>
        </div>
      </form>

      <section className="secao secao-separada" aria-live="polite">
        <h2 className="secao-titulo">[ Resultados da Consulta ]</h2>

        {carregando ? (
          <p className="carregando">Pesquisando...</p>
        ) : mensagem ? (
          <Mensagem
            tipo={mensagem.tipo}
            acoes={
              mensagem.tipo === 'info' ? (
                <>
                  <Botao onClick={limparFiltros}>LIMPAR FILTROS</Botao>
                  <Botao onClick={novaBusca}>NOVA BUSCA</Botao>
                </>
              ) : undefined
            }
          >
            {mensagem.texto}
          </Mensagem>
        ) : (
          <div className="tabela-rolagem">
            <table className="tabela">
              <colgroup>
                <col style={{ width: '35%' }} />
                <col style={{ width: '24%' }} />
                <col style={{ width: '17%' }} />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Nome / Razão Social</th>
                  <th scope="col">CPF / CNPJ</th>
                  <th scope="col">Vínculo</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((pessoa) => (
                  <tr key={pessoa.id}>
                    <td>{pessoa.nome}</td>
                    <td>{formatarDocumento(pessoa.documento)}</td>
                    <td>{pessoa.vinculo}</td>
                    <td>
                      <button
                        type="button"
                        className="link-acao"
                        aria-label={`Ver perfil de ${pessoa.nome}`}
                        onClick={() => navigate(`/pessoas/${pessoa.id}`)}
                      >
                        [ VER PERFIL ]
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="rodape-tabela" />
      </section>
    </Pagina>
  )
}
