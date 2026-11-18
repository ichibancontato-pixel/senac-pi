// Relatório gerencial do Sistema Acadêmico: total de matrículas por período e curso.
// API: GET /api/relatorios/matriculas?periodo=&curso= (perfil Secretaria Acadêmica).

import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Botao } from '../components/Botao'
import { Campo } from '../components/Campo'
import { Mensagem, type MensagemTela } from '../components/Mensagem'
import { Cabecalho, Pagina } from '../components/Pagina'
import { api } from '../services/api'
import { MENSAGENS, mensagemDeErro } from '../services/erros'
import { CURSOS, type RelatorioMatriculas as Relatorio } from '../types'
import { propsDeErro } from '../utils/acessibilidade'
import { capitalizar } from '../utils/formatos'

interface Filtros {
  periodo: string
  curso: string
}

const SEM_FILTROS: Filtros = { periodo: '', curso: '' }

interface Resultado {
  relatorio: Relatorio | null
  mensagem: MensagemTela | null
}

async function gerar(filtros: Filtros): Promise<Resultado> {
  try {
    const relatorio = await api.relatorioMatriculas({
      periodo: filtros.periodo || undefined,
      curso: filtros.curso || undefined,
    })
    const vazio = relatorio.detalhamento.length === 0
    return { relatorio, mensagem: vazio ? { tipo: 'info', texto: MENSAGENS.nenhumaMatricula } : null }
  } catch (erro) {
    return { relatorio: null, mensagem: { tipo: 'erro', texto: mensagemDeErro(erro, 'consulta') } }
  }
}

export default function RelatorioMatriculas() {
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState<Filtros>(SEM_FILTROS)
  const [erroPeriodo, setErroPeriodo] = useState<string>()
  const [resultado, setResultado] = useState<Resultado>({ relatorio: null, mensagem: null })
  const [carregando, setCarregando] = useState(true)

  function aplicar(novo: Resultado) {
    setResultado(novo)
    setCarregando(false)
  }

  async function atualizar(f: Filtros) {
    setCarregando(true)
    aplicar(await gerar(f))
  }

  // Ao abrir a tela, mostra o relatório completo
  useEffect(() => {
    let ativo = true
    void gerar(SEM_FILTROS).then((novo) => {
      if (ativo) aplicar(novo)
    })
    return () => {
      ativo = false
    }
  }, [])

  function aoGerar(evento: FormEvent) {
    evento.preventDefault()
    if (filtros.periodo && !/^\d{4}\.[12]$/.test(filtros.periodo)) {
      setErroPeriodo('Use o formato AAAA.S, por exemplo 2026.1.')
      return
    }
    void atualizar(filtros)
  }

  function limpar() {
    setFiltros(SEM_FILTROS)
    setErroPeriodo(undefined)
    void atualizar(SEM_FILTROS)
  }

  const { relatorio, mensagem } = resultado

  return (
    <Pagina titulo="Relatório de Matrículas">
      <Cabecalho caminho={['Sistema Acadêmico', 'Relatório de Matrículas']} />

      <div className="barra-voltar">
        <Botao onClick={() => navigate('/')}>← VOLTAR AO MENU</Botao>
      </div>

      <form onSubmit={aoGerar} noValidate aria-labelledby="titulo-filtros">
        <h2 id="titulo-filtros" className="subtitulo">
          FILTROS DO RELATÓRIO:
        </h2>
        <div className="grade grade-2">
          <Campo id="filtro-periodo" rotulo="Período Letivo" erro={erroPeriodo}>
            <input
              id="filtro-periodo"
              className="entrada"
              inputMode="decimal"
              placeholder="ex.: 2026.1 (vazio = todos)"
              autoComplete="off"
              maxLength={6}
              value={filtros.periodo}
              onChange={(e) => {
                setFiltros((f) => ({ ...f, periodo: e.target.value.replace(/[^\d.]/g, '') }))
                setErroPeriodo(undefined)
              }}
              {...propsDeErro('filtro-periodo', erroPeriodo)}
            />
          </Campo>
          <Campo id="filtro-curso" rotulo="Curso">
            <select
              id="filtro-curso"
              className="entrada"
              value={filtros.curso}
              onChange={(e) => setFiltros((f) => ({ ...f, curso: e.target.value }))}
            >
              <option value="">Todos os cursos</option>
              {CURSOS.map((curso) => (
                <option key={curso} value={curso}>
                  {curso}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        <div className="filtros-acoes">
          <Botao onClick={limpar}>LIMPAR FILTROS</Botao>
          <Botao type="submit" disabled={carregando}>
            GERAR RELATÓRIO
          </Botao>
        </div>
      </form>

      <section className="secao secao-separada" aria-live="polite">
        <h2 className="secao-titulo">
          MATRÍCULAS POR PERÍODO E CURSO
          {relatorio ? ` · período: ${relatorio.filtros.periodo} · curso: ${relatorio.filtros.curso}` : ''}
        </h2>

        {carregando ? (
          <p className="carregando">Gerando relatório...</p>
        ) : mensagem ? (
          <Mensagem tipo={mensagem.tipo}>{mensagem.texto}</Mensagem>
        ) : relatorio ? (
          <div className="tabela-rolagem">
            <table className="tabela">
              <thead>
                <tr>
                  <th scope="col">Período</th>
                  <th scope="col">Curso</th>
                  <th scope="col">Situação</th>
                  <th scope="col" className="numero">
                    Matrículas
                  </th>
                </tr>
              </thead>
              <tbody>
                {relatorio.detalhamento.map((linha) => (
                  <tr key={`${linha.periodo}|${linha.curso}|${linha.status_vinculo}`}>
                    <td>{linha.periodo}</td>
                    <td>{linha.curso}</td>
                    <td>{capitalizar(linha.status_vinculo)}</td>
                    <td className="numero">{linha.total_matriculas}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}>Total geral</td>
                  <td className="numero">{relatorio.total_geral}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : null}
        <div className="rodape-verde" />
      </section>
    </Pagina>
  )
}
