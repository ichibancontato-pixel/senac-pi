// Caso de Uso 4: consultar pessoa por CPF, matrícula, nome ou data de nascimento.

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Botao } from '../components/Botao'
import { Campo } from '../components/Campo'
import { Mensagem, type MensagemTela } from '../components/Mensagem'
import { Cabecalho, Pagina } from '../components/Pagina'
import { api } from '../services/api'
import { ehApiError, MENSAGENS } from '../services/erros'
import type { FiltroPessoa, PessoaResumo } from '../types'
import { propsDeErro } from '../utils/acessibilidade'
import { dataBrParaIso, mascaraCpf, mascaraData, soDigitos } from '../utils/formatos'

interface Filtros {
  cpf: string
  matricula: string
  nome: string
  dataNascimento: string
}

const SEM_FILTROS: Filtros = { cpf: '', matricula: '', nome: '', dataNascimento: '' }

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
    return {
      lista: [],
      mensagem: {
        tipo: 'erro',
        texto: ehApiError(erro) && erro.codigo !== 'CONEXAO' ? erro.message : MENSAGENS.conexaoConsulta,
      },
    }
  }
}

export default function ConsultarPessoa() {
  const navigate = useNavigate()
  const primeiroCampo = useRef<HTMLInputElement>(null)
  const [filtros, setFiltros] = useState<Filtros>(SEM_FILTROS)
  const [erroData, setErroData] = useState<string>()
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

  function alterar(campo: keyof Filtros, valor: string) {
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }))
    if (campo === 'dataNascimento') setErroData(undefined)
  }

  function aoPesquisar(evento: FormEvent) {
    evento.preventDefault()
    let dataIso: string | undefined
    if (filtros.dataNascimento) {
      const convertida = dataBrParaIso(filtros.dataNascimento)
      if (!convertida) {
        setErroData('Data inválida. Use o formato DD/MM/AAAA.')
        return
      }
      dataIso = convertida
    }
    void pesquisar({
      cpf: soDigitos(filtros.cpf) || undefined,
      matricula: soDigitos(filtros.matricula) || undefined,
      nome: filtros.nome.trim() || undefined,
      data_nascimento: dataIso,
    })
  }

  function limparFiltros() {
    setFiltros(SEM_FILTROS)
    setErroData(undefined)
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
          <Campo id="filtro-cpf" rotulo="CPF">
            <input
              ref={primeiroCampo}
              id="filtro-cpf"
              className="entrada"
              inputMode="numeric"
              autoComplete="off"
              value={filtros.cpf}
              onChange={(e) => alterar('cpf', mascaraCpf(e.target.value))}
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
          <Campo id="filtro-nome" rotulo="Nome">
            <input
              id="filtro-nome"
              className="entrada"
              autoComplete="off"
              value={filtros.nome}
              onChange={(e) => alterar('nome', e.target.value)}
            />
          </Campo>
          <Campo id="filtro-data" rotulo="Data de Nascimento" erro={erroData}>
            <input
              id="filtro-data"
              className="entrada"
              inputMode="numeric"
              placeholder="DD/MM/AAAA"
              autoComplete="off"
              value={filtros.dataNascimento}
              onChange={(e) => alterar('dataNascimento', mascaraData(e.target.value))}
              {...propsDeErro('filtro-data', erroData)}
            />
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
                <col style={{ width: '13.5%' }} />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Nome Completo</th>
                  <th scope="col">CPF</th>
                  <th scope="col">Vínculo</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((pessoa) => (
                  <tr key={pessoa.id_pessoa}>
                    <td>{pessoa.nome}</td>
                    <td>{mascaraCpf(pessoa.cpf)}</td>
                    <td>{pessoa.vinculo ?? '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="link-acao"
                        aria-label={`Ver perfil de ${pessoa.nome}`}
                        onClick={() => navigate(`/pessoas/${pessoa.id_pessoa}`)}
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
