// Caso de Uso 1 / Jornada da Mariana: cadastrar aluno, gerar matrícula e emitir comprovante.
// API: POST /api/alunos e GET /api/alunos/:id/comprovante (perfil Secretaria Acadêmica).

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
import { CURSOS, periodosLetivos, type Aluno, type ComprovanteVinculo } from '../types'
import { propsDeErro } from '../utils/acessibilidade'
import {
  capitalizar,
  cpfComFormatoValido,
  digitosOuNulo,
  emailValido,
  formatarDataHora,
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
  curso: string
  periodo: string
}

type NomeCampo = keyof Formulario
type Erros = Partial<Record<NomeCampo, string>>

const VAZIO: Formulario = { nome: '', cpf: '', telefone: '', email: '', curso: '', periodo: '' }
const PERIODOS = periodosLetivos()

function validar(form: Formulario): { erros: Erros; faltaObrigatorio: boolean } {
  const erros: Erros = {}
  const obrigatorio = 'Campo obrigatório.'

  if (!form.nome.trim()) erros.nome = obrigatorio
  if (!form.cpf) erros.cpf = obrigatorio
  else if (!cpfComFormatoValido(form.cpf)) erros.cpf = 'CPF inválido. Use o formato 000.000.000-00.'
  if (form.telefone && !telefoneValido(form.telefone)) erros.telefone = 'Telefone incompleto.'
  if (form.email && !emailValido(form.email)) erros.email = 'E-mail inválido.'
  if (!form.curso) erros.curso = obrigatorio
  if (!form.periodo) erros.periodo = obrigatorio

  const faltaObrigatorio = Object.values(erros).includes(obrigatorio)
  return { erros, faltaObrigatorio }
}

export default function CadastrarAluno() {
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)
  const [form, setForm] = useState<Formulario>(VAZIO)
  const [erros, setErros] = useState<Erros>({})
  const [mensagem, setMensagem] = useState<MensagemTela | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [cadastrado, setCadastrado] = useState<Aluno | null>(null)
  const [comprovante, setComprovante] = useState<ComprovanteVinculo | null>(null)
  const [emitindo, setEmitindo] = useState(false)
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

  async function salvar(evento: FormEvent) {
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
      const aluno = await api.cadastrarAluno({
        nome: form.nome.trim(),
        documento: soDigitos(form.cpf),
        email: textoOuNulo(form.email),
        telefone: digitosOuNulo(form.telefone),
        curso: form.curso,
        periodo: form.periodo,
      })
      setCadastrado(aluno)
      setComprovante(null)
      setForm(VAZIO)
    } catch (erro) {
      // Em qualquer falha os dados continuam no formulário
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

  async function emitirComprovante() {
    if (!cadastrado) return
    setEmitindo(true)
    setMensagem(null)
    try {
      setComprovante(await api.emitirComprovante(cadastrado.id))
      // Espera a declaração aparecer na tela antes de abrir a impressão
      setTimeout(() => window.print(), 150)
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: mensagemDeErro(erro, 'consulta') })
    } finally {
      setEmitindo(false)
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

  function novoCadastro() {
    setCadastrado(null)
    setComprovante(null)
    setMensagem(null)
    setErros({})
  }

  return (
    <Pagina titulo="Cadastrar Aluno">
      <Cabecalho caminho={['Gestão de Alunos', 'Cadastrar Aluno']} />

      {cadastrado ? (
        <>
          <Secao titulo="CADASTRO CONCLUÍDO">
            <div className="nao-imprimir">
              <Mensagem tipo="sucesso">Aluno cadastrado e matrícula gerada automaticamente.</Mensagem>
            </div>
            <dl className="resumo nao-imprimir">
              <dt>Matrícula:</dt>
              <dd className="destaque">{cadastrado.matricula}</dd>
              <dt>Nome:</dt>
              <dd>{cadastrado.nome}</dd>
              <dt>CPF:</dt>
              <dd>{formatarDocumento(cadastrado.documento)}</dd>
              <dt>Curso:</dt>
              <dd>{cadastrado.curso}</dd>
              <dt>Período:</dt>
              <dd>{cadastrado.periodo}</dd>
              <dt>Situação:</dt>
              <dd>{capitalizar(cadastrado.status_vinculo)}</dd>
            </dl>

            {comprovante ? (
              <article className="declaracao" aria-label="Comprovante de vínculo">
                <h3 className="declaracao-titulo">{comprovante.comprovante}</h3>
                <p>
                  Declaramos que <strong>{comprovante.nome}</strong>, CPF {formatarDocumento(comprovante.cpf)},
                  possui vínculo com esta instituição no curso de <strong>{comprovante.curso}</strong>, período
                  letivo {comprovante.periodo}, matrícula <strong>{comprovante.matricula}</strong>, com situação{' '}
                  {capitalizar(comprovante.status_vinculo)}.
                </p>
                <p className="declaracao-rodape">Emitido em {formatarDataHora(comprovante.emitido_em)}</p>
              </article>
            ) : null}

            {mensagem ? (
              <div className="nao-imprimir">
                <Mensagem tipo={mensagem.tipo}>{mensagem.texto}</Mensagem>
              </div>
            ) : null}
          </Secao>
          <div className="acoes nao-imprimir">
            <Botao onClick={() => navigate('/')}>← VOLTAR AO MENU</Botao>
            <div className="acoes-direita">
              <Botao onClick={novoCadastro}>NOVO CADASTRO</Botao>
              <Botao onClick={emitirComprovante} disabled={emitindo}>
                {emitindo ? 'EMITINDO...' : 'EMITIR COMPROVANTE'}
              </Botao>
            </div>
          </div>
        </>
      ) : (
        <form ref={formRef} onSubmit={salvar} noValidate>
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

          <Secao titulo="DADOS ACADÊMICOS">
            <Campo id="curso" rotulo="Curso" obrigatorio erro={erros.curso}>
              <select
                id="curso"
                className="entrada"
                value={form.curso}
                onChange={(e) => alterar('curso', e.target.value)}
                {...propsDeErro('curso', erros.curso)}
              >
                <option value="">Selecione um curso...</option>
                {CURSOS.map((curso) => (
                  <option key={curso} value={curso}>
                    {curso}
                  </option>
                ))}
              </select>
            </Campo>
            <fieldset className={`campo ${erros.periodo ? 'campo-invalido' : ''}`}>
              <legend>*Período Letivo:</legend>
              <div className="opcoes">
                {PERIODOS.map((periodo) => (
                  <label key={periodo} className="opcao">
                    <input
                      type="radio"
                      name="periodo"
                      value={periodo}
                      checked={form.periodo === periodo}
                      onChange={() => alterar('periodo', periodo)}
                      {...propsDeErro('periodo', erros.periodo)}
                    />
                    {periodo}
                  </label>
                ))}
              </div>
              {erros.periodo ? (
                <span className="campo-mensagem" id="periodo-erro">
                  {erros.periodo}
                </span>
              ) : null}
            </fieldset>
          </Secao>

          {mensagem ? <Mensagem tipo={mensagem.tipo}>{mensagem.texto}</Mensagem> : null}

          <div className="acoes">
            <Botao onClick={sair}>← VOLTAR AO MENU</Botao>
            <div className="acoes-direita">
              <Botao onClick={sair}>CANCELAR</Botao>
              <Botao type="submit" disabled={salvando}>
                {salvando ? 'SALVANDO...' : 'SALVAR'}
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
