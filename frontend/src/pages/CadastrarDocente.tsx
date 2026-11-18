// Caso de Uso 2 / Jornada do Ricardo (RH): cadastrar docente.
// API: POST /api/docentes (perfil RH).

import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Botao } from '../components/Botao'
import { Campo } from '../components/Campo'
import { Dialogo } from '../components/Dialogo'
import { Mensagem, type MensagemTela } from '../components/Mensagem'
import { Cabecalho, Pagina } from '../components/Pagina'
import { Secao } from '../components/Secao'
import { api } from '../services/api'
import { ehApiError, MENSAGENS, mensagemDeErro } from '../services/erros'
import { podeAcessar } from '../services/sessao'
import { usePerfil } from '../services/usePerfil'
import { DEPARTAMENTOS, TITULACOES, type Docente } from '../types'
import { propsDeErro } from '../utils/acessibilidade'
import {
  cpfComFormatoValido,
  digitosOuNulo,
  emailValido,
  formatarDocumento,
  mascaraCpf,
  mascaraTelefone,
  soDigitos,
  telefoneValido,
  textoOuNulo,
} from '../utils/formatos'

interface Formulario {
  nome: string
  cpf: string
  telefone: string
  email: string
  titulacao: string
  departamento: string
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
  telefone: '',
  email: '',
  titulacao: '',
  departamento: '',
  cargaHoraria: '',
  banco: '',
  agencia: '',
  contaCorrente: '',
}

/** Agência e conta aceitam só dígitos e hífen (ex.: 0001-9). */
const soDigitosEHifen = (valor: string) => valor.replace(/[^\d-]/g, '')

/** O backend guarda os dados bancários num texto único, no formato do guia de testes. */
const montarDadosBancarios = (f: Formulario) =>
  `${f.banco.trim()} / Ag ${f.agencia.trim()} / CC ${f.contaCorrente.trim()}`

function validar(form: Formulario): { erros: Erros; faltaObrigatorio: boolean } {
  const erros: Erros = {}
  const obrigatorio = 'Campo obrigatório.'

  if (!form.nome.trim()) erros.nome = obrigatorio
  if (!form.cpf) erros.cpf = obrigatorio
  else if (!cpfComFormatoValido(form.cpf)) erros.cpf = 'CPF inválido. Use o formato 000.000.000-00.'
  if (form.telefone && !telefoneValido(form.telefone)) erros.telefone = 'Telefone incompleto.'
  if (form.email && !emailValido(form.email)) erros.email = 'E-mail inválido.'
  if (!form.titulacao) erros.titulacao = obrigatorio
  if (!form.departamento) erros.departamento = obrigatorio
  if (!form.cargaHoraria) erros.cargaHoraria = obrigatorio
  else if (Number(form.cargaHoraria) <= 0) erros.cargaHoraria = 'Informe um valor maior que zero.'
  else if (Number(form.cargaHoraria) > 60) erros.cargaHoraria = 'Máximo de 60 horas semanais.'
  if (!form.banco.trim()) erros.banco = obrigatorio
  if (!form.agencia.trim()) erros.agencia = obrigatorio
  if (!form.contaCorrente.trim()) erros.contaCorrente = obrigatorio

  const faltaObrigatorio = Object.values(erros).includes(obrigatorio)
  return { erros, faltaObrigatorio }
}

export default function CadastrarDocente() {
  const navigate = useNavigate()
  const perfil = usePerfil()
  const formRef = useRef<HTMLFormElement>(null)
  const [form, setForm] = useState<Formulario>(VAZIO)
  const [erros, setErros] = useState<Erros>({})
  const [mensagem, setMensagem] = useState<MensagemTela | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [cadastrado, setCadastrado] = useState<Docente | null>(null)
  const [confirmarSaida, setConfirmarSaida] = useState(false)

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
      const docente = await api.cadastrarDocente({
        nome: form.nome.trim(),
        documento: soDigitos(form.cpf),
        email: textoOuNulo(form.email),
        telefone: digitosOuNulo(form.telefone),
        titulacao: form.titulacao,
        departamento: form.departamento,
        cargaHoraria: Number(form.cargaHoraria),
        dadosBancarios: montarDadosBancarios(form),
      })
      setCadastrado(docente)
      setForm(VAZIO)
    } catch (erro) {
      // Em qualquer falha o formulário continua preenchido, para não perder a digitação
      if (ehApiError(erro) && erro.codigo === 'CONFLITO') {
        setErros({ cpf: 'CPF já cadastrado.' })
        setMensagem({ tipo: 'erro', texto: MENSAGENS.cpfDuplicado })
        focarPrimeiroErro()
      } else {
        setMensagem({ tipo: 'erro', texto: mensagemDeErro(erro, 'cadastro') })
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
              <dd>{formatarDocumento(cadastrado.documento)}</dd>
              <dt>Titulação:</dt>
              <dd>{cadastrado.titulacao}</dd>
              <dt>Departamento:</dt>
              <dd>{cadastrado.departamento}</dd>
              <dt>Carga horária:</dt>
              <dd>{cadastrado.carga_horaria} horas semanais</dd>
              <dt>Dados bancários:</dt>
              <dd>{cadastrado.dados_bancarios}</dd>
            </dl>
          </Secao>
          <div className="acoes">
            <Botao onClick={() => navigate('/')}>← VOLTAR AO MENU</Botao>
            <div className="acoes-direita">
              {perfil && podeAcessar(perfil, 'pessoas') ? (
                <Botao onClick={() => navigate(`/pessoas/${cadastrado.pessoa_id}`)}>VER PERFIL</Botao>
              ) : null}
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
            <div className="grade grade-2">
              <Campo id="cpf" rotulo="CPF" obrigatorio erro={erros.cpf}>
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
              <Campo id="telefone" rotulo="Telefone" erro={erros.telefone}>
                <input
                  id="telefone"
                  className="entrada"
                  inputMode="tel"
                  autoComplete="off"
                  placeholder="(11) 99999-0000"
                  value={form.telefone}
                  onChange={(e) => alterar('telefone', mascaraTelefone(e.target.value))}
                  {...propsDeErro('telefone', erros.telefone)}
                />
              </Campo>
            </div>
            <Campo id="email" rotulo="E-mail" erro={erros.email}>
              <input
                id="email"
                type="email"
                className="entrada"
                autoComplete="off"
                maxLength={150}
                value={form.email}
                onChange={(e) => alterar('email', e.target.value)}
                {...propsDeErro('email', erros.email)}
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
            <Campo id="departamento" rotulo="Departamento" obrigatorio erro={erros.departamento}>
              <select
                id="departamento"
                className="entrada"
                value={form.departamento}
                onChange={(e) => alterar('departamento', e.target.value)}
                {...propsDeErro('departamento', erros.departamento)}
              >
                <option value="">Selecione o departamento...</option>
                {DEPARTAMENTOS.map((departamento) => (
                  <option key={departamento} value={departamento}>
                    {departamento}
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
              <Campo id="banco" rotulo="Banco" obrigatorio erro={erros.banco}>
                <input
                  id="banco"
                  className="entrada"
                  maxLength={60}
                  autoComplete="off"
                  placeholder="ex.: Banco 001"
                  value={form.banco}
                  onChange={(e) => alterar('banco', e.target.value)}
                  {...propsDeErro('banco', erros.banco)}
                />
              </Campo>
              <Campo id="agencia" rotulo="Agência" obrigatorio erro={erros.agencia}>
                <input
                  id="agencia"
                  className="entrada"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="off"
                  value={form.agencia}
                  onChange={(e) => alterar('agencia', soDigitosEHifen(e.target.value))}
                  {...propsDeErro('agencia', erros.agencia)}
                />
              </Campo>
              <Campo id="contaCorrente" rotulo="Conta Corrente" obrigatorio erro={erros.contaCorrente}>
                <input
                  id="contaCorrente"
                  className="entrada"
                  inputMode="numeric"
                  maxLength={20}
                  autoComplete="off"
                  value={form.contaCorrente}
                  onChange={(e) => alterar('contaCorrente', soDigitosEHifen(e.target.value))}
                  {...propsDeErro('contaCorrente', erros.contaCorrente)}
                />
              </Campo>
            </div>
          </Secao>

          {mensagem ? <Mensagem tipo={mensagem.tipo}>{mensagem.texto}</Mensagem> : null}

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
