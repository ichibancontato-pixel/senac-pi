// Caso de Uso 1 / Jornada da Mariana: cadastrar aluno e gerar matrícula.

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
import { TURNOS, type AlunoCadastrado, type Curso, type Turno } from '../types'
import { propsDeErro } from '../utils/acessibilidade'
import {
  cpfComFormatoValido,
  dataBrParaIso,
  hojeIso,
  isoParaDataBr,
  mascaraCpf,
  mascaraData,
  soDigitos,
} from '../utils/formatos'

interface Formulario {
  nome: string
  cpf: string
  dataNascimento: string
  idCurso: string
  turno: Turno | ''
}

type NomeCampo = keyof Formulario
type Erros = Partial<Record<NomeCampo, string>>

const VAZIO: Formulario = { nome: '', cpf: '', dataNascimento: '', idCurso: '', turno: '' }

/** Nomes dos campos na API -> nomes no formulário. */
const CAMPOS_API: Record<string, NomeCampo> = {
  nome: 'nome',
  cpf: 'cpf',
  data_nascimento: 'dataNascimento',
  id_curso: 'idCurso',
  turno: 'turno',
}

function validar(form: Formulario): { erros: Erros; faltaObrigatorio: boolean } {
  const erros: Erros = {}
  const obrigatorio = 'Campo obrigatório.'

  if (!form.nome.trim()) erros.nome = obrigatorio

  if (!form.cpf) erros.cpf = obrigatorio
  else if (!cpfComFormatoValido(form.cpf)) erros.cpf = 'CPF inválido. Use o formato 000.000.000-00.'

  if (!form.dataNascimento) erros.dataNascimento = obrigatorio
  else {
    const iso = dataBrParaIso(form.dataNascimento)
    if (!iso) erros.dataNascimento = 'Data inválida. Use o formato DD/MM/AAAA.'
    else if (iso > hojeIso()) erros.dataNascimento = 'A data de nascimento não pode ser futura.'
  }

  if (!form.idCurso) erros.idCurso = obrigatorio
  if (!form.turno) erros.turno = obrigatorio

  const faltaObrigatorio = Object.values(erros).includes(obrigatorio)
  return { erros, faltaObrigatorio }
}

export default function CadastrarAluno() {
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)
  const [form, setForm] = useState<Formulario>(VAZIO)
  const [erros, setErros] = useState<Erros>({})
  const [mensagem, setMensagem] = useState<MensagemTela | null>(null)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [salvando, setSalvando] = useState(false)
  const [cadastrado, setCadastrado] = useState<AlunoCadastrado | null>(null)
  const [confirmarSaida, setConfirmarSaida] = useState(false)

  useEffect(() => {
    api
      .listarCursos()
      .then(setCursos)
      .catch(() => setMensagem({ tipo: 'erro', texto: 'Não foi possível carregar a lista de cursos.' }))
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
      const resultado = await api.cadastrarAluno({
        nome: form.nome.trim(),
        cpf: soDigitos(form.cpf),
        data_nascimento: dataBrParaIso(form.dataNascimento) as string,
        id_curso: Number(form.idCurso),
        turno: form.turno as Turno,
      })
      setCadastrado(resultado)
      setForm(VAZIO)
    } catch (erro) {
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

  function novoCadastro() {
    setCadastrado(null)
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
              <Mensagem tipo="sucesso">Aluno cadastrado com sucesso.</Mensagem>
            </div>
            <p className="comprovante-titulo">COMPROVANTE DE VÍNCULO ACADÊMICO</p>
            <dl className="resumo">
              <dt>Matrícula:</dt>
              <dd className="destaque">{cadastrado.matricula}</dd>
              <dt>Nome:</dt>
              <dd>{cadastrado.nome}</dd>
              <dt>CPF:</dt>
              <dd>{mascaraCpf(cadastrado.cpf)}</dd>
              <dt>Curso:</dt>
              <dd>{cadastrado.nome_curso}</dd>
              <dt>Turno:</dt>
              <dd>{cadastrado.turno}</dd>
              <dt>Data da matrícula:</dt>
              <dd>{isoParaDataBr(cadastrado.data_matricula)}</dd>
            </dl>
          </Secao>
          <div className="acoes nao-imprimir">
            <Botao onClick={() => navigate('/')}>← VOLTAR AO MENU</Botao>
            <div className="acoes-direita">
              <Botao onClick={novoCadastro}>NOVO CADASTRO</Botao>
              <Botao onClick={() => window.print()}>EMITIR COMPROVANTE</Botao>
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
              <Campo
                id="dataNascimento"
                rotulo="Data de Nascimento (DD/MM/AAAA)"
                obrigatorio
                erro={erros.dataNascimento}
              >
                <input
                  id="dataNascimento"
                  className="entrada"
                  inputMode="numeric"
                  autoComplete="off"
                  value={form.dataNascimento}
                  onChange={(e) => alterar('dataNascimento', mascaraData(e.target.value))}
                  {...propsDeErro('dataNascimento', erros.dataNascimento)}
                />
              </Campo>
            </div>
          </Secao>

          <Secao titulo="DADOS ACADÊMICOS">
            <Campo id="curso" rotulo="Curso" obrigatorio erro={erros.idCurso}>
              <select
                id="curso"
                className="entrada"
                value={form.idCurso}
                onChange={(e) => alterar('idCurso', e.target.value)}
                {...propsDeErro('curso', erros.idCurso)}
              >
                <option value="">Selecione um curso...</option>
                {cursos.map((curso) => (
                  <option key={curso.id_curso} value={curso.id_curso}>
                    {curso.nome_curso}
                  </option>
                ))}
              </select>
            </Campo>
            <fieldset className={`campo ${erros.turno ? 'campo-invalido' : ''}`}>
              <legend>*Turno:</legend>
              <div className="opcoes">
                {TURNOS.map((turno) => (
                  <label key={turno} className="opcao">
                    <input
                      type="radio"
                      name="turno"
                      value={turno}
                      checked={form.turno === turno}
                      onChange={() => alterar('turno', turno)}
                      {...propsDeErro('turno', erros.turno)}
                    />
                    {turno}
                  </label>
                ))}
              </div>
              {erros.turno ? (
                <span className="campo-mensagem" id="turno-erro">
                  {erros.turno}
                </span>
              ) : null}
            </fieldset>
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
