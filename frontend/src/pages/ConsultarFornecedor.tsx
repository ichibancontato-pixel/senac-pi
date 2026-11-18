// Caso de Uso 3 / Jornada do Camilo (Compras): consultar e excluir fornecedor.
// API: GET /api/fornecedores?busca= e DELETE /api/fornecedores/:id (perfil Setor de Compras).

import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Botao } from '../components/Botao'
import { Dialogo } from '../components/Dialogo'
import { Mensagem, type MensagemTela } from '../components/Mensagem'
import { Cabecalho, Pagina } from '../components/Pagina'
import { api } from '../services/api'
import { ehApiError, MENSAGENS, mensagemDeErro } from '../services/erros'
import type { Fornecedor } from '../types'
import { formatarDocumento } from '../utils/formatos'
import { motivosBloqueioExclusao } from '../utils/regras'

interface Bloqueio {
  fornecedor: Fornecedor
  motivo: string
}

interface Busca {
  lista: Fornecedor[]
  erro?: MensagemTela
}

async function obterFornecedores(texto: string): Promise<Busca> {
  try {
    return { lista: await api.buscarFornecedores(texto.trim()) }
  } catch (erro) {
    return { lista: [], erro: { tipo: 'erro', texto: mensagemDeErro(erro, 'consulta') } }
  }
}

export default function ConsultarFornecedor() {
  const navigate = useNavigate()
  const location = useLocation()
  // Mensagem enviada pela tela de cadastro ao voltar para cá
  const recebida = (location.state as { mensagem?: string } | null)?.mensagem
  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState<Fornecedor[]>([])
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState<MensagemTela | null>(
    recebida ? { tipo: 'sucesso', texto: recebida } : null,
  )
  const [paraExcluir, setParaExcluir] = useState<Fornecedor | null>(null)
  const [bloqueio, setBloqueio] = useState<Bloqueio | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  function aplicar({ lista, erro }: Busca) {
    setResultados(lista)
    if (erro) setMensagem(erro)
    setCarregando(false)
  }

  async function buscar(texto: string) {
    setCarregando(true)
    aplicar(await obterFornecedores(texto))
  }

  // Ao abrir a tela, lista todos os fornecedores
  useEffect(() => {
    let ativo = true
    void obterFornecedores('').then((busca) => {
      if (ativo) aplicar(busca)
    })
    return () => {
      ativo = false
    }
  }, [])

  function aoBuscar(evento: FormEvent) {
    evento.preventDefault()
    setMensagem(null)
    void buscar(termo)
  }

  function pedirExclusao(fornecedor: Fornecedor) {
    setMensagem(null)
    // Verifica as dependências antes de pedir confirmação (Jornada do Camilo, etapa 4)
    const motivos = motivosBloqueioExclusao(fornecedor)
    if (motivos.length > 0) {
      setBloqueio({ fornecedor, motivo: `Fornecedor possui ${motivos.join(' e ')}.` })
    } else {
      setParaExcluir(fornecedor)
    }
  }

  async function confirmarExclusao() {
    if (!paraExcluir) return
    const alvo = paraExcluir
    setExcluindo(true)
    try {
      const retorno = await api.excluirFornecedor(alvo.id)
      setResultados((atuais) => atuais.filter((f) => f.id !== alvo.id))
      setMensagem({ tipo: 'sucesso', texto: retorno || 'Fornecedor excluído com sucesso.' })
      setParaExcluir(null)
    } catch (erro) {
      setParaExcluir(null)
      if (ehApiError(erro) && erro.codigo === 'CONFLITO') {
        // O servidor encontrou um vínculo que a lista ainda não mostrava
        setBloqueio({ fornecedor: alvo, motivo: erro.message })
      } else {
        setMensagem({ tipo: 'erro', texto: mensagemDeErro(erro, 'cadastro') })
      }
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <Pagina titulo="Consultar Fornecedor">
      <Cabecalho caminho={['Gestão de Fornecedores', 'Consultar Fornecedor']} />

      <div className="barra-voltar">
        <Botao onClick={() => navigate('/')}>← VOLTAR AO MENU</Botao>
        <Botao onClick={() => navigate('/fornecedores/cadastrar')}>+ NOVO FORNECEDOR</Botao>
      </div>

      <form className="busca" onSubmit={aoBuscar} role="search">
        <label htmlFor="busca">[ Buscar por CNPJ ou Razão Social ]:</label>
        <input
          id="busca"
          className="entrada"
          value={termo}
          autoComplete="off"
          onChange={(e) => setTermo(e.target.value)}
        />
        <Botao type="submit" disabled={carregando}>
          BUSCAR
        </Botao>
      </form>

      <section className="secao secao-separada" aria-live="polite">
        <h2 className="secao-titulo">RESULTADOS DA BUSCA</h2>

        {mensagem ? <Mensagem tipo={mensagem.tipo}>{mensagem.texto}</Mensagem> : null}

        {carregando ? (
          <p className="carregando" role="status">
            Buscando...
          </p>
        ) : resultados.length === 0 ? (
          mensagem?.tipo === 'erro' ? null : <Mensagem tipo="info">{MENSAGENS.nenhumFornecedor}</Mensagem>
        ) : (
          <div className="tabela-rolagem">
            <table className="tabela">
              <colgroup>
                <col style={{ width: '36%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '14.5%' }} />
                <col style={{ width: '14.5%' }} />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Razão Social</th>
                  <th scope="col">CNPJ</th>
                  <th scope="col">Contrato</th>
                  <th scope="col">Financeiro</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((fornecedor) => (
                  <tr key={fornecedor.id}>
                    <td>{fornecedor.razao_social}</td>
                    <td>{formatarDocumento(fornecedor.cnpj)}</td>
                    <td>{fornecedor.contrato_vigente ? 'Vigente' : 'Encerrado'}</td>
                    <td>{fornecedor.pendencia_financeira ? 'Pendente' : 'Regular'}</td>
                    <td>
                      <button
                        type="button"
                        className="link-acao"
                        title="Excluir fornecedor"
                        aria-label={`Excluir ${fornecedor.razao_social}`}
                        onClick={() => pedirExclusao(fornecedor)}
                      >
                        [ E ]
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

      <Dialogo
        aberto={paraExcluir !== null}
        titulo="[ ATENÇÃO ]"
        textoConfirmar={excluindo ? 'EXCLUINDO...' : 'CONFIRMAR EXCLUSÃO'}
        onConfirmar={confirmarExclusao}
        textoCancelar="CANCELAR"
        onCancelar={() => setParaExcluir(null)}
        perigo
        ocupado={excluindo}
      >
        Tem certeza que deseja excluir o fornecedor <strong>{paraExcluir?.razao_social}</strong>?
      </Dialogo>

      <Dialogo
        aberto={bloqueio !== null}
        titulo="[ AÇÃO NÃO PERMITIDA ]"
        textoConfirmar="ENTENDI"
        onConfirmar={() => setBloqueio(null)}
        alerta
      >
        <p className="sem-margem">
          O fornecedor <strong>{bloqueio?.fornecedor.razao_social}</strong> possui contratos ativos ou
          pendências financeiras no sistema e não pode ser excluído.
        </p>
        {bloqueio?.motivo ? <p className="mensagem-detalhe">Motivo: {bloqueio.motivo}</p> : null}
      </Dialogo>
    </Pagina>
  )
}
