// Caso de Uso 2 / Jornada do Ricardo (RH): cadastrar docente.

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Botao } from '../components/Botao'
import { Campo } from '../components/Campo'
import { Dialogo } from '../components/Dialogo'
import { Mensagem, type MensagemTela } from '../components/Mensagem'
import { Cabecalho, Pagina } from '../components/Pagina'
import { Secao } from '../components/Secao'
import { api } from '../services/api'
import { ehApiError, MENSAGENS } from '../services/erros'
import { TITULACOES, type Departamento, type DocenteCadastrado, type Titulacao } from '../types'
import { propsDeErro } from '../utils/acessibilidade'
import { cpfComFormatoValido, mascaraCpf, soDigitos, textoOuNulo } from '../utils/formatos'

interface Formulario {
  nome: string
  cpf: string
  titulacao: Titulacao | ''
  idDepartamento: string
  cargaHoraria: string
  banco: string
  agencia: string
  contaCorrente: string
}

type NomeCampo = keyof Formulario
type Erros = Partial<Record<NomeCampo, string>>

const VAZIO: Formulario = {
  nome: '',
  cpf: '',
  titulacao: '',
  idDepartamento: '',
  cargaHoraria: '',
  banco: '',
  agencia: '',
  contaCorrente: '',
}

const CAMPOS_API: Record<string, NomeCampo> = {
  nome: 'nome',
  cpf: 'cpf',
  titulacao: 'titulacao',
  id_departamento: 'idDepartamento',
  carga_horaria: 'cargaHoraria',
  banco: 'banco',
  agencia: 'agencia',
  conta_corrente: 'contaCorrente',
}

/** Agência e conta aceitam só dígitos e hífen (ex.: 0001-9). */
const soDigitosEHifen = (valor: string) => valor.replace(/[^\d-]/g, '')

function validar(form: Formulario): { erros: Erros; faltaObrigatorio: boolean } {
  const erros: Erros = {}
  const obrigatorio = 'Campo obrigatório.'

  if (!form.nome.trim()) erros.nome = obrigatorio
  if (!form.cpf) erros.cpf = obrigatorio
  else if (!cpfComFormatoValido(form.cpf)) erros.cpf = 'CPF inválido. Use o formato 000.000.000-00.'
  if (!form.titulacao) erros.titulacao = obrigatorio
  if (!form.idDepartamento) erros.idDepartamento = obrigatorio
  if (!form.cargaHoraria) erros.cargaHoraria = obrigatorio
  else if (Number(form.cargaHoraria) <= 0) erros.cargaHoraria = 'Informe um valor maior que zero.'
  else if (Number(form.cargaHoraria) > 60) erros.cargaHoraria = 'Máximo de 60 horas semanais.'

  const faltaObrigatorio = Object.values(erros).includes(obrigatorio)
  return { erros, faltaObrigatorio }
}

export default function CadastrarDocente() {
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)
  const [form, setForm] = useState<Formulario>(VAZIO)
  const [erros, setErros] = useState<Erros>({})
  const [mensagem, setMensagem] = useState<MensagemTela | null>(null)
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [salvando, setSalvando] = useState(false)
  const [cadastrado, setCadastrado] = useState<DocenteCadastrado | null>(null)
  const [confirmarSaida, setConfirmarSaida] = useState(false)

  useEffect(() => {
    api
      .listarDepartamentos()
      .then(setDepartamentos)
      .catch(() =>
        setMensagem({ tipo: 'erro', texto: 'Não foi possível carregar a lista de departamentos.' }),
      )
  }, [])

  const preenchido = Object.values(form).some((valor) => valor !== '')

  function alterar(campo: NomeCampo, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
    if (erros[campo]) {
      setErros((atuais) => {
        const novos = { ...atuais }
        delete novos[campo]
        return novos
      })
    }
  }

  function focarPrimeiroErro() {
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    })
  }

  async function finalizar(evento: FormEvent) {
    evento.preventDefault()
    const { erros: encontrados, faltaObrigatorio } = validar(form)
    setErros(encontrados)
    if (Object.keys(encontrados).length > 0) {
      setMensagem({
        tipo: 'erro',
        texto: faltaObrigatorio ? MENSAGENS.camposObrigatorios : MENSAGENS.corrijaCampos,
      })
      focarPrimeiroErro()
      return
    }

    setSalvando(true)
    setMensagem(null)
    try {
      const resultado = await api.cadastrarDocente({
        nome: form.nome.trim(),
        cpf: soDigitos(form.cpf),
        titulacao: form.titulacao as Titulacao,
        id_departamento: Number(form.idDepartamento),
        carga_horaria: Number(form.cargaHoraria),
        banco: textoOuNulo(form.banco),
        agencia: textoOuNulo(form.agencia),
        conta_corrente: textoOuNulo(form.contaCorrente),
      })
      setCadastrado(resultado)
      setForm(VAZIO)
    } catch (erro) {
      // Em qualquer falha o formulário continua preenchido, para não perder a digitação
      if (ehApiError(erro) && erro.codigo === 'CONFLITO') {
        setErros({ cpf: 'CPF já cadastrado.' })
        setMensagem({ tipo: 'erro', texto: MENSAGENS.cpfDuplicado })
        focarPrimeiroErro()
      } else if (ehApiError(erro) && erro.codigo === 'VALIDACAO') {
        const doServidor: Erros = {}
        for (const campo of erro.campos) {
          const nome = CAMPOS_API[campo]
          if (nome) doServidor[nome] = 'Verifique este campo.'
        }
        setErros(doServidor)
        setMensagem({ tipo: 'erro', texto: erro.message })
        focarPrimeiroErro()
      } else if (ehApiError(erro) && erro.codigo === 'CONEXAO') {
        setMensagem({ tipo: 'erro', texto: MENSAGENS.conexaoCadastro })
      } else {
        setMensagem({ tipo: 'erro', texto: ehApiError(erro) ? erro.message : 'Erro inesperado ao salvar.' })
      }
    } finally {
      setSalvando(false)
    }
  }

  function sair() {
    if (preenchido) setConfirmarSaida(true)
    else navigate('/')
  }

  function confirmarCancelamento() {
    setConfirmarSaida(false)
    setForm(VAZIO)
    navigate('/')
  }

  return (
    <Pagina titulo="Cadastrar Docente">
      <Cabecalho caminho={['Gestão de Docentes', 'Cadastrar Docente']} />

      {cadastrado ? (
        <>
          <Secao titulo="CADASTRO CONCLUÍDO">
            <Mensagem tipo="sucesso">Docente cadastrado com sucesso.</Mensagem>
            <p className="comprovante-titulo">RESUMO CADASTRAL</p>
            <dl className="resumo">
              <dt>Nome:</dt>
              <dd>{cadastrado.nome}</dd>
              <dt>CPF:</dt>
              <dd>{mascaraCpf(cadastrado.cpf)}</dd>
              <dt>Titulação:</dt>
              <dd>{cadastrado.titulacao}</dd>
              <dt>Departamento:</dt>
              <dd>{cadastrado.nome_depto}</dd>
              <dt>Carga horária:</dt>
              <dd>{cadastrado.carga_horaria} horas semanais</dd>
            </dl>
          </Secao>
          <div className="acoes">
            <Botao onClick={() => navigate('/')}>← VOLTAR AO MENU</Botao>
            <div className="acoes-direita">
              <Botao onClick={() => navigate(`/pessoas/${cadastrado.id_pessoa}`)}>VER PERFIL</Botao>
              <Botao
                onClick={() => {
                  setCadastrado(null)
                  setMensagem(null)
                  setErros({})
                }}
              >
                NOVO CADASTRO
              </Botao>
            </div>
          </div>
        </>
      ) : (
        <form ref={formRef} onSubmit={finalizar} noValidate>
          <Secao titulo="DADOS PESSOAIS">
            <Campo id="nome" rotulo="Nome Completo" obrigatorio erro={erros.nome}>
              <input
                id="nome"
                className="entrada"
                value={form.nome}
                maxLength={150}
                autoComplete="off"
                onChange={(e) => alterar('nome', e.target.value)}
                {...propsDeErro('nome', erros.nome)}
              />
            </Campo>
            <Campo id="cpf" rotulo="CPF" obrigatorio erro={erros.cpf} className="campo-estreito">
              <input
                id="cpf"
                className="entrada"
                inputMode="numeric"
                autoComplete="off"
                value={form.cpf}
                onChange={(e) => alterar('cpf', mascaraCpf(e.target.value))}
                {...propsDeErro('cpf', erros.cpf)}
              />
            </Campo>
          </Secao>

          <Secao titulo="DADOS INSTITUCIONAIS">
            <Campo id="titulacao" rotulo="Titulação" obrigatorio erro={erros.titulacao}>
              <select
                id="titulacao"
                className="entrada"
                value={form.titulacao}
                onChange={(e) => alterar('titulacao', e.target.value)}
                {...propsDeErro('titulacao', erros.titulacao)}
              >
                <option value="">Selecione... (Especialista, Mestre, Doutor)</option>
                {TITULACOES.map((titulacao) => (
                  <option key={titulacao} value={titulacao}>
                    {titulacao}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo id="departamento" rotulo="Departamento" obrigatorio erro={erros.idDepartamento}>
              <select
                id="departamento"
                className="entrada"
                value={form.idDepartamento}
                onChange={(e) => alterar('idDepartamento', e.target.value)}
                {...propsDeErro('departamento', erros.idDepartamento)}
              >
                <option value="">Selecione o departamento...</option>
                {departamentos.map((departamento) => (
                  <option key={departamento.id_departamento} value={departamento.id_departamento}>
                    {departamento.nome_depto}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo id="cargaHoraria" rotulo="Carga Horária Semanal" obrigatorio erro={erros.cargaHoraria}>
              <span className="com-sufixo">
                <input
                  id="cargaHoraria"
                  className="entrada entrada-curta"
                  inputMode="numeric"
                  autoComplete="off"
                  value={form.cargaHoraria}
                  onChange={(e) => alterar('cargaHoraria', soDigitos(e.target.value).slice(0, 2))}
                  {...propsDeErro('cargaHoraria', erros.cargaHoraria)}
                />
                horas
              </span>
            </Campo>
          </Secao>

          <Secao titulo="DADOS BANCÁRIOS">
            <div className="grade grade-3">
              <Campo id="banco" rotulo="Banco">
                <input
                  id="banco"
                  className="entrada"
                  maxLength={80}
                  autoComplete="off"
                  value={form.banco}
                  onChange={(e) => alterar('banco', e.target.value)}
                />
              </Campo>
              <Campo id="agencia" rotulo="Agência">
                <input
                  id="agencia"
                  className="entrada"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="off"
                  value={form.agencia}
                  onChange={(e) => alterar('agencia', soDigitosEHifen(e.target.value))}
                />
              </Campo>
              <Campo id="contaCorrente" rotulo="Conta Corrente">
                <input
                  id="contaCorrente"
                  className="entrada"
                  inputMode="numeric"
                  maxLength={20}
                  autoComplete="off"
                  value={form.contaCorrente}
                  onChange={(e) => alterar('contaCorrente', soDigitosEHifen(e.target.value))}
                />
              </Campo>
            </div>
          </Secao>

          {mensagem ? (
            <Mensagem tipo={mensagem.tipo} detalhe={mensagem.detalhe}>
              {mensagem.texto}
            </Mensagem>
          ) : null}

          <div className="acoes">
            <Botao onClick={sair}>← VOLTAR AO MENU</Botao>
            <div className="acoes-direita">
              <Botao onClick={sair}>CANCELAR</Botao>
              <Botao type="submit" disabled={salvando}>
                {salvando ? 'SALVANDO...' : 'FINALIZAR CADASTRO'}
              </Botao>
            </div>
          </div>
        </form>
      )}

      <Dialogo
        aberto={confirmarSaida}
        titulo="[ CANCELAR CADASTRO ]"
        textoConfirmar="SIM, CANCELAR"
        onConfirmar={confirmarCancelamento}
        textoCancelar="CONTINUAR EDITANDO"
        onCancelar={() => setConfirmarSaida(false)}
        perigo
      >
        Deseja realmente cancelar? Os dados não salvos serão perdidos.
      </Dialogo>
    </Pagina>
  )
}
