// Caso de Uso 3 / Jornada do Camilo (Compras): consultar e excluir fornecedor.

import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Botao } from '../components/Botao'
import { Dialogo } from '../components/Dialogo'
import { Mensagem, type MensagemTela } from '../components/Mensagem'
import { Cabecalho, Pagina } from '../components/Pagina'
import { api } from '../services/api'
import { ehApiError, MENSAGENS } from '../services/erros'
import type { Fornecedor } from '../types'
import { formatarCnpj } from '../utils/formatos'
import { motivosBloqueioExclusao } from '../utils/regras'

interface Bloqueio {
  fornecedor: Fornecedor
  motivos: string
}

interface Busca {
  lista: Fornecedor[]
  erro?: MensagemTela
}

async function obterFornecedores(texto: string): Promise<Busca> {
  try {
    return { lista: await api.buscarFornecedores(texto.trim()) }
  } catch (erro) {
    return {
      lista: [],
      erro: {
        tipo: 'erro',
        texto: ehApiError(erro) && erro.codigo !== 'CONEXAO' ? erro.message : MENSAGENS.conexaoConsulta,
      },
    }
  }
}

export default function ConsultarFornecedor() {
  const navigate = useNavigate()
  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState<Fornecedor[]>([])
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState<MensagemTela | null>(null)
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
    if (motivos.length > 0) setBloqueio({ fornecedor, motivos: motivos.join(' ') })
    else setParaExcluir(fornecedor)
  }

  async function confirmarExclusao() {
    if (!paraExcluir) return
    const alvo = paraExcluir
    setExcluindo(true)
    try {
      await api.excluirFornecedor(alvo.id_fornecedor)
      setResultados((atuais) => atuais.filter((f) => f.id_fornecedor !== alvo.id_fornecedor))
      setMensagem({ tipo: 'sucesso', texto: 'Fornecedor excluído com sucesso.' })
      setParaExcluir(null)
    } catch (erro) {
      setParaExcluir(null)
      if (ehApiError(erro) && erro.codigo === 'CONFLITO') {
        // O servidor encontrou um vínculo que a lista ainda não mostrava
        setBloqueio({ fornecedor: alvo, motivos: erro.detalhe ?? '' })
      } else if (ehApiError(erro) && erro.codigo === 'CONEXAO') {
        setMensagem({ tipo: 'erro', texto: MENSAGENS.conexaoCadastro })
      } else {
        setMensagem({ tipo: 'erro', texto: ehApiError(erro) ? erro.message : 'Erro inesperado ao excluir.' })
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

        {mensagem ? (
          <Mensagem tipo={mensagem.tipo} detalhe={mensagem.detalhe}>
            {mensagem.texto}
          </Mensagem>
        ) : null}

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
                <col style={{ width: '11%' }} />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Razão Social</th>
                  <th scope="col">CNPJ</th>
                  <th scope="col">Contrato</th>
                  <th scope="col">Status</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((fornecedor) => (
                  <tr key={fornecedor.id_fornecedor}>
                    <td>{fornecedor.razao_social}</td>
                    <td>{formatarCnpj(fornecedor.cnpj)}</td>
                    <td>{fornecedor.contrato}</td>
                    <td>{fornecedor.ativo ? 'Ativo' : 'Inativo'}</td>
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
        {bloqueio?.motivos ? <p className="mensagem-detalhe">Motivo: {bloqueio.motivos}</p> : null}
      </Dialogo>
    </Pagina>
  )
}
