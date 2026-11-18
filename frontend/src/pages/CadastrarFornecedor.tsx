// Cadastro de fornecedor (pessoa jurídica), usado pelo Setor de Compras.
// API: POST /api/fornecedores (perfil Setor de Compras).

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
import { propsDeErro } from '../utils/acessibilidade'
import {
  cnpjComFormatoValido,
  digitosOuNulo,
  emailValido,
  mascaraCnpj,
  mascaraTelefone,
  soDigitos,
  telefoneValido,
  textoOuNulo,
} from '../utils/formatos'

interface Formulario {
  razaoSocial: string
  cnpj: string
  telefone: string
  email: string
  contratoVigente: boolean
  pendenciaFinanceira: boolean
}

type CampoTexto = 'razaoSocial' | 'cnpj' | 'telefone' | 'email'
type Erros = Partial<Record<CampoTexto, string>>

const VAZIO: Formulario = {
  razaoSocial: '',
  cnpj: '',
  telefone: '',
  email: '',
  contratoVigente: false,
  pendenciaFinanceira: false,
}

const VOLTAR_PARA = '/fornecedores/consultar'

function validar(form: Formulario): { erros: Erros; faltaObrigatorio: boolean } {
  const erros: Erros = {}
  const obrigatorio = 'Campo obrigatório.'
  if (!form.razaoSocial.trim()) erros.razaoSocial = obrigatorio
  if (!form.cnpj) erros.cnpj = obrigatorio
  else if (!cnpjComFormatoValido(form.cnpj)) erros.cnpj = 'CNPJ inválido. Use o formato 00.000.000/0000-00.'
  if (form.telefone && !telefoneValido(form.telefone)) erros.telefone = 'Telefone incompleto.'
  if (form.email && !emailValido(form.email)) erros.email = 'E-mail inválido.'
  return { erros, faltaObrigatorio: Object.values(erros).includes(obrigatorio) }
}

export default function CadastrarFornecedor() {
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)
  const [form, setForm] = useState<Formulario>(VAZIO)
  const [erros, setErros] = useState<Erros>({})
  const [mensagem, setMensagem] = useState<MensagemTela | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [confirmarSaida, setConfirmarSaida] = useState(false)

  const preenchido = form.razaoSocial !== '' || form.cnpj !== '' || form.telefone !== '' || form.email !== ''

  function alterar(campo: CampoTexto, valor: string) {
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
      const fornecedor = await api.cadastrarFornecedor({
        razaoSocial: form.razaoSocial.trim(),
        cnpj: soDigitos(form.cnpj),
        email: textoOuNulo(form.email),
        telefone: digitosOuNulo(form.telefone),
        contratoVigente: form.contratoVigente,
        pendenciaFinanceira: form.pendenciaFinanceira,
      })
      navigate(VOLTAR_PARA, {
        state: { mensagem: `Fornecedor ${fornecedor.razao_social} cadastrado com sucesso.` },
      })
    } catch (erro) {
      if (ehApiError(erro) && erro.codigo === 'CONFLITO') {
        setErros({ cnpj: 'CNPJ já cadastrado.' })
        setMensagem({ tipo: 'erro', texto: MENSAGENS.cnpjDuplicado })
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
    else navigate(VOLTAR_PARA)
  }

  return (
    <Pagina titulo="Cadastrar Fornecedor">
      <Cabecalho caminho={['Gestão de Fornecedores', 'Cadastrar Fornecedor']} />

      <form ref={formRef} onSubmit={salvar} noValidate>
        <Secao titulo="DADOS DA EMPRESA">
          <Campo id="razaoSocial" rotulo="Razão Social" obrigatorio erro={erros.razaoSocial}>
            <input
              id="razaoSocial"
              className="entrada"
              maxLength={150}
              autoComplete="off"
              value={form.razaoSocial}
              onChange={(e) => alterar('razaoSocial', e.target.value)}
              {...propsDeErro('razaoSocial', erros.razaoSocial)}
            />
          </Campo>
          <div className="grade grade-2">
            <Campo id="cnpj" rotulo="CNPJ" obrigatorio erro={erros.cnpj}>
              <input
                id="cnpj"
                className="entrada"
                inputMode="numeric"
                autoComplete="off"
                value={form.cnpj}
                onChange={(e) => alterar('cnpj', mascaraCnpj(e.target.value))}
                {...propsDeErro('cnpj', erros.cnpj)}
              />
            </Campo>
            <Campo id="telefone" rotulo="Telefone" erro={erros.telefone}>
              <input
                id="telefone"
                className="entrada"
                inputMode="tel"
                autoComplete="off"
                placeholder="(11) 3333-4444"
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
              maxLength={150}
              autoComplete="off"
              value={form.email}
              onChange={(e) => alterar('email', e.target.value)}
              {...propsDeErro('email', erros.email)}
            />
          </Campo>
        </Secao>

        <Secao titulo="SITUAÇÃO CONTRATUAL">
          <fieldset className="campo">
            <legend>Marque o que se aplica:</legend>
            <div className="opcoes">
              <label className="opcao">
                <input
                  type="checkbox"
                  checked={form.contratoVigente}
                  onChange={(e) => setForm((atual) => ({ ...atual, contratoVigente: e.target.checked }))}
                />
                Possui contrato vigente
              </label>
              <label className="opcao">
                <input
                  type="checkbox"
                  checked={form.pendenciaFinanceira}
                  onChange={(e) => setForm((atual) => ({ ...atual, pendenciaFinanceira: e.target.checked }))}
                />
                Possui pendência financeira
              </label>
            </div>
          </fieldset>
        </Secao>

        {mensagem ? <Mensagem tipo={mensagem.tipo}>{mensagem.texto}</Mensagem> : null}

        <div className="acoes">
          <Botao onClick={sair}>← VOLTAR À CONSULTA</Botao>
          <div className="acoes-direita">
            <Botao onClick={sair}>CANCELAR</Botao>
            <Botao type="submit" disabled={salvando}>
              {salvando ? 'SALVANDO...' : 'SALVAR'}
            </Botao>
          </div>
        </div>
      </form>

      <Dialogo
        aberto={confirmarSaida}
        titulo="[ CANCELAR CADASTRO ]"
        textoConfirmar="SIM, CANCELAR"
        onConfirmar={() => {
          setConfirmarSaida(false)
          navigate(VOLTAR_PARA)
        }}
        textoCancelar="CONTINUAR EDITANDO"
        onCancelar={() => setConfirmarSaida(false)}
        perigo
      >
        Deseja realmente cancelar? Os dados não salvos serão perdidos.
      </Dialogo>
    </Pagina>
  )
}
