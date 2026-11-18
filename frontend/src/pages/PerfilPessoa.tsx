// Caso de Uso 4, passo 8: tela com todos os detalhes do registro.
// API: GET /api/pessoas/:id e, conforme o tipo, alunos, docentes ou fornecedores.

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Botao } from '../components/Botao'
import { Mensagem } from '../components/Mensagem'
import { Cabecalho, Pagina } from '../components/Pagina'
import { Secao } from '../components/Secao'
import { api } from '../services/api'
import { ehApiError, MENSAGENS } from '../services/erros'
import type { PessoaDetalhe } from '../types'
import { capitalizar, formatarDataHora, formatarDocumento, formatarTelefone } from '../utils/formatos'

const ouTraco = (valor: string | null | undefined) => (valor ? valor : '—')
const simNao = (valor: boolean) => (valor ? 'Sim' : 'Não')

export default function PerfilPessoa() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [detalhe, setDetalhe] = useState<PessoaDetalhe | null>(null)
  const [erroCarga, setErroCarga] = useState<string | null>(null)

  const numero = Number(id)
  const idValido = Number.isInteger(numero) && numero > 0
  const erro = idValido ? erroCarga : 'Pessoa não encontrada.'

  useEffect(() => {
    if (!idValido) return
    let ativo = true
    api
      .obterPessoa(numero)
      .then((dados) => {
        if (ativo) setDetalhe(dados)
      })
      .catch((falha: unknown) => {
        if (!ativo) return
        if (ehApiError(falha) && falha.codigo === 'NAO_ENCONTRADO') setErroCarga('Pessoa não encontrada.')
        else if (ehApiError(falha) && falha.codigo !== 'CONEXAO') setErroCarga(falha.message)
        else setErroCarga(MENSAGENS.conexaoConsulta)
      })
    return () => {
      ativo = false
    }
  }, [idValido, numero])

  const pessoa = detalhe?.pessoa
  const juridica = pessoa?.tipo_pessoa === 'JURIDICA'

  return (
    <Pagina titulo={pessoa ? pessoa.nome : 'Perfil'}>
      <Cabecalho caminho={['Gestão de Pessoas', 'Consultar Pessoa', 'Perfil']} />

      <div className="barra-voltar">
        <Botao onClick={() => navigate('/pessoas/consultar')}>← VOLTAR À CONSULTA</Botao>
      </div>

      {erro ? <Mensagem tipo="erro">{erro}</Mensagem> : null}
      {!detalhe && !erro ? <p className="carregando">Carregando...</p> : null}

      {detalhe && pessoa ? (
        <div className="perfil secao-separada">
          <Secao titulo="DADOS CADASTRAIS">
            <dl className="resumo">
              <dt>{juridica ? 'Razão social:' : 'Nome completo:'}</dt>
              <dd>{pessoa.nome}</dd>
              <dt>{juridica ? 'CNPJ:' : 'CPF:'}</dt>
              <dd>{formatarDocumento(pessoa.documento)}</dd>
              <dt>Tipo:</dt>
              <dd>{juridica ? 'Pessoa jurídica' : 'Pessoa física'}</dd>
              <dt>E-mail:</dt>
              <dd>{ouTraco(pessoa.email)}</dd>
              <dt>Telefone:</dt>
              <dd>{formatarTelefone(pessoa.telefone)}</dd>
              <dt>Cadastrado em:</dt>
              <dd>{formatarDataHora(pessoa.criado_em)}</dd>
            </dl>
          </Secao>

          {detalhe.aluno ? (
            <Secao titulo="DADOS ACADÊMICOS">
              <dl className="resumo">
                <dt>Matrícula:</dt>
                <dd className="destaque">{detalhe.aluno.matricula}</dd>
                <dt>Curso:</dt>
                <dd>{detalhe.aluno.curso}</dd>
                <dt>Período:</dt>
                <dd>{detalhe.aluno.periodo}</dd>
                <dt>Situação do vínculo:</dt>
                <dd>{capitalizar(detalhe.aluno.status_vinculo)}</dd>
              </dl>
            </Secao>
          ) : null}

          {detalhe.docente ? (
            <>
              <Secao titulo="DADOS INSTITUCIONAIS">
                <dl className="resumo">
                  <dt>Titulação:</dt>
                  <dd>{detalhe.docente.titulacao}</dd>
                  <dt>Departamento:</dt>
                  <dd>{detalhe.docente.departamento}</dd>
                  <dt>Carga horária semanal:</dt>
                  <dd>{detalhe.docente.carga_horaria} horas</dd>
                </dl>
              </Secao>
              <Secao titulo="DADOS BANCÁRIOS">
                <dl className="resumo">
                  <dt>Conta para pagamento:</dt>
                  <dd>{detalhe.docente.dados_bancarios}</dd>
                </dl>
              </Secao>
            </>
          ) : null}

          {detalhe.fornecedor ? (
            <Secao titulo="DADOS DO FORNECEDOR">
              <dl className="resumo">
                <dt>Contrato vigente:</dt>
                <dd>{simNao(detalhe.fornecedor.contrato_vigente)}</dd>
                <dt>Pendência financeira:</dt>
                <dd>{simNao(detalhe.fornecedor.pendencia_financeira)}</dd>
              </dl>
            </Secao>
          ) : null}
        </div>
      ) : null}

      <div className="rodape-verde" />
    </Pagina>
  )
}
